"use client";

import { useRef } from "react";
import {
  Cpu,
  Download,
  Printer,
  Redo2,
  RotateCcw,
  Undo2,
  Upload,
} from "lucide-react";
import { MAX_HISTORY_LENGTH } from "@/lib/resumeStorage";
import { MobileActions } from "./MobileActions";
import styles from "./Toolbar.module.scss";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  historyPosition: number;
  historyTotal: number;
  isMcpConnected: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDownloadJson: () => void;
  onImportJson: (file: File) => void;
  onReset: () => void;
  onOpenMcp: () => void;
  onPrint: () => void;
}

export function Toolbar({
  canUndo,
  canRedo,
  historyPosition,
  historyTotal,
  isMcpConnected,
  onUndo,
  onRedo,
  onDownloadJson,
  onImportJson,
  onReset,
  onOpenMcp,
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
              <span className={styles.hideBelowLg}>Undo</span>
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
              <span className={styles.hideBelowLg}>Redo</span>
            </button>
          </div>
          <span
            className={styles.historyBadge}
            data-tooltip="Saved history snapshots"
            data-tooltip-position="bot"
          >
            <span className={styles.hideBelowLg}>History </span>
            {historyPosition}/{historyTotal}{" "}
            <span className={`${styles.historyMax} ${styles.hideBelowLg}`}>
              (max {MAX_HISTORY_LENGTH})
            </span>
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
            aria-label="Import JSON"
          >
            <Upload size={14} className={styles.mutedIcon} />
            <span className={styles.hideBelowMd}>Import</span>
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${styles.hideOnMobile}`}
            onClick={onDownloadJson}
            data-tooltip="Save JSON"
            data-tooltip-position="bot"
            aria-label="Save JSON"
          >
            <Download size={14} className={styles.mutedIcon} />
            <span className={styles.hideBelowMd}>Save</span>
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${styles.hideOnMobile} ${
              isMcpConnected ? styles.mcpActiveBtn : ""
            }`}
            onClick={(event) => {
              event.currentTarget.focus();
              onOpenMcp();
            }}
            data-tooltip={
              isMcpConnected ? "MCP connected" : "Configure optional MCP"
            }
            data-tooltip-position="bot"
          >
            <Cpu size={14} className={styles.mutedIcon} />
            <span>MCP</span>
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${styles.resetBtn} ${styles.hideOnMobile}`}
            onClick={(event) => {
              event.currentTarget.focus();
              onReset();
            }}
            data-tooltip="Reset to initial JSON"
            data-tooltip-position="bot"
            aria-label="Reset"
          >
            <RotateCcw size={14} />
            <span className={styles.hideBelowMd}>Reset</span>
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={(event) => {
              event.currentTarget.focus();
              onPrint();
            }}
            aria-label="Print / PDF"
            data-tooltip="Print or Save as PDF"
            data-tooltip-position="bot"
          >
            <Printer size={14} />
            <span>
              Print<span className={styles.hideBelowMd}> / PDF</span>
            </span>
          </button>
          <MobileActions
            isMcpConnected={isMcpConnected}
            onImport={() => fileInputRef.current?.click()}
            onSave={onDownloadJson}
            onOpenMcp={onOpenMcp}
            onReset={onReset}
          />
        </div>
      </div>
    </nav>
  );
}
