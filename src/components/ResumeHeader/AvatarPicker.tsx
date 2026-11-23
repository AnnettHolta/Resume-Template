"use client";

import { useRef, useState } from "react";
import { Camera, User, X } from "lucide-react";
import { useAvatarBlob } from "@/hooks/useAvatarBlob";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";
import styles from "./AvatarPicker.module.scss";

interface AvatarPickerProps {
  name: string;
}

export function AvatarPicker({ name }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { avatarUrl, isProcessing, errorMessage, uploadAvatar, removeAvatar } =
    useAvatarBlob();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadAvatar(file);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.avatarFrame}>
        <button
          type="button"
          className={styles.avatarButton}
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
          aria-label={
            avatarUrl ? "Change profile picture" : "Upload profile picture"
          }
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={`${name || "Profile"} photo`}
              className={styles.avatarImage}
            />
          ) : (
            <User size={40} strokeWidth={1.25} aria-hidden="true" />
          )}
          <span
            className={`${styles.uploadOverlay} no-print`}
            aria-hidden="true"
          >
            <Camera size={16} />
          </span>
        </button>

        {avatarUrl && (
          <button
            type="button"
            className={`${styles.removeButton} no-print`}
            onClick={(event) => {
              event.currentTarget.focus();
              setIsConfirmOpen(true);
            }}
            disabled={isProcessing}
            aria-label="Remove profile picture"
          >
            <X size={12} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={(e) => void handleFileChange(e)}
          aria-label="Select profile picture file"
        />
      </div>

      {errorMessage && (
        <p className={`${styles.errorText} no-print`} role="alert">
          {errorMessage}
        </p>
      )}

      <GeneralConfirmModal
        isOpen={isConfirmOpen}
        title="Remove Profile Picture?"
        description="Are you sure you want to remove your profile picture?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        isDestructive
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          void removeAvatar();
        }}
      />
    </div>
  );
}
