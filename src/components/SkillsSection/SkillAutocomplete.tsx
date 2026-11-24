"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { findSkillCatalogItem, SKILLS_CATALOG } from "@/data/skillsCatalog";
import { SkillIcon } from "./SkillIcon";
import styles from "./SkillAutocomplete.module.scss";

interface SkillAutocompleteProps {
  existingSkills: Set<string>;
  onAddSkill: (resolvedSkill: string) => void;
  listboxId?: string;
  placeholder?: string;
}

export function SkillAutocomplete({
  existingSkills,
  onAddSkill,
  listboxId = "skills-suggestions-listbox",
  placeholder = "Add a skill (e.g. Docker, React)",
}: SkillAutocompleteProps) {
  const [newSkill, setNewSkill] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => {
    const query = newSkill.trim().toLowerCase();
    if (!query) return [];

    const startsWith: typeof SKILLS_CATALOG = [];
    const includes: typeof SKILLS_CATALOG = [];

    for (const item of SKILLS_CATALOG) {
      const lower = item.name.toLowerCase();
      if (existingSkills.has(lower)) continue;
      const aliasMatches = (item.aliases ?? []).some((alias) =>
        alias.toLowerCase().includes(query),
      );
      if (lower.startsWith(query)) {
        startsWith.push(item);
      } else if (lower.includes(query) || aliasMatches) {
        includes.push(item);
      }
    }

    return [...startsWith, ...includes].slice(0, 8);
  }, [newSkill, existingSkills]);

  const isDropdownOpen = isFocused && suggestions.length > 0;
  const clampedActiveIndex =
    suggestions.length > 0 ? Math.min(activeIndex, suggestions.length - 1) : 0;

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const matched = findSkillCatalogItem(trimmed);
    const resolved = matched ? matched.name : trimmed;
    onAddSkill(resolved);
    setNewSkill("");
    setActiveIndex(0);
  };

  return (
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
                (prev) => (prev - 1 + suggestions.length) % suggestions.length,
              );
            } else if (e.key === "Escape") {
              setIsFocused(false);
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (isDropdownOpen && suggestions[clampedActiveIndex]) {
                commit(suggestions[clampedActiveIndex].name);
              } else {
                commit(newSkill);
              }
            }
          }}
          placeholder={placeholder}
          aria-label="New skill"
          aria-expanded={isDropdownOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          role="combobox"
        />
        <button type="button" onClick={() => commit(newSkill)}>
          <Plus size={15} />
          <span>Add</span>
        </button>
      </div>

      <ul
        id={listboxId}
        className={`${styles.dropdown} ${
          isDropdownOpen ? styles.dropdownOpen : ""
        }`}
        role="listbox"
        aria-hidden={!isDropdownOpen}
      >
        {suggestions.map((item, idx) => (
          <li
            key={item.name}
            role="option"
            aria-selected={idx === clampedActiveIndex}
          >
            <button
              type="button"
              className={`${styles.dropdownItem} ${
                idx === clampedActiveIndex ? styles.dropdownItemActive : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(item.name);
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
  );
}
