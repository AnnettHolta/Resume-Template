import { promises as fs } from "node:fs";
import path from "node:path";
import type { ResumeData } from "@/types/resume";
import { ResumeEditor } from "@/components/ResumeEditor/ResumeEditor";

async function loadInitialResume(): Promise<ResumeData> {
  "use cache";
  const filePath = path.join(process.cwd(), "src", "data", "resume.json");
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as ResumeData;
}

export default async function HomePage() {
  const initialData = await loadInitialResume();

  return <ResumeEditor initialData={initialData} />;
}
