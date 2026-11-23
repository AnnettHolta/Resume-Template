import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { deleteCookie } from "hono/cookie";
import { deleteSessionResume } from "@/server/storage/resumeFileStore";
import { extractMcpToken, MCP_TOKEN_COOKIE } from "@/server/storage/tokenUtils";
import { DisconnectSessionResponseSchema } from "./response";

const route = createRoute({
  method: "delete",
  path: "/session",
  tags: ["Session"],
  summary: "Disconnect MCP and remove session cookie",
  responses: {
    200: {
      description: "Session disconnected",
      content: {
        "application/json": {
          schema: DisconnectSessionResponseSchema,
        },
      },
    },
  },
});

export function registerDisconnectSessionEndpoint(app: OpenAPIHono) {
  app.openapi(route, async (c) => {
    const token = extractMcpToken(c.req.raw.headers);
    if (token) {
      await deleteSessionResume(token);
    }
    deleteCookie(c, MCP_TOKEN_COOKIE, { path: "/" });
    return c.json({ disconnected: true }, 200);
  });
}

