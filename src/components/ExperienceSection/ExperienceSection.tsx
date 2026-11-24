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
  canEdit?: boolean;
}

export function ExperienceSection({
  items,
  onChange,
  canEdit = true,
}: ExperienceSectionProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleCommitItem = (updated: ExperienceItem) => {
    const next = items.map((item) => (item.id === updated.id ? updated : item));
    onChange(next);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    onChange(items.filter((item) => item.id !== pendingDeleteId));
    setPendingDeleteId(null);
  };

  const handleReorderItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= items.length) {
      return;
    }
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    onChange(next);
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
          {items.map((item, idx) => (
            <ExperienceCard
              key={item.id}
              item={item}
              isDraggable={canEdit && items.length > 1}
              isDragging={draggedIndex === idx}
              isDropTarget={
                dragOverIndex === idx &&
                draggedIndex !== null &&
                draggedIndex !== idx
              }
              onDragStart={(e) => {
                const target = e.target as HTMLElement | null;
                if (
                  target?.closest("input, textarea, select, [contenteditable]")
                ) {
                  e.preventDefault();
                  return;
                }
                setDraggedIndex(idx);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", item.id);
              }}
              onDragOver={(e) => {
                if (!canEdit || draggedIndex === null) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverIndex !== idx) {
                  setDragOverIndex(idx);
                }
              }}
              onDrop={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                if (draggedIndex !== null) {
                  handleReorderItem(draggedIndex, idx);
                }
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
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
