import { devicon, type SkillCatalogItem } from "./types";

export const AI_SKILLS: SkillCatalogItem[] = [
  {
    name: "Anthropic",
    category: "AI",
    iconUrl: devicon("claude"),
    fallbackKind: "ai",
  },
  {
    name: "Claude Code",
    category: "AI",
    iconUrl: devicon("claudecode"),
    fallbackKind: "ai",
  },
  {
    name: "Google Antigravity",
    category: "AI",
    iconUrl: devicon("antigravity"),
    fallbackKind: "ai",
  },
  {
    name: "Gemini",
    category: "AI",
    iconUrl: devicon("google"),
    fallbackKind: "ai",
  },
  {
    name: "OpenAI Codex",
    category: "AI",
    iconUrl: devicon("codex"),
    fallbackKind: "ai",
  },
  { name: "ChatGPT", category: "AI", fallbackKind: "ai" },
  {
    name: "Cursor",
    category: "AI",
    iconUrl: devicon("cursor"),
    fallbackKind: "ai",
  },
  {
    name: "GitHub Copilot",
    category: "AI",
    iconUrl: devicon("githubcopilot"),
    fallbackKind: "ai",
  },
];
