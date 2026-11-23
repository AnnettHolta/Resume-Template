import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import initialResume from "@/data/resume.json";
import { ResumeEditor } from "@/components/ResumeEditor/ResumeEditor";
import type { ResumeData } from "@/types/resume";

describe("ATS & Auto-Reader Parseability", () => {
  it("exposes clean semantic landmarks, heading hierarchy, <time> tags, and selectable text", () => {
    const { container } = render(
      <ResumeEditor initialData={initialResume as ResumeData} />,
    );

    // Single main landmark and header landmark
    const main = container.querySelector("main");
    const header = container.querySelector("header");
    expect(main).toBeInTheDocument();
    expect(header).toBeInTheDocument();

    // Strict heading hierarchy: h1 (Name) -> h2 (Sections) -> h3 (Education)
    const h1 = container.querySelector("h1");
    expect(h1).toHaveTextContent("John Smith");

    const h2Texts = Array.from(container.querySelectorAll("h2")).map((el) =>
      el.textContent?.trim(),
    );
    expect(h2Texts).toEqual(["About", "Experience", "Education", "Skills"]);

    // Contact info is in <address> with mailto: and tel: links
    const address = container.querySelector("address");
    expect(address).toHaveTextContent("john.smith@example.com");
    expect(address).toHaveTextContent("San Francisco, CA");
    expect(
      container.querySelector('a[href="mailto:john.smith@example.com"]'),
    ).toBeInTheDocument();

    // Experience bullet points have selectable print text (not trapped only in <textarea>)
    const printBullets = Array.from(
      container.querySelectorAll(".bulletPrintText"),
    ).map((el) => el.textContent?.trim());
    expect(printBullets.length).toBeGreaterThanOrEqual(5);
    expect(printBullets[0]).toContain("multi-tenant analytics dashboard");

    // Semantic <time> elements for date ranges
    const times = Array.from(container.querySelectorAll("time")).map((el) =>
      el.textContent?.trim(),
    );
    expect(times).toContain("Jan 2023");
    expect(times).toContain("Present");
    expect(times).toContain("2014");
    expect(times).toContain("2018");

    // Skills expose lowercase machine-readable aria-label and data-skill
    const skillItems = Array.from(
      container.querySelectorAll("li[data-skill]"),
    ).map((el) => el.getAttribute("data-skill"));
    expect(skillItems).toContain("typescript");
    expect(skillItems).toContain("react");
    expect(skillItems).toContain("docker");

    // Editing toolbar and interactive controls are marked no-print
    expect(container.querySelector("nav.no-print")).toBeInTheDocument();
    expect(container.querySelector("footer.no-print")).toBeInTheDocument();
  });

  it("marks empty sections and empty fields with no-print so ATS/PDF output stays clean", () => {
    const minimalResume: ResumeData = {
      profile: {
        name: "Alex Taylor",
        headline: "",
        summary: "",
        contact: {
          email: "alex@example.com",
          phone: "",
          location: "NYC",
        },
      },
      experience: [],
      education: [],
      skills: [],
    };

    const { container } = render(<ResumeEditor initialData={minimalResume} />);

    expect(
      container.querySelector('section[aria-labelledby="about-heading"]'),
    ).toHaveClass("no-print");
    expect(
      container.querySelector('section[aria-labelledby="experience-heading"]'),
    ).toHaveClass("no-print");
    expect(
      container.querySelector('section[aria-labelledby="education-heading"]'),
    ).toHaveClass("no-print");
    expect(
      container.querySelector('section[aria-labelledby="skills-heading"]'),
    ).toHaveClass("no-print");
  });
});
