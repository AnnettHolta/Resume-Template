import { devicon, type SkillCatalogItem } from "./types";

export const FRONTEND_LIB_SKILLS: SkillCatalogItem[] = [
  { name: "Tailwind CSS", category: "Frontend lib", iconUrl: devicon("tailwindcss"), aliases: ["tailwind"] },
  { name: "Pinia", category: "Frontend lib", iconUrl: "https://cdn.simpleicons.org/pinia/FFD859" },
  { name: "RxJS", category: "Frontend lib", iconUrl: devicon("rxjs") },
  { name: "NgRx", category: "Frontend lib", iconUrl: devicon("ngrx") },
  { name: "Redux", category: "Frontend lib", iconUrl: devicon("redux") },
  { name: "Zustand", category: "Frontend lib", iconUrl: devicon("zustand") },
  {
    name: "TanStack Query",
    category: "Frontend lib",
    iconUrl: "https://cdn.simpleicons.org/reactquery/FF4154",
    aliases: ["react-query", "react query"],
  },
  { name: "Material UI", category: "Frontend lib", iconUrl: devicon("materialui"), aliases: ["mui"] },
  { name: "Ant Design", category: "Frontend lib", iconUrl: devicon("antdesign"), aliases: ["antd"] },
  { name: "Chakra UI", category: "Frontend lib", iconUrl: devicon("chakraui"), aliases: ["chakra"] },
  { name: "Bootstrap", category: "Frontend lib", iconUrl: devicon("bootstrap") },
  { name: "Three.js", category: "Frontend lib", iconUrl: devicon("threejs"), aliases: ["threejs"] },
  { name: "D3.js", category: "Frontend lib", iconUrl: devicon("d3js"), aliases: ["d3"] },
  { name: "Chart.js", category: "Frontend lib", iconUrl: devicon("chartjs"), aliases: ["chartjs"] },
  { name: "Axios", category: "Frontend lib", iconUrl: devicon("axios", "plain") },
  { name: "Lodash", category: "Frontend lib", iconUrl: devicon("lodash"), aliases: ["lodash-es"] },
];

