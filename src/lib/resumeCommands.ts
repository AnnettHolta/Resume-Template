import { z } from "zod";
import { isEqual } from "lodash-es";
import { findSkillCatalogItem } from "@/data/skillsCatalog";
import type { ResumeData } from "@/types/resume";
import {
  ContactInfoSchema,
  EducationItemSchema,
  ExperienceItemSchema,
  ResumeDataSchema,
  ResumeProfileSchema,
} from "./resumeSchema";

export const ProfilePatchSchema = ResumeProfileSchema.partial().extend({
  contact: ContactInfoSchema.partial().optional(),
});

export const RevisionSchema = z.uuid();
const entryId = z.string().min(1);
const revision = { revision: RevisionSchema };

export const ResumeCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("read") }),
  z.object({
    type: z.literal("update_profile"),
    ...revision,
    patch: ProfilePatchSchema,
  }),
  z.object({
    type: z.literal("upsert_experience"),
    ...revision,
    item: ExperienceItemSchema,
  }),
  z.object({ type: z.literal("delete_experience"), ...revision, id: entryId }),
  z.object({
    type: z.literal("upsert_education"),
    ...revision,
    item: EducationItemSchema,
  }),
  z.object({ type: z.literal("delete_education"), ...revision, id: entryId }),
  z.object({
    type: z.literal("add_skills"),
    ...revision,
    skills: z.array(z.string()),
  }),
  z.object({
    type: z.literal("remove_skills"),
    ...revision,
    skills: z.array(z.string()),
  }),
]);

export const ResumeCommandEventSchema = z.object({
  id: z.uuid(),
  expiresAt: z.number(),
  command: ResumeCommandSchema,
});

export const ResumeCommandResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.enum(["read", "applied"]),
    resume: ResumeDataSchema,
    revision: RevisionSchema,
    saveStatus: z.enum(["idle", "saving", "saved", "error"]),
  }),
  z.object({ status: z.literal("conflict"), fields: z.array(z.string()) }),
  z.object({ status: z.literal("stale") }),
]);

export type ResumeCommand = z.infer<typeof ResumeCommandSchema>;
export type ResumeEdit = Exclude<ResumeCommand, { type: "read" }>;
export type ResumeCommandEvent = z.infer<typeof ResumeCommandEventSchema>;
export type ResumeCommandResult = z.infer<typeof ResumeCommandResultSchema>;

function mergeFields<T extends object>(
  base: T,
  local: T,
  patch: Partial<T>,
  path: string,
  conflicts: string[],
  skipUnchanged = false,
): T {
  const next = { ...local };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const value = patch[key];
    if (value === undefined || (skipUnchanged && isEqual(base[key], value)))
      continue;
    if (isEqual(local[key], value)) continue;
    if (isEqual(local[key], base[key])) next[key] = value;
    else conflicts.push(`${path}.${String(key)}`);
  }
  return next;
}

function editEntries<T extends { id: string }>(
  base: T[],
  local: T[],
  target: { id: string; value?: T },
  section: string,
  conflicts: string[],
) {
  const before = base.find((entry) => entry.id === target.id);
  const current = local.find((entry) => entry.id === target.id);
  const path = `${section}.${target.id}`;
  if (isEqual(current, target.value)) return local;
  if (before && current && target.value) {
    const updated = mergeFields(
      before,
      current,
      target.value,
      path,
      conflicts,
      true,
    );
    return local.map((entry) => (entry.id === target.id ? updated : entry));
  }
  if (!isEqual(before, current)) {
    conflicts.push(path);
    return local;
  }
  return target.value
    ? [target.value, ...local]
    : local.filter((entry) => entry.id !== target.id);
}

function skillName(value: string) {
  const trimmed = value.trim();
  return findSkillCatalogItem(trimmed)?.name ?? trimmed;
}

function editSkills(
  base: string[],
  local: string[],
  skills: string[],
  add: boolean,
  conflicts: string[],
) {
  const keyOf = (skill: string) => skillName(skill).toLowerCase();
  const before = new Set(base.map(keyOf));
  const current = new Set(local.map(keyOf));
  const requested = new Map(
    skills.map((skill) => [keyOf(skill), skillName(skill)]),
  );
  const additions: string[] = [];
  const removals = new Set<string>();
  for (const [key, name] of requested) {
    if (!key || current.has(key) === add) continue;
    if (before.has(key) !== current.has(key)) conflicts.push(`skills.${name}`);
    else if (add) additions.push(name);
    else removals.add(key);
  }
  return [
    ...local.filter((skill) => !removals.has(keyOf(skill))),
    ...additions,
  ];
}

export function applyResumeEdit(
  base: ResumeData,
  local: ResumeData,
  edit: ResumeEdit,
): { fields: string[] } | { next: ResumeData } {
  const fields: string[] = [];
  const next = { ...local };
  switch (edit.type) {
    case "update_profile": {
      const { contact, ...profile } = edit.patch;
      next.profile = {
        ...mergeFields(base.profile, local.profile, profile, "profile", fields),
        contact: contact
          ? mergeFields(
              base.profile.contact,
              local.profile.contact,
              contact,
              "profile.contact",
              fields,
            )
          : local.profile.contact,
      };
      break;
    }
    case "upsert_experience":
    case "delete_experience": {
      const incoming =
        edit.type === "upsert_experience"
          ? (() => {
              const prev = base.experience.find((e) => e.id === edit.item.id);
              if (
                prev?.companyImageUrl
                  .trim()
                  .toLowerCase()
                  .startsWith("data:") &&
                edit.item.companyImageUrl === ""
              ) {
                return { ...edit.item, companyImageUrl: prev.companyImageUrl };
              }
              return edit.item;
            })()
          : undefined;
      next.experience = editEntries(
        base.experience,
        local.experience,
        edit.type === "upsert_experience"
          ? { id: edit.item.id, value: incoming }
          : edit,
        "experience",
        fields,
      );
      break;
    }
    case "upsert_education":
    case "delete_education":
      next.education = editEntries(
        base.education,
        local.education,
        edit.type === "upsert_education"
          ? { id: edit.item.id, value: edit.item }
          : edit,
        "education",
        fields,
      );
      break;
    case "add_skills":
    case "remove_skills":
      next.skills = editSkills(
        base.skills,
        local.skills,
        edit.skills,
        edit.type === "add_skills",
        fields,
      );
      break;
  }
  return fields.length ? { fields } : { next };
}
