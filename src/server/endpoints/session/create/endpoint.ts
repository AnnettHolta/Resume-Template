import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { setCookie } from "hono/cookie";
import {
  activateSession,
  isSessionActive,
  ownsSession,
  revokeSession,
} from "@/server/storage/editorSessions";
import {
  extractEditorCredential,
  extractMcpToken,
  generateMcpToken,
  isHttpsRequest,
  MCP_EDITOR_COOKIE,
  MCP_TOKEN_COOKIE,
} from "@/server/storage/tokenUtils";
import { CreateSessionRequestSchema } from "./request";
import { CreateSessionResponseSchema } from "./response";

const route = createRoute({
  method: "post",
  path: "/session",
  tags: ["Session"],
  summary: "Request or rotate an MCP session token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateSessionRequestSchema,
        },
      },
      required: false,
    },
  },
  responses: {
    200: {
      description: "Active MCP session token",
      content: {
        "application/json": {
          schema: CreateSessionResponseSchema,
        },
      },
    },
    403: {
      description: "The active session belongs to another editor",
    },
  },
});

export function registerCreateSessionEndpoint(app: OpenAPIHono) {
  app.openapi(route, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = CreateSessionRequestSchema.safeParse(body);
    const regenerate = parsed.success ? parsed.data.regenerate : false;
    const existingToken = extractMcpToken(c.req.raw.headers);
    if (existingToken && isSessionActive(existingToken)) {
      if (
        !ownsSession(existingToken, extractEditorCredential(c.req.raw.headers))
      ) {
        return c.body(null, 403);
      }
      if (!regenerate)
        return c.json({ token: existingToken, active: true }, 200);
      revokeSession(existingToken);
    }

    const token = generateMcpToken();
    const owner = generateMcpToken();
    activateSession(token, owner);

    const cookie = {
      path: "/",
      sameSite: "Strict" as const,
      secure: isHttpsRequest(c.req.raw),
    };
    setCookie(c, MCP_TOKEN_COOKIE, token, cookie);
    setCookie(c, MCP_EDITOR_COOKIE, owner, { ...cookie, httpOnly: true });

    return c.json({ token, active: true }, 200);
  });
}
