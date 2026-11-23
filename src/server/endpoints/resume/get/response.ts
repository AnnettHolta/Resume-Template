import { z } from "@hono/zod-openapi";
import { ResumeDataSchema } from "@/lib/resumeSchema";

export const GetResumeResponseSchema = ResumeDataSchema;

export const UnauthorizedResponseSchema = z.object({
  error: z.string(),
});
