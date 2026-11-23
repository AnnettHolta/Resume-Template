"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { debounce } from "lodash-es";
import type {
  EducationItem,
  ExperienceItem,
  ResumeData,
  ResumeProfile,
} from "@/types/resume";
import {
  flushIndexedDbWrites,
  HISTORY_PERSIST_DEBOUNCE_MS,
} from "@/lib/indexedDbStorage";
import { downloadResumeJson, isValidResumeData } from "@/lib/resumeStorage";
import { useResumeStore } from "@/store/useResumeStore";
import { Toolbar } from "@/components/Toolbar/Toolbar";
import { ResumeHeader } from "@/components/ResumeHeader/ResumeHeader";
import { ExperienceSection } from "@/components/ExperienceSection/ExperienceSection";
import { EducationSection } from "@/components/EducationSection/EducationSection";
import { SkillsSection } from "@/components/SkillsSection/SkillsSection";
import { McpModal } from "@/components/McpModal/McpModal";
import { PrintModal, type PrintMode } from "@/components/PrintModal/PrintModal";
import styles from "./ResumeEditor.module.scss";

interface ResumeEditorProps {
  initialData: ResumeData;
}

const MCP_COOKIE_NAME = "resumeMcpToken";
const MCP_COOKIE_EVENT = "resume-mcp-cookie-change";

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

export function ResumeEditor({ initialData }: ResumeEditorProps) {
  const entries = useResumeStore((s) => s.entries);
  const index = useResumeStore((s) => s.index);
  const hasHydrated = useResumeStore((s) => s.hasHydrated);
  const statusMessage = useResumeStore((s) => s.statusMessage);
  const commitResume = useResumeStore((s) => s.commitResume);
  const undo = useResumeStore((s) => s.undo);
  const redo = useResumeStore((s) => s.redo);
  const reset = useResumeStore((s) => s.reset);
  const setStatusMessage = useResumeStore((s) => s.setStatusMessage);

  const mcpToken = useSyncExternalStore(
    subscribeMcpCookie,
    readMcpCookie,
    () => null
  );
  const [isMcpExpired, setIsMcpExpired] = useState(false);
  const [mcpSessionNonce, setMcpSessionNonce] = useState(0);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("printer");
  const skipNextRemoteSyncRef = useRef(false);

  const activeEntries = entries.length > 0 ? entries : [initialData];
  const activeIndex = entries.length > 0 ? index : 0;
  const currentResume = activeEntries[activeIndex] ?? initialData;

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

  // Flush both IndexedDB and optional server sync on page hide / unmount
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

  // Browser -> Server 1s debounced sync (only when optional MCP token is active)
  useEffect(() => {
    if (!mcpToken || isMcpExpired || !hasHydrated) return;
    if (skipNextRemoteSyncRef.current) {
      skipNextRemoteSyncRef.current = false;
      return;
    }
    debouncedServerSync(currentResume);
  }, [
    currentResume,
    mcpToken,
    isMcpExpired,
    hasHydrated,
    debouncedServerSync,
  ]);

  // Server (MCP) -> Browser live SSE updates + reconnect catch-up
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
      // Catch up on any MCP edits missed while disconnected
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
      // Check if error was due to 401 expired/revoked token
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

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isValidResumeData(parsed)) {
        setStatusMessage("Invalid resume JSON format");
        return;
      }
      commitResume(parsed, initialData);
      setStatusMessage("Imported JSON");
    } catch {
      setStatusMessage("Failed to parse JSON file");
    }
  };

  const handleProfileCommit = (nextProfile: ResumeProfile) => {
    commitResume({ ...currentResume, profile: nextProfile }, initialData);
  };

  const handleExperienceChange = (nextExperience: ExperienceItem[]) => {
    commitResume({ ...currentResume, experience: nextExperience }, initialData);
  };

  const handleEducationChange = (nextEducation: EducationItem[]) => {
    commitResume({ ...currentResume, education: nextEducation }, initialData);
  };

  const handleSkillsChange = (nextSkills: string[]) => {
    commitResume({ ...currentResume, skills: nextSkills }, initialData);
  };

  return (
    <div className={styles.wrapper}>
      <Toolbar
        canUndo={activeIndex > 0}
        canRedo={activeIndex < activeEntries.length - 1}
        historyPosition={activeIndex + 1}
        historyTotal={activeEntries.length}
        isMcpConnected={Boolean(mcpToken) && !isMcpExpired}
        onUndo={undo}
        onRedo={redo}
        onDownloadJson={() => downloadResumeJson(currentResume)}
        onImportJson={handleImportJson}
        onReset={() => reset(initialData)}
        onOpenMcp={() => setIsMcpModalOpen(true)}
        onPrint={() => setIsPrintModalOpen(true)}
      />

      <main className={styles.canvas}>
        <div className={styles.sheet}>
          <ResumeHeader
            profile={currentResume.profile}
            onCommit={handleProfileCommit}
          />
          <ExperienceSection
            items={currentResume.experience}
            onChange={handleExperienceChange}
          />
          <EducationSection
            items={currentResume.education}
            onChange={handleEducationChange}
          />
          <SkillsSection
            skills={currentResume.skills}
            onChange={handleSkillsChange}
          />
        </div>

        <footer className={`${styles.footer} no-print`} role="status">
          <p>
            {statusMessage ? `${statusMessage} · ` : ""}
            History is automatically saved to IndexedDB (1s debounce).
          </p>
        </footer>
      </main>

      <McpModal
        isOpen={isMcpModalOpen}
        token={mcpToken}
        isSessionExpired={isMcpExpired}
        currentResume={currentResume}
        onTokenChange={(next) => {
          window.dispatchEvent(new Event(MCP_COOKIE_EVENT));
          if (!next) setIsMcpExpired(false);
        }}
        onSessionRevalidated={() => {
          setIsMcpExpired(false);
          setMcpSessionNonce((n) => n + 1);
          setStatusMessage("MCP session active");
        }}
        onClose={() => setIsMcpModalOpen(false)}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        initialMode={printMode}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirmPrint={(mode) => {
          setPrintMode(mode);
          document.documentElement.dataset.printMode = mode;
          setIsPrintModalOpen(false);
          requestAnimationFrame(() => {
            window.print();
          });
        }}
      />
    </div>
  );
}
