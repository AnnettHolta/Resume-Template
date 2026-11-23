"use client";

import { useState } from "react";
import { Code2, MessageSquare, Sparkles } from "lucide-react";
import type { SkillCatalogItem } from "@/data/skillsCatalog";
import styles from "./SkillsSection.module.scss";

interface SkillIconProps {
  iconUrl?: string;
  fallbackKind?: SkillCatalogItem["fallbackKind"];
  label: string;
  size?: number;
}

export function SkillIcon({
  iconUrl,
  fallbackKind = "code",
  label,
  size = 14,
}: SkillIconProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!iconUrl || failedUrl === iconUrl) {
    if (fallbackKind === "ai") {
      return (
        <Sparkles
          size={size}
          className={styles.fallbackIcon}
          aria-hidden="true"
        />
      );
    }
    if (fallbackKind === "comms") {
      return (
        <MessageSquare
          size={size}
          className={styles.fallbackIcon}
          aria-hidden="true"
        />
      );
    }
    return (
      <Code2 size={size} className={styles.fallbackIcon} aria-hidden="true" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={iconUrl}
      alt={`${label} icon`}
      width={size}
      height={size}
      className={styles.skillIcon}
      onError={() => setFailedUrl(iconUrl)}
    />
  );
}
