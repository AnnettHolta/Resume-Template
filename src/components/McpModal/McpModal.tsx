"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Unplug,
  X,
} from "lucide-react";
import type { ResumeData } from "@/types/resume";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";
import styles from "./McpModal.module.scss";

interface McpModalProps {
  isOpen: boolean;
  token: string | null;
  currentResume: ResumeData;
  onTokenChange: (nextToken: string | null) => void;
  onClose: () => void;
}

export function McpModal({
  isOpen,
  token,
  currentResume,
  onTokenChange,
  onClose,
}: McpModalProps) {
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<"token" | "config" | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always hide token whenever modal opens/closes
  const handleClose = () => {
    setShowToken(false);
    setCopiedType(null);
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmRegenerate) {
        setShowToken(false);
        setCopiedType(null);
        setError(null);
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, confirmRegenerate, onClose]);

  if (!isOpen) return null;

  const requestOrRegenerateToken = async (regenerate: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regenerate,
          initialResume: currentResume,
        }),
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
      await fetch("/api/session", { method: "DELETE" });
      onTokenChange(null);
      setShowToken(false);
    } catch {
      setError("Failed to disconnect MCP session.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = async (text: string, type: "token" | "config") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      setError("Clipboard permission denied.");
    }
  };

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const mcpConfigSnippet = token
    ? JSON.stringify(
        {
          mcpServers: {
            "resume-template": {
              url: `${origin}/api/mcp`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          },
        },
        null,
        2
      )
    : "";

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
                  Optional · Isolated per-session token
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
            read and edit only your resume. The token is stored in your session
            cookie and never embedded in resume JSON.
          </p>

          {error && <p className={styles.errorText}>{error}</p>}

          {token ? (
            <div className={styles.tokenSection}>
              <div className={styles.tokenBox}>
                <code className={styles.tokenValue}>
                  {showToken ? token : "••••••••-••••-••••-••••-••••••••••••"}
                </code>
                <div className={styles.tokenActions}>
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={() => setShowToken((prev) => !prev)}
                    data-tooltip={showToken ? "Hide token" : "Show token"}
                    data-tooltip-position="top"
                    aria-label={showToken ? "Hide token" : "Show token"}
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{showToken ? "Hide" : "Show"}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={() => copyText(token, "token")}
                    data-tooltip="Copy token"
                    data-tooltip-position="top"
                  >
                    {copiedType === "token" ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copiedType === "token" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className={styles.endpointRow}>
                <span>Endpoint:</span>
                <code>{origin}/api/mcp</code>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => copyText(mcpConfigSnippet, "config")}
                >
                  {copiedType === "config"
                    ? "Copied MCP JSON!"
                    : "Copy MCP Config"}
                </button>
              </div>

              <div className={styles.footerRow}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setConfirmRegenerate(true)}
                  disabled={isLoading}
                >
                  <RefreshCw size={14} />
                  <span>Regenerate Token</span>
                </button>
                <button
                  type="button"
                  className={styles.disconnectBtn}
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  <Unplug size={14} />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyBox}>
              <p className={styles.emptyHint}>
                No MCP token active. Request a token to enable 1s two-way sync
                and agent access.
              </p>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => requestOrRegenerateToken(false)}
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
        description="Your current token will be invalidated immediately, and any connected AI agents will need the new token to continue syncing."
        confirmLabel="Regenerate"
        cancelLabel="Keep Current"
        isDestructive
        onCancel={() => setConfirmRegenerate(false)}
        onConfirm={() => {
          setConfirmRegenerate(false);
          void requestOrRegenerateToken(true);
        }}
      />
    </>
  );
}

