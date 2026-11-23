import type { OpenAPIHono } from "@hono/zod-openapi";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createResumeMcpServer } from "@/server/mcp/createResumeMcpServer";
import { isSessionActive } from "@/server/storage/resumeFileStore";
import { extractMcpToken } from "@/server/storage/tokenUtils";

export function registerMcpEndpoint(app: OpenAPIHono) {
  app.all("/mcp", async (c) => {
    const token = extractMcpToken(c.req.raw.headers);

    if (!token || !isSessionActive(token)) {
      return c.json(
        {
          error:
            "Missing, expired, or revoked resumeMcpToken. Pass Authorization: Bearer <token>.",
        },
        401,
      );
    }

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    const server = createResumeMcpServer(token);
    await server.connect(transport);
    try {
      return await transport.handleRequest(c.req.raw);
    } finally {
      await server.close();
    }
  });
}
