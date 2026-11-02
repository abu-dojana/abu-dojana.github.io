import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { entryUrl, getNavigation, getSite, navHref } from './content';
import { createCvModel, createDefaultCvState, parseCvState, serializeCvState } from './cv';

const temporaryBase = fs.realpathSync(os.tmpdir());
const fixtureRoots: string[] = [];
const prefix = 'portfolio-page-items-';
const ids = {
  pottery: 'aa000000-0000-4000-8000-000000000001',
  hobbies: 'aa000000-0000-4000-8000-000000000002',
  draft: 'aa000000-0000-4000-8000-000000000003',
  example: 'aa000000-0000-4000-8000-000000000004',
  hidden: 'aa000000-0000-4000-8000-000000000005',
  bowl: 'bb000000-0000-4000-8000-000000000001',
  glaze: 'bb000000-0000-4000-8000-000000000002',
  draftItem: 'bb000000-0000-4000-8000-000000000003',
  exampleItem: 'bb000000-0000-4000-8000-000000000004',
  unpublishedItem: 'bb000000-0000-4000-8000-000000000005',
  legacy: 'bb000000-0000-4000-8000-000000000006',
  cvSection: 'cc000000-0000-4000-8000-000000000001',
  homeNav: 'dd000000-0000-4000-8000-000000000001',
  pageNav: 'dd000000-0000-4000-8000-000000000002',
};

type RawRecord = Record<string, unknown>;

function makeFixture(settings: RawRecord = {}): string {
  const fixtureRoot = fs.mkdtempSync(path.join(temporaryBase, prefix));
  fixtureRoots.push(fixtureRoot);
  fs.mkdirSync(path.join(fixtureRoot, 'pages'));
  fs.mkdirSync(path.join(fixtureRoot, 'cv-sections'));
  fs.writeFileSync(path.join(fixtureRoot, 'site.json'), JSON.stringify({
    siteTitle: 'Fixture notebook', name: 'Fixture person', navigation: [], ...settings,
  }));
  fs.writeFileSync(path.join(fixtureRoot, 'cv-sections', 'evidence.json'), JSON.stringify({
    id: ids.cvSection, title: 'Evidence of learning', order: 0,
  }));
  return fixtureRoot;
}

function writePage(fixtureRoot: string, filename: string, metadata: RawRecord, body = 'A page introduction.'): void {
  // JSON is valid YAML frontmatter, including nested Markdown body strings.
  fs.writeFileSync(path.join(fixtureRoot, 'pages', `${filename}.md`), `---\n${JSON.stringify(metadata, null, 2)}\n---\n${body}`);
}

function item(id: string, title: string, extra: RawRecord = {}): RawRecord {
  return { id, title, published: true, ...extra };
}

function cvItem(id: string, title: string, extra: RawRecord = {}): RawRecord {
  return item(id, title, {
    cv: { include: true, section: ids.cvSection, bullets: ['A specific, truthful observation.'] }, ...extra,
  });
}

