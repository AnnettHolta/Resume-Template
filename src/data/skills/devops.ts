import { devicon, type SkillCatalogItem } from "./types";

export const DEVOPS_SKILLS: SkillCatalogItem[] = [
  { name: "Docker", category: "DevOps", iconUrl: devicon("docker") },
  { name: "Kubernetes", category: "DevOps", iconUrl: devicon("kubernetes"), aliases: ["k8s"] },
  {
    name: "AWS",
    category: "Cloud",
    iconUrl: devicon("amazonwebservices", "original"),
  },
  { name: "Google Cloud", category: "Cloud", iconUrl: devicon("googlecloud") },
  { name: "Azure", category: "Cloud", iconUrl: devicon("azure") },
  { name: "Terraform", category: "DevOps", iconUrl: devicon("terraform") },
  { name: "GitHub Actions", category: "CI/CD", iconUrl: devicon("githubactions") },
  { name: "GitLab CI", category: "CI/CD", iconUrl: devicon("gitlab") },
  { name: "Jenkins", category: "CI/CD", iconUrl: devicon("jenkins") },
  { name: "CircleCI", category: "CI/CD", iconUrl: devicon("circleci", "plain") },
  { name: "Nginx", category: "DevOps", iconUrl: devicon("nginx") },
  { name: "Linux", category: "DevOps", iconUrl: devicon("linux") },
  { name: "Git", category: "Tooling", iconUrl: devicon("git") },
  { name: "Vercel", category: "Cloud", iconUrl: devicon("vercel") },
];

