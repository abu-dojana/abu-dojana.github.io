import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { entryUrl, formatDate, getSite, navHref, renderMarkdown, validateSite } from './content';
import type { SiteContent } from './types';

function fixture(): SiteContent {
  return {
    settings: { siteTitle: 'Test', name: '', headline: '', bio: '', email: '', location: '', links: [], skills: [], homeEyebrow: '', homeTitle: '', homeDescription: '', footerNote: '', preview: true, navigation: [] },
    categories: [], pages: [], cvSections: [],
    entries: [{ id: 'b92998cb-b934-4cde-a62c-7dbbfb8d90ca', slug: 'test-entry', title: 'Test entry', summary: '', categories: [], tags: [], published: true, example: false, featured: false, date: '', endDate: '', cover: '', coverAlt: '', links: [], details: [], progress: '', cv: { include: false, section: '', title: '', subtitle: '', date: '', bullets: [], order: 0 }, body: '', html: '', readingMinutes: 1 }],
  };
}

describe('shared content and flexible navigation', () => {
  it('accepts a blank profile and a published entry without requiring a career category', () => {
    const site = fixture();
    expect(validateSite(site)).toBe(site);
    expect(site.settings.name).toBe('');
  });
  it('supports a new subject and menu without adding a new content schema', () => {
    const site = fixture();
    const category = { id: '9ed6d05b-1489-436a-8c97-6cf5517a5089', title: 'Something entirely different', slug: 'something-different', description: '', order: 99 };
    site.categories.push(category);
    site.entries[0].categories.push(category.id);
    const nav = { id: 'c1ea7cae-4f0e-48da-89b5-a5ce55e79f32', label: 'Wild things', type: 'category' as const, target: category.id, visible: true };
    site.settings.navigation.push(nav);
    expect(validateSite(site)).toBe(site);
    expect(navHref(nav, site)).toBe('/categories/something-different/');
    const url = entryUrl(site.entries[0]);
    site.entries[0].categories = [category.id];
    expect(entryUrl(site.entries[0])).toBe(url);
  });
  it('reports broken references before a build can replace the live site', () => {
    const site = fixture();
    site.entries[0].categories.push('00000000-0000-4000-8000-000000000000');
    expect(() => validateSite(site)).toThrow(/missing category/);
  });
  it('rejects duplicate URLs even when content has different IDs', () => {
    const site = fixture();
    site.entries.push({ ...site.entries[0], id: '44335e20-1961-4f2f-b2bb-cc7b5f13bc57' });
    expect(() => validateSite(site)).toThrow(/Duplicate URL slug/);
  });
  it('keeps article markup and media while removing executable content', () => {
    const result = renderMarkdown('## Hello\n\n<script>alert(1)</script>\n\n<a href="javascript:alert(1)">bad</a>\n\n![A trail](/images/trail.svg)');
    expect(result).toContain('<h2>Hello</h2>');
    expect(result).toContain('src="/images/trail.svg"');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('javascript:');
  });
  it('does not silently turn impossible dates into a different month', () => {
    expect(formatDate('2026-02-31')).toBe('2026-02-31');
    expect(formatDate('2026-02-28')).toBe('Feb 28, 2026');
  });
  it('accepts cleared optional CMS controls without blocking publication', () => {
    const temporaryDirectory = fs.realpathSync(os.tmpdir());
    const root = fs.mkdtempSync(path.join(temporaryDirectory, 'notebook-content-test-'));
    try {
      fs.writeFileSync(path.join(root, 'site.json'), JSON.stringify({ siteTitle: 'A real updated name', name: 'A real profile', preview: false, navigation: null, skills: null, links: null }));
      fs.mkdirSync(path.join(root, 'entries'));
      const metadata = { id: 'a8151b62-cf87-4326-8b25-9cce43055aaf', slug: 'a-new-topic', title: 'A new topic', published: true, categories: null, tags: null, details: null, links: null, cv: null, progress: null, cover: null };
      fs.writeFileSync(path.join(root, 'entries', 'a-new-topic.md'), `---\n${JSON.stringify(metadata)}\n---\nA new story.`);
      const site = getSite(root);
      expect(site.settings.name).toBe('A real profile');
      expect(site.settings.preview).toBe(false);
      expect(site.settings.navigation).toEqual([]);
      expect(site.entries[0].categories).toEqual([]);
      expect(site.entries[0].cv.include).toBe(false);
      expect(site.entries[0].progress).toBe('');
    } finally {
      if (path.dirname(root) === temporaryDirectory && path.basename(root).startsWith('notebook-content-test-')) fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
