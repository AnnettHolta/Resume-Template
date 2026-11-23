// @vitest-environment node
import { describe, expect, it } from "vitest";
import initialResume from "@/data/resume.json";
import { apiApp } from "@/server/app";

describe("Hono REPR API & MCP session security", () => {
  it("exposes OpenAPI spec and Scalar API docs", async () => {
    const specRes = await apiApp.request("/api/openapi.json");
    expect(specRes.status).toBe(200);
    const spec = (await specRes.json()) as { openapi: string; paths: object };
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.paths).toHaveProperty("/api/session");
    expect(spec.paths).toHaveProperty("/api/resume");

    const docsRes = await apiApp.request("/api/docs");
    expect(docsRes.status).toBe(200);
  });

  it("issues, revalidates, regenerates, and revokes tokens properly", async () => {
    // Unauthenticated resume read fails
    const unauth = await apiApp.request("/api/resume");
    expect(unauth.status).toBe(401);

    // Request token
    const createRes = await apiApp.request("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialResume }),
    });
    expect(createRes.status).toBe(200);
    const { token: token1 } = (await createRes.json()) as { token: string };
    expect(token1).toBeTruthy();

    // Token is never stored inside resume JSON
    const getRes = await apiApp.request("/api/resume", {
      headers: { Authorization: `Bearer ${token1}` },
    });
    expect(getRes.status).toBe(200);
    const resumeText = await getRes.text();
    expect(resumeText).not.toContain(token1);

    // Query ?token= must NOT be accepted on /api/mcp
    const queryMcp = await apiApp.request(`/api/mcp?token=${token1}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(queryMcp.status).toBe(401);

    // Regenerate revokes token1 immediately
    const regenRes = await apiApp.request("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ regenerate: true }),
    });
    expect(regenRes.status).toBe(200);
    const { token: token2 } = (await regenRes.json()) as { token: string };
    expect(token2).not.toBe(token1);

    const oldTokenCheck = await apiApp.request("/api/resume", {
      headers: { Authorization: `Bearer ${token1}` },
    });
    expect(oldTokenCheck.status).toBe(401);

    // Disconnect revokes token2
    const delRes = await apiApp.request("/api/session", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token2}` },
    });
    expect(delRes.status).toBe(200);

    const afterDisconnect = await apiApp.request("/api/resume", {
      headers: { Authorization: `Bearer ${token2}` },
    });
    expect(afterDisconnect.status).toBe(401);
  });
});
