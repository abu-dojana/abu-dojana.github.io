export interface Link { label: string; url: string }
export interface NavItem {
  id: string; label: string;
  type: 'home' | 'explore' | 'page' | 'category' | 'cv' | 'external';
  target: string; visible: boolean;
}
export interface Settings {
  siteTitle: string; name: string; headline: string; bio: string;
  email: string; location: string; links: Link[]; skills: string[];
  homeEyebrow: string; homeTitle: string; homeDescription: string;
  footerNote: string; preview: boolean; navigation: NavItem[];
}
export interface Category { id: string; slug: string; title: string; description: string; order: number }
export interface CvSection { id: string; title: string; order: number }
export interface Entry {
  id: string; slug: string; title: string; summary: string;
  categories: string[]; tags: string[]; published: boolean; example: boolean;
  featured: boolean; date: string; endDate: string; cover: string; coverAlt: string;
  links: Link[]; details: { label: string; value: string }[];
  progress: '' | 'planned' | 'in-progress' | 'completed';
  cv: { include: boolean; section: string; title: string; subtitle: string; date: string; bullets: string[]; order: number };
  body: string; html: string; readingMinutes: number;
}
export interface Page { id: string; slug: string; title: string; summary: string; published: boolean; example: boolean; body: string; html: string }
export interface SiteContent { settings: Settings; categories: Category[]; entries: Entry[]; pages: Page[]; cvSections: CvSection[] }
