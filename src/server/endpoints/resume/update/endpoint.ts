import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { writeSessionResume } from "@/server/storage/resumeFileStore";
import { extractMcpToken } from "@/server/storage/tokenUtils";
import { UpdateResumeRequestSchema } from "./request";
import { UpdateResumeErrorSchema, UpdateResumeResponseSchema } from "./response";

const route = createRoute({
  method: "put",
  path: "/resume",
  tags: ["Resume"],
  summary: "Persist browser resume edits for the active MCP session token",
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
      description: "Missing or invalid MCP session token",
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
    if (!token) {
      return c.json({ error: "Missing or invalid MCP session token" }, 401);
    }

    const body = c.req.valid("json");
    await writeSessionResume(token, body, "browser");
    return c.json({ saved: true }, 200);
  });
}

