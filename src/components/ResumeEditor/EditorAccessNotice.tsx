"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/Modal/Modal";
import type { useResumeWriter } from "@/lib/useResumeWriter";
import styles from "./ResumeEditor.module.scss";

export function EditorAccessNotice({
  phase,
  requestAccess,
  continueReadOnly,
}: Pick<
  ReturnType<typeof useResumeWriter>,
  "phase" | "requestAccess" | "continueReadOnly"
>) {
  const [hasDismissed, setHasDismissed] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  if (phase === "writer" && !hasDismissed) setHasDismissed(true);

  const messages = {
    checking: null,
    writer: null,
    "read-only": "Another tab is editing this resume.",
    requesting: "Waiting for the other tab to save…",
    handoff: "Saving before switching tabs…",
    unsupported: "Read-only. Open on HTTPS or localhost to edit.",
    error: "Couldn’t get editing access.",
  };
  const message = messages[phase];
  const keepViewing = () => {
    setHasDismissed(true);
    continueReadOnly();
  };
  const editHere = () => {
    setHasDismissed(true);
    requestAccess();
  };

  return (
    <>
      {message && (
        <div className={`${styles.accessNotice} no-print`}>
          <p role="status">{message}</p>
          {(phase === "read-only" || phase === "error") && (
            <button type="button" onClick={editHere}>
              Edit here
            </button>
          )}
        </div>
      )}
      <Modal
        isOpen={phase === "read-only" && !hasDismissed}
        className={styles.accessDialog}
        titleId={titleId}
        descriptionId={descriptionId}
        onClose={keepViewing}
      >
        <h2 id={titleId}>Editing in another tab</h2>
        <p id={descriptionId}>
          The other tab will save before editing moves here.
        </p>
        <div className={styles.accessActions}>
          <button type="button" onClick={keepViewing} data-dialog-focus>
            Keep viewing
          </button>
          <button
            type="button"
            className={styles.accessPrimary}
            onClick={editHere}
          >
            Edit here
          </button>
        </div>
      </Modal>
    </>
  );
}
