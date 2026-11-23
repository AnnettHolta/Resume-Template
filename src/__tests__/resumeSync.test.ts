import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import initialResume from "@/data/resume.json";
import { createEditorCommands } from "@/lib/editorCommands";
import type { ResumeData } from "@/types/resume";
import type { ResumeCommand } from "@/lib/resumeCommands";

function setup(settleDraft: () => void = () => {}) {
  let resume: ResumeData = structuredClone(initialResume);
  const handle = createEditorCommands({
    readResume: () => resume,
    commitResume: (data) => {
      resume = data;
    },
    settleDraft,
  });
  const run = (command: ResumeCommand) =>
    handle({ id: randomUUID(), command, expiresAt: Infinity });
  const snapshot = () => {
    const result = run({ type: "read" });
    if (result.status !== "read") throw new Error("Expected a snapshot");
    return result;
  };
  return {
    run,
    snapshot,
    local: () => resume,
    editProfile: (headline: string) => {
      resume = { ...resume, profile: { ...resume.profile, headline } };
    },
    changeFirstBullet: () => {
      resume = {
        ...resume,
        experience: resume.experience.map((item, index) =>
          index === 0 ? { ...item, bullets: ["Local result"] } : item,
        ),
      };
    },
    addLocalSkill: () => {
      resume = { ...resume, skills: [...resume.skills, "Local skill"] };
    },
  };
}

describe("editor-owned MCP commands", () => {
  it("preserves a local bullet edit when the agent updates the headline", () => {
    const { run, local, snapshot, changeFirstBullet } = setup();
    const { revision } = snapshot();
    changeFirstBullet();
    const result = run({
      type: "update_profile",
      revision,
      patch: { headline: "Agent headline" },
    });
    expect(result.status).toBe("applied");
    expect(local().profile.headline).toBe("Agent headline");
    expect(local().experience[0].bullets).toEqual(["Local result"]);
  });

  it("settles a pending local edit before rejecting a conflicting profile patch atomically", () => {
    const editor: ReturnType<typeof setup> = setup(() => {
      editor.editProfile("Local headline");
    });
    const { revision } = editor.snapshot();
    const result = editor.run({
      type: "update_profile",
      revision,
      patch: {
        headline: "Stale agent headline",
        name: "Another name",
      },
    });
    expect(result).toEqual({
      status: "conflict",
      fields: ["profile.headline"],
    });
    expect(editor.local().profile.headline).toBe("Local headline");
    expect(editor.local().profile.name).toBe(initialResume.profile.name);
  });

  it("merges changed fields within one entry and protects it from a stale delete", () => {
    const { run, local, snapshot, changeFirstBullet } = setup();
    const { revision, resume } = snapshot();
    changeFirstBullet();
    const item = { ...resume.experience[0], title: "New title" };
    expect(run({ type: "upsert_experience", revision, item }).status).toBe(
      "applied",
    );
    expect(local().experience[0]).toMatchObject({
      title: "New title",
      bullets: ["Local result"],
    });
    expect(run({ type: "delete_experience", revision, id: item.id })).toEqual({
      status: "conflict",
      fields: [`experience.${item.id}`],
    });
  });

  it("preserves unrelated local skills and supports alias-based removal", () => {
    const { run, snapshot, local, addLocalSkill } = setup();
    const { revision } = snapshot();
    addLocalSkill();
    const added = run({
      type: "add_skills",
      revision,
      skills: ["css", "CSS3"],
    });
    if (added.status !== "applied") throw new Error("Expected skill update");
    expect(local().skills.slice(-2)).toEqual(["Local skill", "CSS3"]);
    expect(
      run({ type: "remove_skills", revision: added.revision, skills: ["css"] })
        .status,
    ).toBe("applied");
    expect(local().skills).toContain("Local skill");
    expect(local().skills).not.toContain("CSS3");
  });

  it("requires a fresh read after the editor changes or the revision window expires", () => {
    const previous = setup().snapshot().revision;
    const { run, snapshot } = setup();
    const original = snapshot().revision;
    for (let i = 0; i < 50; i++) snapshot();
    for (const revision of [previous, original]) {
      expect(
        run({ type: "update_profile", revision, patch: { name: "Ignored" } }),
      ).toEqual({ status: "stale" });
    }
  });
});
