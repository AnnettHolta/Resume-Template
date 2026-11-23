"use client";

import { useCallback, useRef, useState } from "react";
import { Building2, ImagePlus, Plus, Trash2, X } from "lucide-react";
import type { ExperienceItem } from "@/types/resume";
import { DatePickerBadge } from "@/components/DatePickerBadge/DatePickerBadge";
import styles from "./ExperienceCard.module.scss";

interface ExperienceCardProps {
  item: ExperienceItem;
  onCommit: (updated: ExperienceItem) => void;
  onDelete: (id: string) => void;
}

export function ExperienceCard({
  item,
  onCommit,
  onDelete,
}: ExperienceCardProps) {
  const [draft, setDraft] = useState<ExperienceItem>(item);
  const [prevItem, setPrevItem] = useState<ExperienceItem>(item);
  const [showImageInput, setShowImageInput] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const bulletRefs = useRef<Array<HTMLTextAreaElement | null>>([]);

  // Sync draft when parent item changes (e.g., undo/redo/reset/import)
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
    [onCommit]
  );

  const handleBlur = () => {
    commitItem(draft);
  };

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const updateBullet = (index: number, value: string) => {
    setDraft((prev) => {
      const nextBullets = [...prev.bullets];
      nextBullets[index] = value;
      return { ...prev, bullets: nextBullets };
    });
  };

  const addBulletAt = (index: number) => {
    setDraft((prev) => {
      const nextBullets = [...prev.bullets];
      nextBullets.splice(index, 0, "");
      return { ...prev, bullets: nextBullets };
    });
    requestAnimationFrame(() => {
      bulletRefs.current[index]?.focus();
    });
  };

  const removeBulletAt = (index: number, focusPrevious = false) => {
    const nextBullets = draft.bullets.filter((_, idx) => idx !== index);
    const nextDraft = { ...draft, bullets: nextBullets };
    setDraft(nextDraft);
    commitItem(nextDraft);
    if (focusPrevious && index > 0) {
      requestAnimationFrame(() => {
        bulletRefs.current[index - 1]?.focus();
      });
    }
  };

  const trimmedLogoSrc = draft.companyImageUrl.trim();
  const showImage = Boolean(trimmedLogoSrc) && failedImageUrl !== trimmedLogoSrc;

  return (
    <article className={styles.card}>
      <div className={styles.logoColumn}>
        <button
          type="button"
          className={styles.logoBox}
          onClick={() => setShowImageInput((prev) => !prev)}
          title="Click to set company logo URL"
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
          <span className={`${styles.logoEditHint} no-print`} aria-hidden="true">
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
                handleBlur();
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
              onBlur={handleBlur}
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
                onBlur={handleBlur}
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
                onBlur={handleBlur}
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
              <span aria-hidden="true">–</span>
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
                  !draft.location.trim() ? "no-print" : ""
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
                onBlur={handleBlur}
                placeholder="Location"
                aria-label="Location"
              />
            </div>
          </div>

          <div className={`${styles.actions} no-print`}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => onDelete(item.id)}
              aria-label="Delete experience"
              title="Delete experience"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <ul
          className={`${styles.bullets} ${
            draft.bullets.every((b) => !b.trim()) ? "no-print" : ""
          }`}
        >
          {draft.bullets.map((bullet, idx) => (
            <li
              key={`${item.id}-b-${idx}`}
              className={`${styles.bulletItem} ${
                !bullet.trim() ? "no-print" : ""
              }`}
            >
              <span className={styles.bulletDot} aria-hidden="true">
                •
              </span>
              <textarea
                ref={(el) => {
                  bulletRefs.current[idx] = el;
                  resizeTextarea(el);
                }}
                rows={1}
                className={styles.bulletInput}
                value={bullet}
                onChange={(e) => {
                  updateBullet(idx, e.target.value);
                  resizeTextarea(e.currentTarget);
                }}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addBulletAt(idx + 1);
                  } else if (
                    e.key === "Backspace" &&
                    bullet === "" &&
                    draft.bullets.length > 1
                  ) {
                    e.preventDefault();
                    removeBulletAt(idx, true);
                  }
                }}
                placeholder="Describe an achievement or responsibility..."
                aria-label={`Experience highlight ${idx + 1}`}
              />
              <button
                type="button"
                className={`${styles.removeBulletBtn} no-print`}
                onClick={() => removeBulletAt(idx)}
                aria-label="Remove bullet"
                title="Remove point"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`${styles.addBulletBtn} no-print`}
          onClick={() => addBulletAt(draft.bullets.length)}
        >
          <Plus size={13} />
          <span>Add point</span>
        </button>
      </div>
    </article>
  );
}
