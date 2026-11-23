import type { ResumeData } from "@/types/resume";
import { getSaveStatus } from "./indexedDbStorage";
import {
  applyResumeEdit,
  type ResumeCommandEvent,
  type ResumeCommandResult,
  type ResumeEdit,
} from "./resumeCommands";

const MAX_REVISIONS = 50;

interface Options {
  readResume: () => ResumeData;
  commitResume: (data: ResumeData) => void;
  settleDraft: (edit: ResumeEdit) => void;
}

export function createEditorCommands({
  readResume,
  commitResume,
  settleDraft,
}: Options) {
  const revisions = new Map<string, ResumeData>();

  return ({ id, command }: ResumeCommandEvent): ResumeCommandResult => {
    if (command.type !== "read") {
      const base = revisions.get(command.revision);
      if (!base || base.resumeId !== readResume().resumeId)
        return { status: "stale" };

      settleDraft(command);
      const outcome = applyResumeEdit(base, readResume(), command);
      if ("fields" in outcome)
        return { status: "conflict", fields: outcome.fields };
      commitResume(outcome.next);
    }

    const resume = readResume();
    revisions.set(id, resume);
    if (revisions.size > MAX_REVISIONS) {
      const oldest = revisions.keys().next().value;
      if (oldest) revisions.delete(oldest);
    }
    return {
      status: command.type === "read" ? "read" : "applied",
      resume,
      revision: id,
      saveStatus: getSaveStatus(),
    };
  };
}
