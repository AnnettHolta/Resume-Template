"use client";

import { useCallback, useState, type DragEvent } from "react";
import { Building2, ImagePlus } from "lucide-react";
import type { ExperienceItem } from "@/types/resume";
import { DatePickerBadge } from "@/components/DatePickerBadge/DatePickerBadge";
import { ExperienceBullets } from "./ExperienceBullets";
import { ExperienceCardActions } from "./ExperienceCardActions";
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
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

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

  const trimmedLogoSrc = draft.companyImageUrl.trim();
  const showImage =
    Boolean(trimmedLogoSrc) && failedImageUrl !== trimmedLogoSrc;

  return (
    <article
      className={`${styles.card} ${isDragging ? styles.cardDragging : ""} ${
        isDropTarget ? styles.cardDropTarget : ""
      }`}
      data-experience-id={item.id}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className={styles.logoColumn}>
        <button
          type="button"
          className={styles.logoBox}
          onClick={() => setShowImageInput((prev) => !prev)}
          data-tooltip="Set company logo URL"
          data-tooltip-position="top"
          aria-label="Edit company logo URL"
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trimmedLogoSrc}
              alt={`${draft.company} logo`}
              className={styles.logoImg}
              onError={() => setFailedImageUrl(trimmedLogoSrc)}
            />
          ) : (
            <Building2 size={22} strokeWidth={1.5} />
          )}
          <span
            className={`${styles.logoEditHint} no-print`}
            aria-hidden="true"
          >
            <ImagePlus size={12} />
          </span>
        </button>
      </div>

      <div className={styles.content}>
        {showImageInput && (
          <div className={`${styles.imageUrlBar} no-print`}>
            <input
              type="url"
              value={draft.companyImageUrl}
              onChange={(e) => {
                setFailedImageUrl(null);
                setDraft((prev) => ({
                  ...prev,
                  companyImageUrl: e.target.value,
                }));
              }}
              onBlur={() => {
                commitItem(draft);
                setShowImageInput(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              placeholder="Paste company logo image URL..."
              aria-label="Company logo image URL"
              autoFocus
            />
          </div>
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
      </div>
    </article>
  );
}
