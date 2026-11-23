import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { McpModal } from "@/components/McpModal/McpModal";
import { PrintModal } from "@/components/PrintModal/PrintModal";
import { SkillsSection } from "@/components/SkillsSection/SkillsSection";
import { MobileActions } from "@/components/Toolbar/MobileActions";

describe("More actions", () => {
  it("focuses the first action and returns focus after Escape or selection", () => {
    const onSave = vi.fn();
    render(
      <MobileActions
        isMcpConnected={false}
        onImport={vi.fn()}
        onSave={onSave}
        onOpenMcp={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: "More actions" });

    fireEvent.click(trigger);
    const importAction = screen.getByRole("button", { name: "Import JSON" });
    expect(importAction).toHaveFocus();
    fireEvent.keyDown(importAction, { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Save JSON" }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

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

  it("reorders by button and retains focus on the moved skill at the list boundary", () => {
    function EditableSkills() {
      const [skills, setSkills] = useState(["React", "Docker"]);
      return <SkillsSection skills={skills} onChange={setSkills} />;
    }
    render(<EditableSkills />);
    fireEvent.click(screen.getByRole("button", { name: "Reorder skills" }));
    const move = screen.getByRole("button", { name: "Move React later" });
    move.focus();
    fireEvent.click(move);

    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute(
      "data-skill",
      "react",
    );
    expect(move).toHaveFocus();
    expect(move).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "React moved to position 2 of 2.",
    );
  });
});

describe("PrintModal", () => {
  it("keeps its content through the exit transition and then signals dismissal", async () => {
    const onExit = vi.fn();
    function PrintWithDismissal() {
      const [open, setOpen] = useState(true);
      const dismiss = () => setOpen(false);
      return (
        <PrintModal
          isOpen={open}
          initialMode="printer"
          onConfirmPrint={dismiss}
          onClose={dismiss}
          onExit={onExit}
        />
      );
    }
    render(<PrintWithDismissal />);
    const dialog = screen.getByRole("dialog");
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    dialog.getAnimations = () => [
      { transitionProperty: "opacity", finished } as unknown as Animation,
    ];

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(dialog).toHaveAttribute("open");
    expect(onExit).not.toHaveBeenCalled();

    finish();
    await waitFor(() => expect(onExit).toHaveBeenCalledOnce());
    expect(dialog).not.toHaveAttribute("open");
    expect(screen.queryByText("Print / Export PDF")).not.toBeInTheDocument();
  });

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

    expect(screen.getByRole("radio", { name: "Printer-Ready" })).toHaveFocus();
    fireEvent.click(screen.getByRole("radio", { name: /editor-like view/i }));
    expect(
      screen.getByRole("radio", { name: "Editor-Like View" }),
    ).toBeChecked();
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
        isEditorConnected={false}
        onTokenChange={onTokenChange}
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
        isEditorConnected={false}
        onTokenChange={onTokenChange}
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

    const regenerate = screen.getByRole("button", {
      name: /regenerate token/i,
    });
    vi.spyOn(regenerate, "getClientRects").mockReturnValue([
      {},
    ] as unknown as DOMRectList);
    fireEvent.click(regenerate);
    expect(
      screen.getByText(/your current token will be revoked immediately/i),
    ).toBeInTheDocument();
    const confirmation = screen.getByRole("dialog", {
      name: /regenerate mcp token/i,
    });
    expect(
      within(confirmation).getByRole("button", { name: "Keep Current" }),
    ).toHaveFocus();
    fireEvent(confirmation, new Event("cancel", { cancelable: true }));
    await waitFor(() => expect(regenerate).toHaveFocus());
    expect(
      screen.getByRole("dialog", { name: "MCP Connection" }),
    ).toBeInTheDocument();

    fetchMock.mockRestore();
  });
});
