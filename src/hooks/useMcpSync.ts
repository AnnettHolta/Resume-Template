"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushIndexedDbWrites } from "@/lib/indexedDbStorage";
import { createResumeSync } from "@/lib/resumeSync";
import { useResumeStore } from "@/store/useResumeStore";
import type { ResumeData } from "@/types/resume";

const MCP_COOKIE_NAME = "resumeMcpToken";
export const MCP_COOKIE_EVENT = "resume-mcp-cookie-change";

function readMcpCookie(): string | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${MCP_COOKIE_NAME}=`));
  return cookie?.slice(MCP_COOKIE_NAME.length + 1) || null;
}

function subscribeMcpCookie(callback: () => void) {
  window.addEventListener(MCP_COOKIE_EVENT, callback);
  return () => window.removeEventListener(MCP_COOKIE_EVENT, callback);
}

export function useMcpSync(initialData: ResumeData, hasHydrated: boolean) {
  const mcpToken = useSyncExternalStore(
    subscribeMcpCookie,
    readMcpCookie,
    () => null,
  );
  const [isMcpExpired, setIsMcpExpired] = useState(false);
  const [sessionNonce, setSessionNonce] = useState(0);
  const [conflict, setConflict] = useState<ResumeData | null>(null);
  const syncRef = useRef<ReturnType<typeof createResumeSync> | null>(null);

  useEffect(() => {
    const flush = () => {
      flushIndexedDbWrites();
      syncRef.current?.scheduleSave.flush();
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flushWhenHidden);
    };
  }, []);

  useEffect(() => {
    if (!mcpToken || isMcpExpired || !hasHydrated) return;

    const { commitResume, setStatusMessage } = useResumeStore.getState();
    const readLocal = () => {
      const { entries, index } = useResumeStore.getState();
      return entries[index] ?? initialData;
    };
    const sync = createResumeSync({
      token: mcpToken,
      readLocal,
      isEditing: () =>
        Boolean(
          document.activeElement?.matches(
            "main :is(input, textarea, [contenteditable=true])",
          ),
        ),
      applyRemote: (data) => commitResume(data, initialData),
      showConflict: setConflict,
      showStatus: setStatusMessage,
      expire: () => {
        setIsMcpExpired(true);
        setStatusMessage("MCP session expired. Open MCP to reconnect.");
      },
    });
    syncRef.current = sync;
    const unsubscribe = useResumeStore.subscribe((state, previous) => {
      if (state.entries[state.index] !== previous.entries[previous.index]) {
        sync.scheduleSave();
      }
    });

    const events = new EventSource("/api/resume/events");
    events.addEventListener("connected", sync.refresh);
    events.addEventListener("resume-updated", sync.refresh);
    events.onerror = sync.refresh;
    window.addEventListener("online", sync.refresh);
    sync.refresh();

    return () => {
      sync.stop();
      syncRef.current = null;
      events.close();
      unsubscribe();
      window.removeEventListener("online", sync.refresh);
    };
  }, [mcpToken, isMcpExpired, hasHydrated, initialData, sessionNonce]);

  return {
    mcpToken,
    isMcpExpired,
    conflict: mcpToken && !isMcpExpired ? conflict : null,
    keepLocal: () => syncRef.current?.keepLocal(),
    useRemote: () => syncRef.current?.useRemote(),
    notifyTokenChange: () => {
      setConflict(null);
      setIsMcpExpired(false);
      window.dispatchEvent(new Event(MCP_COOKIE_EVENT));
    },
    notifySessionRevalidated: () => {
      setIsMcpExpired(false);
      setSessionNonce((value) => value + 1);
    },
  };
}
