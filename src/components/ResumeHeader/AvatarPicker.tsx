"use client";

import { useId, useRef, useState } from "react";
import { Camera, Check, Plus, Trash2, User, X } from "lucide-react";
import { GeneralConfirmModal } from "@/components/GeneralConfirmModal/GeneralConfirmModal";
import { Modal } from "@/components/Modal/Modal";
import { useAvatarBlob } from "@/hooks/useAvatarBlob";
import styles from "./AvatarPicker.module.scss";

interface AvatarPickerProps {
  name: string;
  resumeId?: string;
  canEdit?: boolean;
  canEditNow?: () => boolean;
}

export function AvatarPicker({
  name,
  resumeId,
  canEdit = true,
  canEditNow,
}: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const {
    gallery,
    urls,
    avatarUrl,
    isProcessing,
    errorMessage,
    uploadAvatar,
    selectAvatar,
    deleteAvatar,
  } = useAvatarBlob(resumeId, canEdit, canEditNow);
  const editable = Boolean(resumeId && canEdit);

  return (
    <div className={styles.wrapper}>
      <div className={styles.avatarFrame}>
        <button
          type="button"
          className={styles.avatarButton}
          onClick={(event) => {
            event.currentTarget.focus();
            setOpen(true);
          }}
          aria-label="Open profile photo gallery"
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
      </div>
      {errorMessage && (
        <p className={`${styles.errorText} no-print`} role="alert">
          {errorMessage}
        </p>
      )}
      <Modal
        isOpen={open}
        titleId={titleId}
        className={styles.dialog}
        onClose={() => setOpen(false)}
      >
        <div className={styles.galleryHeader}>
          <h2 id={titleId}>Profile photo</h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close photo gallery"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        {!editable && (
          <p className={styles.description}>
            Switch editing to this tab to change photos.
          </p>
        )}
        <div className={styles.gallery}>
          <button
            type="button"
            className={styles.uploadTile}
            disabled={!editable || isProcessing}
            onClick={() => inputRef.current?.click()}
            data-dialog-focus
          >
            <Plus size={24} aria-hidden="true" /> Upload photo
          </button>
          {gallery.photos.map((photo, index) => (
            <div key={photo.id} className={styles.photoTile}>
              <button
                type="button"
                className={styles.selectPhoto}
                disabled={!editable || isProcessing}
                onClick={() => void selectAvatar(photo.id)}
                aria-label={`Select saved photo ${index + 1}`}
                aria-pressed={gallery.selectedId === photo.id}
              >
                {urls[photo.id] && ( // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[photo.id]} alt="" />
                )}
                {gallery.selectedId === photo.id && (
                  <span className={styles.selected} aria-hidden="true">
                    <Check size={14} />
                  </span>
                )}
              </button>
              {editable && (
                <button
                  type="button"
                  className={styles.deletePhoto}
                  disabled={!editable || isProcessing}
                  onClick={(event) => {
                    event.currentTarget.focus();
                    setPendingDelete(photo.id);
                  }}
                  aria-label={`Delete saved photo ${index + 1}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={!editable}
          className={styles.hiddenInput}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file && editable) void uploadAvatar(file);
          }}
          aria-label="Select profile picture file"
        />
        {editable && gallery.selectedId && (
          <button
            type="button"
            className={styles.removeFromResume}
            disabled={!editable || isProcessing}
            onClick={() => void selectAvatar(null)}
          >
            Remove from resume
          </button>
        )}
        {errorMessage && (
          <p role="alert" className={styles.galleryError}>
            {errorMessage}
          </p>
        )}
      </Modal>
      <GeneralConfirmModal
        isOpen={open && editable && pendingDelete !== null}
        title="Delete saved photo?"
        description="This removes the photo from this browser’s gallery. If it’s selected, it will also be removed from the resume."
        confirmLabel="Delete saved photo"
        isDestructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void deleteAvatar(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
