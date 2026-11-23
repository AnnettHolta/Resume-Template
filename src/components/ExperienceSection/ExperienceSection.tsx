"use client";

import { Plus } from "lucide-react";
import type { ExperienceItem } from "@/types/resume";
import { ExperienceCard } from "./ExperienceCard";
import styles from "./ExperienceSection.module.scss";

interface ExperienceSectionProps {
  items: ExperienceItem[];
  onChange: (nextItems: ExperienceItem[]) => void;
}

export function ExperienceSection({ items, onChange }: ExperienceSectionProps) {
  const handleCommitItem = (updated: ExperienceItem) => {
    const next = items.map((item) => (item.id === updated.id ? updated : item));
    onChange(next);
  };

  const handleDeleteItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
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
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}
    </section>
  );
}

