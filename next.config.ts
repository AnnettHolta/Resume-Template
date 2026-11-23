import type { NextConfig } from "next";

const isStaticExport = process.env.RESUME_STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      basePath: process.env.PAGES_BASE_PATH,
      trailingSlash: true,
      // The editor is a TSX page. The TypeScript API route requires a server.
      pageExtensions: ["tsx"],
      env: { NEXT_PUBLIC_MCP_ENABLED: "false" },
    }
  : {
      output: "standalone",
      cacheComponents: true,
      partialPrefetching: true,
      allowedDevOrigins: ["127.0.0.1", "*.*.*.*"],
      env: { NEXT_PUBLIC_MCP_ENABLED: "true" },
    };

export default nextConfig;
