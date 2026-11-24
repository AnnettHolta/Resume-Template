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
  {
    name: "Drizzle ORM",
    category: "Backend lib",
    iconUrl: "https://cdn.simpleicons.org/drizzle/C5F74F",
    aliases: ["drizzle"],
  },
  {
    name: "Socket.IO",
    category: "Backend lib",
    iconUrl: devicon("socketio"),
    aliases: ["socketio"],
  },
  {
    name: "Swagger",
    category: "Backend lib",
    iconUrl: devicon("swagger"),
    aliases: ["openapi"],
  },
  { name: "gRPC", category: "Backend lib", iconUrl: devicon("grpc") },
  {
    name: "JWT",
    category: "Backend lib",
    fallbackKind: "code",
    aliases: ["json web token"],
  },
  {
    name: "MCP",
    category: "Backend lib",
    fallbackKind: "code",
    aliases: ["model context protocol", "modelcontextprotocol"],
  },
];
