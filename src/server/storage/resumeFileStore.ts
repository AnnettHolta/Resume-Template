import { promises as fs } from "node:fs";
import path from "node:path";
import type { ResumeData } from "@/types/resume";
import { hashMcpToken, isValidMcpToken } from "./tokenUtils";

const TEMPLATE_PATH = path.join(process.cwd(), "src", "data", "resume.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours sliding runtime TTL

export type ResumeUpdateSource = "browser" | "mcp";

export interface ResumeUpdateEvent {
  data: ResumeData;
  source: ResumeUpdateSource;
  version: number;
  updatedAt: string;
}

interface RuntimeSessionEntry {
  data: ResumeData;
  version: number;
  expiresAt: number;
}

type ResumeListener = (event: ResumeUpdateEvent) => void;

const globalForRuntime = globalThis as unknown as {
  __resumeRuntimeStore?: Map<string, RuntimeSessionEntry>;
  __resumeSubscribers?: Map<string, Set<ResumeListener>>;
};

const sessionStore =
  globalForRuntime.__resumeRuntimeStore ??
  (globalForRuntime.__resumeRuntimeStore = new Map<
    string,
    RuntimeSessionEntry
  >());

const subscribers =
  globalForRuntime.__resumeSubscribers ??
  (globalForRuntime.__resumeSubscribers = new Map<string, Set<ResumeListener>>());

function pruneExpiredSessions(): void {
  const now = Date.now();
  for (const [key, entry] of sessionStore.entries()) {
    if (entry.expiresAt <= now) {
      sessionStore.delete(key);
      subscribers.delete(key);
    }
  }
}

export async function loadTemplateResume(): Promise<ResumeData> {
  const raw = await fs.readFile(TEMPLATE_PATH, "utf-8");
  return JSON.parse(raw) as ResumeData;
}

export function isSessionActive(token: string): boolean {
  if (!isValidMcpToken(token)) return false;
  pruneExpiredSessions();
  const entry = sessionStore.get(hashMcpToken(token));
  if (!entry) return false;
  entry.expiresAt = Date.now() + SESSION_TTL_MS;
  return true;
}

export async function activateSession(
  token: string,
  initialResume?: ResumeData
): Promise<void> {
  if (!isValidMcpToken(token)) {
    throw new Error("Invalid MCP session token");
  }
  pruneExpiredSessions();
  const key = hashMcpToken(token);
  const existing = sessionStore.get(key);
  const data = initialResume ?? existing?.data ?? (await loadTemplateResume());
  sessionStore.set(key, {
    data,
    version: existing ? existing.version + 1 : 1,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

export function readSessionResume(token: string): {
  data: ResumeData;
  version: number;
} | null {
  if (!isValidMcpToken(token)) return null;
  pruneExpiredSessions();
  const entry = sessionStore.get(hashMcpToken(token));
  if (!entry) return null;
  entry.expiresAt = Date.now() + SESSION_TTL_MS;
  return { data: entry.data, version: entry.version };
}

export function writeSessionResume(
  token: string,
  data: ResumeData,
  source: ResumeUpdateSource
): number | null {
  if (!isValidMcpToken(token)) return null;
  pruneExpiredSessions();
  const key = hashMcpToken(token);
  const existing = sessionStore.get(key);
  if (!existing) return null;

  const nextVersion = existing.version + 1;
  sessionStore.set(key, {
    data,
    version: nextVersion,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  const listeners = subscribers.get(key);
  if (listeners) {
    const event: ResumeUpdateEvent = {
      data,
      source,
      version: nextVersion,
      updatedAt: new Date().toISOString(),
    };
    for (const listener of listeners) {
      listener(event);
    }
  }

  return nextVersion;
}

export function revokeSession(token: string): void {
  if (!isValidMcpToken(token)) return;
  const key = hashMcpToken(token);
  sessionStore.delete(key);
  subscribers.delete(key);
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