afterEach(() => {
  for (const fixtureRoot of fixtureRoots.splice(0)) {
    const resolved = fs.realpathSync(fixtureRoot);
    if (path.dirname(resolved) !== temporaryBase || !path.basename(resolved).startsWith(prefix)) {
      throw new Error(`Refusing to remove a fixture outside its expected temporary directory: ${resolved}`);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

describe('page-owned content', () => {
  it('accepts a new subject with inline items, sensible optional defaults, and the page’s item order', () => {
    const fixtureRoot = makeFixture();
    writePage(fixtureRoot, 'pottery', {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [
        item(ids.glaze, 'Testing a glaze', { date: '2025-01-01' }),
        item(ids.bowl, 'My first bowl', { date: '2026-01-01' }),
      ],
    });

    const site = getSite(fixtureRoot);
    const page = site.pages[0];
    expect(page).toMatchObject({ title: 'Pottery', layout: 'cards', showInNavigation: true, order: 0 });
    expect(page.items.map((record) => record.id)).toEqual([ids.glaze, ids.bowl]);
    expect(page.items[0]).toMatchObject({
      pageId: ids.pottery, summary: '', categories: [], tags: [], links: [], details: [],
      body: '', cv: { include: false, bullets: [] },
    });
    expect(site.entries.find((record) => record.id === ids.glaze)).toBe(page.items[0]);
    expect(site.entries.find((record) => record.id === ids.bowl)).toBe(page.items[1]);
    expect(getNavigation(site).some((record) => record.type === 'page' && record.target === ids.pottery)).toBe(true);
  });

  it('renders nested item Markdown separately from the page introduction and removes executable markup', () => {
    const fixtureRoot = makeFixture();
    const nestedBody = '## Kiln notes\n\nA **small** bowl.\n\n<script>alert(1)</script>\n\n[Bad link](javascript:alert(1))\n\n![Glazed bowl](/images/bowl.png)';
    writePage(fixtureRoot, 'pottery', {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [item(ids.bowl, 'A bowl', { body: nestedBody })],
    }, '## About this page\n\nLearning by making.');

    const page = getSite(fixtureRoot).pages[0];
    expect(page.html).toContain('<h2>About this page</h2>');
    expect(page.html).not.toContain('Kiln notes');
    expect(page.items[0].body).toBe(nestedBody);
    expect(page.items[0].html).toContain('<h2>Kiln notes</h2>');
    expect(page.items[0].html).toContain('<strong>small</strong>');
    expect(page.items[0].html).toContain('src="/images/bowl.png"');
    expect(page.items[0].html).not.toContain('<script');
    expect(page.items[0].html).not.toContain('javascript:');
  });

  it('preserves meaningful Markdown indentation in a nested item body', () => {
    const fixtureRoot = makeFixture();
    const body = '    const preserved = true;\n\nA sentence after the code.';
    writePage(fixtureRoot, 'pottery', {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [item(ids.bowl, 'Code notes', { body })],
    });
    const record = getSite(fixtureRoot).pages[0].items[0];
    expect(record.body).toBe(body);
    expect(record.html).toContain('<pre><code>const preserved = true;');
  });

  it('retains a stable UUID, fallback URL, and saved CV selection when an item or page title changes', () => {
    const fixtureRoot = makeFixture();
    const page = {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [cvItem(ids.bowl, 'An early bowl')],
    };
    writePage(fixtureRoot, 'pottery', page);
    const originalSite = getSite(fixtureRoot);
    const original = originalSite.entries[0];
    const savedSelection = serializeCvState(createDefaultCvState(createCvModel(originalSite)));
    expect(original.slug).toBe(`item-${ids.bowl}`);

    writePage(fixtureRoot, 'pottery', { ...page, title: 'Clay practice', items: [cvItem(ids.bowl, 'A more useful title')] });
    const updatedSite = getSite(fixtureRoot);
    const updated = updatedSite.entries[0];
    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe('A more useful title');
    expect(entryUrl(updated)).toBe(entryUrl(original));
    expect(parseCvState(savedSelection, createCvModel(updatedSite)).selectedEntryIds).toEqual([ids.bowl]);
  });

  it('retains backward compatibility with standalone entry files without duplicating page-owned records', () => {
    const fixtureRoot = makeFixture();
    writePage(fixtureRoot, 'pottery', {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [cvItem(ids.bowl, 'A page-owned bowl')],
    });
    fs.mkdirSync(path.join(fixtureRoot, 'entries'));
    fs.writeFileSync(path.join(fixtureRoot, 'entries', 'legacy.md'), `---\n${JSON.stringify({
      ...cvItem(ids.legacy, 'An existing standalone entry'), slug: 'legacy-entry',
    })}\n---\nExisting Markdown remains available.`);

    const site = getSite(fixtureRoot);
    expect(site.entries.map((record) => record.id).sort()).toEqual([ids.bowl, ids.legacy].sort());
    expect(site.pages[0].items).toHaveLength(1);
    expect(site.entries.find((record) => record.id === ids.legacy)?.html).toContain('Existing Markdown remains available.');
    expect(createCvModel(site).sections[0].entries).toHaveLength(2);
  });

  it('rejects duplicate item UUIDs across pages before they can corrupt CV selections', () => {
    const fixtureRoot = makeFixture();
    writePage(fixtureRoot, 'pottery', {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [item(ids.bowl, 'First use of this identity')],
    });
    writePage(fixtureRoot, 'hobbies', {
      id: ids.hobbies, slug: 'hobbies', title: 'Hobbies', published: true,
      items: [item(ids.bowl, 'Accidental second use', { slug: 'another-url' })],
    });
    expect(() => getSite(fixtureRoot)).toThrow(/Duplicate ID/i);
  });
});

describe('page publication, examples, and shared CV content', () => {
  it('applies parent publication and example status before building either real or demo CVs', () => {
    const fixtureRoot = makeFixture();
    writePage(fixtureRoot, 'pottery', {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [cvItem(ids.bowl, 'A real item'), cvItem(ids.unpublishedItem, 'An unfinished item', { published: false })],
    });
    writePage(fixtureRoot, 'draft', {
      id: ids.draft, slug: 'draft', title: 'Unpublished page', published: false,
      items: [cvItem(ids.draftItem, 'Published child of an unpublished page')],
    });
    writePage(fixtureRoot, 'example', {
      id: ids.example, slug: 'example', title: 'Illustrative page', published: true, example: true,
      items: [cvItem(ids.exampleItem, 'Child without an explicit example label', { example: false })],
    });

    const site = getSite(fixtureRoot);
    expect(site.entries.find((record) => record.id === ids.draftItem)?.published).toBe(false);
    expect(site.entries.find((record) => record.id === ids.unpublishedItem)?.published).toBe(false);
    expect(site.entries.find((record) => record.id === ids.exampleItem)?.example).toBe(true);
    expect(site.pages.find((page) => page.id === ids.draft)?.items[0].published).toBe(false);
    expect(site.pages.find((page) => page.id === ids.example)?.items[0].example).toBe(true);
    expect(createCvModel(site).sections.flatMap((section) => section.entries.map((record) => record.id))).toEqual([ids.bowl]);
    expect(createCvModel(site, true).sections.flatMap((section) => section.entries.map((record) => record.id)).sort()).toEqual([ids.bowl, ids.exampleItem].sort());
  });

  it('groups CV records by their chosen CV section regardless of the owning page’s subject', () => {
    const fixtureRoot = makeFixture();
    writePage(fixtureRoot, 'pottery', {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [cvItem(ids.bowl, 'Exploring a new material')],
    });
    writePage(fixtureRoot, 'hobbies', {
      id: ids.hobbies, slug: 'hobbies', title: 'Other hobbies', published: true,
      items: [cvItem(ids.glaze, 'A different kind of practice')],
    });
    const model = createCvModel(getSite(fixtureRoot));
    expect(model.sections).toHaveLength(1);
    expect(model.sections[0]).toMatchObject({ id: ids.cvSection, title: 'Evidence of learning' });
    expect(model.sections[0].entries.map((record) => record.id).sort()).toEqual([ids.bowl, ids.glaze].sort());
  });
});

describe('automatic page navigation', () => {
  it('adds arbitrary published pages in their chosen order while excluding drafts and hidden navigation', () => {
    const fixtureRoot = makeFixture();
    writePage(fixtureRoot, 'pottery', { id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true, order: 9 });
    writePage(fixtureRoot, 'hobbies', { id: ids.hobbies, slug: 'hobbies', title: 'Other hobbies', published: true, navigationLabel: 'My interests', order: 2 });
    writePage(fixtureRoot, 'draft', { id: ids.draft, slug: 'draft', title: 'Not ready', published: false, order: -5 });
    writePage(fixtureRoot, 'hidden', { id: ids.hidden, slug: 'hidden', title: 'Link directly only', published: true, showInNavigation: false, order: -9 });

    const site = getSite(fixtureRoot);
    const pageLinks = getNavigation(site).filter((record) => record.type === 'page');
    expect(pageLinks.map((record) => record.target)).toEqual([ids.hobbies, ids.pottery]);
    expect(pageLinks[0].label).toBe('My interests');
    expect(navHref(pageLinks[0], site)).toBe('/pages/hobbies/');
    expect(site.pages.find((page) => page.id === ids.pottery)?.items).toEqual([]);
  });

  it('keeps a manually curated page link once rather than adding a duplicate automatic destination', () => {
    const fixtureRoot = makeFixture({ navigation: [
      { id: ids.homeNav, label: 'Home', type: 'home', visible: true },
      { id: ids.pageNav, label: 'Clay work', type: 'page', target: ids.pottery, visible: true },
    ] });
    writePage(fixtureRoot, 'pottery', { id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true });
    const navigation = getNavigation(getSite(fixtureRoot));
    const potteryLinks = navigation.filter((record) => record.type === 'page' && record.target === ids.pottery);
    expect(potteryLinks).toHaveLength(1);
    expect(potteryLinks[0].label).toBe('Clay work');
  });
});

describe('page lifecycle without code changes', () => {
  it('deletes a whole page and its child routes, navigation, and CV data despite a stale manual override', () => {
    const fixtureRoot = makeFixture({ navigation: [
      { id: ids.homeNav, label: 'Home', type: 'home', visible: true },
      { id: ids.pageNav, label: 'My collection', type: 'page', target: ids.pottery, visible: true },
    ] });
    writePage(fixtureRoot, 'pottery', {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [cvItem(ids.bowl, 'A bowl', { slug: 'a-bowl' })],
    });
    const before = getSite(fixtureRoot);
    const savedSelection = serializeCvState(createDefaultCvState(createCvModel(before)));
    expect(getNavigation(before).some((link) => link.target === ids.pottery)).toBe(true);

    fs.unlinkSync(path.join(fixtureRoot, 'pages', 'pottery.md'));
    const after = getSite(fixtureRoot);
    expect(after.pages).toEqual([]);
    expect(after.entries).toEqual([]);
    expect(after.entries.filter((record) => record.published).map(entryUrl)).not.toContain('/entries/a-bowl/');
    expect(getNavigation(after).some((link) => link.type === 'page')).toBe(false);
    expect(getNavigation(after).map((link) => navHref(link, after))).toEqual(['/']);
    const staleOverride = after.settings.navigation.find((link) => link.type === 'page')!;
    expect(navHref(staleOverride, after)).toBe('/pages/');
    const model = createCvModel(after);
    expect(model.sections).toEqual([]);
    expect(parseCvState(savedSelection, model)).toMatchObject({
      selectedEntryIds: [], selectedSectionIds: [], entryOrder: [], sectionOrder: [],
    });
  });

  it('unpublishes or deletes one page without hiding or changing another page and its items', () => {
    const fixtureRoot = makeFixture({ navigation: [
      { id: ids.pageNav, label: 'Clay', type: 'page', target: ids.pottery, visible: true },
    ] });
    const firstPage = {
      id: ids.pottery, slug: 'pottery', title: 'Pottery', published: true,
      items: [cvItem(ids.bowl, 'A bowl', { slug: 'a-bowl' })],
    };
    writePage(fixtureRoot, 'pottery', firstPage);
    writePage(fixtureRoot, 'hobbies', {
      id: ids.hobbies, slug: 'hobbies', title: 'Other hobbies', published: true,
      items: [cvItem(ids.glaze, 'A separate practice', { slug: 'separate-practice' })],
    });
    const original = getSite(fixtureRoot);
    const originalOther = original.pages.find((page) => page.id === ids.hobbies);
    const savedSelection = serializeCvState(createDefaultCvState(createCvModel(original)));

    writePage(fixtureRoot, 'pottery', { ...firstPage, published: false });
    const unpublished = getSite(fixtureRoot);
    expect(unpublished.entries.find((record) => record.id === ids.bowl)?.published).toBe(false);
    expect(getNavigation(unpublished).filter((link) => link.type === 'page').map((link) => link.target)).toEqual([ids.hobbies]);
    expect(unpublished.entries.filter((record) => record.published).map(entryUrl)).toEqual(['/entries/separate-practice/']);
    expect(createCvModel(unpublished).sections.flatMap((section) => section.entries.map((record) => record.id))).toEqual([ids.glaze]);

    fs.unlinkSync(path.join(fixtureRoot, 'pages', 'pottery.md'));
    const deleted = getSite(fixtureRoot);
    expect(deleted.pages).toEqual([originalOther]);
    expect(deleted.entries.map((record) => record.id)).toEqual([ids.glaze]);
    expect(parseCvState(savedSelection, createCvModel(deleted)).selectedEntryIds).toEqual([ids.glaze]);
  });

  it('loads and navigates thirty arbitrarily named pages, including empty pages, without a fixed subject list', () => {
    const fixtureRoot = makeFixture();
    for (let index = 1; index <= 30; index += 1) {
      const suffix = String(index).padStart(12, '0');
      writePage(fixtureRoot, `collection-${index}`, {
        id: `aa000000-0000-4000-8000-${suffix}`,
        slug: `field-collection-${index}`,
        title: `Field collection ${index}`,
        published: true,
        order: 30 - index,
        items: index % 3 === 0 ? [] : [item(`bb000000-0000-4000-8000-${suffix}`, `Observation ${index}`)],
      });
    }
    const site = getSite(fixtureRoot);
    const links = getNavigation(site).filter((link) => link.type === 'page');
    expect(site.pages).toHaveLength(30);
    expect(links).toHaveLength(30);
    expect(site.entries).toHaveLength(20);
    expect(site.pages.filter((page) => page.items.length === 0)).toHaveLength(10);
    expect(links[0].label).toBe('Field collection 30');
    expect(links[29].label).toBe('Field collection 1');
    expect(new Set(links.map((link) => navHref(link, site))).size).toBe(30);
    expect(links.every((link) => !navHref(link, site).includes('undefined'))).toBe(true);
  });
});
