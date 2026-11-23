"use client";

import { useMemo, useState } from "react";
import { Code2, MessageSquare, Plus, Sparkles, X } from "lucide-react";
import {
  findSkillCatalogItem,
  SKILLS_CATALOG,
  type SkillCatalogItem,
} from "@/data/skillsCatalog";
import styles from "./SkillsSection.module.scss";

interface SkillsSectionProps {
  skills: string[];
  onChange: (nextSkills: string[]) => void;
}

function SkillIcon({
  iconUrl,
  fallbackKind = "code",
  label,
  size = 14,
}: {
  iconUrl?: string;
  fallbackKind?: SkillCatalogItem["fallbackKind"];
  label: string;
  size?: number;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!iconUrl || failedUrl === iconUrl) {
    if (fallbackKind === "ai") {
      return (
        <Sparkles size={size} className={styles.fallbackIcon} aria-hidden="true" />
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
    return <Code2 size={size} className={styles.fallbackIcon} aria-hidden="true" />;
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

export function SkillsSection({ skills, onChange }: SkillsSectionProps) {
  const [newSkill, setNewSkill] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedSkills, setAnimatedSkills] = useState<Set<string>>(
    () => new Set()
  );

  const normalizedExisting = useMemo(
    () => new Set(skills.map((s) => s.trim().toLowerCase())),
    [skills]
  );

  const suggestions = useMemo(() => {
    const query = newSkill.trim().toLowerCase();
    if (!query) return [];

    const startsWith: typeof SKILLS_CATALOG = [];
    const includes: typeof SKILLS_CATALOG = [];

    for (const item of SKILLS_CATALOG) {
      const lower = item.name.toLowerCase();
      if (normalizedExisting.has(lower)) continue;
      if (lower.startsWith(query)) {
        startsWith.push(item);
      } else if (lower.includes(query)) {
        includes.push(item);
      }
    }

    return [...startsWith, ...includes].slice(0, 8);
  }, [newSkill, normalizedExisting]);

  const isDropdownOpen = isFocused && suggestions.length > 0;
  const clampedActiveIndex =
    suggestions.length > 0 ? Math.min(activeIndex, suggestions.length - 1) : 0;

  const commitAddSkill = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    if (!normalizedExisting.has(trimmed.toLowerCase())) {
      setAnimatedSkills((prev) => {
        const next = new Set(prev);
        next.add(trimmed);
        return next;
      });
      onChange([...skills, trimmed]);
    }
    setNewSkill("");
    setActiveIndex(0);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <section
      className={`${styles.section} ${skills.length === 0 ? "no-print" : ""}`}
      aria-labelledby="skills-heading"
    >
      <h2 id="skills-heading" className={styles.heading}>
        Skills
      </h2>

      <ul className={styles.skillList}>
        {skills.map((skill) => {
          const catalogItem = findSkillCatalogItem(skill);
          const shouldAnimate = animatedSkills.has(skill);
          return (
            <li
              key={skill}
              className={`${styles.skillTag} ${
                shouldAnimate ? styles.skillTagEnter : ""
              }`}
            >
              {catalogItem && (
                <SkillIcon
                  iconUrl={catalogItem.iconUrl}
                  fallbackKind={catalogItem.fallbackKind}
                  label={skill}
                  size={14}
                />
              )}
              <span className={styles.skillName}>{skill}</span>
              <button
                type="button"
                className={`${styles.removeBtn} no-print`}
                onClick={() => handleRemoveSkill(skill)}
                aria-label={`Remove ${skill}`}
              >
                <X size={12} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className={`${styles.addContainer} no-print`}>
        <div className={styles.addRow}>
          <input
            type="text"
            value={newSkill}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
              setNewSkill(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && suggestions.length > 0) {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % suggestions.length);
              } else if (e.key === "ArrowUp" && suggestions.length > 0) {
                e.preventDefault();
                setActiveIndex(
                  (prev) => (prev - 1 + suggestions.length) % suggestions.length
                );
              } else if (e.key === "Escape") {
                setIsFocused(false);
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (isDropdownOpen && suggestions[clampedActiveIndex]) {
                  commitAddSkill(suggestions[clampedActiveIndex].name);
                } else {
                  commitAddSkill(newSkill);
                }
              }
            }}
            placeholder="Add a skill (e.g. Docker, React)"
            aria-label="New skill"
            aria-expanded={isDropdownOpen}
            aria-controls="skills-suggestions-listbox"
            aria-autocomplete="list"
            role="combobox"
          />
          <button
            type="button"
            onClick={() => commitAddSkill(newSkill)}
          >
            <Plus size={15} />
            <span>Add</span>
          </button>
        </div>

        <ul
          id="skills-suggestions-listbox"
          className={`${styles.dropdown} ${
            isDropdownOpen ? styles.dropdownOpen : ""
          }`}
          role="listbox"
          aria-hidden={!isDropdownOpen}
        >
          {suggestions.map((item, idx) => (
            <li key={item.name} role="option" aria-selected={idx === clampedActiveIndex}>
              <button
                type="button"
                className={`${styles.dropdownItem} ${
                  idx === clampedActiveIndex ? styles.dropdownItemActive : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitAddSkill(item.name);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span className={styles.dropdownLeft}>
                  <SkillIcon
                    iconUrl={item.iconUrl}
                    fallbackKind={item.fallbackKind}
                    label={item.name}
                    size={16}
                  />
                  <span className={styles.dropdownName}>{item.name}</span>
                </span>
                <span className={styles.dropdownCategory}>{item.category}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
