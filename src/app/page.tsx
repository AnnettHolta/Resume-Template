import initialData from "@/data/resume.json";
import { ResumeEditor } from "@/components/ResumeEditor/ResumeEditor";

export default function HomePage() {
  return <ResumeEditor initialData={initialData} />;
}
