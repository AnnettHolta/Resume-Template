import { z } from "@hono/zod-openapi";

export const McpErrorResponseSchema = z.object({
  error: z.string(),
});

