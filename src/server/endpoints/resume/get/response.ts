import { z } from "@hono/zod-openapi";
import { ResumeDataSchema } from "@/server/schemas/resumeSchemas";

export const GetResumeResponseSchema = ResumeDataSchema;

export const UnauthorizedResponseSchema = z.object({
  error: z.string(),
});
