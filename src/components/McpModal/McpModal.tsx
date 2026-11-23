"use client";

import { useEffect, useState } from "react";
import { KeyRound, RefreshCw, RotateCcw, X } from "lucide-react";
import type { ResumeData } from "@/types/resume";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";
import { McpTokenPanel } from "./McpTokenPanel";
import styles from "./McpModal.module.scss";

interface McpModalProps {
  isOpen: boolean;
  token: string | null;
  isSessionExpired: boolean;
  currentResume: ResumeData;
  onTokenChange: (nextToken: string | null) => void;
  onSessionRevalidated: () => void;
  onClose: () => void;
}

export function McpModal({
  isOpen,
  token,
  isSessionExpired,
  currentResume,
  onTokenChange,
  onSessionRevalidated,
  onClose,
}: McpModalProps) {
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setShowToken(false);
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmRegenerate) {
        setShowToken(false);
        setError(null);
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, confirmRegenerate, onClose]);

  if (!isOpen) return null;

  const callSessionEndpoint = async (options: {
    regenerate?: boolean;
    revalidate?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regenerate: Boolean(options.regenerate),
          revalidate: Boolean(options.revalidate),
          initialResume: currentResume,
        }),
      });
      if (!res.ok) throw new Error("Failed to issue MCP token");
      const json = (await res.json()) as { token: string };
      onTokenChange(json.token);
      onSessionRevalidated();
      setShowToken(false);
    } catch {
      setError("Could not reach MCP session endpoint.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetch("/api/session", { method: "DELETE" });
      onTokenChange(null);
      setShowToken(false);
    } catch {
      setError("Failed to disconnect MCP session.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={`${styles.backdrop} no-print`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mcp-modal-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className={styles.dialog}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <span className={styles.iconBadge} aria-hidden="true">
                <KeyRound size={16} />
              </span>
              <div>
                <h2 id="mcp-modal-title" className={styles.title}>
                  MCP Connection
                </h2>
                <p className={styles.subtitle}>
                  Optional · Runtime-only in-memory session
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={handleClose}
              aria-label="Close MCP modal"
            >
              <X size={16} />
            </button>
          </div>

          <p className={styles.description}>
            Connect an AI agent (Claude Code, Cursor, Antigravity, Codex) to
            read and edit only your resume. No plaintext resume files are saved
            to server disk, and tokens are never stored in JSON.
          </p>

          {error && <p className={styles.errorText}>{error}</p>}

          {token && isSessionExpired && (
            <div className={styles.expiredBox}>
              <p className={styles.expiredText}>
                Your runtime MCP session expired or the server restarted. Choose
                whether to revalidate your existing token or issue a new one:
              </p>
              <div className={styles.expiredActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => callSessionEndpoint({ revalidate: true })}
                  disabled={isLoading}
                >
                  <RotateCcw size={14} />
                  <span>Revalidate Token</span>
                </button>
                <button
                  type="button"
                  className={styles.primaryInlineBtn}
                  onClick={() => callSessionEndpoint({ regenerate: true })}
                  disabled={isLoading}
                >
                  <RefreshCw size={14} />
                  <span>Request New Token</span>
                </button>
              </div>
            </div>
          )}

          {token ? (
            <McpTokenPanel
              token={token}
              showToken={showToken}
              isLoading={isLoading}
              onToggleShow={() => setShowToken((prev) => !prev)}
              onRequestRegenerate={() => setConfirmRegenerate(true)}
              onDisconnect={handleDisconnect}
              onError={setError}
            />
          ) : (
            <div className={styles.emptyBox}>
              <p className={styles.emptyHint}>
                No MCP token active. Request a token to enable 1s two-way sync
                and agent access.
              </p>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => callSessionEndpoint({})}
                disabled={isLoading}
              >
                <KeyRound size={14} />
                <span>{isLoading ? "Requesting..." : "Request Token"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <GeneralConfirmModal
        isOpen={confirmRegenerate}
        title="Regenerate MCP Token?"
        description="Your current token will be revoked immediately, and any connected AI agents will need the new token to continue syncing."
        confirmLabel="Regenerate"
        cancelLabel="Keep Current"
        isDestructive
        onCancel={() => setConfirmRegenerate(false)}
        onConfirm={() => {
          setConfirmRegenerate(false);
          void callSessionEndpoint({ regenerate: true });
        }}
      />
    </>
  );
}
