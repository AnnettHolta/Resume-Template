"use client";

import { useCallback, useEffect, useState, type DragEvent } from "react";
import type { ExperienceItem } from "@/types/resume";
import { DatePickerBadge } from "@/components/DatePickerBadge/DatePickerBadge";
import { ExperienceBullets } from "./ExperienceBullets";
import { ExperienceCardActions } from "./ExperienceCardActions";
import { ExperienceLogoBar, ExperienceLogoBox } from "./ExperienceLogoPicker";
import { ExperienceSkills } from "./ExperienceSkills";
import styles from "./ExperienceCard.module.scss";

interface ExperienceCardProps {
  item: ExperienceItem;
  isDraggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: DragEvent<HTMLElement>) => void;
  onDragOver?: (e: DragEvent<HTMLElement>) => void;
  onDrop?: (e: DragEvent<HTMLElement>) => void;
  onDragEnd?: () => void;
  onCommit: (updated: ExperienceItem) => void;
  onDelete: (id: string) => void;
}

export function ExperienceCard({
  item,
  isDraggable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onCommit,
  onDelete,
}: ExperienceCardProps) {
  const [draft, setDraft] = useState<ExperienceItem>(item);
  const [prevItem, setPrevItem] = useState<ExperienceItem>(item);
  const [showImageInput, setShowImageInput] = useState(false);
  const [isDragArmed, setIsDragArmed] = useState(false);

  useEffect(() => {
    if (!isDragArmed) return;
    const reset = () => setIsDragArmed(false);
    window.addEventListener("pointerup", reset);
    window.addEventListener("pointercancel", reset);
    return () => {
      window.removeEventListener("pointerup", reset);
      window.removeEventListener("pointercancel", reset);
    };
  }, [isDragArmed]);

  if (item !== prevItem) {
    setPrevItem(item);
    setDraft(item);
  }

  const commitItem = useCallback(
    (nextDraft: ExperienceItem) => {
      onCommit({
        ...nextDraft,
        bullets: nextDraft.bullets
          .map((b) => b.trim())
          .filter((b) => b.length > 0),
      });
    },
    [onCommit],
  );

  return (
    <article
      className={`${styles.card} ${isDragging ? styles.cardDragging : ""} ${
        isDropTarget ? styles.cardDropTarget : ""
      }`}
      data-experience-id={item.id}
      draggable={isDraggable && isDragArmed}
      onPointerDown={(e) => {
        if (!isDraggable) return;
        const target = e.target as HTMLElement | null;
        setIsDragArmed(Boolean(target?.closest("[data-drag-handle]")));
      }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={() => {
        setIsDragArmed(false);
        onDragEnd?.();
      }}
    >
      <ExperienceLogoBox
        company={draft.company}
        imageUrl={draft.companyImageUrl}
        onToggleEditor={() => setShowImageInput((prev) => !prev)}
      />

      <div className={styles.content}>
        {showImageInput && (
          <ExperienceLogoBar
            imageUrl={draft.companyImageUrl}
            onChangeUrl={(nextUrl) =>
              setDraft((prev) => ({ ...prev, companyImageUrl: nextUrl }))
            }
            onCommitUrl={(nextUrl) => {
              const nextDraft = { ...draft, companyImageUrl: nextUrl };
              setDraft(nextDraft);
              commitItem(nextDraft);
            }}
            onClose={() => setShowImageInput(false)}
          />
        )}

        <div className={styles.headerRow}>
          <div className={styles.titleBlock}>
            <input
              type="text"
              className={styles.inlineTitle}
              value={draft.title}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, title: e.target.value }))
              }
              onBlur={() => commitItem(draft)}
              placeholder="Role / Title"
              aria-label="Role or title"
            />

            <div className={styles.companyRow}>
              <input
                type="text"
                className={styles.inlineCompany}
                value={draft.company}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, company: e.target.value }))
                }
                onBlur={() => commitItem(draft)}
                placeholder="Company"
                aria-label="Company name"
              />
              <span
                className={`${styles.separator} ${
                  !draft.employmentType.trim() ? "no-print" : ""
                }`}
                aria-hidden="true"
              >
                ·
              </span>
              <input
                type="text"
                className={`${styles.inlineType} ${
                  !draft.employmentType.trim() ? "no-print" : ""
                }`}
                value={draft.employmentType}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    employmentType: e.target.value,
                  }))
                }
                onBlur={() => commitItem(draft)}
                placeholder="Full-time"
                aria-label="Employment type"
              />
            </div>

            <div className={styles.metaRow}>
              <DatePickerBadge
                value={draft.startDate}
                ariaLabel="Start date"
                onChange={(nextDate) => {
                  const nextDraft = { ...draft, startDate: nextDate };
                  setDraft(nextDraft);
                  commitItem(nextDraft);
                }}
              />
              <span
                className={
                  draft.startDate.trim() && draft.endDate.trim()
                    ? undefined
                    : "no-print"
                }
                aria-hidden="true"
              >
                –
              </span>
              <DatePickerBadge
                value={draft.endDate}
                allowPresent
                ariaLabel="End date"
                onChange={(nextDate) => {
                  const nextDraft = { ...draft, endDate: nextDate };
                  setDraft(nextDraft);
                  commitItem(nextDraft);
                }}
              />
              <span
                className={`${styles.separator} ${
                  !draft.location.trim() ||
                  !(draft.startDate.trim() || draft.endDate.trim())
                    ? "no-print"
                    : ""
                }`}
                aria-hidden="true"
              >
                ·
              </span>
              <input
                type="text"
                className={`${styles.inlineLocation} ${
                  !draft.location.trim() ? "no-print" : ""
                }`}
                value={draft.location}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, location: e.target.value }))
                }
                onBlur={() => commitItem(draft)}
                placeholder="Location"
                aria-label="Location"
              />
            </div>
          </div>

          <ExperienceCardActions
            isDraggable={isDraggable}
            onDelete={() => onDelete(item.id)}
          />
        </div>

        <ExperienceBullets
          itemId={item.id}
          bullets={draft.bullets}
          onChangeBullets={(nextBullets, commitNow) => {
            const nextDraft = { ...draft, bullets: nextBullets };
            setDraft(nextDraft);
            if (commitNow) commitItem(nextDraft);
          }}
          onBlurCommit={() => commitItem(draft)}
        />

        <ExperienceSkills
          itemId={item.id}
          skills={draft.skills ?? []}
          onChangeSkills={(nextSkills) => {
            const nextDraft = { ...draft, skills: nextSkills };
            setDraft(nextDraft);
            commitItem(nextDraft);
          }}
        />
      </div>
    </article>
  );
}
