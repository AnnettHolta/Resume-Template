"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { findSkillCatalogItem } from "@/data/skillsCatalog";
import { SkillAutocomplete } from "./SkillAutocomplete";
import { SkillIcon } from "./SkillIcon";
import styles from "./SkillsSection.module.scss";

interface SkillsSectionProps {
  skills: string[];
  onChange: (nextSkills: string[]) => void;
}

export function SkillsSection({ skills, onChange }: SkillsSectionProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [animatedSkills, setAnimatedSkills] = useState<Set<string>>(
    () => new Set(),
  );

  const normalizedExisting = useMemo(
    () => new Set(skills.map((s) => s.trim().toLowerCase())),
    [skills],
  );

  const handleAddSkill = (resolvedSkill: string) => {
    if (normalizedExisting.has(resolvedSkill.toLowerCase())) return;
    setAnimatedSkills((prev) => {
      const next = new Set(prev);
      next.add(resolvedSkill);
      return next;
    });
    onChange([...skills, resolvedSkill]);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove));
  };

  const handleReorderSkill = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...skills];
    const [moved] = next.splice(fromIndex, 1);
    if (moved === undefined) return;
    next.splice(toIndex, 0, moved);
    onChange(next);
  };

  return (
    <section
      className={`${styles.section} ${skills.length === 0 ? "no-print" : ""}`}
      aria-labelledby="skills-heading"
    >
      <h2 id="skills-heading" className={styles.heading}>
        Skills
      </h2>

      <ul className={styles.skillList}>
        {skills.map((skill, idx) => {
          const catalogItem = findSkillCatalogItem(skill);
          const lowercaseSkill = skill.toLowerCase();
          const shouldAnimate = animatedSkills.has(skill);
          const isDragging = draggedIndex === idx;
          const isDropTarget =
            dragOverIndex === idx &&
            draggedIndex !== null &&
            draggedIndex !== idx;
          return (
            <li
              key={skill}
              draggable
              aria-label={lowercaseSkill}
              data-skill={lowercaseSkill}
              onDragStart={(e) => {
                setDraggedIndex(idx);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", skill);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverIndex !== idx) {
                  setDragOverIndex(idx);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null) {
                  handleReorderSkill(draggedIndex, idx);
                }
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={`${styles.skillTag} ${
                shouldAnimate ? styles.skillTagEnter : ""
              } ${isDragging ? styles.skillTagDragging : ""} ${
                isDropTarget ? styles.skillTagDropTarget : ""
              }`}
            >
              {catalogItem && (
                <SkillIcon
                  iconUrl={catalogItem.iconUrl}
                  fallbackKind={catalogItem.fallbackKind}
                  label={lowercaseSkill}
                  size={14}
                />
              )}
              <span className={styles.skillName}>{skill}</span>
              <button
                type="button"
                className={`${styles.removeBtn} no-print`}
                onClick={() => handleRemoveSkill(skill)}
                aria-label={`remove ${lowercaseSkill}`}
              >
                <X size={12} />
              </button>
            </li>
          );
        })}
      </ul>

      <SkillAutocomplete
        existingSkills={normalizedExisting}
        onAddSkill={handleAddSkill}
      />
    </section>
  );
}
