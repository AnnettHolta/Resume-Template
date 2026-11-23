import { del, get, set } from "idb-keyval";
import { debounce } from "lodash-es";
import type { StateStorage } from "zustand/middleware";

export const HISTORY_PERSIST_DEBOUNCE_MS = 1000;

type SaveStatus = "idle" | "saving" | "saved" | "error";
type HistoryWrite = { name: string; value: string };

let latest: HistoryWrite | undefined;
let scheduled: HistoryWrite | undefined;
let writes = Promise.resolve();
let status: SaveStatus = "idle";
const listeners = new Set<() => void>();

export const getSaveStatus = () => status;
export const subscribeToSaveStatus = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

function setStatus(next: SaveStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
}

function enqueueWrite() {
  const write = latest;
  if (!write || write === scheduled) return;
  scheduled = write;

  writes = writes.then(async () => {
    if (latest !== write) return;
    try {
      await set(write.name, write.value);
      if (latest === write) setStatus("saved");
    } catch {
      if (latest === write) setStatus("error");
    }
  });
}

const debouncedWrite = debounce(enqueueWrite, HISTORY_PERSIST_DEBOUNCE_MS);

export function flushIndexedDbWrites(): void {
  debouncedWrite.flush();
}

/** Flush pending writes and confirm that the latest value reached IndexedDB. */
export async function flushIndexedDbWritesConfirmed(): Promise<boolean> {
  if (status === "error") retryIndexedDbWrite();
  debouncedWrite.flush();
  for (;;) {
    const currentWrites = writes;
    await currentWrites;
    if (currentWrites === writes)
      return status !== "error" && status !== "saving";
  }
}

export function cancelIndexedDbWrites(): void {
  debouncedWrite.cancel();
  latest = undefined;
  scheduled = undefined;
  setStatus("idle");
}

export function retryIndexedDbWrite(): void {
  if (status !== "error" || !latest) return;
  scheduled = undefined;
  setStatus("saving");
  enqueueWrite();
}

export const debouncedIndexedDbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    return (await get<string>(name)) ?? null;
  },
  setItem: (name: string, value: string): void => {
    if (
      typeof window === "undefined" ||
      (latest?.name === name && latest.value === value)
    )
      return;
    latest = { name, value };
    setStatus("saving");
    debouncedWrite();
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;
    cancelIndexedDbWrites();
    writes = writes.then(async () => {
      try {
        await del(name);
      } catch {
        if (!latest) setStatus("error");
      }
    });
    await writes;
  },
};
