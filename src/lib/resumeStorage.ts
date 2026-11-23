import type { ResumeData } from "@/types/resume";

export const RESUME_STORAGE_KEY = "resume_template_state_v1";
export const RESUME_HISTORY_STORAGE_KEY = "resume_template_history_v1";
export const MAX_HISTORY_LENGTH = 50;

export interface StoredHistoryState {
  entries: ResumeData[];
  index: number;
}

export function isValidResumeData(value: unknown): value is ResumeData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ResumeData>;
  return (
    Boolean(candidate.profile && typeof candidate.profile.name === "string") &&
    Array.isArray(candidate.experience) &&
    Array.isArray(candidate.education) &&
    Array.isArray(candidate.skills)
  );
}

export function loadSavedResume(): ResumeData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidResumeData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveResumeToStorage(data: ResumeData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSavedHistory(): StoredHistoryState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RESUME_HISTORY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredHistoryState>;
    if (
      !Array.isArray(parsed.entries) ||
      typeof parsed.index !== "number" ||
      parsed.entries.length === 0
    ) {
      return null;
    }
    const validEntries = parsed.entries.filter(isValidResumeData).slice(-MAX_HISTORY_LENGTH);
    if (validEntries.length === 0) return null;
    const clampedIndex = Math.max(0, Math.min(parsed.index, validEntries.length - 1));
    return { entries: validEntries, index: clampedIndex };
  } catch {
    return null;
  }
}

export function saveHistoryToStorage(state: StoredHistoryState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESUME_HISTORY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearResumeStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RESUME_STORAGE_KEY);
    window.localStorage.removeItem(RESUME_HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function downloadResumeJson(data: ResumeData): void {
  const slug = data.profile.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${slug || "resume"}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

