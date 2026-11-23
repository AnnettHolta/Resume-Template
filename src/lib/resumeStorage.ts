import type { ResumeData } from "@/types/resume";

export const MAX_HISTORY_LENGTH = 50;

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
