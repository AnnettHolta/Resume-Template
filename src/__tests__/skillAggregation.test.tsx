import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExperienceSkills } from "@/components/ExperienceSection/ExperienceSkills";
import { ModalController } from "@/components/Modal/ModalController";
import { SkillsSection } from "@/components/SkillsSection/SkillsSection";
import { mergeExperienceAndCustomSkills } from "@/lib/skillUtils";

describe("skillUtils", () => {
  it("deduplicates and sorts work skills by category first, then custom skills by category", () => {
    const { allSkills, experienceSkillSet } = mergeExperienceAndCustomSkills(
      ["React", "Zustand", "Node.js", "react", "CustomWorkSkill"],
      ["MyCustom", "Prisma", "node.js", "Docker"],
    );

    expect(allSkills).toEqual([
      "Node.js",
      "React",
      "Zustand",
      "CustomWorkSkill",
      "Prisma",
      "Docker",
      "MyCustom",
    ]);
    expect(experienceSkillSet.has("react")).toBe(true);
    expect(experienceSkillSet.has("prisma")).toBe(false);
  });
});

describe("ExperienceSkills", () => {
  it("prevents duplicate skills within a single role and allows adding/removing", () => {
    const onChangeSkills = vi.fn();
    render(
      <ExperienceSkills
        itemId="exp-1"
        skills={["React", "react"]}
        onChangeSkills={onChangeSkills}
      />,
      { wrapper: ModalController },
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    const input = screen.getByRole("combobox", { name: "New skill" });
    fireEvent.change(input, { target: { value: "React" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onChangeSkills).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "Node.js" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onChangeSkills).toHaveBeenCalledWith(["React", "Node.js"]);
    onChangeSkills.mockClear();

    fireEvent.click(
      screen.getByRole("button", { name: "Remove React from role" }),
    );
    expect(onChangeSkills).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Remove Skill?" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onChangeSkills).toHaveBeenCalledWith([]);
  });

  it("supports drag-and-drop reordering of skills within a role", () => {
    const onChangeSkills = vi.fn();
    render(
      <ExperienceSkills
        itemId="exp-1"
        skills={["React", "Node.js"]}
        onChangeSkills={onChangeSkills}
      />,
    );

    const pills = screen.getAllByRole("listitem");
    const dataTransfer = {
      effectAllowed: "move",
      dropEffect: "move",
      setData: vi.fn(),
    };

    fireEvent.dragStart(pills[0], { dataTransfer });
    fireEvent.dragOver(pills[1], { dataTransfer });
    fireEvent.drop(pills[1], { dataTransfer });

    expect(onChangeSkills).toHaveBeenCalledWith(["Node.js", "React"]);
  });
});

describe("SkillsSection with experienceSkills", () => {
  it("renders unique combined skills sorted by category and only allows removing custom skills", () => {
    render(
      <SkillsSection
        skills={["Prisma", "MyCustom", "React"]}
        experienceSkills={["React", "Node.js", "Zustand"]}
        onChange={vi.fn()}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items.map((el) => el.getAttribute("data-skill"))).toEqual([
      "node.js",
      "react",
      "zustand",
      "prisma",
      "mycustom",
    ]);

    expect(
      screen.queryByRole("button", { name: "remove node.js" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "remove react" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "remove prisma" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "remove mycustom" }),
    ).toBeInTheDocument();
  });
});
