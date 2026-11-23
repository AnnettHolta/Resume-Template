import { z } from "@hono/zod-openapi";

export const GetResumeQuerySchema = z.object({
  token: z.string().optional(),
});

