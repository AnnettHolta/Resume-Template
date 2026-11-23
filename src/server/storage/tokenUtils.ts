import { createHash, randomBytes, randomUUID } from "node:crypto";

export const MCP_TOKEN_COOKIE = "resumeMcpToken";
export const MCP_EDITOR_COOKIE = "resumeMcpEditor";
const TOKEN_REGEX = /^[a-zA-Z0-9_-]{16,64}$/;

export function isValidMcpToken(token: unknown): token is string {
  return typeof token === "string" && TOKEN_REGEX.test(token);
}

export function generateMcpToken(): string {
  try {
    return randomUUID();
  } catch {
    return randomBytes(16).toString("hex");
  }
}

export function hashMcpToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function parseCookieValue(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function extractEditorCredential(headers: Headers): string | null {
  const owner = parseCookieValue(headers.get("cookie"), MCP_EDITOR_COOKIE);
  return isValidMcpToken(owner) ? owner : null;
}

export function extractMcpToken(headers: Headers): string | null {
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (isValidMcpToken(bearer)) return bearer;
  }

  const cookieToken = parseCookieValue(headers.get("cookie"), MCP_TOKEN_COOKIE);
  if (isValidMcpToken(cookieToken)) {
    return cookieToken;
  }

  return null;
}

export function isHttpsRequest(req: Request): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0].trim().toLowerCase() === "https";
  }
  return req.url.startsWith("https://");
}
