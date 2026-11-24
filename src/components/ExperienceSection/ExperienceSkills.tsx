"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { findSkillCatalogItem } from "@/data/skillsCatalog";
import { dedupeSkills } from "@/lib/skillUtils";
import { SkillAutocomplete } from "@/components/SkillsSection/SkillAutocomplete";
import { SkillIcon } from "@/components/SkillsSection/SkillIcon";
import styles from "./ExperienceSkills.module.scss";

interface ExperienceSkillsProps {
  itemId: string;
  skills: string[];
  onChangeSkills: (nextSkills: string[]) => void;
}

export function ExperienceSkills({
  itemId,
  skills,
  onChangeSkills,
}: ExperienceSkillsProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const uniqueSkills = useMemo(() => dedupeSkills(skills), [skills]);
  const existingSet = useMemo(
    () => new Set(uniqueSkills.map((s) => s.toLowerCase())),
    [uniqueSkills],
  );

  const handleAddSkill = (resolvedSkill: string) => {
    const trimmed = resolvedSkill.trim();
    if (!trimmed || existingSet.has(trimmed.toLowerCase())) return;
    onChangeSkills([...uniqueSkills, trimmed]);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const target = skillToRemove.toLowerCase();
    onChangeSkills(uniqueSkills.filter((s) => s.toLowerCase() !== target));
  };

  const handleReorderSkill = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      toIndex < 0 ||
      toIndex >= uniqueSkills.length
    ) {
      return;
    }
    const next = [...uniqueSkills];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    onChangeSkills(next);
  };

  return (
    <div
      className={`${styles.wrapper} ${uniqueSkills.length === 0 ? "no-print" : ""}`}
    >
      {uniqueSkills.length > 0 && (
        <ul className={styles.skillList} aria-label="Role skills">
          {uniqueSkills.map((skill, idx) => {
            const catalogItem = findSkillCatalogItem(skill);
            const lowercaseSkill = skill.toLowerCase();
            const isDragging = draggedIndex === idx;
            const isDropTarget =
              dragOverIndex === idx &&
              draggedIndex !== null &&
              draggedIndex !== idx;
            return (
              <li
                key={lowercaseSkill}
                draggable={uniqueSkills.length > 1}
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDraggedIndex(idx);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", skill);
                }}
                onDragOver={(e) => {
                  if (draggedIndex === null) return;
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverIndex !== idx) {
                    setDragOverIndex(idx);
                  }
                }}
                onDrop={(e) => {
                  if (draggedIndex === null) return;
                  e.preventDefault();
                  e.stopPropagation();
                  handleReorderSkill(draggedIndex, idx);
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
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
                  onClick={() => handleRemoveSkill(skill)}
                  aria-label={`Remove ${skill} from role`}
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.autocompleteWrap}>
        <SkillAutocomplete
          existingSkills={existingSet}
          onAddSkill={handleAddSkill}
          listboxId={`exp-skills-${itemId}`}
          placeholder="Add skill to this role..."
        />
      </div>
    </div>
  );
}
