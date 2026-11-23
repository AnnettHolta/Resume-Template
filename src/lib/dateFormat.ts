const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Converts a display month like "Jan 2023" to "2023-01" for <input type="month">.
 * Returns "" if the string is "Present" or cannot be parsed.
 */
export function displayMonthToInputValue(display: string): string {
  const trimmed = display.trim();
  if (!trimmed || trimmed.toLowerCase() === "present") return "";

  const yearOnly = /^(\d{4})$/.exec(trimmed);
  if (yearOnly) {
    return `${yearOnly[1]}-01`;
  }

  const parts = /^([A-Za-z]{3,9})\s+(\d{4})$/.exec(trimmed);
  if (!parts) return "";

  const monthPrefix = parts[1].slice(0, 3).toLowerCase();
  const monthIdx = MONTHS.findIndex((m) => m.toLowerCase() === monthPrefix);
  if (monthIdx === -1) return "";

  const mm = String(monthIdx + 1).padStart(2, "0");
  return `${parts[2]}-${mm}`;
}

/**
 * Converts an <input type="month"> value ("2023-01") to "Jan 2023".
 */
export function inputValueToDisplayMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return value;

  const year = match[1];
  const monthIdx = Number(match[2]) - 1;
  const monthName = MONTHS[monthIdx];
  if (!monthName) return value;

  return `${monthName} ${year}`;
}
