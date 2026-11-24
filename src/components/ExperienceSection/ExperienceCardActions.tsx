"use client";

import { GripVertical, Trash2 } from "lucide-react";
import styles from "./ExperienceCard.module.scss";

interface ExperienceCardActionsProps {
  isDraggable: boolean;
  onDelete: () => void;
}

export function ExperienceCardActions({
  isDraggable,
  onDelete,
}: ExperienceCardActionsProps) {
  return (
    <div className={`${styles.actions} no-print`}>
      {isDraggable && (
        <span
          className={styles.dragHandle}
          role="img"
          data-drag-handle="true"
          aria-label="Drag to reorder experience"
          data-tooltip="Drag to reorder"
          data-tooltip-position="left"
        >
          <GripVertical size={15} aria-hidden="true" />
        </span>
      )}
      <button
        type="button"
        className={styles.iconBtn}
        onClick={(event) => {
          event.currentTarget.focus();
          onDelete();
        }}
        aria-label="Delete experience"
        data-tooltip="Delete experience"
        data-tooltip-position="left"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
