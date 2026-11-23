"use client";

import { useId } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Modal } from "@/components/Modal/Modal";
import styles from "./GeneralConfirmModal.module.scss";

interface GeneralConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GeneralConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
}: GeneralConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      isOpen={isOpen}
      titleId={titleId}
      descriptionId={descriptionId}
      className={styles.dialog}
      onClose={onCancel}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {isDestructive && (
            <span className={styles.warnIcon} aria-hidden="true">
              <AlertTriangle size={16} />
            </span>
          )}
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onCancel}
          aria-label="Close confirmation"
        >
          <X size={16} />
        </button>
      </div>

      <p id={descriptionId} className={styles.description}>
        {description}
      </p>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          data-dialog-focus
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={isDestructive ? styles.destructiveBtn : styles.confirmBtn}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
