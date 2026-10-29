import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import type { SiteContent, NavItem, Settings, Entry, Category, Page, CvSection } from './types';

const text = () => z.preprocess(v => v == null ? '' : v, z.string().trim().default(''));
const list = <T extends z.ZodType>(schema: T) => z.preprocess(v => v == null ? [] : v, z.array(schema).default([]));
const order = z.preprocess(v => v == null || v === '' ? 0 : v, z.number().default(0));
const boolean = (fallback: boolean) => z.preprocess(v => v == null ? fallback : v, z.boolean().default(fallback));
const id = z.uuid();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens');
const url = text().refine(v => !v || (/^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v) || /^mailto:/i.test(v)), 'Use an https:// link or a /local/path');
const link = z.object({ label: z.string().min(1), url });
const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const date = z.preprocess(v => v instanceof Date ? v.toISOString().slice(0, 10) : (v ?? ''), z.string().default('').refine(v => !v || validDate(v), 'Use a real calendar date in YYYY-MM-DD format'));
const navSchema = z.object({ id, label: z.string().min(1), type: z.enum(['home', 'explore', 'page', 'category', 'cv', 'external']), target: text(), visible: boolean(true) });
const settingsSchema = z.object({
  siteTitle: z.string().min(1), name: text(), headline: text(), bio: text(), email: text(), location: text(),
  links: list(link), skills: list(text()),
  homeEyebrow: text(), homeTitle: text(), homeDescription: text(), footerNote: text(),
  preview: boolean(true), navigation: list(navSchema),
});
const categorySchema = z.object({ id, slug, title: z.string().min(1), description: text(), order });
const sectionSchema = z.object({ id, title: z.string().min(1), order });
const cvSchema = z.object({ include: boolean(false), section: text(), title: text(), subtitle: text(), date: text(), bullets: list(text()), order });
const entrySchema = z.object({
  id, slug, title: z.string().min(1), summary: text(), categories: list(id), tags: list(text()),
  published: boolean(false), example: boolean(false), featured: boolean(false),
  date, endDate: date, cover: url, coverAlt: text(), links: list(link),
  details: list(z.object({ label: z.string().min(1), value: z.string() })),
  progress: z.preprocess(v => v == null ? '' : v, z.enum(['', 'planned', 'in-progress', 'completed']).default('')),
  cv: z.preprocess(v => v == null ? {} : v, cvSchema),
});
const pageSchema = z.object({ id, slug, title: z.string().min(1), summary: text(), published: boolean(false), example: boolean(false) });

export function renderMarkdown(body: string): string {
  const html = marked.parse(body, { async: false });
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'figure', 'figcaption', 'details', 'summary'],
    allowedAttributes: { a: ['href', 'title'], img: ['src', 'alt', 'title', 'width', 'height', 'loading'], code: ['class'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: { img: (_tagName, attributes) => ({ tagName: 'img', attribs: { ...attributes, loading: 'lazy' } }) },
  });
}

function files(folder: string, extension: string): string[] {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder).filter(f => f.endsWith(extension)).sort().map(f => path.join(folder, f));
}
function parseFile<T>(filename: string, schema: z.ZodType<T>, markdown = false): T & { body: string } {
  try {
    const source = fs.readFileSync(filename, 'utf8');
    const parsed = markdown ? matter(source) : { data: JSON.parse(source), content: '' };
    return { ...schema.parse(parsed.data), body: parsed.content };
  } catch (error) { throw new Error(`Content error in ${filename}: ${error instanceof Error ? error.message : String(error)}`); }
}
function unique(items: { id: string; slug?: string }[], label: string) {
  const ids = new Set<string>(); const slugs = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`Duplicate ID in ${label}: ${item.id}`);
    if (item.slug && slugs.has(item.slug)) throw new Error(`Duplicate URL slug in ${label}: ${item.slug}`);
    ids.add(item.id); if (item.slug) slugs.add(item.slug);
  }
}
export function validateSite(site: SiteContent): SiteContent {
  for (const [label, items] of Object.entries({ entries: site.entries, categories: site.categories, pages: site.pages, cvSections: site.cvSections })) unique(items, label);
  unique(site.settings.navigation, 'navigation');
  const categories = new Set(site.categories.map(c => c.id));
  const sections = new Set(site.cvSections.map(s => s.id));
  const pages = new Set(site.pages.filter(p => p.published).map(p => p.id));
  for (const entry of site.entries) {
    for (const category of entry.categories) if (!categories.has(category)) throw new Error(`Entry "${entry.title}" refers to a missing category. Reassign it before deleting that category.`);
    if ((entry.cv.include || entry.cv.section) && !sections.has(entry.cv.section)) throw new Error(`Entry "${entry.title}" needs a valid CV section, or turn off CV inclusion and clear its section.`);
    if (entry.cover && !entry.coverAlt) throw new Error(`Add alternative text for the cover of "${entry.title}".`);
  }
  for (const item of site.settings.navigation.filter(n => n.visible)) {
    if (item.type === 'category' && !categories.has(item.target)) throw new Error(`Menu item "${item.label}" refers to a missing category.`);
    if (item.type === 'page' && !pages.has(item.target)) throw new Error(`Menu item "${item.label}" needs a published page.`);
    if (item.type === 'external' && !/^https?:\/\//i.test(item.target)) throw new Error(`Menu item "${item.label}" needs an https:// URL.`);
  }
  return site;
}

export function getSite(root = path.resolve('content')): SiteContent {
  const settings = parseFile(path.join(root, 'site.json'), settingsSchema) as Settings;
  const categories = files(path.join(root, 'categories'), '.json').map(f => parseFile(f, categorySchema)) as Category[];
  const cvSections = files(path.join(root, 'cv-sections'), '.json').map(f => parseFile(f, sectionSchema)) as CvSection[];
  const entries = files(path.join(root, 'entries'), '.md').map(f => {
    const record = parseFile(f, entrySchema, true);
    return { ...record, html: renderMarkdown(record.body), readingMinutes: Math.max(1, Math.ceil(record.body.split(/\s+/).length / 220)) };
  }) as Entry[];
  const pages = files(path.join(root, 'pages'), '.md').map(f => {
    const record = parseFile(f, pageSchema, true);
    return { ...record, html: renderMarkdown(record.body) };
  }) as Page[];
  categories.sort((a, b) => a.order - b.order);
  cvSections.sort((a, b) => a.order - b.order);
  entries.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  return validateSite({ settings, categories, entries, pages, cvSections });
}
export function navHref(item: NavItem, site: SiteContent): string {
  if (item.type === 'home') return '/';
  if (item.type === 'explore') return '/explore/';
  if (item.type === 'cv') return '/cv/';
  if (item.type === 'page') return `/pages/${site.pages.find(p => p.id === item.target)?.slug}/`;
  if (item.type === 'category') return `/categories/${site.categories.find(c => c.id === item.target)?.slug}/`;
  return item.target;
}
export const entryUrl = (entry: Pick<Entry, 'slug'>) => `/entries/${entry.slug}/`;
export function formatDate(value: string): string {
  if (!value) return '';
  if (!validDate(value)) return value;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}
