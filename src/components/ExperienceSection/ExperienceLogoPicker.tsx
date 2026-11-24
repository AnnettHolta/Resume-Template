"use client";

import { useRef, useState, type ChangeEvent, type ClipboardEvent } from "react";
import { Building2, ImagePlus, Upload, X } from "lucide-react";
import { compressImageToWebpDataUrl } from "@/lib/avatarStorage";
import styles from "./ExperienceCard.module.scss";

interface ExperienceLogoBoxProps {
  company: string;
  imageUrl: string;
  onToggleEditor: () => void;
}

export function ExperienceLogoBox({
  company,
  imageUrl,
  onToggleEditor,
}: ExperienceLogoBoxProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const trimmed = imageUrl.trim();
  const showImage = Boolean(trimmed) && failedUrl !== trimmed;

  return (
    <div className={styles.logoColumn}>
      <button
        type="button"
        className={styles.logoBox}
        onClick={onToggleEditor}
        data-tooltip="Upload or set company logo"
        data-tooltip-position="top"
        aria-label="Edit company logo"
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trimmed}
            alt={`${company} logo`}
            className={styles.logoImg}
            onError={() => setFailedUrl(trimmed)}
          />
        ) : (
          <Building2 size={22} strokeWidth={1.5} />
        )}
        <span className={`${styles.logoEditHint} no-print`} aria-hidden="true">
          <ImagePlus size={12} />
        </span>
      </button>
    </div>
  );
}

interface ExperienceLogoBarProps {
  imageUrl: string;
  onChangeUrl: (nextUrl: string) => void;
  onCommitUrl: (nextUrl: string) => void;
  onClose: () => void;
}

export function ExperienceLogoBar({
  imageUrl,
  onChangeUrl,
  onCommitUrl,
  onClose,
}: ExperienceLogoBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isDataUrl = imageUrl.trim().toLowerCase().startsWith("data:");

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const dataUrl = await compressImageToWebpDataUrl(file);
      onCommitUrl(dataUrl);
      onClose();
    } catch {
      // Keep editor open if the image could not be decoded
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void processFile(file);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    const file =
      imageItem?.getAsFile() ??
      Array.from(e.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith("image/"),
      );
    if (!file) return;
    e.preventDefault();
    void processFile(file);
  };

  return (
    <div className={`${styles.imageUrlBar} no-print`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenFileInput}
        onChange={handleFileChange}
        aria-label="Upload company logo file"
      />
      <input
        type="url"
        value={isDataUrl ? "" : imageUrl}
        onChange={(e) => onChangeUrl(e.target.value)}
        onPaste={handlePaste}
        onBlur={() => {
          if (!isProcessing) {
            onCommitUrl(imageUrl);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
            onClose();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        placeholder={
          isDataUrl
            ? "Uploaded logo (paste image/URL to replace)"
            : "Paste logo URL or Ctrl+V image..."
        }
        aria-label="Company logo image URL"
        autoFocus
      />
      <button
        type="button"
        className={styles.logoActionBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        aria-label="Upload company logo"
        data-tooltip="Upload image"
        data-tooltip-position="top"
      >
        <Upload size={14} aria-hidden="true" />
      </button>
      {imageUrl.trim() && (
        <button
          type="button"
          className={styles.logoActionBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onCommitUrl("");
            onClose();
          }}
          aria-label="Remove company logo"
          data-tooltip="Remove logo"
          data-tooltip-position="top"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
