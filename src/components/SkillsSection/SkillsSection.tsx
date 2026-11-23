"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { findSkillCatalogItem } from "@/data/skillsCatalog";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";
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
  const [pendingDeleteSkill, setPendingDeleteSkill] = useState<string | null>(
    null,
  );
  const [animatedSkills, setAnimatedSkills] = useState<Set<string>>(
    () => new Set(),
  );
  const [isReordering, setIsReordering] = useState(false);
  const [positionMessage, setPositionMessage] = useState("");
  const moveFocus = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    moveFocus.current?.focus({ preventScroll: true });
    moveFocus.current = null;
  }, [skills]);

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

  const handleReorderSkill = (
    fromIndex: number,
    toIndex: number,
    control?: HTMLButtonElement,
  ) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= skills.length)
      return;
    const next = [...skills];
    const [moved] = next.splice(fromIndex, 1);
    if (moved === undefined) return;
    next.splice(toIndex, 0, moved);
    moveFocus.current = control ?? null;
    onChange(next);
    setPositionMessage(
      `${moved} moved to position ${toIndex + 1} of ${skills.length}.`,
    );
  };

  return (
    <section
      className={`${styles.section} ${skills.length === 0 ? "no-print" : ""}`}
      aria-labelledby="skills-heading"
    >
      <div className={styles.header}>
        <h2 id="skills-heading" className={styles.heading}>
          Skills
        </h2>
        {(skills.length > 1 || isReordering) && (
          <button
            type="button"
            className={`${styles.reorderToggle} no-print`}
            aria-pressed={isReordering}
            onClick={() => setIsReordering(!isReordering)}
          >
            Reorder skills
          </button>
        )}
      </div>
      <div className={`${styles.announcement} no-print`} role="status">
        {positionMessage}
      </div>

      <ul
        className={`${styles.skillList} ${isReordering ? styles.reordering : ""}`}
      >
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
              draggable={!isReordering}
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
              {isReordering ? (
                <div className={`${styles.moveActions} no-print`}>
                  <button
                    type="button"
                    aria-label={`Move ${skill} earlier`}
                    aria-disabled={idx === 0}
                    onClick={(event) =>
                      handleReorderSkill(idx, idx - 1, event.currentTarget)
                    }
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${skill} later`}
                    aria-disabled={idx === skills.length - 1}
                    onClick={(event) =>
                      handleReorderSkill(idx, idx + 1, event.currentTarget)
                    }
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={`${styles.removeBtn} no-print`}
                  onClick={(event) => {
                    event.currentTarget.focus();
                    setPendingDeleteSkill(skill);
                  }}
                  aria-label={`remove ${lowercaseSkill}`}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <SkillAutocomplete
        existingSkills={normalizedExisting}
        onAddSkill={handleAddSkill}
      />

      <GeneralConfirmModal
        isOpen={pendingDeleteSkill !== null}
        title="Remove Skill?"
        description={`Are you sure you want to remove "${pendingDeleteSkill ?? ""}" from your skills?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        isDestructive
        onCancel={() => setPendingDeleteSkill(null)}
        onConfirm={() => {
          if (pendingDeleteSkill) {
            handleRemoveSkill(pendingDeleteSkill);
          }
          setPendingDeleteSkill(null);
        }}
      />
    </section>
  );
}
