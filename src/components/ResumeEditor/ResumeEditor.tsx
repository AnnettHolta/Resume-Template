"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import type {
  EducationItem,
  ExperienceItem,
  ResumeData,
  ResumeProfile,
} from "@/types/resume";
import {
  clearResumeStorage,
  downloadResumeJson,
  isValidResumeData,
  loadSavedHistory,
  loadSavedResume,
  MAX_HISTORY_LENGTH,
  saveHistoryToStorage,
  saveResumeToStorage,
  type StoredHistoryState,
} from "@/lib/resumeStorage";
import { Toolbar } from "@/components/Toolbar/Toolbar";
import { ResumeHeader } from "@/components/ResumeHeader/ResumeHeader";
import { ExperienceSection } from "@/components/ExperienceSection/ExperienceSection";
import { EducationSection } from "@/components/EducationSection/EducationSection";
import { SkillsSection } from "@/components/SkillsSection/SkillsSection";
import styles from "./ResumeEditor.module.scss";

interface ResumeEditorProps {
  initialData: ResumeData;
}

const STORE_EVENT = "resume-editor-store-change";

function subscribeToStore(callback: () => void) {
  window.addEventListener(STORE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function ResumeEditor({ initialData }: ResumeEditorProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const serverSnapshotRef = useRef<StoredHistoryState>({
    entries: [initialData],
    index: 0,
  });
  const clientCacheRef = useRef<{
    rawKey: string | null;
    snapshot: StoredHistoryState;
  } | null>(null);

  const getClientSnapshot = useCallback((): StoredHistoryState => {
    const savedHistory = loadSavedHistory();
    if (savedHistory) {
      const key = JSON.stringify(savedHistory);
      if (clientCacheRef.current?.rawKey === key) {
        return clientCacheRef.current.snapshot;
      }
      clientCacheRef.current = { rawKey: key, snapshot: savedHistory };
      return savedHistory;
    }

    const savedResume = loadSavedResume();
    if (savedResume) {
      const fallback: StoredHistoryState = { entries: [savedResume], index: 0 };
      const key = JSON.stringify(fallback);
      if (clientCacheRef.current?.rawKey === key) {
        return clientCacheRef.current.snapshot;
      }
      clientCacheRef.current = { rawKey: key, snapshot: fallback };
      return fallback;
    }

    return serverSnapshotRef.current;
  }, []);

  const historyState = useSyncExternalStore(
    subscribeToStore,
    getClientSnapshot,
    () => serverSnapshotRef.current
  );

  const { entries: history, index: historyIndex } = historyState;
  const currentResume = history[historyIndex] ?? initialData;

  const persistState = useCallback((nextState: StoredHistoryState) => {
    const activeResume = nextState.entries[nextState.index];
    saveResumeToStorage(activeResume);
    saveHistoryToStorage(nextState);
    window.dispatchEvent(new Event(STORE_EVENT));
  }, []);

  const commitResume = useCallback(
    (nextData: ResumeData) => {
      if (JSON.stringify(nextData) === JSON.stringify(currentResume)) {
        return;
      }

      const nextHistory = [...history.slice(0, historyIndex + 1), nextData].slice(
        -MAX_HISTORY_LENGTH
      );
      const nextIndex = nextHistory.length - 1;

      persistState({ entries: nextHistory, index: nextIndex });
      setStatusMessage("Saved to local storage");
    },
    [currentResume, history, historyIndex, persistState]
  );

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    persistState({ entries: history, index: historyIndex - 1 });
    setStatusMessage("Undid change");
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    persistState({ entries: history, index: historyIndex + 1 });
    setStatusMessage("Redid change");
  };

  const handleReset = () => {
    clearResumeStorage();
    clientCacheRef.current = null;
    window.dispatchEvent(new Event(STORE_EVENT));
    setStatusMessage("Reset to initial JSON");
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isValidResumeData(parsed)) {
        setStatusMessage("Invalid resume JSON format");
        return;
      }
      commitResume(parsed);
      setStatusMessage("Imported JSON");
    } catch {
      setStatusMessage("Failed to parse JSON file");
    }
  };

  const handleProfileCommit = (nextProfile: ResumeProfile) => {
    commitResume({ ...currentResume, profile: nextProfile });
  };

  const handleExperienceChange = (nextExperience: ExperienceItem[]) => {
    commitResume({ ...currentResume, experience: nextExperience });
  };

  const handleEducationChange = (nextEducation: EducationItem[]) => {
    commitResume({ ...currentResume, education: nextEducation });
  };

  const handleSkillsChange = (nextSkills: string[]) => {
    commitResume({ ...currentResume, skills: nextSkills });
  };

  return (
    <div className={styles.wrapper}>
      <Toolbar
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        historyPosition={historyIndex + 1}
        historyTotal={history.length}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDownloadJson={() => downloadResumeJson(currentResume)}
        onImportJson={handleImportJson}
        onReset={handleReset}
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
            {statusMessage
              ? `${statusMessage} · `
              : ""}
            All changes are automatically cached to local storage.
          </p>
        </footer>
      </main>
    </div>
  );
}
