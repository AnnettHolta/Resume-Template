import { randomUUID } from "node:crypto";
import { hashMcpToken } from "./tokenUtils";
import type {
  ResumeCommand,
  ResumeCommandEvent,
  ResumeCommandResult,
} from "@/lib/resumeCommands";

const SESSION_TTL_MS = 4 * 60 * 60 * 1000;
const COMMAND_TIMEOUT_MS = 8000;
const MAX_PENDING_COMMANDS = 16;

interface EditorConnection {
  send: (event: ResumeCommandEvent) => void;
  close: () => void;
}

interface PendingCommand {
  finish: (result: ResumeCommandResult | null) => void;
  type: ResumeCommand["type"];
}

interface Session {
  ownerHash: string;
  expiresAt: number;
  editor?: EditorConnection;
  pending: Map<string, PendingCommand>;
}

const runtime = globalThis as typeof globalThis & {
  resumeEditorSessions?: Map<string, Session>;
};
const sessions = (runtime.resumeEditorSessions ??= new Map<string, Session>());

function removeSession(key: string) {
  const session = sessions.get(key);
  sessions.delete(key);
  session?.editor?.close();
  session?.pending.forEach(({ finish }) => finish(null));
}

function getSession(token: string) {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (session.expiresAt <= now) removeSession(key);
  }
  return sessions.get(hashMcpToken(token));
}

export function activateSession(token: string, owner: string) {
  getSession(token);
  sessions.set(hashMcpToken(token), {
    ownerHash: hashMcpToken(owner),
    expiresAt: Date.now() + SESSION_TTL_MS,
    pending: new Map(),
  });
}

export function isSessionActive(token: string): boolean {
  return Boolean(getSession(token));
}

export function ownsSession(token: string, owner: string | null): boolean {
  return Boolean(owner && getSession(token)?.ownerHash === hashMcpToken(owner));
}

export function revokeSession(token: string) {
  removeSession(hashMcpToken(token));
}

export function connectEditor(token: string, editor: EditorConnection) {
  const session = getSession(token);
  if (!session || session.editor) return null;
  session.editor = editor;
  return () => {
    if (session.editor !== editor) return;
    session.editor = undefined;
    session.pending.forEach(({ finish }) => finish(null));
  };
}

export function requestEditor(
  token: string,
  command: ResumeCommand,
  signal?: AbortSignal,
): Promise<ResumeCommandResult | null> {
  const session = getSession(token);
  const editor = session?.editor;
  if (
    !session ||
    !editor ||
    signal?.aborted ||
    session.pending.size >= MAX_PENDING_COMMANDS
  ) {
    return Promise.resolve(null);
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  const id = randomUUID();

  return new Promise((resolve) => {
    const abort = () => finish(null);
    const timer = setTimeout(abort, COMMAND_TIMEOUT_MS);
    function finish(result: ResumeCommandResult | null) {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      session?.pending.delete(id);
      resolve(result);
    }
    session.pending.set(id, { finish, type: command.type });
    signal?.addEventListener("abort", abort, { once: true });
    editor.send({ id, command, expiresAt: Date.now() + COMMAND_TIMEOUT_MS });
  });
}

export function completeCommand(
  token: string,
  id: string,
  result: ResumeCommandResult,
) {
  const pending = getSession(token)?.pending.get(id);
  if (!pending || (pending.type === "read") !== (result.status === "read"))
    return false;
  pending.finish(result);
  return true;
}
