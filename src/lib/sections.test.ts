import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import { afterEach, describe, expect, it } from 'vitest';
import { fileDisplayName, formatFileLabel, getNavigation, getSite, isPdfUrl, isSectionVisible, itemUrl, navHref, sectionUrl } from './content';

const temporaryBase = fs.realpathSync(os.tmpdir());
const fixtureRoots: string[] = [];
const prefix = 'portfolio-sections-test-';

function createFixture(siteOverrides: Record<string, unknown> = {}): string {
  const root = fs.mkdtempSync(path.join(temporaryBase, prefix));
  fixtureRoots.push(root);
  for (const dir of ['sections', 'projects', 'experience', 'education', 'items']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  fs.writeFileSync(
    path.join(root, 'site.json'),
    JSON.stringify({
      siteTitle: 'Test Portfolio',
      name: 'Test User',
      showCvInNavigation: true,
      noindex: false,
      ...siteOverrides,
    }),
  );
  return root;
}

function writeMd(root: string, folder: string, filename: string, data: Record<string, unknown>, body = '') {
  fs.writeFileSync(
    path.join(root, folder, `${filename}.md`),
    `---\n${JSON.stringify(data, null, 2)}\n---\n${body}`,
  );
}

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) {
    const resolved = fs.realpathSync(root);
    if (path.dirname(resolved) !== temporaryBase || !path.basename(resolved).startsWith(prefix)) {
      throw new Error(`Refusing to delete unexpected path: ${resolved}`);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

describe('collections, galleries, and flexible sections', () => {
  it('loads dedicated projects, experience, education, and supports multi-image galleries without coverAlt', () => {
    const root = createFixture();
    writeMd(root, 'sections', 'projects', { title: 'Projects', slug: 'projects', type: 'projects', order: 1 });
    writeMd(root, 'sections', 'experience', { title: 'Experience', slug: 'experience', type: 'experience', order: 2 });
    writeMd(root, 'sections', 'education', { title: 'Education', slug: 'education', type: 'education', order: 3 });

    writeMd(root, 'projects', 'alpha-app', {
      title: 'Alpha App',
      summary: 'A project with multiple images.',
      images: ['/images/projects/a1.png', '/images/projects/a2.png'],
      tech: ['TypeScript', 'Astro'],
      liveUrl: 'https://example.com',
      repoUrl: 'https://github.com/example/alpha',
      startDate: '2026-01-10',
      published: true,
    });

    writeMd(root, 'experience', 'backend-intern', {
      title: 'Backend Intern',
      organization: 'Acme Corp',
      startDate: '2025-06-01',
      current: true,
      images: '/images/single.png',
      published: true,
    });

    writeMd(root, 'education', 'bsc-cs', {
      degree: 'B.Sc. in Computer Science',
      institution: 'State University',
      startDate: '2021-09-01',
      endDate: '2025-05-15',
      published: true,
    });

    const site = getSite(root);
    expect(site.projects).toHaveLength(1);
    expect(site.projects[0]).toMatchObject({
      slug: 'alpha-app',
      sectionSlug: 'projects',
      images: ['/images/projects/a1.png', '/images/projects/a2.png'],
      cover: '/images/projects/a1.png',
      coverAlt: 'Alpha App preview',
    });
    expect(itemUrl(site.projects[0])).toBe('/projects/alpha-app/');

    expect(site.experience[0]).toMatchObject({
      slug: 'backend-intern',
      sectionSlug: 'experience',
      images: ['/images/single.png'],
      current: true,
      dateLabel: 'Jun 2025 – Present',
    });

    expect(site.education[0]).toMatchObject({
      slug: 'bsc-cs',
      title: 'B.Sc. in Computer Science',
      institution: 'State University',
      dateLabel: 'Sep 2021 – May 2025',
    });
  });

  it('supports arbitrary custom general sections and custom items', () => {
    const root = createFixture();
    writeMd(root, 'sections', 'anime', {
      title: 'Anime That I Watched',
      slug: 'anime',
      type: 'general',
      order: 5,
      published: true,
      showInNavigation: true,
    });
    writeMd(root, 'items', 'steins-gate', {
      title: 'Steins;Gate',
      section: 'anime',
      summary: 'Sci-fi thriller series.',
      files: ['/files/review-notes.pdf'],
      details: [{ label: 'Rating', value: '10/10' }],
      published: true,
    });
    writeMd(root, 'items', 'research-note', {
      title: 'Systems Paper',
      section: 'anime',
      pdf: '/files/paper.pdf',
      published: true,
    });

    const site = getSite(root);
    const animeSection = site.sections.find(s => s.slug === 'anime')!;
    expect(animeSection.items).toHaveLength(2);
    expect(animeSection.items[0].files).toEqual(['/files/review-notes.pdf']);
    expect(animeSection.items[1].files).toEqual(['/files/paper.pdf']);
    expect(isPdfUrl('/files/paper.pdf')).toBe(true);
    expect(isPdfUrl('/files/slides.pptx')).toBe(false);
    expect(formatFileLabel('/files/paper.pdf', 0, 1, 'action')).toBe('Read PDF');
    expect(fileDisplayName('/files/my%20paper.pdf')).toBe('my paper.pdf');
    expect(itemUrl(animeSection.items[0])).toBe('/anime/steins-gate/');
    expect(sectionUrl(animeSection)).toBe('/anime/');

    const nav = getNavigation(site);
    expect(nav.map(item => navHref(item))).toEqual(['/', '/anime/', '/cv/']);
  });

  it('auto-hides empty sections and respects published / showInNavigation / about toggles', () => {
    const root = createFixture({
      skillGroups: [{ category: 'Languages', items: ['TypeScript'] }],
    });
    writeMd(root, 'sections', 'projects', { title: 'Projects', slug: 'projects', type: 'projects', order: 1, published: true });
    writeMd(root, 'sections', 'experience', { title: 'Experience', slug: 'experience', type: 'experience', order: 2, published: true });
    writeMd(root, 'sections', 'skills', { title: 'Skills', slug: 'skills', type: 'skills', order: 3, published: true });
    writeMd(root, 'sections', 'hidden-blog', {
      title: 'Blog',
      slug: 'blog',
      type: 'general',
      order: 4,
      published: true,
      showInNavigation: false,
    }, 'An intro paragraph.');
    writeMd(root, 'sections', 'draft-section', {
      title: 'Drafts',
      slug: 'drafts',
      type: 'general',
      order: 5,
      published: false,
    }, 'Draft intro.');

    writeMd(root, 'projects', 'app', { title: 'App', published: true });
    writeMd(root, 'items', 'post', { title: 'Draft post', section: 'drafts', published: true });

    fs.writeFileSync(
      path.join(root, 'about.md'),
      `---\n${JSON.stringify({ title: 'About', published: true, showInNavigation: true })}\n---\nHello, I build web software.`,
    );

    const site = getSite(root);
    const exp = site.sections.find(s => s.slug === 'experience')!;
    const skills = site.sections.find(s => s.slug === 'skills')!;
    const drafts = site.sections.find(s => s.slug === 'drafts')!;

    expect(isSectionVisible(exp, site)).toBe(false);
    expect(isSectionVisible(skills, site)).toBe(true);
    expect(isSectionVisible(drafts, site)).toBe(false);
    // Items in an unpublished section become unpublished too.
    expect(drafts.items[0].published).toBe(false);

    const nav = getNavigation(site);
    expect(nav.map(item => item.label)).toEqual(['Home', 'Projects', 'Skills', 'About', 'CV']);
  });

  it('rejects reserved slugs, duplicate slugs, duplicate built-in types, and orphan items', () => {
    const reservedRoot = createFixture();
    writeMd(reservedRoot, 'sections', 'cv-copy', { title: 'CV Copy', slug: 'cv', type: 'general' });
    expect(() => getSite(reservedRoot)).toThrow(/reserved URL slug/i);

    const filesReservedRoot = createFixture();
    writeMd(filesReservedRoot, 'sections', 'files-copy', { title: 'Files', slug: 'files', type: 'general' });
    expect(() => getSite(filesReservedRoot)).toThrow(/reserved URL slug/i);

    const dupTypeRoot = createFixture();
    writeMd(dupTypeRoot, 'sections', 'p1', { title: 'Projects 1', slug: 'projects-1', type: 'projects' });
    writeMd(dupTypeRoot, 'sections', 'p2', { title: 'Projects 2', slug: 'projects-2', type: 'projects' });
    expect(() => getSite(dupTypeRoot)).toThrow(/Only one section can use type "projects"/);

    const orphanRoot = createFixture();
    writeMd(orphanRoot, 'items', 'lost', { title: 'Lost Item', section: 'non-existent' });
    expect(() => getSite(orphanRoot)).toThrow(/does not exist/);

    const dupItemRoot = createFixture();
    writeMd(dupItemRoot, 'projects', 'first', { title: 'First', slug: 'same-slug' });
    writeMd(dupItemRoot, 'projects', 'second', { title: 'Second', slug: 'same-slug' });
    expect(() => getSite(dupItemRoot)).toThrow(/Duplicate URL slug "same-slug"/);
  });

  it('ships a valid .pages.yml with resolved media, component, and collection references', () => {
    const raw = fs.readFileSync(path.resolve('.pages.yml'), 'utf8');
    const config = matter(`---\n${raw}\n---`).data as {
      media: { name: string }[];
      components: Record<string, unknown>;
      content: { name: string; fields?: Array<Record<string, unknown>> }[];
    };

    const mediaNames = new Set(config.media.map(m => m.name));
    expect(mediaNames.has('images')).toBe(true);
    expect(mediaNames.has('documents')).toBe(true);
    const componentNames = new Set(Object.keys(config.components));
    const collectionNames = new Set(config.content.map(c => c.name));

    for (const entry of config.content) {
      for (const field of entry.fields || []) {
        if (typeof field.component === 'string') {
          expect(componentNames.has(field.component), `Unknown component ${field.component}`).toBe(true);
        }
        const options = field.options as Record<string, unknown> | undefined;
        if (options && typeof options.media === 'string') {
          expect(mediaNames.has(options.media), `Unknown media ${options.media}`).toBe(true);
        }
        if (options && typeof options.collection === 'string') {
          expect(collectionNames.has(options.collection), `Unknown collection ${options.collection}`).toBe(true);
        }
      }
    }
  });
});
