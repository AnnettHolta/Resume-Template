export interface SkillCatalogItem {
  name: string;
  category: string;
  iconUrl?: string;
  fallbackKind?: "code" | "ai" | "comms";
}

const DEVICON_BASE =
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

export const devicon = (slug: string, variant = "original"): string =>
  `${DEVICON_BASE}/${slug}/${slug}-${variant}.svg`;

