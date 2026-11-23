import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import initialResume from "@/data/resume.json";
import { McpModal } from "@/components/McpModal/McpModal";
import { PrintModal } from "@/components/PrintModal/PrintModal";
import { SkillsSection } from "@/components/SkillsSection/SkillsSection";
import type { ResumeData } from "@/types/resume";

describe("SkillsSection", () => {
  it("auto-corrects css to CSS3 and stores lowercase aria-label", () => {
    const onChange = vi.fn();
    render(<SkillsSection skills={["React"]} onChange={onChange} />);

    const input = screen.getByRole("combobox", { name: "New skill" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "css" } });

    expect(screen.getByText("CSS3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onChange).toHaveBeenCalledWith(["React", "CSS3"]);
  });

  it("renders lowercase aria-label and data-skill on skill pills and supports drag reorder", () => {
    const onChange = vi.fn();
    render(<SkillsSection skills={["React", "Docker"]} onChange={onChange} />);

    const reactPill = screen.getByLabelText("react");
    const dockerPill = screen.getByLabelText("docker");
    expect(reactPill).toHaveAttribute("data-skill", "react");
    expect(dockerPill).toHaveAttribute("data-skill", "docker");

    const dataTransfer = {
      effectAllowed: "move",
      dropEffect: "move",
      setData: vi.fn(),
    };
    fireEvent.dragStart(reactPill, { dataTransfer });
    fireEvent.dragOver(dockerPill, { dataTransfer });
    fireEvent.drop(dockerPill, { dataTransfer });

    expect(onChange).toHaveBeenCalledWith(["Docker", "React"]);
  });
});

describe("PrintModal", () => {
  it("lets user choose between Printer-Ready and Editor-Like View", () => {
    const onConfirmPrint = vi.fn();
    render(
      <PrintModal
        isOpen
        initialMode="printer"
        onConfirmPrint={onConfirmPrint}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /editor-like view/i }));
    fireEvent.click(screen.getByRole("button", { name: /print \/ save pdf/i }));
    expect(onConfirmPrint).toHaveBeenCalledWith("visual");
  });
});

describe("McpModal", () => {
  it("keeps token hidden on request until Show is clicked, and confirms before regenerate", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "11111111-2222-3333-4444-555555555555",
        active: true,
      }),
    } as Response);

    const onTokenChange = vi.fn();
    const { rerender } = render(
      <McpModal
        isOpen
        token={null}
        isSessionExpired={false}
        currentResume={initialResume as ResumeData}
        onTokenChange={onTokenChange}
        onSessionRevalidated={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /request token/i }));
    await waitFor(() =>
      expect(onTokenChange).toHaveBeenCalledWith(
        "11111111-2222-3333-4444-555555555555",
      ),
    );

    rerender(
      <McpModal
        isOpen
        token="11111111-2222-3333-4444-555555555555"
        isSessionExpired={false}
        currentResume={initialResume as ResumeData}
        onTokenChange={onTokenChange}
        onSessionRevalidated={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.queryByText("11111111-2222-3333-4444-555555555555"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show token/i }));
    expect(
      screen.getByText("11111111-2222-3333-4444-555555555555"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /regenerate token/i }));
    expect(
      screen.getByText(/your current token will be revoked immediately/i),
    ).toBeInTheDocument();

    fetchMock.mockRestore();
  });
});
