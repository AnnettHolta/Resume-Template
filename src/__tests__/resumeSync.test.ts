import { afterEach, describe, expect, it, vi } from "vitest";
import initialResume from "@/data/resume.json";
import { createResumeSync } from "@/lib/resumeSync";
import type { ResumeData } from "@/types/resume";

function setup() {
  vi.useFakeTimers();
  let revision = 1;
  let server: ResumeData = initialResume;
  let editor: ResumeData = initialResume;
  const showConflict = vi.fn();
  const fetchResume = vi.fn(async (_path: string, init: RequestInit) => {
    if (init.method === "PUT") {
      if (new Headers(init.headers).get("If-Match") !== String(revision)) {
        return new Response(null, { status: 412 });
      }
      server = JSON.parse(String(init.body));
      revision++;
    }
    return Response.json(server, { headers: { ETag: String(revision) } });
  });
  vi.stubGlobal("fetch", fetchResume);

  const sync = createResumeSync({
    token: "test-token",
    readLocal: () => editor,
    isEditing: () => false,
    applyRemote: (data) => {
      editor = data;
    },
    showConflict,
    showStatus: vi.fn(),
    expire: vi.fn(),
  });
  const changeHeadline = (data: ResumeData, headline: string) => ({
    ...data,
    profile: { ...data.profile, headline },
  });
  return {
    sync,
    fetchResume,
    showConflict,
    editorHeadline: () => editor.profile.headline,
    serverHeadline: () => server.profile.headline,
    editLocally: (headline: string) => {
      editor = changeHeadline(editor, headline);
      sync.scheduleSave();
    },
    editRemotely: (headline: string) => {
      server = changeHeadline(server, headline);
      revision++;
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("MCP resume sync", () => {
  it("keeps a pending browser edit when a remote edit wins before the write", async () => {
    const {
      sync,
      editLocally,
      editRemotely,
      editorHeadline,
      serverHeadline,
      showConflict,
    } = setup();
    sync.refresh();
    await vi.advanceTimersByTimeAsync(0);
    editLocally("Editor draft");
    editRemotely("Agent edit");
    await vi.advanceTimersByTimeAsync(1000);

    expect(editorHeadline()).toBe("Editor draft");
    expect(serverHeadline()).toBe("Agent edit");
    expect(showConflict).toHaveBeenLastCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({ headline: "Agent edit" }),
      }),
    );

    sync.keepLocal();
    await vi.advanceTimersByTimeAsync(0);
    expect(serverHeadline()).toBe("Editor draft");
    expect(showConflict).toHaveBeenLastCalledWith(null);
  });

  it("applies a remote edit after a completed local write when the editor is clean", async () => {
    const { sync, editLocally, editRemotely, editorHeadline, serverHeadline } =
      setup();
    sync.refresh();
    await vi.advanceTimersByTimeAsync(0);
    editLocally("Browser edit");
    await vi.advanceTimersByTimeAsync(1000);
    expect(serverHeadline()).toBe("Browser edit");

    editRemotely("Later agent edit");
    sync.refresh();
    await vi.advanceTimersByTimeAsync(0);
    expect(editorHeadline()).toBe("Later agent edit");
  });

  it("preserves both versions on reconnect until the user selects the session version", async () => {
    const {
      sync,
      editLocally,
      editRemotely,
      editorHeadline,
      serverHeadline,
      fetchResume,
    } = setup();
    sync.refresh();
    await vi.advanceTimersByTimeAsync(0);
    editLocally("Offline draft");
    editRemotely("Missed agent edit");
    sync.refresh();
    await vi.advanceTimersByTimeAsync(1000);
    expect(editorHeadline()).toBe("Offline draft");
    expect(serverHeadline()).toBe("Missed agent edit");
    expect(
      fetchResume.mock.calls.every(([, init]) => init.method !== "PUT"),
    ).toBe(true);

    sync.useRemote();
    expect(editorHeadline()).toBe("Missed agent edit");
  });

  it("can keep the editor draft when first opening an already divergent session", async () => {
    const { sync, editRemotely, serverHeadline } = setup();
    editRemotely("Remote edit before startup");
    sync.refresh();
    await vi.advanceTimersByTimeAsync(0);
    sync.keepLocal();
    await vi.advanceTimersByTimeAsync(0);
    expect(serverHeadline()).toBe(initialResume.profile.headline);
  });
});
