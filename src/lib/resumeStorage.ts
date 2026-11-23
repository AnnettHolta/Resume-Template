import type { ResumeData } from "@/types/resume";
import { ResumeDataSchema } from "./resumeSchema";

export const MAX_HISTORY_LENGTH = 50;

export function withResumeId(
  data: ResumeData,
): ResumeData & { resumeId: string } {
  if (data.resumeId) return { ...data, resumeId: data.resumeId };
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  const resumeId = [
    hex.slice(0, 4),
    hex.slice(4, 6),
    hex.slice(6, 8),
    hex.slice(8, 10),
    hex.slice(10),
  ]
    .map((part) => part.join(""))
    .join("-");
  return { ...data, resumeId };
}

export function isValidResumeData(value: unknown): value is ResumeData {
  return ResumeDataSchema.safeParse(value).success;
}

export function parseResumeJson(text: string): ResumeData {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("The file contains invalid JSON.");
  }
  const result = ResumeDataSchema.safeParse(value);
  if (result.success) return withResumeId(result.data);

  const issue = result.error.issues[0];
  const field = issue.path.join(".") || "resume";
  throw new Error(`Invalid resume field "${field}": ${issue.message}`);
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
