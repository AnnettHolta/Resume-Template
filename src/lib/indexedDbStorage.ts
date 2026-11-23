import { del, get, set } from "idb-keyval";
import { debounce } from "lodash-es";
import type { StateStorage } from "zustand/middleware";

export const HISTORY_PERSIST_DEBOUNCE_MS = 1000;

const debouncedSet = debounce((name: string, value: string) => {
  void set(name, value);
}, HISTORY_PERSIST_DEBOUNCE_MS);

export function flushIndexedDbWrites(): void {
  debouncedSet.flush();
}

export function cancelIndexedDbWrites(): void {
  debouncedSet.cancel();
}

export const debouncedIndexedDbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    try {
      const value = await get<string>(name);
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    debouncedSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;
    debouncedSet.cancel();
    try {
      await del(name);
    } catch {
      // Ignore IndexedDB deletion errors
    }
  },
};

