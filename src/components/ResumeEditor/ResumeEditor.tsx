"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ResumeData } from "@/types/resume";
import { downloadResumeJson, parseResumeJson } from "@/lib/resumeStorage";
import { clearAvatarGallery } from "@/lib/avatarStorage";
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
import { LocalMcpNotice, McpModal } from "@/components/McpModal/McpModal";
import { ModalController } from "@/components/Modal/ModalController";
import { PrintModal, type PrintMode } from "@/components/PrintModal/PrintModal";
import { EditorAccessNotice } from "./EditorAccessNotice";
import { settleEditorDraft, useEditorAccess } from "./useEditorAccess";
import styles from "./ResumeEditor.module.scss";

const mcpEnabled = process.env.NEXT_PUBLIC_MCP_ENABLED !== "false";

interface ResumeEditorProps {
  initialData: ResumeData;
}

export function ResumeEditor({ initialData }: ResumeEditorProps) {
  return (
    <ModalController>
      <ResumeEditorContent initialData={initialData} />
    </ModalController>
  );
}

function ResumeEditorContent({ initialData }: ResumeEditorProps) {
  const entries = useResumeStore((s) => s.entries);
  const index = useResumeStore((s) => s.index);
  const statusMessage = useResumeStore((s) => s.statusMessage);
  const commitResume = useResumeStore((s) => s.commitResume);
  const importResume = useResumeStore((s) => s.importResume);
  const undo = useResumeStore((s) => s.undo);
  const redo = useResumeStore((s) => s.redo);
  const reset = useResumeStore((s) => s.reset);
  const setStatusMessage = useResumeStore((s) => s.setStatusMessage);

  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [printMode, setPrintMode] = useState<PrintMode>("printer");
  const pendingPrint = useRef(false);

  const activeEntries = entries.length > 0 ? entries : [initialData];
  const activeIndex = entries.length > 0 ? index : 0;
  const currentResume = activeEntries[activeIndex] ?? initialData;
  const access = useEditorAccess(initialData);
  const { isWriter, isWriterNow } = access;

  const { mcpToken, isMcpExpired, isEditorConnected, notifyTokenChange } =
    useMcpSync(initialData, isWriter && mcpEnabled, isWriterNow);
  const saveStatus = useSyncExternalStore(
    subscribeToSaveStatus,
    getSaveStatus,
    (): ReturnType<typeof getSaveStatus> => "idle",
  );

  useEffect(() => {
    const flushOnPageHide = () => {
      if (!isWriterNow()) return;
      settleEditorDraft();
      flushIndexedDbWrites();
    };
    const flushWhenHidden = () => {
      if (isWriterNow() && document.visibilityState === "hidden")
        flushIndexedDbWrites();
    };
    window.addEventListener("pagehide", flushOnPageHide);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushOnPageHide);
      document.removeEventListener("visibilitychange", flushWhenHidden);
    };
  }, [isWriterNow]);

  const commitSection = (change: Partial<ResumeData>) => {
    const { entries, index } = useResumeStore.getState();
    commitResume(
      { ...(entries[index] ?? initialData), ...change },
      initialData,
    );
  };

  const handleImportJson = async (file: File) => {
    if (!isWriterNow()) return;
    const text = await file.text().catch(() => null);
    if (!isWriterNow()) return;
    if (text === null) {
      setStatusMessage("Could not read the resume file.");
      return;
    }
    try {
      importResume(parseResumeJson(text), initialData);
      setStatusMessage("Imported JSON");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Import failed.",
      );
    }
  };

  return (
    <div className={styles.wrapper}>
      <Toolbar
        canEdit={isWriter}
        canOpenMcp={!mcpEnabled || isWriter}
        canExport={entries.length > 0}
        canUndo={isWriter && activeIndex > 0}
        canRedo={isWriter && activeIndex < activeEntries.length - 1}
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
        <EditorAccessNotice {...access} />
        <div
          key={`${currentResume.resumeId}-${isWriter}-${resetVersion}`}
          className={styles.sheet}
        >
          <ResumeHeader
            profile={currentResume.profile}
            onCommit={(profile) => commitSection({ profile })}
            resumeId={currentResume.resumeId}
            canEdit={isWriter}
            canEditNow={isWriterNow}
          />
          <fieldset className={styles.editorSections} disabled={!isWriter}>
            <ExperienceSection
              items={currentResume.experience}
              onChange={(experience) => commitSection({ experience })}
            />
            <EducationSection
              items={currentResume.education}
              onChange={(education) => commitSection({ education })}
            />
            <SkillsSection
              skills={currentResume.skills}
              onChange={(skills) => commitSection({ skills })}
              canEdit={isWriter}
            />
          </fieldset>
        </div>

        <footer className={`${styles.footer} no-print`}>
          <div role="status">
            {statusMessage && <p>{statusMessage}</p>}
            {isWriter && saveStatus === "saving" && (
              <p>Saving on this device…</p>
            )}
            {isWriter && saveStatus === "saved" && <p>Saved on this device</p>}
            {isWriter && saveStatus === "error" && (
              <p>Couldn’t save on this device</p>
            )}
          </div>
          {isWriter && saveStatus === "error" && (
            <div className={styles.saveActions}>
              <button
                type="button"
                onClick={() => {
                  if (isWriterNow()) retryIndexedDbWrite();
                }}
              >
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

      {mcpEnabled ? (
        <McpModal
          isOpen={isWriter && isMcpModalOpen}
          token={mcpToken}
          isSessionExpired={isMcpExpired}
          isEditorConnected={isEditorConnected}
          onTokenChange={notifyTokenChange}
          onClose={() => setIsMcpModalOpen(false)}
        />
      ) : (
        <LocalMcpNotice
          isOpen={isMcpModalOpen}
          onClose={() => setIsMcpModalOpen(false)}
        />
      )}

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
        isOpen={isWriter && isResetConfirmOpen}
        title="Reset Resume?"
        description="This restores the starter template and clears this resume’s local edits, undo history, and saved photos."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        isDestructive
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          if (!isWriterNow()) return;
          reset(initialData);
          setResetVersion((version) => version + 1);
          if (currentResume.resumeId) {
            void clearAvatarGallery(currentResume.resumeId).catch(() => {
              setStatusMessage(
                "Resume reset. The saved photos could not be removed.",
              );
            });
          }
        }}
      />
    </div>
  );
}
