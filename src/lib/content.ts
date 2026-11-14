import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import type {
  Detail,
  NavItem,
  Section,
  SectionItem,
  SectionType,
  Settings,
  SiteContent,
  SkillGroup,
} from './types';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BUILTIN_SECTION_TYPES = new Set<SectionType>(['projects', 'experience', 'education', 'skills']);
const RESERVED_SECTION_SLUGS = new Set([
  'about',
  'cv',
  'pages',
  'entries',
  'sections',
  'images',
  'files',
  'explore',
  'categories',
  'robots.txt',
  '404',
]);

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const text = () =>
  z.preprocess(v => (v == null ? '' : String(v)), z.string().trim().default(''));

const markdownBody = z.preprocess(v => (v == null ? '' : String(v)), z.string().default(''));

const list = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    v => (v == null ? [] : Array.isArray(v) ? v : [v]),
    z.array(schema).default([]),
  );

const stringList = list(text()).transform(items => items.filter(Boolean));

const orderField = z.preprocess(
  v => (v == null || v === '' ? 0 : Number(v)),
  z.number().refine(Number.isFinite, 'Order must be a valid number').default(0),
);

const booleanField = (fallback: boolean) =>
  z.preprocess(v => (v == null ? fallback : Boolean(v)), z.boolean().default(fallback));

const urlString = text().refine(
  v => !v || /^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v) || /^mailto:/i.test(v),
  'Use an https:// link or a /local/path',
);

const linkSchema = z.object({
  label: text().refine(v => v.length > 0, 'Link label is required'),
  url: urlString.refine(v => v.length > 0, 'Link URL is required'),
});

const detailSchema = z.object({
  label: text().refine(v => v.length > 0, 'Detail label is required'),
  value: text(),
});

const skillGroupSchema = z.object({
  category: text().refine(v => v.length > 0, 'Skill group category is required'),
  items: stringList,
});

const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const dateField = z.preprocess(
  v => {
    if (v == null || v === '') return '';
    if (v instanceof Date) {
      return Number.isNaN(v.getTime()) ? 'invalid' : v.toISOString().slice(0, 10);
    }
    const str = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return str.slice(0, 10);
    return str;
  },
  z
    .string()
    .default('')
    .refine(v => !v || validDate(v), 'Use a real calendar date in YYYY-MM-DD format'),
);

const optionalSlugField = text().refine(
  v => !v || slugPattern.test(v),
  'Use lowercase letters, numbers, and hyphens',
);

const settingsSchema = z.object({
  siteTitle: text().refine(v => v.length > 0, 'Website title is required'),
  name: text(),
  headline: text(),
  bio: text(),
  avatar: urlString,
  email: text(),
  phone: text(),
  location: text(),
  links: list(linkSchema),
  skillGroups: list(skillGroupSchema),
  skills: stringList.optional(),
  homeEyebrow: text(),
  homeTitle: text(),
  homeDescription: text(),
  footerNote: text(),
  showCvInNavigation: booleanField(true),
  noindex: booleanField(false),
  externalLinks: list(linkSchema),
});

const sectionSchema = z.object({
  id: text().optional(),
  title: text().refine(v => v.length > 0, 'Section title is required'),
  slug: optionalSlugField,
  type: z.preprocess(
    v => (v == null || v === '' ? 'general' : v),
    z.enum(['projects', 'experience', 'education', 'skills', 'general']).default('general'),
  ),
  summary: text(),
  published: booleanField(true),
  showInNavigation: booleanField(true),
  navigationLabel: text(),
  order: orderField,
});

const aboutSchema = z.object({
  title: text().default('About'),
  summary: text(),
  published: booleanField(true),
  showInNavigation: booleanField(true),
  navigationLabel: text(),
});

const mediaListField = z.preprocess(
  v => {
    if (v == null || v === '') return [];
    if (Array.isArray(v)) return v.map(item => (item == null ? '' : String(item).trim())).filter(Boolean);
    return [String(v).trim()].filter(Boolean);
  },
  z.array(urlString).default([]),
);

