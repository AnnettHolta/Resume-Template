import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findSkillCatalogItem } from "@/data/skillsCatalog";
import {
  EducationItemSchema,
  ExperienceItemSchema,
} from "@/server/schemas/resumeSchemas";
import {
  readSessionResume,
  writeSessionResume,
} from "@/server/storage/resumeFileStore";

export function createResumeMcpServer(token: string): McpServer {
  const server = new McpServer({
    name: "resume-template-mcp",
    version: "1.0.0",
  });

  server.tool(
    "get_resume",
    "Read the current resume JSON for this session",
    {},
    async () => {
      const data = await readSessionResume(token);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "update_profile",
    "Update profile fields (name, headline, summary, and contact info)",
    {
      name: z.string().optional(),
      headline: z.string().optional(),
      summary: z.string().optional(),
      contact: z
        .object({
          email: z.string().optional(),
          phone: z.string().optional(),
          location: z.string().optional(),
          website: z.string().optional(),
          linkedin: z.string().optional(),
          github: z.string().optional(),
        })
        .optional(),
    },
    async (args) => {
      const current = await readSessionResume(token);
      const next = {
        ...current,
        profile: {
          ...current.profile,
          ...(args.name !== undefined ? { name: args.name } : {}),
          ...(args.headline !== undefined ? { headline: args.headline } : {}),
          ...(args.summary !== undefined ? { summary: args.summary } : {}),
          contact: {
            ...current.profile.contact,
            ...(args.contact ?? {}),
          },
        },
      };
      await writeSessionResume(token, next, "mcp");
      return {
        content: [{ type: "text", text: JSON.stringify(next.profile, null, 2) }],
      };
    }
  );

  server.tool(
    "upsert_experience",
    "Add a new experience entry or update an existing one by id",
    {
      item: ExperienceItemSchema,
    },
    async ({ item }) => {
      const current = await readSessionResume(token);
      const exists = current.experience.some((e) => e.id === item.id);
      const nextExperience = exists
        ? current.experience.map((e) => (e.id === item.id ? item : e))
        : [item, ...current.experience];
      const next = { ...current, experience: nextExperience };
      await writeSessionResume(token, next, "mcp");
      return {
        content: [
          { type: "text", text: JSON.stringify(next.experience, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "delete_experience",
    "Delete an experience entry by id",
    {
      id: z.string(),
    },
    async ({ id }) => {
      const current = await readSessionResume(token);
      const next = {
        ...current,
        experience: current.experience.filter((e) => e.id !== id),
      };
      await writeSessionResume(token, next, "mcp");
      return {
        content: [
          { type: "text", text: JSON.stringify(next.experience, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "upsert_education",
    "Add a new education entry or update an existing one by id",
    {
      item: EducationItemSchema,
    },
    async ({ item }) => {
      const current = await readSessionResume(token);
      const exists = current.education.some((e) => e.id === item.id);
      const nextEducation = exists
        ? current.education.map((e) => (e.id === item.id ? item : e))
        : [item, ...current.education];
      const next = { ...current, education: nextEducation };
      await writeSessionResume(token, next, "mcp");
      return {
        content: [
          { type: "text", text: JSON.stringify(next.education, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "delete_education",
    "Delete an education entry by id",
    {
      id: z.string(),
    },
    async ({ id }) => {
      const current = await readSessionResume(token);
      const next = {
        ...current,
        education: current.education.filter((e) => e.id !== id),
      };
      await writeSessionResume(token, next, "mcp");
      return {
        content: [
          { type: "text", text: JSON.stringify(next.education, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "add_skills",
    "Add one or more skills (auto-resolving catalog aliases like css -> CSS3)",
    {
      skills: z.array(z.string()),
    },
    async ({ skills }) => {
      const current = await readSessionResume(token);
      const existingLower = new Set(
        current.skills.map((s) => s.trim().toLowerCase())
      );
      const added: string[] = [];

      for (const raw of skills) {
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const matched = findSkillCatalogItem(trimmed);
        const resolved = matched ? matched.name : trimmed;
        if (!existingLower.has(resolved.toLowerCase())) {
          existingLower.add(resolved.toLowerCase());
          added.push(resolved);
        }
      }

      const next = { ...current, skills: [...current.skills, ...added] };
      await writeSessionResume(token, next, "mcp");
      return {
        content: [{ type: "text", text: JSON.stringify(next.skills, null, 2) }],
      };
    }
  );

  server.tool(
    "remove_skills",
    "Remove one or more skills by name (case-insensitive)",
    {
      skills: z.array(z.string()),
    },
    async ({ skills }) => {
      const current = await readSessionResume(token);
      const toRemove = new Set(skills.map((s) => s.trim().toLowerCase()));
      const next = {
        ...current,
        skills: current.skills.filter(
          (s) => !toRemove.has(s.trim().toLowerCase())
        ),
      };
      await writeSessionResume(token, next, "mcp");
      return {
        content: [{ type: "text", text: JSON.stringify(next.skills, null, 2) }],
      };
    }
  );

  return server;
}

