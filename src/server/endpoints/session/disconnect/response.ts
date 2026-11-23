import { z } from "@hono/zod-openapi";

export const DisconnectSessionResponseSchema = z.object({
  disconnected: z.boolean(),
});

