import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "base-path": { type: "string", default: process.env.PAGES_BASE_PATH ?? "" },
  },
});
const require = createRequire(import.meta.url);
const result = spawnSync(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RESUME_STATIC_EXPORT: "1",
      PAGES_BASE_PATH: values["base-path"],
    },
  },
);

if (result.error) throw result.error;
if (result.status === 0) writeFileSync("out/.nojekyll", "");
process.exitCode = result.status ?? 1;
