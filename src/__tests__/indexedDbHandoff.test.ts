import { set } from "idb-keyval";
import { afterEach, expect, it, vi } from "vitest";
import {
  cancelIndexedDbWrites,
  debouncedIndexedDbStorage,
  flushIndexedDbWritesConfirmed,
} from "@/lib/indexedDbStorage";

afterEach(() => {
  cancelIndexedDbWrites();
  vi.restoreAllMocks();
});

it("confirms only after the pending write finishes and reports failures", async () => {
  let finish = () => {};
  vi.mocked(set).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  debouncedIndexedDbStorage.setItem("handoff", "first");
  let done = false;
  const flush = flushIndexedDbWritesConfirmed().then((result) => {
    done = true;
    return result;
  });
  await Promise.resolve();
  expect(done).toBe(false);
  finish();
  await expect(flush).resolves.toBe(true);

  vi.mocked(set).mockRejectedValueOnce(new Error("full"));
  debouncedIndexedDbStorage.setItem("handoff", "second");
  await expect(flushIndexedDbWritesConfirmed()).resolves.toBe(false);
  await expect(flushIndexedDbWritesConfirmed()).resolves.toBe(true);
});
