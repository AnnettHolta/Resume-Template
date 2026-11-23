"use client";

import { useState } from "react";
import {
  Briefcase,
  Check,
  Code2,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
} from "lucide-react";
import type { ResumeProfile } from "@/types/resume";
import styles from "./ResumeHeader.module.scss";

interface ResumeHeaderProps {
  profile: ResumeProfile;
  onCommit: (nextProfile: ResumeProfile) => void;
}

export function ResumeHeader({ profile, onCommit }: ResumeHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ResumeProfile>(profile);

  const toggleEdit = () => {
    if (isEditing) {
      onCommit(draft);
      setIsEditing(false);
    } else {
      setDraft(profile);
      setIsEditing(true);
    }
  };

  const commitDraft = () => {
    onCommit(draft);
  };

  const updateContact = (
    field: keyof ResumeProfile["contact"],
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value,
      },
    }));
  };

  return (
    <header className={styles.wrapper}>
      <div className={styles.profileHeader}>
        <div className={styles.topRow}>
          <div className={styles.identityRow}>
            <div className={styles.avatar} aria-hidden="true">
              <User size={40} strokeWidth={1.25} />
            </div>

            <div className={styles.identity}>
              {isEditing ? (
                <div className={styles.editStack}>
                  <label className={styles.fieldLabel}>
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, name: e.target.value }))
                      }
                      onBlur={commitDraft}
                      placeholder="John Smith"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span>Headline</span>
                    <input
                      type="text"
                      value={draft.headline}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          headline: e.target.value,
                        }))
                      }
                      onBlur={commitDraft}
                      placeholder="Senior Full-Stack Software Engineer"
                    />
                  </label>
                  <div className={styles.contactGrid}>
                    <label className={styles.fieldLabel}>
                      <span>Location</span>
                      <input
                        type="text"
                        value={draft.contact.location}
                        onChange={(e) =>
                          updateContact("location", e.target.value)
                        }
                        onBlur={commitDraft}
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      <span>Email</span>
                      <input
                        type="email"
                        value={draft.contact.email}
                        onChange={(e) => updateContact("email", e.target.value)}
                        onBlur={commitDraft}
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      <span>Phone</span>
                      <input
                        type="tel"
                        value={draft.contact.phone}
                        onChange={(e) => updateContact("phone", e.target.value)}
                        onBlur={commitDraft}
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      <span>Website</span>
                      <input
                        type="text"
                        value={draft.contact.website ?? ""}
                        onChange={(e) =>
                          updateContact("website", e.target.value)
                        }
                        onBlur={commitDraft}
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      <span>LinkedIn</span>
                      <input
                        type="text"
                        value={draft.contact.linkedin ?? ""}
                        onChange={(e) =>
                          updateContact("linkedin", e.target.value)
                        }
                        onBlur={commitDraft}
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      <span>GitHub</span>
                      <input
                        type="text"
                        value={draft.contact.github ?? ""}
                        onChange={(e) =>
                          updateContact("github", e.target.value)
                        }
                        onBlur={commitDraft}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className={styles.name}>{profile.name}</h1>
                  <p className={styles.headline}>{profile.headline}</p>

                  <address className={styles.metaRow}>
                    {profile.contact.location && (
                      <span className={styles.metaItem}>
                        <MapPin size={14} className={styles.metaIcon} aria-hidden="true" />
                        <span>{profile.contact.location}</span>
                      </span>
                    )}
                    {profile.contact.email && (
                      <>
                        <span className={styles.dot} aria-hidden="true">
                          •
                        </span>
                        <a
                          className={`${styles.metaItem} ${styles.metaLink}`}
                          href={`mailto:${profile.contact.email}`}
                        >
                          <Mail size={14} className={styles.metaIcon} aria-hidden="true" />
                          <span>{profile.contact.email}</span>
                        </a>
                      </>
                    )}
                    {profile.contact.phone && (
                      <>
                        <span className={styles.dot} aria-hidden="true">
                          •
                        </span>
                        <a
                          className={`${styles.metaItem} ${styles.metaLink}`}
                          href={`tel:${profile.contact.phone}`}
                        >
                          <Phone size={14} className={styles.metaIcon} aria-hidden="true" />
                          <span>{profile.contact.phone}</span>
                        </a>
                      </>
                    )}
                  </address>

                  {(profile.contact.website ||
                    profile.contact.linkedin ||
                    profile.contact.github) && (
                    <div className={styles.socialPills}>
                      {profile.contact.website && (
                        <a
                          className={styles.socialPill}
                          href={
                            profile.contact.website.startsWith("http")
                              ? profile.contact.website
                              : `https://${profile.contact.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe size={12} aria-hidden="true" />
                          <span>
                            {profile.contact.website.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      )}
                      {profile.contact.linkedin && (
                        <a
                          className={styles.socialPill}
                          href={
                            profile.contact.linkedin.startsWith("http")
                              ? profile.contact.linkedin
                              : `https://${profile.contact.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Briefcase size={12} aria-hidden="true" />
                          <span>{profile.contact.linkedin}</span>
                        </a>
                      )}
                      {profile.contact.github && (
                        <a
                          className={styles.socialPill}
                          href={
                            profile.contact.github.startsWith("http")
                              ? profile.contact.github
                              : `https://${profile.contact.github}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Code2 size={12} aria-hidden="true" />
                          <span>{profile.contact.github}</span>
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            className={`${styles.editBtn} no-print`}
            onClick={toggleEdit}
            aria-label={isEditing ? "Finish editing header" : "Edit header"}
          >
            {isEditing ? <Check size={14} /> : <Pencil size={14} />}
            <span>{isEditing ? "Done" : "Edit"}</span>
          </button>
        </div>
      </div>

      <section className={styles.aboutSection} aria-labelledby="about-heading">
        <h2 id="about-heading" className={styles.sectionTitle}>
          About
        </h2>
        <div className={styles.aboutBox}>
          {isEditing ? (
            <textarea
              className={styles.summaryInput}
              rows={3}
              value={draft.summary}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, summary: e.target.value }))
              }
              onBlur={commitDraft}
              placeholder="Write a concise professional summary..."
            />
          ) : (
            <p className={styles.summaryText}>{profile.summary}</p>
          )}
        </div>
      </section>
    </header>
  );
}
