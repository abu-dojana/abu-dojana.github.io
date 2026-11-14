export interface Link {
  label: string;
  url: string;
}

export interface Detail {
  label: string;
  value: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export type SectionType = 'projects' | 'experience' | 'education' | 'skills' | 'general';

export interface NavItem {
  id: string;
  label: string;
  type: 'home' | 'section' | 'about' | 'cv' | 'external';
  target: string;
  visible: boolean;
}

export interface Settings {
  siteTitle: string;
  name: string;
  headline: string;
  bio: string;
  avatar: string;
  email: string;
  phone: string;
  location: string;
  links: Link[];
  skillGroups: SkillGroup[];
  homeEyebrow: string;
  homeTitle: string;
  homeDescription: string;
  footerNote: string;
  showCvInNavigation: boolean;
  noindex: boolean;
  externalLinks: Link[];
}

export interface SectionItem {
  id: string;
  slug: string;
  sectionSlug: string;
  kind: 'project' | 'experience' | 'education' | 'item';
  title: string;
  subtitle: string;
  summary: string;
  images: string[];
  files: string[];
  cover: string;
  coverAlt: string;
  date: string;
  endDate: string;
  current: boolean;
  dateLabel: string;
  status: '' | 'planned' | 'in-progress' | 'completed' | 'archived';
  role: string;
  organization: string;
  organizationUrl: string;
  employmentType: string;
  institution: string;
  institutionUrl: string;
  field: string;
  grade: string;
  location: string;
  tech: string[];
  tags: string[];
  highlights: string[];
  liveUrl: string;
  repoUrl: string;
  links: Link[];
  details: Detail[];
  featured: boolean;
  showOnCv: boolean;
  published: boolean;
  order: number;
  body: string;
  html: string;
  readingMinutes: number;
}

export interface Section {
  id: string;
  slug: string;
  title: string;
  type: SectionType;
  summary: string;
  published: boolean;
  showInNavigation: boolean;
  navigationLabel: string;
  order: number;
  body: string;
  html: string;
  items: SectionItem[];
}

export interface SiteContent {
  settings: Settings;
  sections: Section[];
  about: Section;
  projects: SectionItem[];
  experience: SectionItem[];
  education: SectionItem[];
  customItems: SectionItem[];
  allItems: SectionItem[];
}
