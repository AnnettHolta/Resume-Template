import { devicon, type SkillCatalogItem } from "./types";

export const TESTING_SKILLS: SkillCatalogItem[] = [
  { name: "Jest", category: "Testing", iconUrl: devicon("jest", "plain") },
  { name: "Vitest", category: "Testing", iconUrl: devicon("vitest") },
  { name: "Playwright", category: "Testing", iconUrl: devicon("playwright") },
  { name: "Cypress", category: "Testing", iconUrl: devicon("cypressio") },
  { name: "pytest", category: "Testing", iconUrl: devicon("pytest") },
];
