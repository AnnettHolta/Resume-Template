import { findSkillCatalogItem } from "@/data/skillsCatalog";

export const SKILL_CATEGORY_ORDER = [
  "Backend",
  "Backend lib",
  "Frontend",
  "Frontend lib",
  "Language",
  "Database",
  "API",
  "Messaging",
  "Mobile",
  "Desktop",
  "Cloud",
  "DevOps",
  "CI/CD",
  "Observability",
  "Testing",
  "Tooling",
  "AI",
  "Collaboration",
  "Communication",
] as const;

const CATEGORY_RANK = new Map<string, number>(
  SKILL_CATEGORY_ORDER.map((category, index) => [category, index]),
);

export function getSkillCategoryRank(skill: string): number {
  const category = findSkillCatalogItem(skill)?.category;
  if (!category) return SKILL_CATEGORY_ORDER.length;
  return CATEGORY_RANK.get(category) ?? SKILL_CATEGORY_ORDER.length;
}

export function dedupeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of skills) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function sortSkillsByCategory(skills: string[]): string[] {
  return dedupeSkills(skills).sort(
    (a, b) => getSkillCategoryRank(a) - getSkillCategoryRank(b),
  );
}

export function mergeExperienceAndCustomSkills(
  experienceSkills: string[],
  customSkills: string[],
): {
  allSkills: string[];
  experienceSkillSet: Set<string>;
} {
  const sortedExperience = sortSkillsByCategory(experienceSkills);
  const experienceSkillSet = new Set(
    sortedExperience.map((skill) => skill.toLowerCase()),
  );
  const remainingCustom = sortSkillsByCategory(
    customSkills.filter(
      (skill) => !experienceSkillSet.has(skill.trim().toLowerCase()),
    ),
  );
  return {
    allSkills: [...sortedExperience, ...remainingCustom],
    experienceSkillSet,
  };
}
