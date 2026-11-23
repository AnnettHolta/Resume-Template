export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface ResumeProfile {
  name: string;
  headline: string;
  summary: string;
  contact: ContactInfo;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  companyImageUrl: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface ResumeData {
  profile: ResumeProfile;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
}

