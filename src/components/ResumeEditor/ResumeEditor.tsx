"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  EducationItem,
  ExperienceItem,
  ResumeData,
  ResumeProfile,
} from "@/types/resume";
import { downloadResumeJson, parseResumeJson } from "@/lib/resumeStorage";
import {
  flushIndexedDbWrites,
  getSaveStatus,
  retryIndexedDbWrite,
  subscribeToSaveStatus,
} from "@/lib/indexedDbStorage";
import { useMcpSync } from "@/hooks/useMcpSync";
import { useResumeStore } from "@/store/useResumeStore";
import { Toolbar } from "@/components/Toolbar/Toolbar";
import { ResumeHeader } from "@/components/ResumeHeader/ResumeHeader";
import { ExperienceSection } from "@/components/ExperienceSection/ExperienceSection";
import { EducationSection } from "@/components/EducationSection/EducationSection";
import { SkillsSection } from "@/components/SkillsSection/SkillsSection";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";
import { McpModal } from "@/components/McpModal/McpModal";
import { PrintModal, type PrintMode } from "@/components/PrintModal/PrintModal";
import styles from "./ResumeEditor.module.scss";

interface ResumeEditorProps {
  initialData: ResumeData;
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

  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("printer");
  const pendingPrint = useRef(false);

  const activeEntries = entries.length > 0 ? entries : [initialData];
  const activeIndex = entries.length > 0 ? index : 0;
  const currentResume = activeEntries[activeIndex] ?? initialData;

  const { mcpToken, isMcpExpired, isEditorConnected, notifyTokenChange } =
    useMcpSync(initialData, hasHydrated);
  const saveStatus = useSyncExternalStore(
    subscribeToSaveStatus,
    getSaveStatus,
    (): ReturnType<typeof getSaveStatus> => "idle",
  );

  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushIndexedDbWrites();
    };
    window.addEventListener("pagehide", flushIndexedDbWrites);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushIndexedDbWrites);
      document.removeEventListener("visibilitychange", flushWhenHidden);
    };
  }, []);

  const commitSection = (change: Partial<ResumeData>) => {
    const { entries, index } = useResumeStore.getState();
    commitResume(
      { ...(entries[index] ?? initialData), ...change },
      initialData,
    );
  };

  const handleImportJson = async (file: File) => {
    const text = await file.text().catch(() => null);
    if (text === null) {
      setStatusMessage("Could not read the resume file.");
      return;
    }
    try {
      commitResume(parseResumeJson(text), initialData);
      setStatusMessage("Imported JSON");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Import failed.",
      );
    }
  };

  const handleProfileCommit = (nextProfile: ResumeProfile) => {
    commitSection({ profile: nextProfile });
  };

  const handleExperienceChange = (nextExperience: ExperienceItem[]) => {
    commitSection({ experience: nextExperience });
  };

  const handleEducationChange = (nextEducation: EducationItem[]) => {
    commitSection({ education: nextEducation });
  };

  const handleSkillsChange = (nextSkills: string[]) => {
    commitSection({ skills: nextSkills });
  };

  return (
    <div className={styles.wrapper}>
      <Toolbar
        canUndo={activeIndex > 0}
        canRedo={activeIndex < activeEntries.length - 1}
        historyPosition={activeIndex + 1}
        historyTotal={activeEntries.length}
        isMcpConnected={isEditorConnected}
        onUndo={undo}
        onRedo={redo}
        onDownloadJson={() => downloadResumeJson(currentResume)}
        onImportJson={handleImportJson}
        onReset={() => setIsResetConfirmOpen(true)}
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

        <footer className={`${styles.footer} no-print`}>
          <div role="status">
            {statusMessage && <p>{statusMessage}</p>}
            {saveStatus === "saving" && <p>Saving on this device…</p>}
            {saveStatus === "saved" && <p>Saved on this device</p>}
            {saveStatus === "error" && <p>Couldn’t save on this device</p>}
          </div>
          {saveStatus === "error" && (
            <div className={styles.saveActions}>
              <button type="button" onClick={retryIndexedDbWrite}>
                Retry save
              </button>
              <button
                type="button"
                onClick={() => downloadResumeJson(currentResume)}
              >
                Download JSON
              </button>
            </div>
          )}
        </footer>
      </main>

      <McpModal
        isOpen={isMcpModalOpen}
        token={mcpToken}
        isSessionExpired={isMcpExpired}
        isEditorConnected={isEditorConnected}
        onTokenChange={notifyTokenChange}
        onClose={() => setIsMcpModalOpen(false)}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        initialMode={printMode}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirmPrint={(mode) => {
          setPrintMode(mode);
          document.documentElement.dataset.printMode = mode;
          pendingPrint.current = true;
          setIsPrintModalOpen(false);
        }}
        onExit={() => {
          if (!pendingPrint.current) return;
          pendingPrint.current = false;
          requestAnimationFrame(() => {
            window.print();
          });
        }}
      />

      <GeneralConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset Resume?"
        description="This will clear your local edits and undo history, restoring the initial resume template."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        isDestructive
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          reset(initialData);
        }}
      />
    </div>
  );
}
