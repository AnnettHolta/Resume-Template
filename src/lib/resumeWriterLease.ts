import { createStore, update, type UseStore } from "idb-keyval";
import { createClientId } from "./clientId";

const LEASE_KEY = "resume-template-writer-lease-v1";
const RELOAD_KEY = "resume-template-writer-reload-v1";
const LEASE_DURATION = 20_000;
const RENEW_INTERVAL = 4_000;
const WAIT_INTERVAL = 350;

type Lease = { owner: string; expiresAt: number };
let sharedStore: UseStore | undefined;
let guardedWriteStore: UseStore | undefined;

export function getEditorWriteStore() {
  return guardedWriteStore;
}

function writeStoreFor(owner: string, lost: AbortController): UseStore {
  // This is the same database and object store that idb-keyval uses by default.
  // Checking the lease and writing the payload must share one transaction.
  const useStore = (sharedStore ??= createStore("keyval-store", "keyval"));
  return (mode, write) =>
    useStore(
      mode,
      (store) =>
        new Promise((resolve, reject) => {
          const request = store.get(LEASE_KEY);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const current = request.result as Lease | null | undefined;
            if (lost.signal.aborted || current?.owner !== owner) {
              lost.abort();
              reject(new Error("This tab no longer owns resume storage."));
              return;
            }
            try {
              resolve(write(store));
            } catch (error) {
              reject(error);
            }
          };
        }),
    );
}

function takeReloadOwner(): string | null {
  try {
    const owner = sessionStorage.getItem(RELOAD_KEY);
    sessionStorage.removeItem(RELOAD_KEY);
    return owner;
  } catch {
    return null;
  }
}

async function claim(owner: string, reloadOwner: string | null) {
  let granted = false;
  await update<Lease | null>(LEASE_KEY, (current) => {
    const now = Date.now();
    if (current && current.expiresAt > now && current.owner !== reloadOwner)
      return current;
    granted = true;
    return { owner, expiresAt: now + LEASE_DURATION };
  });
  return granted;
}

function waitForRetry(signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, WAIT_INTERVAL);
    signal.addEventListener("abort", finish, { once: true });
  });
}

export async function requestResumeWriterLease(
  wait: boolean,
  signal: AbortSignal,
  onGrant: (
    granted: boolean,
    lost?: AbortSignal,
    rememberOnDeparture?: () => void,
  ) => Promise<void>,
) {
  const owner = createClientId();
  const reloadOwner = takeReloadOwner();
  while (!signal.aborted) {
    if (await claim(owner, reloadOwner)) {
      const lost = new AbortController();
      const rememberOnDeparture = () => {
        if (lost.signal.aborted) return;
        // Reload can interrupt the asynchronous lease release. The next page
        // in this tab may replace only this departing page's exact lease.
        try {
          sessionStorage.setItem(RELOAD_KEY, owner);
        } catch {
          // The lease can still be acquired after its expiration.
        }
      };
      const renew = async () => {
        let stillOwner = false;
        try {
          await update<Lease | null>(LEASE_KEY, (current) => {
            if (current?.owner !== owner) return current ?? null;
            stillOwner = true;
            return { owner, expiresAt: Date.now() + LEASE_DURATION };
          });
        } catch {
          stillOwner = false;
        }
        if (!stillOwner) lost.abort();
      };
      guardedWriteStore = writeStoreFor(owner, lost);
      const interval = setInterval(() => void renew(), RENEW_INTERVAL);
      try {
        if (!signal.aborted)
          await onGrant(true, lost.signal, rememberOnDeparture);
      } finally {
        clearInterval(interval);
        lost.abort();
        await update<Lease | null>(LEASE_KEY, (current) =>
          current?.owner === owner ? null : (current ?? null),
        );
      }
      return;
    }
    if (!wait) {
      await onGrant(false);
      return;
    }
    await waitForRetry(signal);
  }
}
