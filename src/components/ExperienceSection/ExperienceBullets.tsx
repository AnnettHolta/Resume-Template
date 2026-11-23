"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";
import styles from "./ExperienceBullets.module.scss";

interface ExperienceBulletsProps {
  itemId: string;
  bullets: string[];
  onChangeBullets: (nextBullets: string[], commitNow?: boolean) => void;
  onBlurCommit: () => void;
}

export function ExperienceBullets({
  itemId,
  bullets,
  onChangeBullets,
  onBlurCommit,
}: ExperienceBulletsProps) {
  const bulletRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(
    null,
  );

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const addBulletAt = (index: number) => {
    const next = [...bullets];
    next.splice(index, 0, "");
    onChangeBullets(next, false);
    requestAnimationFrame(() => {
      bulletRefs.current[index]?.focus();
    });
  };

  const removeBulletAt = (index: number, focusPrevious = false) => {
    const next = bullets.filter((_, idx) => idx !== index);
    onChangeBullets(next, true);
    if (focusPrevious && index > 0) {
      requestAnimationFrame(() => {
        bulletRefs.current[index - 1]?.focus();
      });
    }
  };

  return (
    <>
      <ul
        className={`${styles.bullets} ${
          bullets.every((b) => !b.trim()) ? "no-print" : ""
        }`}
      >
        {bullets.map((bullet, idx) => (
          <li
            key={`${itemId}-b-${idx}`}
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
              className={`${styles.bulletInput} no-print`}
              value={bullet}
              onChange={(e) => {
                const next = [...bullets];
                next[idx] = e.target.value;
                onChangeBullets(next, false);
                resizeTextarea(e.currentTarget);
              }}
              onBlur={onBlurCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addBulletAt(idx + 1);
                } else if (
                  e.key === "Backspace" &&
                  bullet === "" &&
                  bullets.length > 1
                ) {
                  e.preventDefault();
                  removeBulletAt(idx, true);
                }
              }}
              placeholder="Describe an achievement or responsibility..."
              aria-label={`Experience highlight ${idx + 1}`}
            />
            <span className={styles.bulletPrintText}>{bullet}</span>
            <button
              type="button"
              className={`${styles.removeBulletBtn} no-print`}
              onClick={() => setPendingDeleteIndex(idx)}
              aria-label="Remove bullet"
              data-tooltip="Remove point"
              data-tooltip-position="left"
            >
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`${styles.addBulletBtn} no-print`}
        onClick={() => addBulletAt(bullets.length)}
      >
        <Plus size={13} />
        <span>Add point</span>
      </button>

      <GeneralConfirmModal
        isOpen={pendingDeleteIndex !== null}
        title="Delete Bullet Point?"
        description="Are you sure you want to remove this highlight?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onCancel={() => setPendingDeleteIndex(null)}
        onConfirm={() => {
          if (pendingDeleteIndex !== null) {
            removeBulletAt(pendingDeleteIndex);
          }
          setPendingDeleteIndex(null);
        }}
      />
    </>
  );
}
