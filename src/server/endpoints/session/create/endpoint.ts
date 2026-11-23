import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { setCookie } from "hono/cookie";
import {
  activateSession,
  isSessionActive,
  readSessionResume,
  revokeSession,
} from "@/server/storage/resumeFileStore";
import {
  extractMcpToken,
  generateMcpToken,
  isHttpsRequest,
  MCP_TOKEN_COOKIE,
} from "@/server/storage/tokenUtils";
import { CreateSessionRequestSchema } from "./request";
import { CreateSessionResponseSchema } from "./response";

const route = createRoute({
  method: "post",
  path: "/session",
  tags: ["Session"],
  summary: "Request, revalidate, or regenerate an MCP session token",
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
  },
});

export function registerCreateSessionEndpoint(app: OpenAPIHono) {
  app.openapi(route, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = CreateSessionRequestSchema.safeParse(body);
    const regenerate = parsed.success ? parsed.data.regenerate : false;
    const revalidate = parsed.success ? parsed.data.revalidate : false;
    const initialResume = parsed.success ? parsed.data.initialResume : undefined;

    const existingToken = extractMcpToken(c.req.raw.headers);

    if (existingToken && !regenerate) {
      if (isSessionActive(existingToken) || revalidate) {
        await activateSession(existingToken, initialResume);
        return c.json({ token: existingToken, active: true }, 200);
      }
    }

    let seedResume = initialResume;
    if (existingToken && regenerate) {
      if (!seedResume) {
        seedResume = readSessionResume(existingToken)?.data;
      }
      revokeSession(existingToken);
    }

    const token = generateMcpToken();
    await activateSession(token, seedResume);

    setCookie(c, MCP_TOKEN_COOKIE, token, {
      path: "/",
      sameSite: "Lax",
      httpOnly: false,
      secure: isHttpsRequest(c.req.raw),
      maxAge: 60 * 60 * 4,
    });

    return c.json({ token, active: true }, 200);
  });
}
