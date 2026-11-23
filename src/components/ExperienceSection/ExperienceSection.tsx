"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ExperienceItem } from "@/types/resume";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";
import { ExperienceCard } from "./ExperienceCard";
import styles from "./ExperienceSection.module.scss";

interface ExperienceSectionProps {
  items: ExperienceItem[];
  onChange: (nextItems: ExperienceItem[]) => void;
}

export function ExperienceSection({ items, onChange }: ExperienceSectionProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleCommitItem = (updated: ExperienceItem) => {
    const next = items.map((item) => (item.id === updated.id ? updated : item));
    onChange(next);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    onChange(items.filter((item) => item.id !== pendingDeleteId));
    setPendingDeleteId(null);
  };

  const handleAddItem = () => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      title: "New Role",
      company: "Company Name",
      companyImageUrl: "",
      employmentType: "Full-time",
      location: "Remote",
      startDate: "Jan 2025",
      endDate: "Present",
      bullets: ["Describe your key impact and responsibilities."],
    };
    onChange([newItem, ...items]);
  };

  return (
    <section
      className={`${styles.section} ${items.length === 0 ? "no-print" : ""}`}
      aria-labelledby="experience-heading"
    >
      <div className={styles.headerRow}>
        <h2 id="experience-heading" className={styles.heading}>
          Experience
        </h2>
        <button
          type="button"
          className={`${styles.addBtn} no-print`}
          onClick={handleAddItem}
        >
          <Plus size={15} />
          <span>Add Experience</span>
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No experience entries yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <ExperienceCard
              key={item.id}
              item={item}
              onCommit={handleCommitItem}
              onDelete={setPendingDeleteId}
            />
          ))}
        </div>
      )}

      <GeneralConfirmModal
        isOpen={pendingDeleteId !== null}
        title="Delete Experience?"
        description="Are you sure you want to remove this experience entry?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
