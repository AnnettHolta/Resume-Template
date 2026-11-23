import { set } from "idb-keyval";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import initialResume from "@/data/resume.json";
import {
  cancelIndexedDbWrites,
  debouncedIndexedDbStorage,
  flushIndexedDbWrites,
  HISTORY_PERSIST_DEBOUNCE_MS,
} from "@/lib/indexedDbStorage";
import { MAX_HISTORY_LENGTH } from "@/lib/resumeStorage";
import { useResumeStore } from "@/store/useResumeStore";
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

    vi.advanceTimersByTime(100);
    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith("test-key", '{"a":2}');

    debouncedIndexedDbStorage.setItem("test-key", '{"a":3}');
    flushIndexedDbWrites();
    expect(setMock).toHaveBeenCalledTimes(2);
    expect(setMock).toHaveBeenLastCalledWith("test-key", '{"a":3}');
  });
});
