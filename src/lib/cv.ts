import type { Link, SectionItem, SiteContent, SkillGroup } from './types';

export interface CvEntry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  date: string;
  summary: string;
  bullets: string[];
  tech: string[];
  links: Link[];
}

export interface CvGroup {
  id: string;
  title: string;
  entries: CvEntry[];
}

export interface CvModel {
  ready: boolean;
  profile: {
    name: string;
    headline: string;
    summary: string;
    email: string;
    phone: string;
    location: string;
    links: Link[];
    skillGroups: SkillGroup[];
  };
  sections: CvGroup[];
}

function projectToCvEntry(item: SectionItem): CvEntry {
  const links: Link[] = [
    ...(item.liveUrl ? [{ label: 'Live', url: item.liveUrl }] : []),
    ...(item.repoUrl ? [{ label: 'Source', url: item.repoUrl }] : []),
    ...item.links,
  ];
  return {
    id: item.id,
    title: item.title,
    subtitle: item.role,
    location: '',
    date: item.dateLabel,
    summary: item.highlights.length === 0 ? item.summary : '',
    bullets: item.highlights,
    tech: item.tech,
    links,
  };
}

function experienceToCvEntry(item: SectionItem): CvEntry {
  const links: Link[] = [
    ...(item.organizationUrl
      ? [{ label: item.organization || 'Organization', url: item.organizationUrl }]
      : []),
    ...item.links,
  ];
  return {
    id: item.id,
    title: item.title,
    subtitle: [item.organization, item.employmentType].filter(Boolean).join(' · '),
    location: item.location,
    date: item.dateLabel,
    summary: item.highlights.length === 0 ? item.summary : '',
    bullets: item.highlights,
    tech: item.tech,
    links,
  };
}

function educationToCvEntry(item: SectionItem): CvEntry {
  const links: Link[] = [
    ...(item.institutionUrl
      ? [{ label: item.institution || 'Institution', url: item.institutionUrl }]
      : []),
    ...item.links,
  ];
  const gradeLabel = item.grade ? `Grade: ${item.grade}` : '';
  return {
    id: item.id,
    title: [item.title, item.field].filter(Boolean).join(', '),
    subtitle: [item.institution, gradeLabel].filter(Boolean).join(' · '),
    location: item.location,
    date: item.dateLabel,
    summary: item.highlights.length === 0 ? item.summary : '',
    bullets: item.highlights,
    tech: [],
    links,
  };
}

function customItemToCvEntry(item: SectionItem): CvEntry {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    location: item.location,
    date: item.dateLabel,
    summary: item.highlights.length === 0 ? item.summary : '',
    bullets: item.highlights,
    tech: item.tech,
    links: item.links,
  };
}

export function createCvModel(site: SiteContent): CvModel {
  const profile = {
    name: site.settings.name.trim(),
    headline: site.settings.headline.trim(),
    summary: site.settings.bio.trim(),
    email: site.settings.email.trim(),
    phone: site.settings.phone.trim(),
    location: site.settings.location.trim(),
    links: site.settings.links,
    skillGroups: site.settings.skillGroups.filter(group => group.items.length > 0),
  };

  const groups: CvGroup[] = [];

  const experienceEntries = site.experience
    .filter(item => item.published && item.showOnCv)
    .map(experienceToCvEntry);
  if (experienceEntries.length) {
    groups.push({ id: 'experience', title: 'Experience', entries: experienceEntries });
  }

  const projectEntries = site.projects
    .filter(item => item.published && item.showOnCv)
    .map(projectToCvEntry);
  if (projectEntries.length) {
    groups.push({ id: 'projects', title: 'Selected Projects', entries: projectEntries });
  }

  const educationEntries = site.education
    .filter(item => item.published && item.showOnCv)
    .map(educationToCvEntry);
  if (educationEntries.length) {
    groups.push({ id: 'education', title: 'Education', entries: educationEntries });
  }

  for (const section of site.sections) {
    if (!section.published || section.type !== 'general') continue;
    const entries = section.items
      .filter(item => item.published && item.showOnCv)
      .map(customItemToCvEntry);
    if (entries.length) {
      groups.push({ id: `section-${section.slug}`, title: section.title, entries });
    }
  }

  const ready = Boolean(
    profile.name &&
      (groups.length > 0 || profile.skillGroups.length > 0 || profile.summary.length > 0),
  );

  return { ready, profile, sections: groups };
}