const projectSchema = z.object({
  id: text().optional(),
  title: text().refine(v => v.length > 0, 'Project title is required'),
  slug: optionalSlugField,
  summary: text(),
  images: mediaListField,
  files: mediaListField,
  pdf: urlString,
  file: urlString,
  cover: urlString,
  coverAlt: text(),
  role: text(),
  tech: stringList,
  liveUrl: urlString,
  repoUrl: urlString,
  links: list(linkSchema),
  status: z.preprocess(
    v => (v == null ? '' : v),
    z.enum(['', 'planned', 'in-progress', 'completed', 'archived']).default(''),
  ),
  startDate: dateField,
  endDate: dateField,
  highlights: stringList,
  tags: stringList,
  featured: booleanField(false),
  showOnCv: booleanField(true),
  order: orderField,
  published: booleanField(true),
});

const experienceSchema = z.object({
  id: text().optional(),
  title: text().refine(v => v.length > 0, 'Role / job title is required'),
  slug: optionalSlugField,
  organization: text().refine(v => v.length > 0, 'Company / organization is required'),
  organizationUrl: urlString,
  employmentType: text(),
  location: text(),
  startDate: dateField,
  endDate: dateField,
  current: booleanField(false),
  summary: text(),
  highlights: stringList,
  tech: stringList,
  images: mediaListField,
  files: mediaListField,
  pdf: urlString,
  file: urlString,
  cover: urlString,
  coverAlt: text(),
  links: list(linkSchema),
  showOnCv: booleanField(true),
  order: orderField,
  published: booleanField(true),
});

const educationSchema = z.object({
  id: text().optional(),
  degree: text().refine(v => v.length > 0, 'Degree / qualification is required'),
  slug: optionalSlugField,
  institution: text().refine(v => v.length > 0, 'Institution is required'),
  institutionUrl: urlString,
  field: text(),
  location: text(),
  startDate: dateField,
  endDate: dateField,
  current: booleanField(false),
  grade: text(),
  summary: text(),
  highlights: stringList,
  images: mediaListField,
  files: mediaListField,
  pdf: urlString,
  file: urlString,
  cover: urlString,
  coverAlt: text(),
  links: list(linkSchema),
  showOnCv: booleanField(true),
  order: orderField,
  published: booleanField(true),
});

const customItemSchema = z.object({
  id: text().optional(),
  title: text().refine(v => v.length > 0, 'Title is required'),
  slug: optionalSlugField,
  section: text(),
  summary: text(),
  images: mediaListField,
  files: mediaListField,
  pdf: urlString,
  file: urlString,
  cover: urlString,
  coverAlt: text(),
  subtitle: text(),
  date: dateField,
  endDate: dateField,
  tags: stringList,
  details: list(detailSchema),
  links: list(linkSchema),
  highlights: stringList,
  showOnCv: booleanField(false),
  order: orderField,
  published: booleanField(true),
});

export function renderMarkdown(body: string): string {
  const html = marked.parse(body, { async: false });
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'figure', 'figcaption', 'details', 'summary'],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      code: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      img: (_tagName, attributes) => ({ tagName: 'img', attribs: { ...attributes, loading: 'lazy' } }),
    },
  });
}

function files(folder: string, extension: string): string[] {
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter(file => file.endsWith(extension))
    .sort()
    .map(file => path.join(folder, file));
}

