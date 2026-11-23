import { renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { expect, it, vi } from "vitest";
import { useResumeWriter } from "@/lib/useResumeWriter";

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
