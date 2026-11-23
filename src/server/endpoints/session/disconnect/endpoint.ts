import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { deleteCookie } from "hono/cookie";
import { revokeSession } from "@/server/storage/editorSessions";
import {
  extractMcpToken,
  isHttpsRequest,
  MCP_EDITOR_COOKIE,
  MCP_TOKEN_COOKIE,
} from "@/server/storage/tokenUtils";
import { DisconnectSessionResponseSchema } from "./response";

const route = createRoute({
  method: "delete",
  path: "/session",
  tags: ["Session"],
  summary: "Disconnect MCP, revoke session token, and clear cookie",
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
      revokeSession(token);
    }
    const cookie = {
      path: "/",
      secure: isHttpsRequest(c.req.raw),
    };
    deleteCookie(c, MCP_TOKEN_COOKIE, cookie);
    deleteCookie(c, MCP_EDITOR_COOKIE, cookie);
    return c.json({ disconnected: true }, 200);
  });
}
