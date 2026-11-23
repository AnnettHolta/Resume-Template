"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, RefreshCw, Unplug } from "lucide-react";
import styles from "./McpModal.module.scss";

interface McpTokenPanelProps {
  token: string;
  showToken: boolean;
  isLoading: boolean;
  onToggleShow: () => void;
  onRequestRegenerate: () => void;
  onDisconnect: () => void;
  onError: (message: string) => void;
}

export function McpTokenPanel({
  token,
  showToken,
  isLoading,
  onToggleShow,
  onRequestRegenerate,
  onDisconnect,
  onError,
}: McpTokenPanelProps) {
  const [copiedType, setCopiedType] = useState<"token" | "config" | null>(null);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  const mcpConfigSnippet = JSON.stringify(
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
    2,
  );

  const copyText = async (text: string, type: "token" | "config") => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      onError("Clipboard permission denied.");
    }
  };

  return (
    <div className={styles.tokenSection}>
      <div className={styles.tokenBox}>
        <code className={styles.tokenValue}>
          {showToken ? token : "••••••••-••••-••••-••••-••••••••••••"}
        </code>
        <div className={styles.tokenActions}>
          <button
            type="button"
            className={styles.smallBtn}
            onClick={onToggleShow}
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
            {copiedType === "token" ? <Check size={14} /> : <Copy size={14} />}
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
          {copiedType === "config" ? "Copied MCP JSON!" : "Copy MCP Config"}
        </button>
      </div>

      <div className={styles.footerRow}>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onRequestRegenerate}
          disabled={isLoading}
        >
          <RefreshCw size={14} />
          <span>Regenerate Token</span>
        </button>
        <button
          type="button"
          className={styles.disconnectBtn}
          onClick={onDisconnect}
          disabled={isLoading}
        >
          <Unplug size={14} />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
}
