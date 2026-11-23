import { devicon, type SkillCatalogItem } from "./types";

export const BACKEND_SKILLS: SkillCatalogItem[] = [
  { name: "Node.js", category: "Backend", iconUrl: devicon("nodejs"), aliases: ["node", "nodejs"] },
  { name: "Express", category: "Backend", iconUrl: devicon("express"), aliases: ["expressjs"] },
  { name: "NestJS", category: "Backend", iconUrl: devicon("nestjs"), aliases: ["nest"] },
  { name: "Python", category: "Language", iconUrl: devicon("python") },
  { name: "FastAPI", category: "Backend", iconUrl: devicon("fastapi") },
  { name: "Django", category: "Backend", iconUrl: devicon("django", "plain") },
  { name: "Flask", category: "Backend", iconUrl: devicon("flask") },
  { name: "Go", category: "Language", iconUrl: devicon("go", "original-wordmark") },
  { name: "Rust", category: "Language", iconUrl: devicon("rust") },
  { name: "Java", category: "Language", iconUrl: devicon("java") },
  { name: "Spring Boot", category: "Backend", iconUrl: devicon("spring") },
  { name: "C#", category: "Language", iconUrl: devicon("csharp") },
  { name: ".NET", category: "Backend", iconUrl: devicon("dotnetcore") },
  { name: "Ruby on Rails", category: "Backend", iconUrl: devicon("rails", "plain") },
  { name: "Laravel", category: "Backend", iconUrl: devicon("laravel") },
  { name: "Prisma", category: "Backend", iconUrl: devicon("prisma") },
];

