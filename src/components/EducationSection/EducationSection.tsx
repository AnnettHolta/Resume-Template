"use client";

import { useState } from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import type { EducationItem } from "@/types/resume";
import { DatePickerBadge } from "@/components/DatePickerBadge/DatePickerBadge";
import styles from "./EducationSection.module.scss";

interface EducationCardProps {
  item: EducationItem;
  onCommit: (updated: EducationItem) => void;
  onDelete: (id: string) => void;
}

function EducationCard({ item, onCommit, onDelete }: EducationCardProps) {
  const [draft, setDraft] = useState<EducationItem>(item);
  const [prevItem, setPrevItem] = useState<EducationItem>(item);

  if (item !== prevItem) {
    setPrevItem(item);
    setDraft(item);
  }

  const handleBlur = () => {
    onCommit(draft);
  };

  return (
    <article className={styles.card}>
      <div className={styles.logoBox} aria-hidden="true">
        <GraduationCap size={22} strokeWidth={1.5} />
      </div>

      <div className={styles.content}>
        <input
          type="text"
          className={styles.inlineSchool}
          value={draft.school}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, school: e.target.value }))
          }
          onBlur={handleBlur}
          placeholder="School / University"
          aria-label="School or university"
        />

        <div className={styles.degreeRow}>
          <input
            type="text"
            className={styles.inlineDegree}
            value={draft.degree}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, degree: e.target.value }))
            }
            onBlur={handleBlur}
            placeholder="Degree"
            aria-label="Degree"
          />
          <span
            className={`${styles.separator} ${
              !draft.field.trim() ? "no-print" : ""
            }`}
            aria-hidden="true"
          >
            ,
          </span>
          <input
            type="text"
            className={`${styles.inlineField} ${
              !draft.field.trim() ? "no-print" : ""
            }`}
            value={draft.field}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, field: e.target.value }))
            }
            onBlur={handleBlur}
            placeholder="Field of Study"
            aria-label="Field of study"
          />
        </div>

        <div className={styles.datesRow}>
          <DatePickerBadge
            value={draft.startDate}
            ariaLabel="Education start date"
            onChange={(nextDate) => {
              const nextDraft = { ...draft, startDate: nextDate };
              setDraft(nextDraft);
              onCommit(nextDraft);
            }}
          />
          <span aria-hidden="true">–</span>
          <DatePickerBadge
            value={draft.endDate}
            allowPresent
            ariaLabel="Education end date"
            onChange={(nextDate) => {
              const nextDraft = { ...draft, endDate: nextDate };
              setDraft(nextDraft);
              onCommit(nextDraft);
            }}
          />
        </div>
      </div>

      <div className={`${styles.actions} no-print`}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => onDelete(item.id)}
          aria-label="Delete education"
          title="Delete education"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

interface EducationSectionProps {
  items: EducationItem[];
  onChange: (nextItems: EducationItem[]) => void;
}

export function EducationSection({ items, onChange }: EducationSectionProps) {
  const handleCommitItem = (updated: EducationItem) => {
    onChange(items.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleDeleteItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      school: "University Name",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "Sep 2018",
      endDate: "Jun 2022",
    };
    onChange([newItem, ...items]);
  };

  return (
    <section
      className={`${styles.section} ${items.length === 0 ? "no-print" : ""}`}
      aria-labelledby="education-heading"
    >
      <div className={styles.headerRow}>
        <h2 id="education-heading" className={styles.heading}>
          Education
        </h2>
        <button
          type="button"
          className={`${styles.addBtn} no-print`}
          onClick={handleAddItem}
        >
          <Plus size={15} />
          <span>Add Education</span>
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No education entries yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <EducationCard
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
