"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { debounce } from "lodash-es";
import {
  flushIndexedDbWrites,
  HISTORY_PERSIST_DEBOUNCE_MS,
} from "@/lib/indexedDbStorage";
import { isValidResumeData } from "@/lib/resumeStorage";
import type { ResumeData } from "@/types/resume";

const MCP_COOKIE_NAME = "resumeMcpToken";
export const MCP_COOKIE_EVENT = "resume-mcp-cookie-change";

function readMcpCookie(): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === MCP_COOKIE_NAME) {
      const value = decodeURIComponent(rest.join("="));
      return value || null;
    }
  }
  return null;
}

function subscribeMcpCookie(callback: () => void) {
  window.addEventListener(MCP_COOKIE_EVENT, callback);
  return () => window.removeEventListener(MCP_COOKIE_EVENT, callback);
}

interface UseMcpSyncOptions {
  currentResume: ResumeData;
  initialData: ResumeData;
  hasHydrated: boolean;
  commitResume: (nextData: ResumeData, fallbackInitial: ResumeData) => void;
  setStatusMessage: (message: string | null) => void;
}

export function useMcpSync({
  currentResume,
  initialData,
  hasHydrated,
  commitResume,
  setStatusMessage,
}: UseMcpSyncOptions) {
  const mcpToken = useSyncExternalStore(
    subscribeMcpCookie,
    readMcpCookie,
    () => null
  );
  const [isMcpExpired, setIsMcpExpired] = useState(false);
  const [mcpSessionNonce, setMcpSessionNonce] = useState(0);
  const skipNextRemoteSyncRef = useRef(false);

  const debouncedServerSync = useMemo(
    () =>
      debounce(async (data: ResumeData) => {
        try {
          const res = await fetch("/api/resume", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (res.status === 401) {
            setIsMcpExpired(true);
            setStatusMessage("MCP session expired — click MCP to revalidate");
          }
        } catch {
          // Ignore transient network errors
        }
      }, HISTORY_PERSIST_DEBOUNCE_MS),
    [setStatusMessage]
  );

  useEffect(() => {
    const handleFlush = () => {
      flushIndexedDbWrites();
      debouncedServerSync.flush();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleFlush();
      }
    };

    window.addEventListener("pagehide", handleFlush);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      handleFlush();
      window.removeEventListener("pagehide", handleFlush);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [debouncedServerSync]);

  useEffect(() => {
    if (!mcpToken || isMcpExpired || !hasHydrated) return;
    if (skipNextRemoteSyncRef.current) {
      skipNextRemoteSyncRef.current = false;
      return;
    }
    debouncedServerSync(currentResume);
  }, [currentResume, mcpToken, isMcpExpired, hasHydrated, debouncedServerSync]);

  useEffect(() => {
    if (!mcpToken || isMcpExpired) return;
    let isCancelled = false;
    let hasConnectedOnce = false;

    const eventSource = new EventSource("/api/resume/events");

    eventSource.onopen = async () => {
      if (isCancelled) return;
      if (!hasConnectedOnce) {
        hasConnectedOnce = true;
        return;
      }
      try {
        const res = await fetch("/api/resume");
        if (res.status === 401) {
          setIsMcpExpired(true);
          eventSource.close();
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as unknown;
          if (!isCancelled && isValidResumeData(data)) {
            debouncedServerSync.cancel();
            skipNextRemoteSyncRef.current = true;
            commitResume(data, initialData);
          }
        }
      } catch {
        // Ignore transient catch-up errors
      }
    };

    eventSource.addEventListener("resume-updated", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent<string>).data) as {
          data?: ResumeData;
        };
        if (payload.data && isValidResumeData(payload.data)) {
          debouncedServerSync.cancel();
          skipNextRemoteSyncRef.current = true;
          commitResume(payload.data, initialData);
          setStatusMessage("Synced update from MCP");
        }
      } catch {
        // Ignore malformed SSE payload
      }
    });

    eventSource.onerror = async () => {
      try {
        const res = await fetch("/api/resume");
        if (!isCancelled && res.status === 401) {
          setIsMcpExpired(true);
          setStatusMessage("MCP session expired — click MCP to revalidate");
          eventSource.close();
        }
      } catch {
        // Keep EventSource open for normal network reconnect
      }
    };

    return () => {
      isCancelled = true;
      eventSource.close();
    };
  }, [
    mcpToken,
    isMcpExpired,
    mcpSessionNonce,
    commitResume,
    initialData,
    setStatusMessage,
    debouncedServerSync,
  ]);

  return {
    mcpToken,
    isMcpExpired,
    notifyTokenChange: (next: string | null) => {
      window.dispatchEvent(new Event(MCP_COOKIE_EVENT));
      if (!next) setIsMcpExpired(false);
    },
    notifySessionRevalidated: () => {
      setIsMcpExpired(false);
      setMcpSessionNonce((n) => n + 1);
      setStatusMessage("MCP session active");
    },
  };
}

