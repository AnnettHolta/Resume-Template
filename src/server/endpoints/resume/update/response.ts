import { z } from "@hono/zod-openapi";

export const UpdateResumeResponseSchema = z.object({
  saved: z.boolean(),
});

export const UpdateResumeErrorSchema = z.object({
  error: z.string(),
});
