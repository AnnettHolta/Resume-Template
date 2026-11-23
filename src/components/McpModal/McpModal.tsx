"use client";

import { useId, useState } from "react";
import { KeyRound, RefreshCw, X } from "lucide-react";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";
import { Modal } from "@/components/Modal/Modal";
import { McpTokenPanel } from "./McpTokenPanel";
import styles from "./McpModal.module.scss";

interface McpModalProps {
  isOpen: boolean;
  token: string | null;
  isSessionExpired: boolean;
  isEditorConnected: boolean;
  onTokenChange: (nextToken: string | null) => void;
  onClose: () => void;
}

export function McpModal({
  isOpen,
  token,
  isSessionExpired,
  isEditorConnected,
  onTokenChange,
  onClose,
}: McpModalProps) {
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleId = useId();
  const descriptionId = useId();

  const handleClose = () => {
    setShowToken(false);
    setError(null);
    onClose();
  };

  const callSessionEndpoint = async (regenerate = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });
      if (!res.ok) throw new Error("Failed to issue MCP token");
      const json = (await res.json()) as { token: string };
      onTokenChange(json.token);
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
      const res = await fetch("/api/session", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect MCP session");
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
      <Modal
        isOpen={isOpen}
        titleId={titleId}
        descriptionId={descriptionId}
        className={styles.dialog}
        onClose={handleClose}
      >
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.iconBadge} aria-hidden="true">
              <KeyRound size={16} />
            </span>
            <div>
              <h2 id={titleId} className={styles.title}>
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
            data-dialog-focus
          >
            <X size={16} />
          </button>
        </div>

        <p id={descriptionId} className={styles.description}>
          Connect an AI agent (Claude Code, Cursor, Antigravity, Codex) to read
          and edit this resume while the editor is open. Changes go through the
          editor’s undo history and save on this device.
        </p>

        {error && <p className={styles.errorText}>{error}</p>}

        {token && isSessionExpired && (
          <div className={styles.expiredBox}>
            <p className={styles.expiredText}>
              Your session expired or the server restarted. Request a new token
              to reconnect.
            </p>
            <div className={styles.expiredActions}>
              <button
                type="button"
                className={styles.primaryInlineBtn}
                onClick={() => callSessionEndpoint(true)}
                disabled={isLoading}
              >
                <RefreshCw size={14} />
                <span>Request New Token</span>
              </button>
            </div>
          </div>
        )}
        {token && !isSessionExpired && !isEditorConnected && (
          <p role="status">
            Waiting for the editor connection. If another tab is connected,
            close it to use this tab.
          </p>
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
              {isSessionExpired
                ? "Your MCP session ended. Request a new token to reconnect."
                : "Request a token to let an agent read and edit this resume."}
            </p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => callSessionEndpoint()}
              disabled={isLoading}
            >
              <KeyRound size={14} />
              <span>{isLoading ? "Requesting..." : "Request Token"}</span>
            </button>
          </div>
        )}
      </Modal>

      <GeneralConfirmModal
        isOpen={isOpen && confirmRegenerate}
        title="Regenerate MCP Token?"
        description="Your current token will be revoked immediately, and any connected AI agents will need the new token to continue syncing."
        confirmLabel="Regenerate"
        cancelLabel="Keep Current"
        isDestructive
        onCancel={() => setConfirmRegenerate(false)}
        onConfirm={() => {
          setConfirmRegenerate(false);
          void callSessionEndpoint(true);
        }}
      />
    </>
  );
}