function parseFile<T>(filename: string, schema: z.ZodType<T>, markdown = false): T & { body: string } {
  try {
    const source = fs.readFileSync(filename, 'utf8');
    const parsed = markdown ? matter(source) : { data: JSON.parse(source), content: '' };
    const body = markdownBody.parse(parsed.content);
    return { ...schema.parse(parsed.data), body };
  } catch (error) {
    throw new Error(`Content error in ${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function resolveSlug(explicitSlug: string, filename: string, title: string): string {
  if (explicitSlug) return explicitSlug;
  const fromFile = slugify(path.basename(filename, path.extname(filename)));
  if (fromFile) return fromFile;
  const fromTitle = slugify(title);
  if (fromTitle) return fromTitle;
  throw new Error(`Content error in ${filename}: Could not derive a valid URL slug.`);
}

function mergeMediaUrls(...inputs: Array<string | string[] | undefined>): string[] {
  const urls: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) urls.push(...input);
    else urls.push(input);
  }
  return [...new Set(urls.map(u => u.trim()).filter(Boolean))];
}

/** Whether a URL or path points to a PDF document. */
export function isPdfUrl(url: string): boolean {
  return /\.pdf(?:$|[?#])/i.test(url.trim());
}

/** Format a concise, readable label for an attached document or PDF link. */
export function formatFileLabel(fileUrl: string, index = 0, total = 1, mode: 'action' | 'short' = 'action'): string {
  const isPdf = isPdfUrl(fileUrl);
  if (mode === 'short') {
    if (isPdf) return total > 1 ? `PDF ${index + 1}` : 'PDF';
    return total > 1 ? `Document ${index + 1}` : 'Document';
  }
  if (isPdf) return total > 1 ? `Read PDF ${index + 1}` : 'Read PDF';
  return total > 1 ? `Open document ${index + 1}` : 'Open document';
}

/** Extract a safe display filename from a file URL or local path. */
export function fileDisplayName(fileUrl: string): string {
  const raw = fileUrl.split('/').pop()?.split(/[?#]/)[0] || 'document.pdf';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function readingTime(body: string): number {
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

export function formatDate(value: string): string {
  if (!value) return '';
  if (!validDate(value)) return value;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}

export function formatMonthYear(value: string): string {
  if (!value) return '';
  if (!validDate(value)) return value;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}

export function formatDateRange(start: string, end: string, current = false): string {
  const startLabel = formatMonthYear(start);
  const endLabel = current ? 'Present' : formatMonthYear(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  if (startLabel) return startLabel;
  if (endLabel) return current ? 'Present' : `Until ${endLabel}`;
  return '';
}

function createBaseItem(fields: {
  id?: string;
  slug: string;
  sectionSlug: string;
  kind: SectionItem['kind'];
  title: string;
  subtitle?: string;
  summary: string;
  images: string[];
  files?: string[];
  coverAlt?: string;
  date: string;
  endDate: string;
  current?: boolean;
  status?: SectionItem['status'];
  role?: string;
  organization?: string;
  organizationUrl?: string;
  employmentType?: string;
  institution?: string;
  institutionUrl?: string;
  field?: string;
  grade?: string;
  location?: string;
  tech?: string[];
  tags?: string[];
  highlights?: string[];
  liveUrl?: string;
  repoUrl?: string;
  links?: { label: string; url: string }[];
  details?: Detail[];
  featured?: boolean;
  showOnCv: boolean;
  published: boolean;
  order: number;
  body: string;
}): SectionItem {
  const cover = fields.images[0] || '';
  return {
    id: fields.id || `${fields.kind}:${fields.sectionSlug}:${fields.slug}`,
    slug: fields.slug,
    sectionSlug: fields.sectionSlug,
    kind: fields.kind,
    title: fields.title,
    subtitle: fields.subtitle || '',
    summary: fields.summary,
    images: fields.images,
    files: fields.files || [],
    cover,
    coverAlt: fields.coverAlt || (cover ? `${fields.title} preview` : ''),
    date: fields.date,
    endDate: fields.endDate,
    current: Boolean(fields.current),
    dateLabel: formatDateRange(fields.date, fields.endDate, Boolean(fields.current)),
    status: fields.status || '',
    role: fields.role || '',
    organization: fields.organization || '',
    organizationUrl: fields.organizationUrl || '',
    employmentType: fields.employmentType || '',
    institution: fields.institution || '',
    institutionUrl: fields.institutionUrl || '',
    field: fields.field || '',
    grade: fields.grade || '',
    location: fields.location || '',
    tech: fields.tech || [],
    tags: fields.tags || [],
    highlights: fields.highlights || [],
    liveUrl: fields.liveUrl || '',
    repoUrl: fields.repoUrl || '',
    links: fields.links || [],
    details: fields.details || [],
    featured: Boolean(fields.featured),
    showOnCv: fields.showOnCv,
    published: fields.published,
    order: fields.order,
    body: fields.body,
    html: renderMarkdown(fields.body),
    readingMinutes: readingTime(fields.body),
  };
}

function sortItems(items: SectionItem[]): SectionItem[] {
  return [...items].sort(
    (a, b) => a.order - b.order || b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
  );
}

export function validateSite(site: SiteContent): SiteContent {
  const sectionSlugs = new Set<string>();
  const builtInTypes = new Map<SectionType, string>();

  for (const section of site.sections) {
    if (RESERVED_SECTION_SLUGS.has(section.slug)) {
      throw new Error(`Section "${section.title}" cannot use reserved URL slug "${section.slug}".`);
    }
    if (sectionSlugs.has(section.slug)) {
      throw new Error(`Duplicate section URL slug "${section.slug}". Each section must have a unique slug.`);
    }
    sectionSlugs.add(section.slug);

    if (BUILTIN_SECTION_TYPES.has(section.type)) {
      const existing = builtInTypes.get(section.type);
      if (existing) {
        throw new Error(
          `Only one section can use type "${section.type}" (found "${existing}" and "${section.title}"). Use "general" for custom sections.`,
        );
      }
      builtInTypes.set(section.type, section.title);
    }
  }

  const sectionMap = new Map(site.sections.map(section => [section.slug, section]));
  for (const item of site.customItems) {
    const target = sectionMap.get(item.sectionSlug);
    if (!target) {
      throw new Error(`Item "${item.title}" refers to section "${item.sectionSlug || '(none)'}", which does not exist.`);
    }
    if (target.type !== 'general') {
      throw new Error(
        `Item "${item.title}" points to "${target.title}" (type "${target.type}"). Add items for that section in its own collection, or pick a Custom section.`,
      );
    }
  }

  const checkItemSlugs = (items: SectionItem[], scopeLabel: string) => {
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.sectionSlug}/${item.slug}`;
      if (seen.has(key)) {
        throw new Error(`Duplicate URL slug "${item.slug}" in ${scopeLabel}. Give each file or custom slug a unique name.`);
      }
      seen.add(key);
    }
  };

  checkItemSlugs(site.projects, 'projects');
  checkItemSlugs(site.experience, 'experience');
  checkItemSlugs(site.education, 'education');
  checkItemSlugs(site.customItems, 'custom items');

  return site;
}

