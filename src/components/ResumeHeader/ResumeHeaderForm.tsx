"use client";

import type { ResumeProfile } from "@/types/resume";
import styles from "./ResumeHeader.module.scss";

interface ResumeHeaderFormProps {
  draft: ResumeProfile;
  onChange: (next: ResumeProfile) => void;
  onBlurCommit: () => void;
}

export function ResumeHeaderForm({
  draft,
  onChange,
  onBlurCommit,
}: ResumeHeaderFormProps) {
  const updateContact = (
    field: keyof ResumeProfile["contact"],
    value: string
  ) => {
    onChange({
      ...draft,
      contact: {
        ...draft.contact,
        [field]: value,
      },
    });
  };

  return (
    <div className={styles.editStack}>
      <label className={styles.fieldLabel}>
        <span>Full Name</span>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          onBlur={onBlurCommit}
          placeholder="John Smith"
        />
      </label>
      <label className={styles.fieldLabel}>
        <span>Headline</span>
        <input
          type="text"
          value={draft.headline}
          onChange={(e) => onChange({ ...draft, headline: e.target.value })}
          onBlur={onBlurCommit}
          placeholder="Senior Full-Stack Software Engineer"
        />
      </label>
      <div className={styles.contactGrid}>
        <label className={styles.fieldLabel}>
          <span>Location</span>
          <input
            type="text"
            value={draft.contact.location}
            onChange={(e) => updateContact("location", e.target.value)}
            onBlur={onBlurCommit}
          />
        </label>
        <label className={styles.fieldLabel}>
          <span>Email</span>
          <input
            type="email"
            value={draft.contact.email}
            onChange={(e) => updateContact("email", e.target.value)}
            onBlur={onBlurCommit}
          />
        </label>
        <label className={styles.fieldLabel}>
          <span>Phone</span>
          <input
            type="tel"
            value={draft.contact.phone}
            onChange={(e) => updateContact("phone", e.target.value)}
            onBlur={onBlurCommit}
          />
        </label>
        <label className={styles.fieldLabel}>
          <span>Website</span>
          <input
            type="text"
            value={draft.contact.website ?? ""}
            onChange={(e) => updateContact("website", e.target.value)}
            onBlur={onBlurCommit}
          />
        </label>
        <label className={styles.fieldLabel}>
          <span>LinkedIn</span>
          <input
            type="text"
            value={draft.contact.linkedin ?? ""}
            onChange={(e) => updateContact("linkedin", e.target.value)}
            onBlur={onBlurCommit}
          />
        </label>
        <label className={styles.fieldLabel}>
          <span>GitHub</span>
          <input
            type="text"
            value={draft.contact.github ?? ""}
            onChange={(e) => updateContact("github", e.target.value)}
            onBlur={onBlurCommit}
          />
        </label>
      </div>
    </div>
  );
}

