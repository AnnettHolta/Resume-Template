"use client";

import { useRef } from "react";
import {
  displayMonthToInputValue,
  inputValueToDisplayMonth,
} from "@/lib/dateFormat";
import styles from "./DatePickerBadge.module.scss";

interface DatePickerBadgeProps {
  value: string;
  onChange: (nextDisplayValue: string) => void;
  allowPresent?: boolean;
  ariaLabel: string;
}

export function DatePickerBadge({
  value,
  onChange,
  allowPresent = false,
  ariaLabel,
}: DatePickerBadgeProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        input.focus();
      }
    }
  };

  return (
    <span className={styles.wrapper}>
      <label className={styles.label} onClick={openPicker} title="Change date">
        <time className={styles.display}>{value || "Select date"}</time>
        <input
          ref={inputRef}
          type="month"
          className={`${styles.hiddenInput} no-print`}
          value={displayMonthToInputValue(value)}
          aria-label={ariaLabel}
          onChange={(e) => {
            if (!e.target.value) return;
            onChange(inputValueToDisplayMonth(e.target.value));
          }}
        />
      </label>

      {allowPresent && value.trim().toLowerCase() !== "present" && (
        <button
          type="button"
          className={`${styles.presentBtn} no-print`}
          onClick={() => onChange("Present")}
          title="Set end date to Present"
        >
          Present
        </button>
      )}
    </span>
  );
}

