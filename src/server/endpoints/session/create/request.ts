import { z } from "@hono/zod-openapi";
import { ResumeDataSchema } from "@/lib/resumeSchema";

export const CreateSessionRequestSchema = z.object({
  regenerate: z.boolean().optional().default(false),
  revalidate: z.boolean().optional().default(false),
  initialResume: ResumeDataSchema.optional(),
});
