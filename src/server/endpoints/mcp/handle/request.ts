import { z } from "@hono/zod-openapi";

export const McpQuerySchema = z.object({
  token: z.string().optional(),
});

