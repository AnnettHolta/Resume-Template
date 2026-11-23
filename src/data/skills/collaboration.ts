import { devicon, type SkillCatalogItem } from "./types";

export const COLLABORATION_SKILLS: SkillCatalogItem[] = [
  {
    name: "Jira",
    category: "Collaboration",
    iconUrl: devicon("jira"),
    fallbackKind: "comms",
  },
  {
    name: "Confluence",
    category: "Collaboration",
    iconUrl: devicon("confluence"),
    fallbackKind: "comms",
  },
  {
    name: "Slack",
    category: "Communication",
    iconUrl: devicon("slack"),
    fallbackKind: "comms",
  },
  {
    name: "Mattermost",
    category: "Communication",
    iconUrl: devicon("mattermost"),
    fallbackKind: "comms",
  },
  {
    name: "Notion",
    category: "Collaboration",
    iconUrl: devicon("notion"),
    fallbackKind: "comms",
  },
  {
    name: "Trello",
    category: "Collaboration",
    iconUrl: devicon("trello"),
    fallbackKind: "comms",
  },
  {
    name: "Linear",
    category: "Collaboration",
    iconUrl: devicon("linear"),
    fallbackKind: "comms",
  },
  { name: "Microsoft Teams", category: "Communication", fallbackKind: "comms" },
  {
    name: "Discord",
    category: "Communication",
    iconUrl: "https://cdn.simpleicons.org/discord/5865F2",
    fallbackKind: "comms",
  },
  {
    name: "Figma",
    category: "Collaboration",
    iconUrl: devicon("figma"),
    fallbackKind: "comms",
  },
];
