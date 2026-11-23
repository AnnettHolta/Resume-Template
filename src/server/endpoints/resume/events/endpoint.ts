import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import { subscribeToResumeUpdates } from "@/server/storage/resumeFileStore";
import { extractMcpToken } from "@/server/storage/tokenUtils";
import { ResumeEventsUnauthorizedSchema } from "./response";

const route = createRoute({
  method: "get",
  path: "/resume/events",
  tags: ["Resume"],
  summary: "Subscribe to live MCP resume updates via Server-Sent Events",
  responses: {
    200: {
      description: "SSE stream of resume update events",
    },
    401: {
      description: "Missing or invalid MCP session token",
      content: {
        "application/json": {
          schema: ResumeEventsUnauthorizedSchema,
        },
      },
    },
  },
});

export function registerResumeEventsEndpoint(app: OpenAPIHono) {
  app.openapi(route, async (c) => {
    const token = extractMcpToken(c.req.raw.headers);
    if (!token) {
      return c.json({ error: "Missing or invalid MCP session token" }, 401);
    }

    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        event: "connected",
        data: JSON.stringify({ connected: true }),
      });

      const unsubscribe = subscribeToResumeUpdates(token, (event) => {
        if (event.source !== "mcp") return;
        void stream.writeSSE({
          event: "resume-updated",
          data: JSON.stringify(event),
        });
      });

      const heartbeat = setInterval(() => {
        void stream.writeSSE({
          event: "ping",
          data: "{}",
        });
      }, 25000);

      stream.onAbort(() => {
        clearInterval(heartbeat);
        unsubscribe();
      });

      await new Promise<void>((resolve) => {
        stream.onAbort(() => resolve());
      });
    });
  });
}

