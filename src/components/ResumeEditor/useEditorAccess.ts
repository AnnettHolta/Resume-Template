"use client";

import { useLayoutEffect } from "react";
import { useResumeWriter } from "@/lib/useResumeWriter";
import { flushAvatarWrites, migrateLegacyAvatar } from "@/lib/avatarStorage";
import {
  cancelIndexedDbWrites,
  flushIndexedDbWritesConfirmed,
} from "@/lib/indexedDbStorage";
import {
  rehydrateResumeStore,
  setResumeWriteAllowed,
  useResumeStore,
} from "@/store/useResumeStore";
import type { ResumeData } from "@/types/resume";

export function settleEditorDraft() {
  const active = document.activeElement;
  if (
    active instanceof HTMLElement &&
    active.matches("main :is(input, textarea, [contenteditable=true])")
  ) {
    active.blur();
  }
}

export function useEditorAccess(initialData: ResumeData) {
  useLayoutEffect(() => setResumeWriteAllowed(false), []);

  return useResumeWriter({
    beforeAcquire: async () => {
      setResumeWriteAllowed(false);
      cancelIndexedDbWrites();
      await rehydrateResumeStore();
      const state = useResumeStore.getState();
      if (state.hydrationError)
        throw new Error("Could not reload the saved resume.");

      try {
        setResumeWriteAllowed(true);
        state.initializeResume(initialData);
        if (!(await flushIndexedDbWritesConfirmed())) {
          throw new Error("Could not save the resume identity.");
        }
        const { entries, index } = useResumeStore.getState();
        const id = entries[index]?.resumeId;
        if (id) {
          await migrateLegacyAvatar(id).catch(() => {
            state.setStatusMessage(
              "Could not move the previous profile photo into this gallery.",
            );
          });
        }
      } catch (error) {
        setResumeWriteAllowed(false);
        throw error;
      }
    },
    beforeHandoff: async () => {
      // Blur synchronously so the current inline draft enters the save queue.
      settleEditorDraft();
      setResumeWriteAllowed(false);
      const [historySaved, photosSaved] = await Promise.all([
        flushIndexedDbWritesConfirmed().catch(() => false),
        flushAvatarWrites().catch(() => false),
      ]);
      if (historySaved && photosSaved) {
        useResumeStore.getState().setStatusMessage(null);
        return true;
      }
      setResumeWriteAllowed(true);
      useResumeStore
        .getState()
        .setStatusMessage(
          "Editing stayed in this tab because a pending change could not be saved.",
        );
      return false;
    },
  });
}
