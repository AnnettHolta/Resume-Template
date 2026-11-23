import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  debouncedIndexedDbStorage,
  flushIndexedDbWrites,
} from "@/lib/indexedDbStorage";
import {
  isValidResumeData,
  MAX_HISTORY_LENGTH,
  withResumeId,
} from "@/lib/resumeStorage";
import type { ResumeData } from "@/types/resume";

export const RESUME_STORE_KEY = "resume-template-history-v1";

let resumeWriteAllowed = true;
export function setResumeWriteAllowed(allowed: boolean): void {
  resumeWriteAllowed = allowed;
}

interface PersistedSlice {
  entries: ResumeData[];
  index: number;
}

interface ResumeStoreState extends PersistedSlice {
  hasHydrated: boolean;
  hydrationError: boolean;
  statusMessage: string | null;
  setStatusMessage: (message: string | null) => void;
  initializeResume: (initialData: ResumeData) => void;
  importResume: (data: ResumeData, fallbackInitial: ResumeData) => void;
  commitResume: (nextData: ResumeData, fallbackInitial: ResumeData) => void;
  undo: () => void;
  redo: () => void;
  reset: (initialData: ResumeData) => void;
}

export const useResumeStore = create<ResumeStoreState>()(
  (setTransient, getState, api) =>
    persist<ResumeStoreState, [], [], PersistedSlice>(
      (set, get) => ({
        entries: [],
        index: 0,
        hasHydrated: false,
        hydrationError: false,
        statusMessage: null,

        setStatusMessage: (statusMessage) => setTransient({ statusMessage }),

        initializeResume: (initialData) => {
          if (!resumeWriteAllowed) return;
          const { entries, index } = get();
          const resumeId = withResumeId(entries[index] ?? initialData).resumeId;
          if (
            entries.length &&
            entries.every((entry) => entry.resumeId === resumeId)
          )
            return;
          set({
            entries: entries.length
              ? entries.map((entry) =>
                  entry.resumeId === resumeId ? entry : { ...entry, resumeId },
                )
              : [{ ...initialData, resumeId }],
            index: entries.length ? index : 0,
          });
          flushIndexedDbWrites();
        },

        importResume: (data, fallbackInitial) => {
          if (!resumeWriteAllowed) return;
          const incoming = withResumeId(data);
          const { entries, index } = get();
          if (entries[index]?.resumeId !== incoming.resumeId) {
            set({ entries: [incoming], index: 0, statusMessage: null });
            return;
          }
          get().commitResume(incoming, fallbackInitial);
        },

        commitResume: (nextData, fallbackInitial) => {
          if (!resumeWriteAllowed) return;
          const { entries, index } = get();
          const resumeId = withResumeId(
            entries[index] ?? fallbackInitial,
          ).resumeId;
          const baseEntries =
            entries.length > 0
              ? entries.map((entry) =>
                  entry.resumeId === resumeId ? entry : { ...entry, resumeId },
                )
              : [{ ...fallbackInitial, resumeId }];
          const currentResume = baseEntries[index] ?? baseEntries[0];
          nextData = { ...nextData, resumeId };

          if (JSON.stringify(nextData) === JSON.stringify(currentResume)) {
            return;
          }

          const nextEntries = [
            ...baseEntries.slice(0, index + 1),
            nextData,
          ].slice(-MAX_HISTORY_LENGTH);

          set({
            entries: nextEntries,
            index: nextEntries.length - 1,
            statusMessage: null,
          });
        },

        undo: () => {
          if (!resumeWriteAllowed) return;
          const { entries, index } = get();
          if (index <= 0) return;
          set({
            entries,
            index: index - 1,
            statusMessage: "Undid change",
          });
        },

        redo: () => {
          if (!resumeWriteAllowed) return;
          const { entries, index } = get();
          if (index >= entries.length - 1) return;
          set({
            entries,
            index: index + 1,
            statusMessage: "Redid change",
          });
        },

        reset: (initialData) => {
          if (!resumeWriteAllowed) return;
          const { entries, index } = get();
          const resumeId = withResumeId(entries[index] ?? initialData).resumeId;
          set({
            entries: [{ ...initialData, resumeId }],
            index: 0,
            statusMessage: "Reset to initial JSON",
          });
          flushIndexedDbWrites();
        },
      }),
      {
        name: RESUME_STORE_KEY,
        storage: createJSONStorage(() => debouncedIndexedDbStorage),
        partialize: (state): PersistedSlice => ({
          entries: state.entries,
          index: state.index,
        }),
        merge: (persisted, current) => {
          const typed = persisted as Partial<PersistedSlice> | undefined;
          if (!typed || !Array.isArray(typed.entries)) {
            return current;
          }
          const validEntries = typed.entries
            .filter(isValidResumeData)
            .slice(-MAX_HISTORY_LENGTH);
          if (validEntries.length === 0) {
            return current;
          }
          const rawIndex = typeof typed.index === "number" ? typed.index : 0;
          const clampedIndex = Math.max(
            0,
            Math.min(rawIndex, validEntries.length - 1),
          );
          return {
            ...current,
            entries: validEntries,
            index: clampedIndex,
          };
        },
        onRehydrateStorage: () => (_state, error) => {
          setTransient({
            hasHydrated: true,
            hydrationError: Boolean(error),
            ...(error
              ? {
                  statusMessage: "Could not load saved history on this device.",
                }
              : {}),
          });
        },
      },
    )(setTransient, getState, api),
);

export function rehydrateResumeStore(): Promise<void> {
  const store = useResumeStore as typeof useResumeStore & {
    persist: { rehydrate: () => Promise<void> | void };
  };
  return Promise.resolve(store.persist.rehydrate());
}
