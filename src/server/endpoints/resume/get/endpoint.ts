import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import {
  isSessionActive,
  requestEditor,
} from "@/server/storage/editorSessions";
import { extractMcpToken } from "@/server/storage/tokenUtils";
import {
  GetResumeResponseSchema,
  UnauthorizedResponseSchema,
} from "./response";

const route = createRoute({
  method: "get",
  path: "/resume",
  tags: ["Resume"],
  summary: "Read the current resume from the connected editor",
  responses: {
    200: {
      description: "Resume data",
      headers: { ETag: { schema: { type: "string" } } },
      content: {
        "application/json": {
          schema: GetResumeResponseSchema,
        },
      },
    },
    401: {
      description: "Missing, expired, or revoked MCP session token",
      content: {
        "application/json": {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
    503: {
      description: "The editor is disconnected or did not respond",
      content: { "application/json": { schema: UnauthorizedResponseSchema } },
    },
  },
});

export function registerGetResumeEndpoint(app: OpenAPIHono) {
  app.openapi(route, async (c) => {
    const token = extractMcpToken(c.req.raw.headers);
    if (!token || !isSessionActive(token)) {
      return c.json(
        { error: "Missing, expired, or revoked MCP session token" },
        401,
      );
    }

    const result = await requestEditor(
      token,
      { type: "read" },
      c.req.raw.signal,
    );
    if (!result || result.status !== "read") {
      return c.json(
        { error: "The editor is disconnected or did not respond" },
        503,
      );
    }

    return c.json(result.resume, 200, {
      ETag: `"${result.revision}"`,
      "Cache-Control": "no-store",
    });
  });
}
