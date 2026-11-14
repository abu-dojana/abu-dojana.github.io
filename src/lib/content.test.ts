import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { formatDate, formatDateRange, formatMonthYear, getSite, renderMarkdown } from './content';

describe('content parsing, formatting, and sanitization', () => {
  it('accepts a minimal profile with no personal bio, links, or skills', () => {
    const tmp = fs.realpathSync(os.tmpdir());
    const root = fs.mkdtempSync(path.join(tmp, 'portfolio-min-'));
    try {
      fs.writeFileSync(
        path.join(root, 'site.json'),
        JSON.stringify({
          siteTitle: 'Abu Dojana',
          links: [{ label: 'Github', url: 'https://github.com/abu-dojana' }],
        }),
      );
      const site = getSite(root);
      expect(site.settings.siteTitle).toBe('Abu Dojana');
      expect(site.settings.name).toBe('Abu Dojana');
      expect(site.settings.headline).toBe('');
      expect(site.settings.links).toEqual([{ label: 'Github', url: 'https://github.com/abu-dojana' }]);
      expect(site.settings.skillGroups).toEqual([]);
      expect(site.settings.noindex).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps article markup and media while removing executable content', () => {
    const result = renderMarkdown(
      '## Architecture\n\n<script>alert(1)</script>\n\n<a href="javascript:alert(1)">bad</a>\n\n![Diagram](/images/diagram.png)',
    );
    expect(result).toContain('<h2>Architecture</h2>');
    expect(result).toContain('src="/images/diagram.png"');
    expect(result).toContain('loading="lazy"');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('javascript:');
  });

  it('formats calendar dates and ranges accurately without wrapping invalid dates', () => {
    expect(formatDate('2026-02-31')).toBe('2026-02-31');
    expect(formatDate('2026-02-28')).toBe('Feb 28, 2026');
    expect(formatMonthYear('2026-10-22')).toBe('Oct 2026');
    expect(formatDateRange('2026-10-22', '2026-11-02')).toBe('Oct 2026 – Nov 2026');
    expect(formatDateRange('2025-06-01', '', true)).toBe('Jun 2025 – Present');
  });

  it('accepts cleared optional CMS controls, Date objects, and legacy skills arrays', () => {
    const tmp = fs.realpathSync(os.tmpdir());
    const root = fs.mkdtempSync(path.join(tmp, 'portfolio-cms-'));
    try {
      fs.writeFileSync(
        path.join(root, 'site.json'),
        JSON.stringify({
          siteTitle: 'Portfolio',
          name: 'Ada Lovelace',
          skills: ['TypeScript', 'Rust'],
          links: null,
          externalLinks: null,
        }),
      );
      fs.mkdirSync(path.join(root, 'projects'));
      fs.writeFileSync(
        path.join(root, 'projects', 'engine.md'),
        [
          '---',
          'title: Analytical Engine',
          'startDate: 2026-10-22',
          'endDate: 2026-11-02T00:00:00.000Z',
          'images: null',
          'tech: null',
          'links: null',
          'published: true',
          '---',
          'Notes on the design.',
        ].join('\n'),
      );

      const site = getSite(root);
      expect(site.settings.skillGroups).toEqual([{ category: 'Skills', items: ['TypeScript', 'Rust'] }]);
      expect(site.projects[0].date).toBe('2026-10-22');
      expect(site.projects[0].endDate).toBe('2026-11-02');
      expect(site.projects[0].images).toEqual([]);
      expect(site.projects[0].tech).toEqual([]);
      expect(site.projects[0].links).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
