import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { readSessionResume } from "@/server/storage/resumeFileStore";
import { extractMcpToken } from "@/server/storage/tokenUtils";
import { GetResumeQuerySchema } from "./request";
import { GetResumeResponseSchema, UnauthorizedResponseSchema } from "./response";

const route = createRoute({
  method: "get",
  path: "/resume",
  tags: ["Resume"],
  summary: "Get the resume for the active MCP session token",
  request: {
    query: GetResumeQuerySchema,
  },
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
      description: "Missing or invalid MCP session token",
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
    const { token: queryToken } = c.req.valid("query");
    const token = extractMcpToken(c.req.raw.headers, queryToken);
    if (!token) {
      return c.json({ error: "Missing or invalid MCP session token" }, 401);
    }

    const data = await readSessionResume(token);
    return c.json(data, 200);
  });
}

