"use client";

import { useState } from "react";
import type {
  EducationItem,
  ExperienceItem,
  ResumeData,
  ResumeProfile,
} from "@/types/resume";
import { downloadResumeJson, parseResumeJson } from "@/lib/resumeStorage";
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

  const activeEntries = entries.length > 0 ? entries : [initialData];
  const activeIndex = entries.length > 0 ? index : 0;
  const currentResume = activeEntries[activeIndex] ?? initialData;

  const {
    mcpToken,
    isMcpExpired,
    conflict,
    keepLocal,
    useRemote,
    notifyTokenChange,
    notifySessionRevalidated,
  } = useMcpSync(initialData, hasHydrated);

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
        onReset={() => setIsResetConfirmOpen(true)}
        onOpenMcp={() => setIsMcpModalOpen(true)}
        onPrint={() => setIsPrintModalOpen(true)}
      />

      <main className={styles.canvas}>
        {conflict && (
          <section
            className={`${styles.conflict} no-print`}
            aria-labelledby="sync-conflict"
          >
            <div role="status">
              <h2 id="sync-conflict">Two versions of this resume</h2>
              <p>
                Your editor draft is still here. Choose which version to sync,
                or download the session copy to review it.
              </p>
            </div>
            <div className={styles.conflictActions}>
              <button type="button" onClick={keepLocal}>
                Sync editor draft
              </button>
              <button type="button" onClick={useRemote}>
                Use session version
              </button>
              <button
                type="button"
                onClick={() => downloadResumeJson(conflict)}
              >
                Download session copy
              </button>
            </div>
          </section>
        )}
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
        onTokenChange={notifyTokenChange}
        onSessionRevalidated={notifySessionRevalidated}
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
