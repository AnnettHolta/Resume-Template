"use client";

import { useId, useState } from "react";
import { FileText, LayoutGrid, Printer, X } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import styles from "./PrintModal.module.scss";

export type PrintMode = "printer" | "visual";

const layouts = [
  {
    mode: "printer",
    title: "Printer-Ready",
    description:
      "Flat, ink-friendly layout with black text, thin dividers, and a layout designed for ATS readability.",
    Icon: FileText,
  },
  {
    mode: "visual",
    title: "Editor-Like View",
    description:
      "Preserves the editor’s rounded cards, subtle borders, and tinted skill pills.",
    Icon: LayoutGrid,
  },
] as const;

interface PrintModalProps {
  isOpen: boolean;
  initialMode: PrintMode;
  onConfirmPrint: (mode: PrintMode) => void;
  onClose: () => void;
  onExit?: () => void;
}

export function PrintModal({
  isOpen,
  initialMode,
  onConfirmPrint,
  onClose,
  onExit,
}: PrintModalProps) {
  const id = useId();
  const [selectedMode, setSelectedMode] = useState<PrintMode>(initialMode);

  const finishExit = () => {
    setSelectedMode(initialMode);
    onExit?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      titleId={`${id}-title`}
      className={styles.dialog}
      onClose={onClose}
      onExit={finishExit}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.iconBadge} aria-hidden="true">
            <Printer size={16} />
          </span>
          <h2 id={`${id}-title`} className={styles.title}>
            Print / Export PDF
          </h2>
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

      <fieldset className={styles.options}>
        <legend className={styles.optionLegend}>Print layout</legend>
        <div className={styles.optionsGrid}>
          {layouts.map(({ mode, title, description, Icon }) => {
            const checked = selectedMode === mode;
            return (
              <label key={mode} className={styles.optionCard}>
                <span className={styles.optionHeader}>
                  <Icon size={18} aria-hidden="true" />
                  <span
                    id={`${id}-${mode}-title`}
                    className={styles.optionTitle}
                  >
                    {title}
                  </span>
                  <input
                    type="radio"
                    name={`${id}-layout`}
                    value={mode}
                    checked={checked}
                    onChange={() => setSelectedMode(mode)}
                    aria-labelledby={`${id}-${mode}-title`}
                    aria-describedby={`${id}-${mode}-description`}
                    data-dialog-focus={checked ? "" : undefined}
                  />
                </span>
                <span
                  id={`${id}-${mode}-description`}
                  className={styles.optionDesc}
                >
                  {description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.footer}>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => onConfirmPrint(selectedMode)}
        >
          <Printer size={14} aria-hidden="true" />
          <span>Print / Save PDF</span>
        </button>
      </div>
    </Modal>
  );
}
