import { AI_SKILLS } from "./skills/ai";
import { BACKEND_SKILLS } from "./skills/backend";
import { COLLABORATION_SKILLS } from "./skills/collaboration";
import { DATABASE_SKILLS } from "./skills/databases";
import { DEVOPS_SKILLS } from "./skills/devops";
import { FRONTEND_SKILLS } from "./skills/frontend";
import { MOBILE_SKILLS } from "./skills/mobile";
import { TESTING_SKILLS } from "./skills/testing";
import type { SkillCatalogItem } from "./skills/types";

export type { SkillCatalogItem };

export const SKILLS_CATALOG: SkillCatalogItem[] = [
  ...FRONTEND_SKILLS,
  ...MOBILE_SKILLS,
  ...BACKEND_SKILLS,
  ...DATABASE_SKILLS,
  ...DEVOPS_SKILLS,
  ...TESTING_SKILLS,
  ...AI_SKILLS,
  ...COLLABORATION_SKILLS,
];

const CATALOG_MAP = new Map<string, SkillCatalogItem>(
  SKILLS_CATALOG.map((item) => [item.name.toLowerCase(), item])
);

export function findSkillCatalogItem(name: string): SkillCatalogItem | undefined {
  return CATALOG_MAP.get(name.trim().toLowerCase());
}
