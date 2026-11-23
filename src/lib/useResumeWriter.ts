"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LOCK_NAME = "resume-template-history-writer";
const CHANNEL_NAME = "resume-template-history-writer";

type Phase =
  | "checking"
  | "writer"
  | "read-only"
  | "requesting"
  | "handoff"
  | "unsupported"
  | "error";
type Options = {
  beforeAcquire: () => Promise<void>;
  beforeHandoff: () => Promise<boolean>;
};
type Message = {
  type: "request" | "owner" | "refused";
  tab: string;
  target?: string;
};

/** Coordinates the single shared IndexedDB history across same-origin tabs. */
export function useResumeWriter(options: Options) {
  const callbacks = useRef(options);
  useEffect(() => {
    callbacks.current = options;
  });
  const [phase, setPhase] = useState<Phase>("checking");
  const writer = useRef(false);
  const operations = useRef<{ request: () => void; cancel: () => void }>({
    request: () => {},
    cancel: () => {},
  });
  const isWriterNow = useCallback(() => writer.current, []);
  const requestAccess = useCallback(() => operations.current.request(), []);
  const continueReadOnly = useCallback(() => operations.current.cancel(), []);

  useEffect(() => {
    if (!navigator.locks || typeof BroadcastChannel === "undefined") {
      let active = true;
      queueMicrotask(() => {
        if (active) setPhase("unsupported");
      });
      return () => {
        active = false;
      };
    }
    const tab = crypto.randomUUID();
    const channel = new BroadcastChannel(CHANNEL_NAME);
    let active = true;
    let pending: AbortController | undefined;
    let release: (() => void) | undefined;
    let handingOff = false;
    const requesters = new Set<string>();
    const update = (next: Phase) => {
      if (active) setPhase(next);
    };
    const send = (message: Message) => channel.postMessage(message);

    const handoff = async (target?: string) => {
      if (target) requesters.add(target);
      if (!writer.current || handingOff) return;
      handingOff = true;
      writer.current = false;
      update("handoff");
      let saved = false;
      try {
        saved = await callbacks.current.beforeHandoff();
      } catch {
        /* Retain ownership on save failure. */
      }
      if (saved || !active) {
        release?.();
        update("read-only");
      } else {
        writer.current = true;
        update("writer");
        if (active) {
          for (const requester of requesters)
            send({ type: "refused", tab, target: requester });
        }
      }
      requesters.clear();
      handingOff = false;
    };
    const acquire = (wait: boolean) => {
      const controller = new AbortController();
      pending = controller;
      navigator.locks
        .request(
          LOCK_NAME,
          wait ? { signal: controller.signal } : { ifAvailable: true },
          async (lock) => {
            if (!lock) {
              if (pending === controller) pending = undefined;
              update("read-only");
              return;
            }
            if (!active || controller.signal.aborted) return;
            try {
              await callbacks.current.beforeAcquire();
            } catch {
              if (pending === controller) pending = undefined;
              update("error");
              return;
            }
            if (!active || controller.signal.aborted) return;
            if (pending === controller) pending = undefined;
            await new Promise<void>((resolve) => {
              release = resolve;
              writer.current = true;
              update("writer");
              send({ type: "owner", tab });
            });
            release = undefined;
          },
        )
        .catch((error: unknown) => {
          if (
            active &&
            !(error instanceof DOMException && error.name === "AbortError")
          )
            update("error");
        });
    };
    channel.onmessage = ({ data }: MessageEvent<Message>) => {
      if (!active || !data || data.tab === tab) return;
      if (data.type === "request") void handoff(data.tab);
      if (data.type === "owner" && pending) send({ type: "request", tab });
      if (data.type === "refused" && data.target === tab && pending) {
        pending.abort();
        pending = undefined;
        update("error");
      }
    };
    operations.current = {
      request: () => {
        if (writer.current || handingOff || release || pending) return;
        update("requesting");
        acquire(true);
        send({ type: "request", tab });
      },
      cancel: () => {
        pending?.abort();
        pending = undefined;
        update("read-only");
      },
    };
    const onPageHide = () => {
      void handoff();
    };
    window.addEventListener("pagehide", onPageHide);
    // Strict Mode may replay effects before the browser handles the first lock request.
    queueMicrotask(() => {
      if (active) acquire(false);
    });
    return () => {
      active = false;
      window.removeEventListener("pagehide", onPageHide);
      pending?.abort();
      operations.current = { request: () => {}, cancel: () => {} };
      if (writer.current) void handoff();
      channel.close();
    };
  }, []);

  return {
    isWriter: phase === "writer",
    isWriterNow,
    phase,
    requestAccess,
    continueReadOnly,
  };
}
