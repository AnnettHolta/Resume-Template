import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { deleteAvatarBlob } from "@/lib/avatarStorage";
import {
  debouncedIndexedDbStorage,
  flushIndexedDbWrites,
} from "@/lib/indexedDbStorage";
import { isValidResumeData, MAX_HISTORY_LENGTH } from "@/lib/resumeStorage";
import type { ResumeData } from "@/types/resume";

export const RESUME_STORE_KEY = "resume-template-history-v1";

interface PersistedSlice {
  entries: ResumeData[];
  index: number;
}

interface ResumeStoreState extends PersistedSlice {
  hasHydrated: boolean;
  statusMessage: string | null;
  setStatusMessage: (message: string | null) => void;
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
        statusMessage: null,

        setStatusMessage: (statusMessage) => setTransient({ statusMessage }),

        commitResume: (nextData, fallbackInitial) => {
          const { entries, index } = get();
          const baseEntries = entries.length > 0 ? entries : [fallbackInitial];
          const currentResume = baseEntries[index] ?? fallbackInitial;

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
          const { entries, index } = get();
          if (index <= 0) return;
          set({
            entries,
            index: index - 1,
            statusMessage: "Undid change",
          });
        },

        redo: () => {
          const { entries, index } = get();
          if (index >= entries.length - 1) return;
          set({
            entries,
            index: index + 1,
            statusMessage: "Redid change",
          });
        },

        reset: (initialData) => {
          void deleteAvatarBlob();
          set({
            entries: [initialData],
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
