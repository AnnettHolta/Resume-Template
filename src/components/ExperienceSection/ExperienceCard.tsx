"use client";

import { useCallback, useState } from "react";
import { Building2, ImagePlus, Trash2 } from "lucide-react";
import type { ExperienceItem } from "@/types/resume";
import { DatePickerBadge } from "@/components/DatePickerBadge/DatePickerBadge";
import { ExperienceBullets } from "./ExperienceBullets";
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
    <article className={styles.card} data-experience-id={item.id}>
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

          <div className={`${styles.actions} no-print`}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={(event) => {
                event.currentTarget.focus();
                onDelete(item.id);
              }}
              aria-label="Delete experience"
              data-tooltip="Delete experience"
              data-tooltip-position="left"
            >
              <Trash2 size={15} />
            </button>
          </div>
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
