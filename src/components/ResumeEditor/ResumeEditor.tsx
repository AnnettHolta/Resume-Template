"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import styles from "./ResumeEditor.module.scss";

interface ResumeEditorProps {
  initialData: ResumeData;
}

const MCP_COOKIE_NAME = "resumeMcpToken";

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

  const [mcpToken, setMcpToken] = useState<string | null>(() => readMcpCookie());
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const skipNextRemoteSyncRef = useRef(false);

  const activeEntries = hasHydrated && entries.length > 0 ? entries : [initialData];
  const activeIndex = hasHydrated && entries.length > 0 ? index : 0;
  const currentResume = activeEntries[activeIndex] ?? initialData;

  const debouncedServerSync = useMemo(
    () =>
      debounce((data: ResumeData) => {
        void fetch("/api/resume", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }, HISTORY_PERSIST_DEBOUNCE_MS),
    []
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
    if (!mcpToken || !hasHydrated) return;
    if (skipNextRemoteSyncRef.current) {
      skipNextRemoteSyncRef.current = false;
      return;
    }
    debouncedServerSync(currentResume);
  }, [currentResume, mcpToken, hasHydrated, debouncedServerSync]);

  // Server (MCP) -> Browser live SSE updates (only when optional MCP token is active)
  useEffect(() => {
    if (!mcpToken) return;
    const eventSource = new EventSource("/api/resume/events");

    eventSource.addEventListener("resume-updated", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent<string>).data) as {
          data?: ResumeData;
        };
        if (payload.data && isValidResumeData(payload.data)) {
          skipNextRemoteSyncRef.current = true;
          commitResume(payload.data, initialData);
          setStatusMessage("Synced update from MCP");
        }
      } catch {
        // Ignore malformed SSE payload
      }
    });

    return () => {
      eventSource.close();
    };
  }, [mcpToken, commitResume, initialData, setStatusMessage]);

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
        isMcpConnected={Boolean(mcpToken)}
        onUndo={undo}
        onRedo={redo}
        onDownloadJson={() => downloadResumeJson(currentResume)}
        onImportJson={handleImportJson}
        onReset={() => reset(initialData)}
        onOpenMcp={() => setIsMcpModalOpen(true)}
        onPrint={() => window.print()}
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
        currentResume={currentResume}
        onTokenChange={setMcpToken}
        onClose={() => setIsMcpModalOpen(false)}
      />
    </div>
  );
}
