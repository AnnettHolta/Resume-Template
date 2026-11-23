import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { expect, it, vi } from "vitest";
import { useResumeWriter } from "@/lib/useResumeWriter";
import * as writerLease from "@/lib/resumeWriterLease";

it("requests the initial editor lock once when Strict Mode replays effects", async () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "locks");
  const request = vi.fn(
    async (
      _name: string,
      _options: LockOptions,
      callback: LockGrantedCallback<unknown>,
    ) => callback({ name: "resume", mode: "exclusive" }),
  );
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: { request },
  });
  vi.stubGlobal(
    "BroadcastChannel",
    class {
      postMessage() {}
      close() {}
    },
  );
  const beforeAcquire = vi.fn(async () => {});
  const beforeHandoff = vi.fn(async () => true);
  const hook = renderHook(
    () => useResumeWriter({ beforeAcquire, beforeHandoff }),
    {
      wrapper: StrictMode,
    },
  );

  try {
    await waitFor(() => expect(hook.result.current.isWriter).toBe(true));
    expect(hook.result.current.isWriterNow()).toBe(true);
    expect(request).toHaveBeenCalledOnce();
    expect(beforeAcquire).toHaveBeenCalledOnce();
  } finally {
    hook.unmount();
    if (original) Object.defineProperty(navigator, "locks", original);
    else Reflect.deleteProperty(navigator, "locks");
    vi.unstubAllGlobals();
  }
});

it("uses the storage lease and revokes editing when Web Locks are unavailable", async () => {
  const originally = Object.getOwnPropertyDescriptor(navigator, "locks");
  const lost = new AbortController();
  const request = vi
    .spyOn(writerLease, "requestResumeWriterLease")
    .mockImplementation(async (_wait, _signal, onGrant) =>
      onGrant(true, lost.signal),
    );
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: undefined,
  });
  vi.stubGlobal("indexedDB", {});
  vi.stubGlobal("crypto", {
    getRandomValues: crypto.getRandomValues.bind(crypto),
  });
  vi.stubGlobal(
    "BroadcastChannel",
    class {
      postMessage() {}
      close() {}
    },
  );
  const onOwnershipLost = vi.fn();
  const hook = renderHook(() =>
    useResumeWriter({
      beforeAcquire: async () => {},
      beforeHandoff: async () => true,
      onOwnershipLost,
    }),
  );

  try {
    await waitFor(() => expect(hook.result.current.isWriter).toBe(true));
    expect(request).toHaveBeenCalledOnce();

    act(() => lost.abort());
    expect(hook.result.current.phase).toBe("lost");
    expect(hook.result.current.isWriterNow()).toBe(false);
    expect(onOwnershipLost).toHaveBeenCalledOnce();
  } finally {
    hook.unmount();
    request.mockRestore();
    if (originally) Object.defineProperty(navigator, "locks", originally);
    else Reflect.deleteProperty(navigator, "locks");
    vi.unstubAllGlobals();
  }
});
