import { z } from "@hono/zod-openapi";

export const CreateSessionRequestSchema = z.object({
  regenerate: z.boolean().optional().default(false),
});
