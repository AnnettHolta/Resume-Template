// @vitest-environment node
import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import initialResume from "@/data/resume.json";
import { createEditorCommands } from "@/lib/editorCommands";
import {
  ResumeCommandEventSchema,
  ResumeCommandResultSchema,
} from "@/lib/resumeCommands";
import { apiApp } from "@/server/app";
import type { ResumeData } from "@/types/resume";

async function createSession(init?: RequestInit) {
  const response = await apiApp.request("/api/session", {
    method: "POST",
    ...init,
  });
  expect(response.status).toBe(200);
  const { token } = (await response.json()) as { token: string };
  return {
    token,
    auth: { Authorization: `Bearer ${token}` },
    browser: {
      Cookie: response.headers
        .getSetCookie()
        .map((line) => line.split(";")[0])
        .join("; "),
    },
  };
}

describe("editor session and MCP API", () => {
  it("exposes OpenAPI and Scalar docs for editor commands", async () => {
    const spec = (await (await apiApp.request("/api/openapi.json")).json()) as {
      paths: object;
    };
    expect(spec.paths).toHaveProperty("/api/session");
    expect(spec.paths).toHaveProperty("/api/resume");
    expect(spec.paths).toHaveProperty("/api/resume/commands/{id}/result");
    expect((await apiApp.request("/api/docs")).status).toBe(200);
  });

  it("allows only the browser owner to connect or rotate and revokes the old token", async () => {
    expect((await apiApp.request("/api/resume")).status).toBe(401);
    const session = await createSession();
    expect(
      (await apiApp.request("/api/resume", { headers: session.auth })).status,
    ).toBe(503);
    expect(
      (await apiApp.request("/api/resume/events", { headers: session.auth }))
        .status,
    ).toBe(401);
    expect(
      (
        await apiApp.request("/api/session", {
          method: "POST",
          headers: session.auth,
        })
      ).status,
    ).toBe(403);

    const replacement = await createSession({
      headers: { ...session.browser, "Content-Type": "application/json" },
      body: JSON.stringify({ regenerate: true }),
    });
    expect(replacement.token).not.toBe(session.token);
    expect(
      (await apiApp.request("/api/resume", { headers: session.auth })).status,
    ).toBe(401);

    await apiApp.request("/api/session", {
      method: "DELETE",
      headers: replacement.browser,
    });
    expect(
      (await apiApp.request("/api/resume", { headers: replacement.auth }))
        .status,
    ).toBe(401);
  });

  it("relays MCP reads and edits through the editor and rejects commands after disconnect", async () => {
    const session = await createSession();
    const stream = await apiApp.request("/api/resume/events", {
      headers: session.browser,
    });
    expect(stream.status).toBe(200);
    const reader = stream.body!.getReader();
    const decoder = new TextDecoder();
    expect(decoder.decode((await reader.read()).value)).toContain(
      "event: connected",
    );

    let resume: ResumeData = initialResume;
    const editor = createEditorCommands({
      readResume: () => resume,
      commitResume: (data) => {
        resume = data;
      },
      settleDraft: () => {},
    });
    const client = new Client({ name: "resume-test", version: "1" });
    const transport = new StreamableHTTPClientTransport(
      new URL("http://localhost/api/mcp"),
      {
        requestInit: { headers: session.auth },
        fetch: async (input, init) => apiApp.request(input, init),
      },
    );

    try {
      await client.connect(transport);
      const read = client.callTool({ name: "get_resume", arguments: {} });
      const readEvent = await reader.read();
      const body = (chunk: Uint8Array | undefined) =>
        ResumeCommandEventSchema.parse(
          JSON.parse(decoder.decode(chunk).split("data: ")[1]),
        );
      const request = body(readEvent.value);
      const answer = (id: string, result: unknown, headers: HeadersInit) =>
        apiApp.request(`/api/resume/commands/${id}/result`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });
      const snapshot = editor(request);
      expect((await answer(request.id, snapshot, session.auth)).status).toBe(
        401,
      );
      expect((await answer(request.id, snapshot, session.browser)).status).toBe(
        204,
      );
      expect((await answer(request.id, snapshot, session.browser)).status).toBe(
        404,
      );
      expect((await read).isError).toBeFalsy();
      if (snapshot.status !== "read") throw new Error("Missing revision");

      const edit = client.callTool({
        name: "update_profile",
        arguments: {
          revision: snapshot.revision,
          headline: "Agent headline",
        },
      });
      const editRequest = body((await reader.read()).value);
      expect(resume.profile.headline).toBe(initialResume.profile.headline);
      const result = ResumeCommandResultSchema.parse(editor(editRequest));
      expect(
        (await answer(editRequest.id, result, session.browser)).status,
      ).toBe(204);
      expect((await edit).isError).toBeFalsy();
      expect(resume.profile.headline).toBe("Agent headline");

      await reader.cancel();
      const offline = await client.callTool({
        name: "update_profile",
        arguments: {
          revision: snapshot.revision,
          headline: "Offline edit",
        },
      });
      expect(offline.isError).toBe(true);
      expect(resume.profile.headline).toBe("Agent headline");
    } finally {
      await reader.cancel();
      await client.close();
      await apiApp.request("/api/session", {
        method: "DELETE",
        headers: session.browser,
      });
    }
  });
});
