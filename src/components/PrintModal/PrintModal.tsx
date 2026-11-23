"use client";

import { useEffect, useState } from "react";
import { FileText, LayoutGrid, Printer, X } from "lucide-react";
import styles from "./PrintModal.module.scss";

export type PrintMode = "printer" | "visual";

interface PrintModalProps {
  isOpen: boolean;
  initialMode: PrintMode;
  onConfirmPrint: (mode: PrintMode) => void;
  onClose: () => void;
}

export function PrintModal({
  isOpen,
  initialMode,
  onConfirmPrint,
  onClose,
}: PrintModalProps) {
  const [selectedMode, setSelectedMode] = useState<PrintMode>(initialMode);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.backdrop} no-print`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.iconBadge} aria-hidden="true">
              <Printer size={16} />
            </span>
            <div>
              <h2 id="print-modal-title" className={styles.title}>
                Print / Export PDF
              </h2>
              <p className={styles.subtitle}>
                Choose how your resume should look when printed
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close print options"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.optionsGrid} role="radiogroup" aria-label="Print layout">
          <button
            type="button"
            role="radio"
            aria-checked={selectedMode === "printer"}
            className={`${styles.optionCard} ${
              selectedMode === "printer" ? styles.optionCardSelected : ""
            }`}
            onClick={() => setSelectedMode("printer")}
          >
            <div className={styles.optionHeader}>
              <FileText size={18} />
              <span className={styles.optionTitle}>Printer-Ready</span>
            </div>
            <p className={styles.optionDesc}>
              Flat, ink-friendly layout with crisp black text, hairline
              dividers, and optimal ATS readability.
            </p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selectedMode === "visual"}
            className={`${styles.optionCard} ${
              selectedMode === "visual" ? styles.optionCardSelected : ""
            }`}
            onClick={() => setSelectedMode("visual")}
          >
            <div className={styles.optionHeader}>
              <LayoutGrid size={18} />
              <span className={styles.optionTitle}>Editor-Like View</span>
            </div>
            <p className={styles.optionDesc}>
              Preserves rounded cards, subtle borders, tinted skill pills, and
              the Apple HIG visual styling.
            </p>
          </button>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => onConfirmPrint(selectedMode)}
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

