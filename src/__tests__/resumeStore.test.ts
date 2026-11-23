import { get, set } from "idb-keyval";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import initialResume from "@/data/resume.json";
import {
  cancelIndexedDbWrites,
  debouncedIndexedDbStorage,
  flushIndexedDbWrites,
  getSaveStatus,
  HISTORY_PERSIST_DEBOUNCE_MS,
  retryIndexedDbWrite,
} from "@/lib/indexedDbStorage";
import { MAX_HISTORY_LENGTH } from "@/lib/resumeStorage";
import { RESUME_STORE_KEY, useResumeStore } from "@/store/useResumeStore";
import type { ResumeData } from "@/types/resume";

describe("useResumeStore & debouncedIndexedDbStorage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cancelIndexedDbWrites();
    useResumeStore.setState({
      entries: [],
      index: 0,
      hasHydrated: true,
      statusMessage: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("supports commit, undo, redo, and reset", () => {
    const base = initialResume as ResumeData;
    const store = useResumeStore.getState();

    const edit1: ResumeData = {
      ...base,
      profile: { ...base.profile, name: "Jane Doe" },
    };
    const edit2: ResumeData = {
      ...edit1,
      profile: { ...edit1.profile, headline: "Staff Engineer" },
    };

    store.commitResume(edit1, base);
    store.commitResume(edit2, base);

    expect(useResumeStore.getState().entries).toHaveLength(3);
    expect(useResumeStore.getState().index).toBe(2);

    store.undo();
    expect(useResumeStore.getState().index).toBe(1);
    expect(
      useResumeStore.getState().entries[useResumeStore.getState().index].profile
        .name,
    ).toBe("Jane Doe");

    store.redo();
    expect(useResumeStore.getState().index).toBe(2);

    store.reset(base);
    expect(useResumeStore.getState().entries).toHaveLength(1);
    expect(useResumeStore.getState().index).toBe(0);
  });

  it("caps history at MAX_HISTORY_LENGTH (50)", () => {
    const base = initialResume as ResumeData;
    const store = useResumeStore.getState();

    for (let i = 1; i <= 60; i++) {
      store.commitResume(
        {
          ...base,
          profile: { ...base.profile, name: `User ${i}` },
        },
        base,
      );
    }

    const state = useResumeStore.getState();
    expect(state.entries).toHaveLength(MAX_HISTORY_LENGTH);
    expect(state.index).toBe(MAX_HISTORY_LENGTH - 1);
    expect(state.entries[state.index].profile.name).toBe("User 60");
  });

  it("debounces IndexedDB writes to 1s and supports flush", async () => {
    const setMock = vi.mocked(set);
    setMock.mockClear();

    debouncedIndexedDbStorage.setItem("test-key", '{"a":1}');
    debouncedIndexedDbStorage.setItem("test-key", '{"a":2}');
    expect(setMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(HISTORY_PERSIST_DEBOUNCE_MS - 100);
    expect(setMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith("test-key", '{"a":2}');

    debouncedIndexedDbStorage.setItem("test-key", '{"a":3}');
    flushIndexedDbWrites();
    await vi.advanceTimersByTimeAsync(0);
    expect(setMock).toHaveBeenCalledTimes(2);
    expect(setMock).toHaveBeenLastCalledWith("test-key", '{"a":3}');
  });

  it("handles a failed save and retries the current payload", async () => {
    vi.mocked(set).mockRejectedValueOnce(new Error("Storage full"));
    debouncedIndexedDbStorage.setItem("test-key", "draft");
    expect(getSaveStatus()).toBe("saving");
    await vi.advanceTimersByTimeAsync(HISTORY_PERSIST_DEBOUNCE_MS);
    expect(getSaveStatus()).toBe("error");

    retryIndexedDbWrite();
    await vi.advanceTimersByTimeAsync(0);
    expect(getSaveStatus()).toBe("saved");
    await expect(get("test-key")).resolves.toBe("draft");
  });

  it("waits for the latest write and keeps a reset after an in-flight edit", async () => {
    let finishOldWrite = () => {};
    vi.mocked(set).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishOldWrite = resolve;
        }),
    );
    const store = useResumeStore.getState();
    store.commitResume(
      {
        ...initialResume,
        profile: { ...initialResume.profile, name: "Earlier edit" },
      },
      initialResume,
    );
    flushIndexedDbWrites();
    await vi.advanceTimersByTimeAsync(0);

    store.reset(initialResume);
    expect(getSaveStatus()).toBe("saving");
    finishOldWrite();
    await vi.advanceTimersByTimeAsync(0);
    expect(getSaveStatus()).toBe("saved");
    const stored = await get<string>(RESUME_STORE_KEY);
    expect(JSON.parse(stored ?? "{}").state).toEqual({
      entries: [initialResume],
      index: 0,
    });
  });
});
