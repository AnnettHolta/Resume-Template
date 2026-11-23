import { describe, expect, it } from "vitest";
import initialResume from "@/data/resume.json";
import { findSkillCatalogItem, SKILLS_CATALOG } from "@/data/skillsCatalog";
import {
  displayMonthToInputValue,
  inputValueToDisplayMonth,
} from "@/lib/dateFormat";
import { parseResumeJson } from "@/lib/resumeStorage";
import {
  extractMcpToken,
  isHttpsRequest,
  isValidMcpToken,
} from "@/server/storage/tokenUtils";

describe("resume JSON import", () => {
  it("round-trips the starter resume in the export format", () => {
    expect(parseResumeJson(JSON.stringify(initialResume, null, 2))).toEqual(
      initialResume,
    );
  });

  it("reports the location of invalid nested data", () => {
    const invalid = structuredClone(initialResume);
    const data = {
      ...invalid,
      experience: [{ ...invalid.experience[0], bullets: [42] }],
    };
    expect(() => parseResumeJson(JSON.stringify(data))).toThrow(
      "experience.0.bullets.0",
    );
  });

  it("rejects malformed JSON and resumes that lack required fields", () => {
    expect(() => parseResumeJson("{")).toThrow("invalid JSON");
    expect(() =>
      parseResumeJson(
        JSON.stringify({ ...initialResume, profile: { name: "Name" } }),
      ),
    ).toThrow("profile.headline");
  });
});

describe("skillsCatalog", () => {
  it("resolves aliases like css, ts, k8s, postgres to canonical skills", () => {
    expect(findSkillCatalogItem("css")?.name).toBe("CSS3");
    expect(findSkillCatalogItem("ts")?.name).toBe("TypeScript");
    expect(findSkillCatalogItem("k8s")?.name).toBe("Kubernetes");
    expect(findSkillCatalogItem("postgres")?.name).toBe("PostgreSQL");
    expect(findSkillCatalogItem("  REACT  ")?.name).toBe("React");
  });

  it("includes library categories, AI tools, and communication platforms with valid icons", () => {
    expect(findSkillCatalogItem("Pinia")?.category).toBe("Frontend lib");
    expect(findSkillCatalogItem("tRPC")?.category).toBe("Backend lib");
    expect(findSkillCatalogItem("Hono")?.category).toBe("Backend");
    expect(findSkillCatalogItem("Fastify")?.category).toBe("Backend");
    expect(findSkillCatalogItem("Discord")?.iconUrl).toBe(
      "https://cdn.simpleicons.org/discord/5865F2",
    );
    expect(findSkillCatalogItem("OpenAI Codex")?.iconUrl).toContain(
      "codex/codex-original.svg",
    );
    expect(SKILLS_CATALOG.length).toBeGreaterThan(60);
  });
});

describe("dateFormat", () => {
  it("converts between display month and input[type=month] value", () => {
    expect(displayMonthToInputValue("Jan 2023")).toBe("2023-01");
    expect(displayMonthToInputValue("Dec 2022")).toBe("2022-12");
    expect(displayMonthToInputValue("2018")).toBe("2018-01");
    expect(displayMonthToInputValue("Present")).toBe("");
    expect(inputValueToDisplayMonth("2023-01")).toBe("Jan 2023");
    expect(inputValueToDisplayMonth("2020-03")).toBe("Mar 2020");
  });
});

describe("tokenUtils", () => {
  it("validates token format and rejects unsafe characters", () => {
    expect(isValidMcpToken("12345678-1234-1234-1234-1234567890ab")).toBe(true);
    expect(isValidMcpToken("../etc/passwd")).toBe(false);
    expect(isValidMcpToken("short")).toBe(false);
  });

  it("extracts bearer or cookie token only", () => {
    const valid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const h1 = new Headers({ authorization: `Bearer ${valid}` });
    expect(extractMcpToken(h1)).toBe(valid);

    const h2 = new Headers({ cookie: `foo=bar; resumeMcpToken=${valid}` });
    expect(extractMcpToken(h2)).toBe(valid);
  });

  it("detects HTTPS via x-forwarded-proto or URL", () => {
    expect(
      isHttpsRequest(new Request("http://192.168.1.5:3000/api/session")),
    ).toBe(false);
    expect(
      isHttpsRequest(new Request("https://resume.example.com/api/session")),
    ).toBe(true);
    expect(
      isHttpsRequest(
        new Request("http://internal/api/session", {
          headers: { "x-forwarded-proto": "https" },
        }),
      ),
    ).toBe(true);
  });
});
