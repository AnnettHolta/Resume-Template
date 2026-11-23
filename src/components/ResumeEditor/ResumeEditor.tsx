"use client";

import { useEffect } from "react";
import type {
  EducationItem,
  ExperienceItem,
  ResumeData,
  ResumeProfile,
} from "@/types/resume";
import { flushIndexedDbWrites } from "@/lib/indexedDbStorage";
import { downloadResumeJson, isValidResumeData } from "@/lib/resumeStorage";
import { useResumeStore } from "@/store/useResumeStore";
import { Toolbar } from "@/components/Toolbar/Toolbar";
import { ResumeHeader } from "@/components/ResumeHeader/ResumeHeader";
import { ExperienceSection } from "@/components/ExperienceSection/ExperienceSection";
import { EducationSection } from "@/components/EducationSection/EducationSection";
import { SkillsSection } from "@/components/SkillsSection/SkillsSection";
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

  useEffect(() => {
    const handleFlush = () => {
      flushIndexedDbWrites();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushIndexedDbWrites();
      }
    };

    window.addEventListener("pagehide", handleFlush);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      flushIndexedDbWrites();
      window.removeEventListener("pagehide", handleFlush);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const activeEntries = hasHydrated && entries.length > 0 ? entries : [initialData];
  const activeIndex = hasHydrated && entries.length > 0 ? index : 0;
  const currentResume = activeEntries[activeIndex] ?? initialData;

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
        onUndo={undo}
        onRedo={redo}
        onDownloadJson={() => downloadResumeJson(currentResume)}
        onImportJson={handleImportJson}
        onReset={() => reset(initialData)}
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
            History is automatically saved to IndexedDB (6s debounce).
          </p>
        </footer>
      </main>
    </div>
  );
}
