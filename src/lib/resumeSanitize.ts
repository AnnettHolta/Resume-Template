import type { ResumeData } from "@/types/resume";

export const MAX_AGENT_URL_LENGTH = 256;

export function sanitizeUrlForAgent(url: string): string {
  const trimmed = url.trim();
  if (trimmed.toLowerCase().startsWith("data:")) {
    return "";
  }
  return url.length > MAX_AGENT_URL_LENGTH
    ? url.slice(0, MAX_AGENT_URL_LENGTH)
    : url;
}

export function sanitizeResumeForAgent(resume: ResumeData): ResumeData {
  const { contact } = resume.profile;
  return {
    ...resume,
    profile: {
      ...resume.profile,
      contact: {
        ...contact,
        ...(contact.website !== undefined
          ? { website: sanitizeUrlForAgent(contact.website) }
          : {}),
        ...(contact.linkedin !== undefined
          ? { linkedin: sanitizeUrlForAgent(contact.linkedin) }
          : {}),
        ...(contact.github !== undefined
          ? { github: sanitizeUrlForAgent(contact.github) }
          : {}),
      },
    },
    experience: resume.experience.map((item) => ({
      ...item,
      companyImageUrl: sanitizeUrlForAgent(item.companyImageUrl),
    })),
  };
}
