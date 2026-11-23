import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
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
    const version = writeSessionResume(token, body, "browser");
    if (version === null) {
      return c.json(
        { error: "Missing, expired, or revoked MCP session token" },
        401,
      );
    }

    return c.json({ saved: true }, 200);
  });
}
