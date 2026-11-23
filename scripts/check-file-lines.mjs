import { promises as fs } from "node:fs";
import path from "node:path";

const SRC_DIR = path.join(process.cwd(), "src");
const TARGET_EXTENSIONS = new Set([".ts", ".tsx", ".scss"]);
const WARN_THRESHOLD = 250;
const ERROR_THRESHOLD = 450;

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function countCodeLines(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length;
}

async function main() {
  const files = await collectFiles(SRC_DIR);
  const warnings = [];
  const errors = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const lines = countCodeLines(content);
    const rel = path.relative(process.cwd(), file);

    if (lines > ERROR_THRESHOLD) {
      errors.push({ rel, lines });
    } else if (lines >= WARN_THRESHOLD) {
      warnings.push({ rel, lines });
    }
  }

  for (const w of warnings) {
    console.warn(
      `[WARN]  ${w.rel}: ${w.lines} code lines (>= ${WARN_THRESHOLD}, <= ${ERROR_THRESHOLD})`
    );
  }

  for (const e of errors) {
    console.error(
      `[ERROR] ${e.rel}: ${e.lines} code lines (> ${ERROR_THRESHOLD})`
    );
  }

  if (warnings.length === 0 && errors.length === 0) {
    console.log(
      `Line check passed: all ${files.length} files are under ${WARN_THRESHOLD} code lines.`
    );
  }

  if (errors.length > 0) {
    process.exit(1);
  }
}

await main();

