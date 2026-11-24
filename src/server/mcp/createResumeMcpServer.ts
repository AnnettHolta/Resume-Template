import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  ProfilePatchSchema,
  RevisionSchema,
  type ResumeCommand,
} from "@/lib/resumeCommands";
import { EducationItemSchema, ExperienceItemSchema } from "@/lib/resumeSchema";
import { sanitizeResumeForAgent } from "@/lib/resumeSanitize";
import { requestEditor } from "@/server/storage/editorSessions";

export function createResumeMcpServer(token: string): McpServer {
  const server = new McpServer({
    name: "resume-template-mcp",
    version: "2.0.0",
  });

  async function relay(
    command: ResumeCommand,
    signal: AbortSignal,
  ): Promise<CallToolResult> {
    const result = await requestEditor(token, command, signal);
    if (!result) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "The browser editor is disconnected or did not confirm the command. Open the editor and call get_resume before retrying.",
          },
        ],
      };
    }
    if (result.status === "stale" || result.status === "conflict") {
      const reason =
        result.status === "stale"
          ? "That resume revision is unavailable."
          : `The editor changed these fields: ${result.fields.join(", ")}.`;
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `${reason} No part of this edit was applied. Call get_resume before trying again.`,
          },
        ],
      };
    }
    const payload =
      result.status === "read" || result.status === "applied"
        ? { ...result, resume: sanitizeResumeForAgent(result.resume) }
        : result;
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    };
  }

  const revision = {
    revision: RevisionSchema.describe(
      "Revision returned by get_resume or the last successful edit",
    ),
  };
  server.tool(
    "get_resume",
    "Read the live browser resume and its revision",
    {},
    (_, { signal }) => relay({ type: "read" }, signal),
  );

  server.tool(
    "update_profile",
    "Update only the supplied profile or contact fields",
    { ...ProfilePatchSchema.shape, ...revision },
    ({ revision, ...patch }, { signal }) =>
      relay({ type: "update_profile", revision, patch }, signal),
  );

  server.tool(
    "upsert_experience",
    "Add an experience entry, or change fields relative to the revision by ID",
    { item: ExperienceItemSchema, ...revision },
    (args, { signal }) => relay({ type: "upsert_experience", ...args }, signal),
  );

  server.tool(
    "delete_experience",
    "Delete an experience entry by ID",
    { id: z.string().min(1), ...revision },
    (args, { signal }) => relay({ type: "delete_experience", ...args }, signal),
  );

  server.tool(
    "upsert_education",
    "Add an education entry, or change fields relative to the revision by ID",
    { item: EducationItemSchema, ...revision },
    (args, { signal }) => relay({ type: "upsert_education", ...args }, signal),
  );

  server.tool(
    "delete_education",
    "Delete an education entry by ID",
    { id: z.string().min(1), ...revision },
    (args, { signal }) => relay({ type: "delete_education", ...args }, signal),
  );

  server.tool(
    "add_skills",
    "Add skills and resolve catalog aliases",
    { skills: z.array(z.string()), ...revision },
    (args, { signal }) => relay({ type: "add_skills", ...args }, signal),
  );

  server.tool(
    "remove_skills",
    "Remove skills by name or catalog alias",
    { skills: z.array(z.string()), ...revision },
    (args, { signal }) => relay({ type: "remove_skills", ...args }, signal),
  );

  return server;
}
