import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { setCookie } from "hono/cookie";
import {
  deleteSessionResume,
  readSessionResume,
  writeSessionResume,
} from "@/server/storage/resumeFileStore";
import {
  extractMcpToken,
  generateMcpToken,
  MCP_TOKEN_COOKIE,
} from "@/server/storage/tokenUtils";
import { CreateSessionRequestSchema } from "./request";
import { CreateSessionResponseSchema } from "./response";

const route = createRoute({
  method: "post",
  path: "/session",
  tags: ["Session"],
  summary: "Request or regenerate an MCP session token",
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
    const initialResume = parsed.success ? parsed.data.initialResume : undefined;

    const existingToken = extractMcpToken(c.req.raw.headers);

    if (existingToken && !regenerate) {
      if (initialResume) {
        await writeSessionResume(existingToken, initialResume, "browser");
      }
      return c.json({ token: existingToken }, 200);
    }

    let seedResume = initialResume;
    if (existingToken && regenerate) {
      if (!seedResume) {
        seedResume = await readSessionResume(existingToken);
      }
      await deleteSessionResume(existingToken);
    }

    const token = generateMcpToken();
    if (seedResume) {
      await writeSessionResume(token, seedResume, "browser");
    }

    setCookie(c, MCP_TOKEN_COOKIE, token, {
      path: "/",
      sameSite: "Lax",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });

    return c.json({ token }, 200);
  });
}

