import { describe, expect, it } from 'vitest';
import type { Entry, SiteContent } from './types';
import {
  createCvModel, createDefaultCvState, deriveCvView, moveCvEntry, moveCvSection,
  parseCvState, reconcileCvState, serializeCvState, setCvEntrySelected, setCvSectionSelected,
} from './cv';

function entry(id: string, options: Partial<Entry> = {}): Entry {
  return {
    id, slug: id, title: `Entry ${id}`, summary: '', categories: [], tags: [],
    published: true, example: false, featured: false, date: '', endDate: '',
    cover: '', coverAlt: '', links: [], details: [], progress: '',
    cv: { include: true, section: 'work', title: '', subtitle: '', date: '', bullets: [`Evidence for ${id}`], order: 0 },
    body: '', html: '', readingMinutes: 1,
    ...options,
  };
}

function site(entries: Entry[] = [entry('a'), entry('b'), entry('c', {
  cv: { include: true, section: 'learning', title: '', subtitle: '', date: '', bullets: [], order: 0 },
})]): SiteContent {
  return {
    settings: {
      siteTitle: 'A notebook', name: 'A real person', headline: 'A short introduction',
      bio: 'A truthful summary.', email: 'public@example.com', location: 'A city', links: [], skills: [],
      homeEyebrow: '', homeTitle: '', homeDescription: '', footerNote: '', preview: true, navigation: [],
    },
    categories: [], pages: [], entries,
    cvSections: [{ id: 'work', title: 'Selected work', order: 0 }, { id: 'learning', title: 'Learning', order: 1 }],
  };
}

describe('CV content and honest defaults', () => {
  it('excludes unpublished, opted-out, and example records from a real CV', () => {
    const fixture = site([
      entry('real'), entry('draft', { published: false }), entry('sample', { example: true }),
      entry('private-selection', { cv: { ...entry('unused').cv, include: false } }),
    ]);
    const model = createCvModel(fixture);
    expect(model.sections.flatMap((section) => section.entries.map((item) => item.id))).toEqual(['real']);
    expect(model.ready).toBe(true);
    const demo = createCvModel(fixture, true);
    expect(demo.sections[0].entries.map((item) => item.id)).toEqual(['real', 'sample']);
    expect(demo.sections[0].entries.find((item) => item.id === 'sample')?.example).toBe(true);
    expect(demo.demo).toBe(true);
    expect(demo.profile.name).toBe('Example profile');
    expect(demo.profile.email).toBe('');
  });

  it('leaves a blank or examples-only profile unready without inventing a name', () => {
    const blank = site([entry('sample', { example: true })]);
    blank.settings.name = '';
    expect(createCvModel(blank)).toMatchObject({ ready: false, profile: { name: '' }, sections: [] });
    expect(createCvModel(blank, true).ready).toBe(true);
    expect(createCvModel(site([])).ready).toBe(false);
    const noName = site();
    noName.settings.name = '   ';
    expect(createCvModel(noName).ready).toBe(false);
  });

  it('uses CV presentation independently of categories and retains truthful progress', () => {
    const record = entry('work', {
      categories: ['adventures'], progress: 'in-progress',
      cv: { include: true, section: 'learning', title: 'Selected title', subtitle: 'A course', date: '2026–present', bullets: ['  A concrete result  ', ''], order: 0 },
    });
    expect(createCvModel(site([record])).sections[0]).toMatchObject({
      id: 'learning', entries: [{ title: 'Selected title', subtitle: 'A course', date: '2026–present', bullets: ['A concrete result'], progress: 'in-progress' }],
    });
  });
});

describe('CV selection and ordering', () => {
  it('hides empty or disabled sections and restores retained entry choices when re-enabled', () => {
    const model = createCvModel(site());
    const defaults = createDefaultCvState(model);
    let state = setCvSectionSelected(defaults, model, 'work', false);
    expect(deriveCvView(model, state).map((section) => section.id)).toEqual(['learning']);
    state = setCvSectionSelected(state, model, 'work', true);
    state = setCvEntrySelected(state, model, 'a', false);
    expect(deriveCvView(model, state)[0].entries.map((item) => item.id)).toEqual(['b']);
    state = setCvEntrySelected(state, model, 'b', false);
    expect(deriveCvView(model, state).map((section) => section.id)).toEqual(['learning']);
    expect(defaults.selectedEntryIds).toEqual(['a', 'b', 'c']);
  });

  it('moves entries only inside their section and moves sections without mutating the default state', () => {
    const model = createCvModel(site());
    const defaults = createDefaultCvState(model);
    const moved = moveCvEntry(defaults, model, 'b', -1);
    expect(deriveCvView(model, moved)[0].entries.map((item) => item.id)).toEqual(['b', 'a']);
    expect(moveCvEntry(moved, model, 'b', -1)).toEqual(moved);
    expect(moveCvEntry(moved, model, 'missing', 1)).toEqual(moved);
    const reordered = moveCvSection(moved, model, 'learning', -1);
    expect(deriveCvView(model, reordered).map((section) => section.id)).toEqual(['learning', 'work']);
    expect(defaults.entryOrder).toEqual(['a', 'b', 'c']);
    expect(defaults.sectionOrder).toEqual(['work', 'learning']);
  });

  it('drops stale and duplicate IDs without reselecting intentionally excluded or new entries', () => {
    const model = createCvModel(site());
    const saved = {
      version: 1 as const,
      selectedEntryIds: ['b', 'b', 'removed'], selectedSectionIds: ['work', 'removed'],
      entryOrder: ['b', 'removed', 'b', 'a'], sectionOrder: ['removed', 'work', 'work'],
    };
    expect(reconcileCvState(saved, model)).toEqual({
      version: 1, selectedEntryIds: ['b'], selectedSectionIds: ['work'],
      entryOrder: ['b', 'a', 'c'], sectionOrder: ['work', 'learning'],
    });
  });
});

describe('CV browser state privacy and recovery', () => {
  it.each([null, '', '{bad json', 'null', '[]', '42', '{"version":2}', '{"version":1,"selectedEntryIds":[{}]}'])(
    'recovers malformed or unsupported storage: %s', (raw) => {
      const model = createCvModel(site());
      expect(parseCvState(raw, model)).toEqual(createDefaultCvState(model));
    },
  );

  it('allows an intentionally empty CV selection and never serializes free-text extras', () => {
    const model = createCvModel(site());
    const state = { ...createDefaultCvState(model), selectedEntryIds: [], selectedSectionIds: [] };
    const input = { ...state, email: 'private@example.com', contact: 'PRIVATE CONTACT', summary: 'PRIVATE SUMMARY' };
    const serialized = serializeCvState(input);
    expect(serialized).not.toContain('PRIVATE');
    expect(serialized).not.toContain('private@example.com');
    expect(Object.keys(JSON.parse(serialized))).toEqual(['version', 'selectedEntryIds', 'selectedSectionIds', 'entryOrder', 'sectionOrder']);
    expect(parseCvState(JSON.stringify(input), model)).toEqual(state);
    expect(deriveCvView(model, parseCvState(serialized, model))).toEqual([]);
  });
});
