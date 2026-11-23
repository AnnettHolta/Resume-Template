import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import { ResumeCommandResultSchema } from "@/lib/resumeCommands";
import {
  completeCommand,
  connectEditor,
  isSessionActive,
  ownsSession,
} from "@/server/storage/editorSessions";
import {
  extractEditorCredential,
  extractMcpToken,
} from "@/server/storage/tokenUtils";

const eventRoute = createRoute({
  method: "get",
  path: "/resume/events",
  tags: ["Resume"],
  summary: "Connect the browser editor to MCP commands",
  responses: {
    200: { description: "Server-Sent Events stream of editor commands" },
    401: { description: "Missing or expired editor credentials" },
  },
});

const resultRoute = createRoute({
  method: "post",
  path: "/resume/commands/{id}/result",
  tags: ["Resume"],
  summary: "Acknowledge a command from the connected browser editor",
  request: {
    params: z.object({ id: z.uuid() }),
    body: {
      required: true,
      content: { "application/json": { schema: ResumeCommandResultSchema } },
    },
  },
  responses: {
    204: { description: "Result accepted" },
    401: { description: "Missing or expired editor credentials" },
    404: { description: "Command expired or was already acknowledged" },
  },
});

function editorToken(headers: Headers) {
  const token = extractMcpToken(headers);
  return token && ownsSession(token, extractEditorCredential(headers))
    ? token
    : null;
}

export function registerEditorEndpoints(app: OpenAPIHono) {
  app.openapi(eventRoute, (c) => {
    const token = editorToken(c.req.raw.headers);
    if (!token) return c.body(null, 401);

    return streamSSE(c, async (stream) => {
      const disconnect = connectEditor(token, {
        send: (event) => {
          void stream.writeSSE({
            event: "resume-command",
            data: JSON.stringify(event),
          });
        },
        close: () => {
          stream.abort();
        },
      });
      if (!disconnect) {
        await stream.writeSSE({ event: "editor-busy", data: "{}" });
        return;
      }
      const heartbeat = setInterval(() => {
        if (!isSessionActive(token)) stream.abort();
        else void stream.writeSSE({ event: "ping", data: "{}" });
      }, 25000);
      const closed = new Promise<void>((resolve) => {
        stream.onAbort(() => {
          clearInterval(heartbeat);
          disconnect();
          resolve();
        });
      });
      await stream.writeSSE({ event: "connected", data: "{}" });
      await closed;
    });
  });

  app.openapi(resultRoute, (c) => {
    const token = editorToken(c.req.raw.headers);
    if (!token) return c.body(null, 401);

    const { id } = c.req.valid("param");
    const result = c.req.valid("json");
    if (!completeCommand(token, id, result)) return c.body(null, 404);
    return c.body(null, 204);
  });
}
