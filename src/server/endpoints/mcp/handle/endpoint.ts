import type { OpenAPIHono } from "@hono/zod-openapi";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createResumeMcpServer } from "@/server/mcp/createResumeMcpServer";
import { extractMcpToken } from "@/server/storage/tokenUtils";

export function registerMcpEndpoint(app: OpenAPIHono) {
  app.all("/mcp", async (c) => {
    const queryToken = c.req.query("token");
    const token = extractMcpToken(c.req.raw.headers, queryToken);

    if (!token) {
      return c.json(
        {
          error:
            "Missing or invalid resumeMcpToken. Pass Authorization: Bearer <token> or ?token=<token>.",
        },
        401
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

