"use client";

import type { DragEvent } from "react";
import { X } from "lucide-react";
import { findSkillCatalogItem } from "@/data/skillsCatalog";
import { useConfirmModal } from "@/components/Modal/ModalController";
import { SkillIcon } from "@/components/SkillsSection/SkillIcon";
import styles from "./ExperienceSkills.module.scss";

interface ExperienceSkillTagProps {
  skill: string;
  isDraggable: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (e: DragEvent<HTMLLIElement>) => void;
  onDragOver: (e: DragEvent<HTMLLIElement>) => void;
  onDrop: (e: DragEvent<HTMLLIElement>) => void;
  onDragEnd: (e: DragEvent<HTMLLIElement>) => void;
  onRemove: () => void;
}

export function ExperienceSkillTag({
  skill,
  isDraggable,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
}: ExperienceSkillTagProps) {
  const confirm = useConfirmModal();
  const catalogItem = findSkillCatalogItem(skill);
  const lowercaseSkill = skill.toLowerCase();

  return (
    <li
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`${styles.skillTag} ${
        isDragging ? styles.skillTagDragging : ""
      } ${isDropTarget ? styles.skillTagDropTarget : ""}`}
      data-skill={lowercaseSkill}
    >
      {catalogItem && (
        <SkillIcon
          iconUrl={catalogItem.iconUrl}
          fallbackKind={catalogItem.fallbackKind}
          label={lowercaseSkill}
          size={13}
        />
      )}
      <span className={styles.skillName}>{skill}</span>
      <button
        type="button"
        className={`${styles.removeBtn} no-print`}
        onClick={(event) => {
          event.currentTarget.focus();
          confirm({
            title: "Remove Skill?",
            description: `Are you sure you want to remove "${skill}" from this role?`,
            confirmLabel: "Remove",
            cancelLabel: "Cancel",
            isDestructive: true,
            onConfirm: onRemove,
          });
        }}
        aria-label={`Remove ${skill} from role`}
      >
        <X size={11} aria-hidden="true" />
      </button>
    </li>
  );
}
