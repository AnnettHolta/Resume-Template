import { AI_SKILLS } from "./skills/ai";
import { BACKEND_SKILLS } from "./skills/backend";
import { BACKEND_LIB_SKILLS } from "./skills/backend-libs";
import { COLLABORATION_SKILLS } from "./skills/collaboration";
import { DATABASE_SKILLS } from "./skills/databases";
import { DEVOPS_SKILLS } from "./skills/devops";
import { FRONTEND_SKILLS } from "./skills/frontend";
import { FRONTEND_LIB_SKILLS } from "./skills/frontend-libs";
import { MOBILE_SKILLS } from "./skills/mobile";
import { TESTING_SKILLS } from "./skills/testing";
import type { SkillCatalogItem } from "./skills/types";

export type { SkillCatalogItem };

export const SKILLS_CATALOG: SkillCatalogItem[] = [
  ...FRONTEND_SKILLS,
  ...FRONTEND_LIB_SKILLS,
  ...MOBILE_SKILLS,
  ...BACKEND_SKILLS,
  ...BACKEND_LIB_SKILLS,
  ...DATABASE_SKILLS,
  ...DEVOPS_SKILLS,
  ...TESTING_SKILLS,
  ...AI_SKILLS,
  ...COLLABORATION_SKILLS,
];

const CATALOG_MAP = new Map<string, SkillCatalogItem>();
for (const item of SKILLS_CATALOG) {
  CATALOG_MAP.set(item.name.toLowerCase(), item);
  for (const alias of item.aliases ?? []) {
    CATALOG_MAP.set(alias.toLowerCase(), item);
  }
}

export function findSkillCatalogItem(name: string): SkillCatalogItem | undefined {
  return CATALOG_MAP.get(name.trim().toLowerCase());
}
