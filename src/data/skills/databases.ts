import { devicon, type SkillCatalogItem } from "./types";

export const DATABASE_SKILLS: SkillCatalogItem[] = [
  {
    name: "PostgreSQL",
    category: "Database",
    iconUrl: devicon("postgresql"),
    aliases: ["postgres", "psql"],
  },
  { name: "MySQL", category: "Database", iconUrl: devicon("mysql") },
  { name: "MongoDB", category: "Database", iconUrl: devicon("mongodb") },
  { name: "Redis", category: "Database", iconUrl: devicon("redis") },
  { name: "SQLite", category: "Database", iconUrl: devicon("sqlite") },
  { name: "Firebase", category: "Backend", iconUrl: devicon("firebase") },
  { name: "Supabase", category: "Backend", iconUrl: devicon("supabase") },
  {
    name: "Apache Kafka",
    category: "Messaging",
    iconUrl: devicon("apachekafka"),
  },
  { name: "RabbitMQ", category: "Messaging", iconUrl: devicon("rabbitmq") },
];
