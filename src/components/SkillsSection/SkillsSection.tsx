"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import styles from "./SkillsSection.module.scss";

interface SkillsSectionProps {
  skills: string[];
  onChange: (nextSkills: string[]) => void;
}

export function SkillsSection({ skills, onChange }: SkillsSectionProps) {
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <section className={styles.section} aria-labelledby="skills-heading">
      <h2 id="skills-heading" className={styles.heading}>
        Skills
      </h2>

      <ul className={styles.skillList}>
        {skills.map((skill) => (
          <li key={skill} className={styles.skillTag}>
            <span>{skill}</span>
            <button
              type="button"
              className={`${styles.removeBtn} no-print`}
              onClick={() => handleRemoveSkill(skill)}
              aria-label={`Remove ${skill}`}
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>

      <div className={`${styles.addRow} no-print`}>
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddSkill();
            }
          }}
          placeholder="Add a skill (e.g. Kubernetes)"
          aria-label="New skill"
        />
        <button type="button" onClick={handleAddSkill}>
          <Plus size={15} />
          <span>Add</span>
        </button>
      </div>
    </section>
  );
}

