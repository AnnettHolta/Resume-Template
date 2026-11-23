import { promises as fs } from "node:fs";
import path from "node:path";
import type { ResumeData } from "@/types/resume";
import { hashMcpToken, isValidMcpToken } from "./tokenUtils";

const DATA_DIR = path.join(process.cwd(), ".data", "resumes");
const TEMPLATE_PATH = path.join(process.cwd(), "src", "data", "resume.json");

export type ResumeUpdateSource = "browser" | "mcp";

export interface ResumeUpdateEvent {
  data: ResumeData;
  source: ResumeUpdateSource;
  updatedAt: string;
}

type ResumeListener = (event: ResumeUpdateEvent) => void;

const globalForBus = globalThis as unknown as {
  __resumeSubscribers?: Map<string, Set<ResumeListener>>;
};

const subscribers =
  globalForBus.__resumeSubscribers ??
  (globalForBus.__resumeSubscribers = new Map<string, Set<ResumeListener>>());

function getSessionFilePath(token: string): string {
  if (!isValidMcpToken(token)) {
    throw new Error("Invalid MCP session token");
  }
  const hashed = hashMcpToken(token);
  return path.join(DATA_DIR, `${hashed}.json`);
}

export async function loadTemplateResume(): Promise<ResumeData> {
  const raw = await fs.readFile(TEMPLATE_PATH, "utf-8");
  return JSON.parse(raw) as ResumeData;
}

export async function readSessionResume(token: string): Promise<ResumeData> {
  const filePath = getSessionFilePath(token);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as ResumeData;
  } catch {
    return loadTemplateResume();
  }
}

export async function writeSessionResume(
  token: string,
  data: ResumeData,
  source: ResumeUpdateSource
): Promise<void> {
  const filePath = getSessionFilePath(token);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

  const key = hashMcpToken(token);
  const listeners = subscribers.get(key);
  if (listeners) {
    const event: ResumeUpdateEvent = {
      data,
      source,
      updatedAt: new Date().toISOString(),
    };
    for (const listener of listeners) {
      listener(event);
    }
  }
}

export async function deleteSessionResume(token: string): Promise<void> {
  if (!isValidMcpToken(token)) return;
  const filePath = getSessionFilePath(token);
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore if file does not exist
  }
}

export function subscribeToResumeUpdates(
  token: string,
  listener: ResumeListener
): () => void {
  const key = hashMcpToken(token);
  let set = subscribers.get(key);
  if (!set) {
    set = new Set();
    subscribers.set(key, set);
  }
  set.add(listener);

  return () => {
    const current = subscribers.get(key);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      subscribers.delete(key);
    }
  };
}

