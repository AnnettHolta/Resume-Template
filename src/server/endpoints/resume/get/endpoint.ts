import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import {
  isSessionActive,
  readSessionResume,
} from "@/server/storage/resumeFileStore";
import { extractMcpToken } from "@/server/storage/tokenUtils";
import {
  GetResumeResponseSchema,
  UnauthorizedResponseSchema,
} from "./response";

const route = createRoute({
  method: "get",
  path: "/resume",
  tags: ["Resume"],
  summary: "Get the resume for the active MCP session token",
  responses: {
    200: {
      description: "Resume data",
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

    const session = readSessionResume(token);
    if (!session) {
      return c.json(
        { error: "Missing, expired, or revoked MCP session token" },
        401,
      );
    }

    return c.json(session.data, 200);
  });
}
