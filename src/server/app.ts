import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { registerMcpEndpoint } from "./endpoints/mcp/handle/endpoint";
import { registerResumeEventsEndpoint } from "./endpoints/resume/events/endpoint";
import { registerGetResumeEndpoint } from "./endpoints/resume/get/endpoint";
import { registerUpdateResumeEndpoint } from "./endpoints/resume/update/endpoint";
import { registerCreateSessionEndpoint } from "./endpoints/session/create/endpoint";
import { registerDisconnectSessionEndpoint } from "./endpoints/session/disconnect/endpoint";

export const apiApp = new OpenAPIHono().basePath("/api");

registerCreateSessionEndpoint(apiApp);
registerDisconnectSessionEndpoint(apiApp);
registerGetResumeEndpoint(apiApp);
registerUpdateResumeEndpoint(apiApp);
registerResumeEventsEndpoint(apiApp);
registerMcpEndpoint(apiApp);

apiApp.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Resume Template API",
    version: "1.0.0",
    description:
      "REPR API for resume session management, 1s two-way sync, SSE live updates, and per-token MCP access.",
  },
});

apiApp.get(
  "/docs",
  Scalar({
    url: "/api/openapi.json",
    pageTitle: "Resume Template API Reference",
  })
);

