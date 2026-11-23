"use client";

import { useRef } from "react";
import {
  Download,
  Printer,
  Redo2,
  RotateCcw,
  Undo2,
  Upload,
} from "lucide-react";
import { MAX_HISTORY_LENGTH } from "@/lib/resumeStorage";
import styles from "./Toolbar.module.scss";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  historyPosition: number;
  historyTotal: number;
  onUndo: () => void;
  onRedo: () => void;
  onDownloadJson: () => void;
  onImportJson: (file: File) => void;
  onReset: () => void;
  onPrint: () => void;
}

export function Toolbar({
  canUndo,
  canRedo,
  historyPosition,
  historyTotal,
  onUndo,
  onRedo,
  onDownloadJson,
  onImportJson,
  onReset,
  onPrint,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <nav className={`${styles.toolbar} no-print`} aria-label="Resume actions">
      <div className={styles.inner}>
        <div className={styles.group}>
          <div className={styles.segmented}>
            <button
              type="button"
              className={styles.segBtn}
              onClick={onUndo}
              disabled={!canUndo}
              data-tooltip="Undo last change"
              data-tooltip-position="bot"
              aria-label="Undo"
            >
              <Undo2 size={14} />
              <span>Undo</span>
            </button>
            <button
              type="button"
              className={styles.segBtn}
              onClick={onRedo}
              disabled={!canRedo}
              data-tooltip="Redo change"
              data-tooltip-position="bot"
              aria-label="Redo"
            >
              <Redo2 size={14} />
              <span>Redo</span>
            </button>
          </div>
          <span
            className={styles.historyBadge}
            data-tooltip="Saved history snapshots"
            data-tooltip-position="bot"
          >
            History {historyPosition}/{historyTotal}{" "}
            <span className={styles.historyMax}>(max {MAX_HISTORY_LENGTH})</span>
          </span>
        </div>

        <div className={styles.group}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportJson(file);
                e.target.value = "";
              }
            }}
          />
          <button
            type="button"
            className={`${styles.pillBtn} ${styles.hideOnMobile}`}
            onClick={() => fileInputRef.current?.click()}
            data-tooltip="Import JSON"
            data-tooltip-position="bot"
          >
            <Upload size={14} className={styles.mutedIcon} />
            <span>Import JSON</span>
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${styles.hideOnMobile}`}
            onClick={onDownloadJson}
            data-tooltip="Download JSON"
            data-tooltip-position="bot"
          >
            <Download size={14} className={styles.mutedIcon} />
            <span>Download JSON</span>
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${styles.resetBtn}`}
            onClick={onReset}
            data-tooltip="Reset to initial JSON"
            data-tooltip-position="bot"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onPrint}
            data-tooltip="Print or Save as PDF"
            data-tooltip-position="bot"
          >
            <Printer size={14} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
