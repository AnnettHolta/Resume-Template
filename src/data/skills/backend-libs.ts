import { devicon, type SkillCatalogItem } from "./types";

export const BACKEND_LIB_SKILLS: SkillCatalogItem[] = [
  { name: "tRPC", category: "Backend lib", iconUrl: devicon("trpc") },
  {
    name: "Zod",
    category: "Backend lib",
    iconUrl: "https://cdn.simpleicons.org/zod/3E67B1",
  },
  { name: "Prisma", category: "Backend lib", iconUrl: devicon("prisma") },
  { name: "TypeORM", category: "Backend lib", iconUrl: devicon("typeorm") },
  { name: "Sequelize", category: "Backend lib", iconUrl: devicon("sequelize") },
  { name: "Mongoose", category: "Backend lib", iconUrl: devicon("mongoose") },
];
