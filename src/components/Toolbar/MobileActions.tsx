"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Cpu, Download, Ellipsis, RotateCcw, Upload } from "lucide-react";
import styles from "./Toolbar.module.scss";

interface MobileActionsProps {
  isMcpConnected: boolean;
  onImport: () => void;
  onSave: () => void;
  onOpenMcp: () => void;
  onReset: () => void;
}

export function MobileActions({
  isMcpConnected,
  onImport,
  onSave,
  onOpenMcp,
  onReset,
}: MobileActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const parent = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstAction = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useLayoutEffect(() => {
    if (isOpen) firstAction.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const dismissOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !parent.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [isOpen]);

  const closeAndFocus = () => {
    setIsOpen(false);
    trigger.current?.focus();
  };

  const actions = [
    { label: "Import JSON", Icon: Upload, run: onImport },
    { label: "Save JSON", Icon: Download, run: onSave },
    {
      label: "MCP",
      Icon: Cpu,
      run: onOpenMcp,
      className: isMcpConnected ? styles.mobileConnected : undefined,
    },
    {
      label: "Reset",
      Icon: RotateCcw,
      run: onReset,
      className: styles.mobileDestructive,
    },
  ];

  return (
    <div
      ref={parent}
      className={styles.mobileActions}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          event.stopPropagation();
          closeAndFocus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={`${styles.pillBtn} ${styles.mobileTrigger}`}
        aria-label="More actions"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          if (isOpen) closeAndFocus();
          else setIsOpen(true);
        }}
      >
        <Ellipsis size={20} aria-hidden="true" />
      </button>
      <div
        id={panelId}
        className={styles.mobilePanel}
        inert={!isOpen}
        aria-hidden={!isOpen}
      >
        {actions.map(({ label, Icon, run, className }, index) => (
          <button
            key={label}
            ref={index === 0 ? firstAction : undefined}
            type="button"
            className={className}
            onClick={() => {
              closeAndFocus();
              run();
            }}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
