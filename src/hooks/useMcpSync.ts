"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createEditorCommands } from "@/lib/editorCommands";
import {
  ResumeCommandEventSchema,
  type ResumeEdit,
} from "@/lib/resumeCommands";
import { useResumeStore } from "@/store/useResumeStore";
import type { ResumeData } from "@/types/resume";

const MCP_COOKIE_NAME = "resumeMcpToken";
const MCP_COOKIE_EVENT = "resume-mcp-cookie-change";

function readMcpCookie() {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${MCP_COOKIE_NAME}=`));
  return cookie?.slice(MCP_COOKIE_NAME.length + 1) || null;
}

function subscribeMcpCookie(callback: () => void) {
  window.addEventListener(MCP_COOKIE_EVENT, callback);
  return () => window.removeEventListener(MCP_COOKIE_EVENT, callback);
}

function settleFocusedDraft(edit: ResumeEdit) {
  const active = document.activeElement;
  if (
    !(active instanceof HTMLElement) ||
    !active.matches("main :is(input, textarea)")
  )
    return;

  // Existing inline editors commit on blur. Settle the affected draft before comparing it.
  if (
    (edit.type === "update_profile" &&
      active.closest("[data-resume-profile]")) ||
    (edit.type === "upsert_experience" &&
      active.closest<HTMLElement>("[data-experience-id]")?.dataset
        .experienceId === edit.item.id) ||
    (edit.type === "delete_experience" &&
      active.closest<HTMLElement>("[data-experience-id]")?.dataset
        .experienceId === edit.id) ||
    (edit.type === "upsert_education" &&
      active.closest<HTMLElement>("[data-education-id]")?.dataset
        .educationId === edit.item.id) ||
    (edit.type === "delete_education" &&
      active.closest<HTMLElement>("[data-education-id]")?.dataset
        .educationId === edit.id)
  ) {
    active.blur();
  }
}

export function useMcpSync(initialData: ResumeData, hasHydrated: boolean) {
  const mcpToken = useSyncExternalStore(
    subscribeMcpCookie,
    readMcpCookie,
    () => null,
  );
  const [isMcpExpired, setIsMcpExpired] = useState(false);
  const [isEditorConnected, setIsEditorConnected] = useState(false);

  useEffect(() => {
    if (!mcpToken || !hasHydrated) return;
    const abort = new AbortController();
    const { commitResume, setStatusMessage } = useResumeStore.getState();
    const handleCommand = createEditorCommands({
      readResume: () => {
        const { entries, index } = useResumeStore.getState();
        return entries[index] ?? initialData;
      },
      commitResume: (data) => commitResume(data, initialData),
      settleDraft: settleFocusedDraft,
    });

    const events = new EventSource("/api/resume/events");
    events.addEventListener("connected", () => {
      setIsMcpExpired(false);
      setIsEditorConnected(true);
    });
    events.addEventListener("resume-command", async (event) => {
      if (abort.signal.aborted || readMcpCookie() !== mcpToken) return;
      try {
        const command = ResumeCommandEventSchema.parse(JSON.parse(event.data));
        if (command.expiresAt <= Date.now()) return;
        const result = handleCommand(command);
        if (command.command.type !== "read") {
          if (result.status === "applied") setStatusMessage("MCP edit applied");
          if (result.status === "conflict")
            setStatusMessage(
              `MCP edit skipped. Local changes kept in ${result.fields.join(", ")}.`,
            );
        }

        const response = await fetch(
          `/api/resume/commands/${command.id}/result`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
            signal: abort.signal,
          },
        ).catch(() => null);
        if (
          !response?.ok &&
          !abort.signal.aborted &&
          result.status === "applied"
        ) {
          setStatusMessage(
            "MCP edit applied locally. The agent could not be notified.",
          );
        }
      } catch {
        if (!abort.signal.aborted)
          setStatusMessage("Could not complete the MCP command.");
      }
    });

    events.onerror = () => {
      setIsEditorConnected(false);
      if (events.readyState === EventSource.CLOSED) setIsMcpExpired(true);
    };

    return () => {
      abort.abort();
      events.close();
    };
  }, [mcpToken, hasHydrated, initialData]);

  return {
    mcpToken,
    isMcpExpired,
    isEditorConnected,
    notifyTokenChange: () => {
      setIsMcpExpired(false);
      setIsEditorConnected(false);
      window.dispatchEvent(new Event(MCP_COOKIE_EVENT));
    },
  };
}
