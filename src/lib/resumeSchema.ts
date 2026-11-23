import { z } from "zod";

export const ContactInfoSchema = z.object({
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

export const ResumeProfileSchema = z.object({
  name: z.string(),
  headline: z.string(),
  summary: z.string(),
  contact: ContactInfoSchema,
});

export const ExperienceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  companyImageUrl: z.string(),
  employmentType: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()),
});

export const EducationItemSchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export const ResumeDataSchema = z.object({
  profile: ResumeProfileSchema,
  experience: z.array(ExperienceItemSchema),
  education: z.array(EducationItemSchema),
  skills: z.array(z.string()),
});
