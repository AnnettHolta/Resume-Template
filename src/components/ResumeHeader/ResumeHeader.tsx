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
} from "lucide-react";
import type { ResumeProfile } from "@/types/resume";
import { AvatarPicker } from "./AvatarPicker";
import { ResumeHeaderForm } from "./ResumeHeaderForm";
import styles from "./ResumeHeader.module.scss";

interface ResumeHeaderProps {
  profile: ResumeProfile;
  onCommit: (nextProfile: ResumeProfile) => void;
}

export function ResumeHeader({ profile, onCommit }: ResumeHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ResumeProfile>(profile);
  const [previousProfile, setPreviousProfile] = useState(profile);

  if (profile !== previousProfile) {
    setPreviousProfile(profile);
    setDraft(profile);
  }

  const toggleEdit = () => {
    if (isEditing) {
      onCommit(draft);
      setIsEditing(false);
    } else {
      setDraft(profile);
      setIsEditing(true);
    }
  };

  return (
    <header className={styles.wrapper} data-resume-profile>
      <div className={styles.profileHeader}>
        <div className={styles.topRow}>
          <div className={styles.identityRow}>
            <AvatarPicker name={profile.name} />

            <div className={styles.identity}>
              {isEditing && (
                <ResumeHeaderForm
                  draft={draft}
                  onChange={setDraft}
                  onBlurCommit={() => onCommit(draft)}
                />
              )}
              <div className={isEditing ? styles.printOnly : undefined}>
                <h1 className={styles.name}>{profile.name}</h1>
                {profile.headline.trim() && (
                  <p className={styles.headline}>{profile.headline}</p>
                )}

                <address className={styles.metaRow}>
                  {profile.contact.location && (
                    <span className={styles.metaItem}>
                      <MapPin
                        size={14}
                        className={styles.metaIcon}
                        aria-hidden="true"
                      />
                      <span>{profile.contact.location}</span>
                    </span>
                  )}
                  {profile.contact.email && (
                    <>
                      {profile.contact.location && (
                        <span className={styles.dot} aria-hidden="true">
                          •
                        </span>
                      )}
                      <a
                        className={`${styles.metaItem} ${styles.metaLink}`}
                        href={`mailto:${profile.contact.email}`}
                      >
                        <Mail
                          size={14}
                          className={styles.metaIcon}
                          aria-hidden="true"
                        />
                        <span>{profile.contact.email}</span>
                      </a>
                    </>
                  )}
                  {profile.contact.phone && (
                    <>
                      {(profile.contact.location || profile.contact.email) && (
                        <span className={styles.dot} aria-hidden="true">
                          •
                        </span>
                      )}
                      <a
                        className={`${styles.metaItem} ${styles.metaLink}`}
                        href={`tel:${profile.contact.phone}`}
                      >
                        <Phone
                          size={14}
                          className={styles.metaIcon}
                          aria-hidden="true"
                        />
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
              </div>
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

        <section
          className={`${styles.aboutSection} ${
            !profile.summary.trim()
              ? isEditing
                ? styles.hideEmptySummaryInPrint
                : "no-print"
              : ""
          }`}
          aria-labelledby="about-heading"
        >
          <div className={styles.aboutDivider}>
            <h2 id="about-heading" className={styles.sectionTitle}>
              About
            </h2>
            <span className={styles.dividerLine} aria-hidden="true" />
          </div>
          {isEditing && (
            <textarea
              className={`${styles.summaryInput} no-print`}
              rows={3}
              value={draft.summary}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, summary: e.target.value }))
              }
              onBlur={() => onCommit(draft)}
              placeholder="Write a concise professional summary..."
            />
          )}
          <p
            className={`${styles.summaryText} ${isEditing ? styles.printOnly : ""}`}
          >
            {profile.summary}
          </p>
        </section>
      </div>
    </header>
  );
}
