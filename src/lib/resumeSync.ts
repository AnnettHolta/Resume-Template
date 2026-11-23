import { debounce, isEqual } from "lodash-es";
import type { ResumeData } from "@/types/resume";
import { HISTORY_PERSIST_DEBOUNCE_MS } from "./indexedDbStorage";
import { ResumeDataSchema } from "./resumeSchema";

interface ResumeSnapshot {
  data: ResumeData;
  revision: string;
}

interface ResumeSyncOptions {
  token: string;
  readLocal: () => ResumeData;
  isEditing: () => boolean;
  applyRemote: (data: ResumeData) => void;
  showConflict: (data: ResumeData | null) => void;
  showStatus: (message: string) => void;
  expire: () => void;
}

export function createResumeSync(options: ResumeSyncOptions) {
  const abort = new AbortController();
  const requestOptions = {
    headers: { Authorization: `Bearer ${options.token}` },
    signal: abort.signal,
  };
  let base: ResumeSnapshot | null = null;
  let conflict: ResumeSnapshot | null = null;
  let overwriteRevision: string | null = null;
  let useRemoteRevision: string | null = null;
  let refreshPending = false;
  let savePending = false;
  let running = false;

  function setConflict(snapshot: ResumeSnapshot | null) {
    conflict = snapshot;
    options.showConflict(snapshot?.data ?? null);
  }

  function apply(snapshot: ResumeSnapshot) {
    base = snapshot;
    setConflict(null);
    if (!isEqual(options.readLocal(), snapshot.data)) {
      options.applyRemote(snapshot.data);
      options.showStatus("Applied synced resume");
    }
  }

  async function refresh() {
    const response = await fetch("/api/resume", {
      ...requestOptions,
      cache: "no-store",
    });
    if (abort.signal.aborted) return;
    if (response.status === 401) return options.expire();
    const revision = response.headers.get("ETag");
    if (!response.ok || !revision) throw new Error("Resume read failed");
    const data = ResumeDataSchema.parse(await response.json());
    if (abort.signal.aborted) return;

    const remote = { data, revision };
    const local = options.readLocal();
    if (isEqual(local, data)) {
      apply(remote);
    } else if (!conflict && base && isEqual(base.data, data)) {
      base = remote;
      savePending = true;
    } else if (
      !conflict &&
      base &&
      isEqual(local, base.data) &&
      !options.isEditing()
    ) {
      apply(remote);
    } else {
      setConflict(remote);
    }
  }

  async function save() {
    const revision = conflict ? overwriteRevision : base?.revision;
    overwriteRevision = null;
    if (!revision || (conflict && revision !== conflict.revision)) return;
    const data = options.readLocal();
    if (!conflict && isEqual(data, base?.data)) return;

    const response = await fetch("/api/resume", {
      ...requestOptions,
      method: "PUT",
      headers: {
        ...requestOptions.headers,
        "Content-Type": "application/json",
        "If-Match": revision,
      },
      body: JSON.stringify(data),
    });
    if (abort.signal.aborted) return;
    if (response.status === 401) return options.expire();
    if (response.status === 412) {
      refreshPending = true;
      return;
    }
    const savedRevision = response.headers.get("ETag");
    if (!response.ok || !savedRevision) throw new Error("Resume write failed");

    base = { data, revision: savedRevision };
    setConflict(null);
    if (!isEqual(options.readLocal(), data)) scheduleSave();
  }

  // One request at a time keeps reconnect reads from racing in-flight writes.
  async function processPending() {
    if (running || abort.signal.aborted) return;
    running = true;
    try {
      while (
        !abort.signal.aborted &&
        (refreshPending || useRemoteRevision || savePending)
      ) {
        if (refreshPending) {
          refreshPending = false;
          await refresh();
          continue;
        }
        if (useRemoteRevision) {
          if (conflict?.revision === useRemoteRevision) apply(conflict);
          useRemoteRevision = null;
          continue;
        }
        savePending = false;
        if (base || conflict) await save();
        else refreshPending = true;
      }
    } catch {
      if (!abort.signal.aborted) {
        options.showStatus(
          "Could not sync with MCP. Local edits are still in the editor.",
        );
      }
    } finally {
      running = false;
    }
  }

  const scheduleSave = debounce(() => {
    savePending = true;
    void processPending();
  }, HISTORY_PERSIST_DEBOUNCE_MS);

  return {
    scheduleSave,
    refresh: () => {
      refreshPending = true;
      void processPending();
    },
    useRemote: () => {
      if (!conflict) return;
      useRemoteRevision = conflict.revision;
      void processPending();
    },
    keepLocal: () => {
      if (!conflict) return;
      overwriteRevision = conflict.revision;
      savePending = true;
      void processPending();
    },
    stop: () => {
      abort.abort();
      scheduleSave.cancel();
    },
  };
}
