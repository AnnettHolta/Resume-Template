import { devicon, type SkillCatalogItem } from "./types";

export const FRONTEND_SKILLS: SkillCatalogItem[] = [
  { name: "React", category: "Frontend", iconUrl: devicon("react"), aliases: ["reactjs"] },
  { name: "Next.js", category: "Frontend", iconUrl: devicon("nextjs"), aliases: ["nextjs", "next"] },
  { name: "TypeScript", category: "Language", iconUrl: devicon("typescript"), aliases: ["ts"] },
  { name: "JavaScript", category: "Language", iconUrl: devicon("javascript"), aliases: ["js"] },
  { name: "Vue.js", category: "Frontend", iconUrl: devicon("vuejs"), aliases: ["vue", "vuejs"] },
  { name: "Nuxt.js", category: "Frontend", iconUrl: devicon("nuxtjs"), aliases: ["nuxt", "nuxtjs"] },
  { name: "Angular", category: "Frontend", iconUrl: devicon("angular") },
  { name: "Svelte", category: "Frontend", iconUrl: devicon("svelte") },
  { name: "Redux", category: "Frontend", iconUrl: devicon("redux") },
  { name: "Tailwind CSS", category: "Frontend", iconUrl: devicon("tailwindcss"), aliases: ["tailwind"] },
  { name: "SCSS", category: "Frontend", iconUrl: devicon("sass"), aliases: ["sass"] },
  { name: "HTML5", category: "Frontend", iconUrl: devicon("html5"), aliases: ["html"] },
  { name: "CSS3", category: "Frontend", iconUrl: devicon("css3"), aliases: ["css"] },
  { name: "Vite", category: "Tooling", iconUrl: devicon("vitejs") },
  { name: "Webpack", category: "Tooling", iconUrl: devicon("webpack") },
  { name: "GraphQL", category: "API", iconUrl: devicon("graphql", "plain"), aliases: ["gql"] },
];
