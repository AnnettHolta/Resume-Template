import { describe, expect, it } from "vitest";
import { applyResumeEdit } from "@/lib/resumeCommands";
import {
  MAX_AGENT_URL_LENGTH,
  sanitizeResumeForAgent,
} from "@/lib/resumeSanitize";
import type { ResumeData } from "@/types/resume";

const baseResume: ResumeData = {
  profile: {
    name: "Jane Doe",
    headline: "Engineer",
    summary: "Summary",
    contact: {
      email: "jane@example.com",
      phone: "123",
      location: "Remote",
      website: `https://example.com/${"a".repeat(300)}`,
    },
  },
  experience: [
    {
      id: "exp-1",
      title: "Senior Engineer",
      company: "Acme",
      companyImageUrl: "data:image/webp;base64,UklGRh4AAABXRUJQVlA4",
      employmentType: "Full-time",
      location: "Remote",
      startDate: "Jan 2023",
      endDate: "Present",
      bullets: ["Built things."],
    },
    {
      id: "exp-2",
      title: "Engineer",
      company: "Beta",
      companyImageUrl: `https://cdn.example.com/${"x".repeat(300)}.png`,
      employmentType: "Full-time",
      location: "Remote",
      startDate: "Jan 2021",
      endDate: "Dec 2022",
      bullets: ["Maintained things."],
    },
  ],
  education: [],
  skills: [],
};

describe("sanitizeResumeForAgent", () => {
  it("strips data: base64 URLs and caps URLs at 256 characters", () => {
    const sanitized = sanitizeResumeForAgent(baseResume);

    expect(sanitized.experience[0].companyImageUrl).toBe("");
    expect(sanitized.experience[1].companyImageUrl.length).toBe(
      MAX_AGENT_URL_LENGTH,
    );
    expect(sanitized.profile.contact.website?.length).toBe(
      MAX_AGENT_URL_LENGTH,
    );
  });

  it("preserves uploaded base64 companyImageUrl when agent sends empty string on upsert_experience", () => {
    const result = applyResumeEdit(baseResume, baseResume, {
      type: "upsert_experience",
      revision: "11111111-1111-4111-8111-111111111111",
      item: {
        ...baseResume.experience[0],
        title: "Staff Engineer",
        companyImageUrl: "",
      },
    });

    expect("next" in result).toBe(true);
    if ("next" in result) {
      expect(result.next.experience[0].title).toBe("Staff Engineer");
      expect(result.next.experience[0].companyImageUrl).toBe(
        baseResume.experience[0].companyImageUrl,
      );
    }
  });
});
