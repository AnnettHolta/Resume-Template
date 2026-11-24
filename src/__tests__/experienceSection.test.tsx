import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExperienceSection } from "@/components/ExperienceSection/ExperienceSection";
import type { ExperienceItem } from "@/types/resume";

const sampleItems: ExperienceItem[] = [
  {
    id: "exp-1",
    title: "Senior Engineer",
    company: "Acme Corp",
    companyImageUrl: "",
    employmentType: "Full-time",
    location: "Remote",
    startDate: "Jan 2023",
    endDate: "Present",
    bullets: ["Led core platform work."],
  },
  {
    id: "exp-2",
    title: "Software Engineer",
    company: "Beta Labs",
    companyImageUrl: "",
    employmentType: "Full-time",
    location: "NYC",
    startDate: "Jan 2021",
    endDate: "Dec 2022",
    bullets: ["Built frontend features."],
  },
];

describe("ExperienceSection", () => {
  it("supports drag-and-drop reordering only via the drag handle when multiple items exist", () => {
    const onChange = vi.fn();
    render(<ExperienceSection items={sampleItems} onChange={onChange} />);

    const cards = screen.getAllByRole("article");
    const handles = screen.getAllByRole("img", {
      name: "Drag to reorder experience",
    });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute("draggable", "false");

    const dataTransfer = {
      effectAllowed: "move",
      dropEffect: "move",
      setData: vi.fn(),
    };

    fireEvent.pointerDown(handles[0]);
    expect(cards[0]).toHaveAttribute("draggable", "true");

    fireEvent.dragStart(cards[0], { dataTransfer });
    fireEvent.dragOver(cards[1], { dataTransfer });
    fireEvent.drop(cards[1], { dataTransfer });

    expect(onChange).toHaveBeenCalledWith([sampleItems[1], sampleItems[0]]);
  });

  it("disables dragging when canEdit is false or only one item exists", () => {
    const { rerender } = render(
      <ExperienceSection
        items={sampleItems}
        onChange={vi.fn()}
        canEdit={false}
      />,
    );
    expect(
      screen.queryByRole("img", { name: "Drag to reorder experience" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")[0]).toHaveAttribute(
      "draggable",
      "false",
    );

    rerender(<ExperienceSection items={[sampleItems[0]]} onChange={vi.fn()} />);
    expect(screen.getByRole("article")).toHaveAttribute("draggable", "false");
  });

  it("keeps draggable disabled when interacting with inputs or card body", () => {
    render(<ExperienceSection items={sampleItems} onChange={vi.fn()} />);

    const firstCard = screen.getAllByRole("article")[0];
    const titleInput = screen.getAllByRole("textbox", {
      name: "Role or title",
    })[0];
    const handle = screen.getAllByRole("img", {
      name: "Drag to reorder experience",
    })[0];

    fireEvent.pointerDown(titleInput);
    expect(firstCard).toHaveAttribute("draggable", "false");

    fireEvent.pointerDown(firstCard);
    expect(firstCard).toHaveAttribute("draggable", "false");

    fireEvent.pointerDown(handle);
    expect(firstCard).toHaveAttribute("draggable", "true");

    fireEvent.pointerUp(window);
    expect(firstCard).toHaveAttribute("draggable", "false");
  });
});