export function getSite(root = path.resolve('content')): SiteContent {
  const rawSettings = parseFile(path.join(root, 'site.json'), settingsSchema);
  const skillGroups: SkillGroup[] = rawSettings.skillGroups.length
    ? rawSettings.skillGroups
    : rawSettings.skills && rawSettings.skills.length
      ? [{ category: 'Skills', items: rawSettings.skills }]
      : [];

  const settings: Settings = {
    siteTitle: rawSettings.siteTitle,
    name: rawSettings.name || rawSettings.siteTitle,
    headline: rawSettings.headline,
    bio: rawSettings.bio,
    avatar: rawSettings.avatar,
    email: rawSettings.email,
    phone: rawSettings.phone,
    location: rawSettings.location,
    links: rawSettings.links,
    skillGroups,
    homeEyebrow: rawSettings.homeEyebrow,
    homeTitle: rawSettings.homeTitle,
    homeDescription: rawSettings.homeDescription,
    footerNote: rawSettings.footerNote,
    showCvInNavigation: rawSettings.showCvInNavigation,
    noindex: rawSettings.noindex,
    externalLinks: rawSettings.externalLinks,
  };

  const sections: Section[] = files(path.join(root, 'sections'), '.md')
    .map(filename => {
      const parsed = parseFile(filename, sectionSchema, true);
      const slug = resolveSlug(parsed.slug, filename, parsed.title);
      return {
        id: parsed.id || slug,
        slug,
        title: parsed.title,
        type: parsed.type,
        summary: parsed.summary,
        published: parsed.published,
        showInNavigation: parsed.showInNavigation,
        navigationLabel: parsed.navigationLabel,
        order: parsed.order,
        body: parsed.body,
        html: renderMarkdown(parsed.body),
        items: [],
      };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  const sectionByType = new Map<SectionType, Section>();
  for (const section of sections) {
    if (BUILTIN_SECTION_TYPES.has(section.type) && !sectionByType.has(section.type)) {
      sectionByType.set(section.type, section);
    }
  }

  const projectsSection = sectionByType.get('projects');
  const experienceSection = sectionByType.get('experience');
  const educationSection = sectionByType.get('education');

  const projects = sortItems(
    files(path.join(root, 'projects'), '.md').map(filename => {
      const parsed = parseFile(filename, projectSchema, true);
      const slug = resolveSlug(parsed.slug, filename, parsed.title);
      return createBaseItem({
        id: parsed.id,
        slug,
        sectionSlug: projectsSection?.slug || 'projects',
        kind: 'project',
        title: parsed.title,
        subtitle: parsed.role,
        summary: parsed.summary,
        images: mergeMediaUrls(parsed.images, parsed.cover),
        files: mergeMediaUrls(parsed.files, parsed.pdf, parsed.file),
        coverAlt: parsed.coverAlt,
        date: parsed.startDate,
        endDate: parsed.endDate,
        status: parsed.status,
        role: parsed.role,
        tech: parsed.tech,
        tags: parsed.tags,
        highlights: parsed.highlights,
        liveUrl: parsed.liveUrl,
        repoUrl: parsed.repoUrl,
        links: parsed.links,
        featured: parsed.featured,
        showOnCv: parsed.showOnCv,
        published: (projectsSection ? projectsSection.published : true) && parsed.published,
        order: parsed.order,
        body: parsed.body,
      });
    }),
  );

  const experience = sortItems(
    files(path.join(root, 'experience'), '.md').map(filename => {
      const parsed = parseFile(filename, experienceSchema, true);
      const slug = resolveSlug(parsed.slug, filename, parsed.title);
      return createBaseItem({
        id: parsed.id,
        slug,
        sectionSlug: experienceSection?.slug || 'experience',
        kind: 'experience',
        title: parsed.title,
        subtitle: [parsed.organization, parsed.employmentType].filter(Boolean).join(' · '),
        summary: parsed.summary,
        images: mergeMediaUrls(parsed.images, parsed.cover),
        files: mergeMediaUrls(parsed.files, parsed.pdf, parsed.file),
        coverAlt: parsed.coverAlt,
        date: parsed.startDate,
        endDate: parsed.endDate,
        current: parsed.current,
        organization: parsed.organization,
        organizationUrl: parsed.organizationUrl,
        employmentType: parsed.employmentType,
        location: parsed.location,
        tech: parsed.tech,
        highlights: parsed.highlights,
        links: parsed.links,
        showOnCv: parsed.showOnCv,
        published: (experienceSection ? experienceSection.published : true) && parsed.published,
        order: parsed.order,
        body: parsed.body,
      });
    }),
  );

  const education = sortItems(
    files(path.join(root, 'education'), '.md').map(filename => {
      const parsed = parseFile(filename, educationSchema, true);
      const slug = resolveSlug(parsed.slug, filename, parsed.degree);
      return createBaseItem({
        id: parsed.id,
        slug,
        sectionSlug: educationSection?.slug || 'education',
        kind: 'education',
        title: parsed.degree,
        subtitle: [parsed.institution, parsed.field].filter(Boolean).join(' · '),
        summary: parsed.summary,
        images: mergeMediaUrls(parsed.images, parsed.cover),
        files: mergeMediaUrls(parsed.files, parsed.pdf, parsed.file),
        coverAlt: parsed.coverAlt,
        date: parsed.startDate,
        endDate: parsed.endDate,
        current: parsed.current,
        institution: parsed.institution,
        institutionUrl: parsed.institutionUrl,
        field: parsed.field,
        grade: parsed.grade,
        location: parsed.location,
        highlights: parsed.highlights,
        links: parsed.links,
        showOnCv: parsed.showOnCv,
        published: (educationSection ? educationSection.published : true) && parsed.published,
        order: parsed.order,
        body: parsed.body,
      });
    }),
  );

  const sectionBySlugOrId = new Map<string, Section>();
  for (const section of sections) {
    sectionBySlugOrId.set(section.slug, section);
    sectionBySlugOrId.set(section.id, section);
  }

  const customItems = sortItems(
    files(path.join(root, 'items'), '.md').map(filename => {
      const parsed = parseFile(filename, customItemSchema, true);
      const slug = resolveSlug(parsed.slug, filename, parsed.title);
      const owner = sectionBySlugOrId.get(parsed.section);
      const sectionSlug = owner?.slug || parsed.section;
      return createBaseItem({
        id: parsed.id,
        slug,
        sectionSlug,
        kind: 'item',
        title: parsed.title,
        subtitle: parsed.subtitle,
        summary: parsed.summary,
        images: mergeMediaUrls(parsed.images, parsed.cover),
        files: mergeMediaUrls(parsed.files, parsed.pdf, parsed.file),
        coverAlt: parsed.coverAlt,
        date: parsed.date,
        endDate: parsed.endDate,
        tags: parsed.tags,
        details: parsed.details,
        links: parsed.links,
        highlights: parsed.highlights,
        showOnCv: parsed.showOnCv,
        published: (owner ? owner.published : true) && parsed.published,
        order: parsed.order,
        body: parsed.body,
      });
    }),
  );

  for (const section of sections) {
    if (section.type === 'projects') section.items = projects;
    else if (section.type === 'experience') section.items = experience;
    else if (section.type === 'education') section.items = education;
    else if (section.type === 'general') {
      section.items = customItems.filter(item => item.sectionSlug === section.slug);
    }
  }

  const aboutFile = path.join(root, 'about.md');
  const aboutParsed = fs.existsSync(aboutFile)
    ? parseFile(aboutFile, aboutSchema, true)
    : { ...aboutSchema.parse({ title: 'About' }), body: '' };
  const about: Section = {
    id: 'about',
    slug: 'about',
    title: aboutParsed.title || 'About',
    type: 'general',
    summary: aboutParsed.summary,
    published: aboutParsed.published,
    showInNavigation: aboutParsed.showInNavigation,
    navigationLabel: aboutParsed.navigationLabel || 'About',
    order: 999,
    body: aboutParsed.body,
    html: renderMarkdown(aboutParsed.body),
    items: [],
  };

  const allItems = [...projects, ...experience, ...education, ...customItems];

  return validateSite({
    settings,
    sections,
    about,
    projects,
    experience,
    education,
    customItems,
    allItems,
  });
}

export function sectionHasContent(section: Section, site: Pick<SiteContent, 'settings'>): boolean {
  if (section.type === 'skills') {
    return (
      site.settings.skillGroups.some(group => group.items.length > 0) ||
      section.items.some(item => item.published) ||
      section.body.trim().length > 0
    );
  }
  if (section.slug === 'about') {
    return (
      section.body.trim().length > 0 ||
      section.summary.trim().length > 0 ||
      section.items.some(item => item.published)
    );
  }
  return section.items.some(item => item.published) || section.body.trim().length > 0;
}

export function isSectionVisible(section: Section, site: Pick<SiteContent, 'settings'>): boolean {
  return section.published && sectionHasContent(section, site);
}

export function getVisibleSections(site: SiteContent): Section[] {
  return [...site.sections]
    .filter(section => isSectionVisible(section, site))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getNavigation(site: SiteContent): NavItem[] {
  const items: NavItem[] = [
    { id: 'nav-home', label: 'Home', type: 'home', target: '/', visible: true },
  ];

  for (const section of getVisibleSections(site)) {
    if (!section.showInNavigation) continue;
    items.push({
      id: `section-${section.slug}`,
      label: section.navigationLabel || section.title,
      type: 'section',
      target: section.slug,
      visible: true,
    });
  }

  if (isSectionVisible(site.about, site) && site.about.showInNavigation) {
    items.push({
      id: 'nav-about',
      label: site.about.navigationLabel || 'About',
      type: 'about',
      target: 'about',
      visible: true,
    });
  }

  if (site.settings.showCvInNavigation) {
    items.push({ id: 'nav-cv', label: 'CV', type: 'cv', target: 'cv', visible: true });
  }

  site.settings.externalLinks.forEach((link, index) => {
    items.push({
      id: `external-${index}`,
      label: link.label,
      type: 'external',
      target: link.url,
      visible: true,
    });
  });

  return items;
}

export function navHref(item: NavItem): string {
  if (item.type === 'home') return '/';
  if (item.type === 'cv') return '/cv/';
  if (item.type === 'about') return '/about/';
  if (item.type === 'section') return `/${item.target}/`;
  return item.target;
}

export const sectionUrl = (section: Pick<Section, 'slug'>) =>
  section.slug === 'about' ? '/about/' : `/${section.slug}/`;

export const itemUrl = (item: Pick<SectionItem, 'sectionSlug' | 'slug'>) =>
  `/${item.sectionSlug}/${item.slug}/`;
