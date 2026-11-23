import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import {
  isSessionActive,
  writeSessionResume,
} from "@/server/storage/resumeFileStore";
import { extractMcpToken } from "@/server/storage/tokenUtils";
import { UpdateResumeRequestSchema } from "./request";
import {
  UpdateResumeErrorSchema,
  UpdateResumeResponseSchema,
} from "./response";

const route = createRoute({
  method: "put",
  path: "/resume",
  tags: ["Resume"],
  summary: "Sync browser resume edits to the active runtime MCP session",
  request: {
    headers: z.object({
      "if-match": z.string().optional().openapi({
        description: "ETag returned by the last resume read or write",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateResumeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Resume saved",
      headers: { ETag: { schema: { type: "string" } } },
      content: {
        "application/json": {
          schema: UpdateResumeResponseSchema,
        },
      },
    },
    401: {
      description: "Missing, expired, or revoked MCP session token",
      content: {
        "application/json": {
          schema: UpdateResumeErrorSchema,
        },
      },
    },
    412: {
      description: "The resume changed since this revision was read",
      content: { "application/json": { schema: UpdateResumeErrorSchema } },
    },
    428: {
      description: "An If-Match header is required",
      content: { "application/json": { schema: UpdateResumeErrorSchema } },
    },
  },
});

export function registerUpdateResumeEndpoint(app: OpenAPIHono) {
  app.openapi(route, async (c) => {
    const token = extractMcpToken(c.req.raw.headers);
    if (!token || !isSessionActive(token)) {
      return c.json(
        { error: "Missing, expired, or revoked MCP session token" },
        401,
      );
    }

    const body = c.req.valid("json");
    const expectedRevision = c.req.valid("header")["if-match"];
    if (!expectedRevision) {
      return c.json({ error: "An If-Match header is required" }, 428);
    }
    const result = writeSessionResume(token, body, "browser", expectedRevision);
    if (result === "conflict") {
      return c.json({ error: "The resume changed since it was read" }, 412);
    }
    if (result === null) {
      return c.json(
        { error: "Missing, expired, or revoked MCP session token" },
        401,
      );
    }

    return c.json({ saved: true }, 200, { ETag: result.revision });
  });
}
