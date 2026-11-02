import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import type { SiteContent, NavItem, Settings, Entry, Category, Page, CvSection } from './types';

const text = () => z.preprocess(v => v == null ? '' : v, z.string().trim().default(''));
const markdownBody = z.preprocess(v => v == null ? '' : v, z.string().default(''));
const list = <T extends z.ZodType>(schema: T) => z.preprocess(v => v == null ? [] : v, z.array(schema).default([]));
const order = z.preprocess(v => v == null || v === '' ? 0 : v, z.number().default(0));
const boolean = (fallback: boolean) => z.preprocess(v => v == null ? fallback : v, z.boolean().default(fallback));
const id = z.uuid();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slug = z.string().regex(slugPattern, 'Use lowercase words separated by hyphens');
const url = text().refine(v => !v || (/^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v) || /^mailto:/i.test(v)), 'Use an https:// link or a /local/path');
const link = z.object({ label: z.string().min(1), url });
const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const date = z.preprocess(v => v instanceof Date ? v.toISOString().slice(0, 10) : (v ?? ''), z.string().default('').refine(v => !v || validDate(v), 'Use a real calendar date in YYYY-MM-DD format'));
const navSchema = z.object({ id, label: z.string().min(1), type: z.enum(['home', 'explore', 'page', 'category', 'about', 'cv', 'external']), target: text(), visible: boolean(true) });
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
const pageItemSchema = entrySchema.extend({
  slug: text().refine(value => !value || slugPattern.test(value), 'Use lowercase words separated by hyphens'),
  body: markdownBody,
});
const pageSchema = z.object({
  id, slug, title: z.string().min(1), summary: text(), published: boolean(false), example: boolean(false),
  showInNavigation: boolean(true), navigationLabel: text(), order,
  layout: z.preprocess(v => v == null ? 'cards' : v, z.enum(['cards', 'list', 'timeline', 'article']).default('cards')),
  items: list(pageItemSchema),
});
const aboutSchema = pageSchema.pick({ title: true, summary: true, example: true, navigationLabel: true, items: true });
const aboutId = '40000000-0000-4000-8000-000000000001';

function materializePage(record: z.infer<typeof pageSchema> & { body: string }): Page {
  const items = record.items.map(item => ({
    ...item,
    pageId: record.id,
    slug: item.slug || `item-${item.id}`,
    published: record.published && item.published,
    example: record.example || item.example,
    html: renderMarkdown(item.body),
    readingMinutes: Math.max(1, Math.ceil(item.body.split(/\s+/).length / 220)),
  }));
  return { ...record, items, html: renderMarkdown(record.body) };
}

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
  if (site.pages.some(page => page.slug === 'about' || page.id === aboutId)) {
    throw new Error('About is a permanent page. Edit it in the dedicated About editor, and choose another URL name for ordinary pages.');
  }
  for (const [label, items] of Object.entries({ entries: site.entries, categories: site.categories, pages: [site.about, ...site.pages], cvSections: site.cvSections })) unique(items, label);
  unique(site.settings.navigation, 'navigation');
  const categories = new Set(site.categories.map(c => c.id));
  const sections = new Set(site.cvSections.map(s => s.id));
  for (const entry of site.entries) {
    for (const category of entry.categories) if (!categories.has(category)) throw new Error(`Entry "${entry.title}" refers to a missing category. Reassign it before deleting that category.`);
    if ((entry.cv.include || entry.cv.section) && !sections.has(entry.cv.section)) throw new Error(`Entry "${entry.title}" needs a valid CV section, or turn off CV inclusion and clear its section.`);
    if (entry.cover && !entry.coverAlt) throw new Error(`Add alternative text for the cover of "${entry.title}".`);
  }
  // Missing page shortcuts are ignored by getNavigation, so deleting a page
  // never requires a second edit in website settings.
  for (const item of site.settings.navigation.filter(n => n.visible)) {
    if (item.type === 'category' && !categories.has(item.target)) throw new Error(`Menu item "${item.label}" refers to a missing category.`);
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
  const pages = files(path.join(root, 'pages'), '.md').map(f => materializePage(parseFile(f, pageSchema, true)));
  const aboutFile = path.join(root, 'about.md');
  const aboutRecord = fs.existsSync(aboutFile)
    ? parseFile(aboutFile, aboutSchema, true)
    : { ...aboutSchema.parse({ title: 'About' }), body: '' };
  const about = materializePage({
    ...aboutRecord, id: aboutId, slug: 'about', published: true, showInNavigation: true,
    navigationLabel: aboutRecord.navigationLabel || 'About', order: 99, layout: 'article',
  });
  entries.push(...[...pages, about].flatMap(page => page.items));
  pages.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  categories.sort((a, b) => a.order - b.order);
  cvSections.sort((a, b) => a.order - b.order);
  entries.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  return validateSite({ settings, categories, entries, pages, about, cvSections });
}

/** A new published page appears in navigation without a second menu-editing step. */
export function getNavigation(site: SiteContent): NavItem[] {
  const overrides = new Map(site.settings.navigation.filter(item => item.type === 'page').map(item => [item.target, item]));
  const pageLinks: NavItem[] = [...site.pages].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .filter(page => page.published && page.showInNavigation && overrides.get(page.id)?.visible !== false)
    .map(page => ({
      id: `page-${page.id}`, type: 'page', target: page.id, visible: true,
      label: page.navigationLabel || overrides.get(page.id)?.label || page.title,
    }));
  const core = site.settings.navigation.filter(item => item.visible && item.type !== 'page' && item.type !== 'about');
  const cvIndex = core.findIndex(item => item.type === 'cv');
  const index = cvIndex < 0 ? core.length : cvIndex;
  const aboutLink: NavItem = { id: 'permanent-about', type: 'about', target: site.about.id, label: site.about.navigationLabel || 'About', visible: true };
  return [...core.slice(0, index), ...pageLinks, aboutLink, ...core.slice(index)];
}
export function navHref(item: NavItem, site: SiteContent): string {
  if (item.type === 'home') return '/';
  if (item.type === 'explore') return '/explore/';
  if (item.type === 'cv') return '/cv/';
  if (item.type === 'about') return '/pages/about/';
  if (item.type === 'page') {
    if (item.target === site.about.id) return '/pages/about/';
    const page = site.pages.find(p => p.id === item.target && p.published);
    return page ? `/pages/${page.slug}/` : '/pages/';
  }
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
