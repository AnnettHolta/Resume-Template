import { z } from "@hono/zod-openapi";

export const CreateSessionResponseSchema = z.object({
  token: z.string(),
});

