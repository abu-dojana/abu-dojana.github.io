import { describe, expect, it } from 'vitest';
import { createCvModel } from './cv';
import type { Section, SectionItem, SiteContent } from './types';

function makeItem(overrides: Partial<SectionItem> = {}): SectionItem {
  return {
    id: 'item-1',
    slug: 'item-1',
    sectionSlug: 'projects',
    kind: 'project',
    title: 'Sample Item',
    subtitle: '',
    summary: 'Concise summary.',
    images: [],
    files: [],
    cover: '',
    coverAlt: '',
    date: '2026-10-01',
    endDate: '',
    current: false,
    dateLabel: 'Oct 2026',
    status: 'completed',
    role: '',
    organization: '',
    organizationUrl: '',
    employmentType: '',
    institution: '',
    institutionUrl: '',
    field: '',
    grade: '',
    location: '',
    tech: [],
    tags: [],
    highlights: [],
    liveUrl: '',
    repoUrl: '',
    links: [],
    details: [],
    featured: false,
    showOnCv: true,
    published: true,
    order: 0,
    body: '',
    html: '',
    readingMinutes: 1,
    ...overrides,
  };
}

function makeSite(overrides: Partial<SiteContent> = {}): SiteContent {
  return {
    settings: {
      siteTitle: 'Abu Dojana',
      name: 'Abu Dojana',
      headline: '',
      bio: '',
      avatar: '',
      email: '',
      phone: '',
      location: '',
      links: [],
      skillGroups: [],
      homeEyebrow: '',
      homeTitle: '',
      homeDescription: '',
      footerNote: '',
      showCvInNavigation: true,
      noindex: false,
      externalLinks: [],
    },
    sections: [],
    about: {
      id: 'about',
      slug: 'about',
      title: 'About',
      type: 'general',
      summary: '',
      published: true,
      showInNavigation: true,
      navigationLabel: 'About',
      order: 999,
      body: '',
      html: '',
      items: [],
    },
    projects: [],
    experience: [],
    education: [],
    customItems: [],
    allItems: [],
    ...overrides,
  };
}

describe('ATS CV model generation', () => {
  it('orders sections Experience -> Selected Projects -> Education -> Custom sections', () => {
    const customSection: Section = {
      id: 'awards',
      slug: 'awards',
      title: 'Awards',
      type: 'general',
      summary: '',
      published: true,
      showInNavigation: true,
      navigationLabel: 'Awards',
      order: 10,
      body: '',
      html: '',
      items: [makeItem({ id: 'aw1', kind: 'item', sectionSlug: 'awards', title: 'Hackathon Winner', showOnCv: true })],
    };

    const site = makeSite({
      sections: [customSection],
      experience: [
        makeItem({
          id: 'exp1',
          kind: 'experience',
          sectionSlug: 'experience',
          title: 'Software Engineer',
          organization: 'Acme',
          employmentType: 'Full-time',
          location: 'Remote',
          dateLabel: 'Jan 2025 – Present',
          highlights: ['Reduced latency by 35%.'],
        }),
      ],
      projects: [
        makeItem({
          id: 'proj1',
          kind: 'project',
          sectionSlug: 'projects',
          title: 'SpaceTabs',
          liveUrl: 'https://example.com/store',
          highlights: [],
          summary: 'Local-first tab workspace manager.',
        }),
      ],
      education: [
        makeItem({
          id: 'edu1',
          kind: 'education',
          sectionSlug: 'education',
          title: 'B.Sc.',
          field: 'Computer Science',
          institution: 'University',
          grade: '3.9/4.0',
        }),
      ],
    });

    const model = createCvModel(site);
    expect(model.ready).toBe(true);
    expect(model.sections.map(s => s.title)).toEqual([
      'Experience',
      'Selected Projects',
      'Education',
      'Awards',
    ]);
    expect(model.sections[0].entries[0]).toMatchObject({
      title: 'Software Engineer',
      subtitle: 'Acme · Full-time',
      location: 'Remote',
      date: 'Jan 2025 – Present',
      summary: '',
      bullets: ['Reduced latency by 35%.'],
    });
    // Falls back to summary when highlights is empty
    expect(model.sections[1].entries[0]).toMatchObject({
      title: 'SpaceTabs',
      summary: 'Local-first tab workspace manager.',
      bullets: [],
      links: [{ label: 'Live', url: 'https://example.com/store' }],
    });
    expect(model.sections[2].entries[0]).toMatchObject({
      title: 'B.Sc., Computer Science',
      subtitle: 'University · Grade: 3.9/4.0',
    });
  });

  it('excludes unpublished and showOnCv=false items and omits empty sections', () => {
    const site = makeSite({
      projects: [
        makeItem({ id: 'p1', title: 'Visible', showOnCv: true, published: true }),
        makeItem({ id: 'p2', title: 'Draft', showOnCv: true, published: false }),
        makeItem({ id: 'p3', title: 'Hidden from CV', showOnCv: false, published: true }),
      ],
    });
    const model = createCvModel(site);
    expect(model.sections).toHaveLength(1);
    expect(model.sections[0].entries.map(e => e.id)).toEqual(['p1']);
  });

  it('includes attached PDF files as CV entry links without duplicating explicit links', () => {
    const customSection: Section = {
      id: 'research',
      slug: 'research',
      title: 'Research Papers',
      type: 'general',
      summary: '',
      published: true,
      showInNavigation: true,
      navigationLabel: 'Research',
      order: 6,
      body: '',
      html: '',
      items: [
        makeItem({
          id: 'paper-1',
          kind: 'item',
          sectionSlug: 'research',
          title: 'Efficient Tab Graphs',
          files: ['/files/tab-graphs.pdf', '/files/slides.pptx'],
          links: [{ label: 'Slides Mirror', url: '/files/slides.pptx' }],
          showOnCv: true,
        }),
      ],
    };

    const site = makeSite({ sections: [customSection] });
    const model = createCvModel(site);
    expect(model.sections[0].entries[0].links).toEqual([
      { label: 'Slides Mirror', url: '/files/slides.pptx' },
      { label: 'PDF 1', url: '/files/tab-graphs.pdf' },
    ]);
  });

  it('reports ready=false when name is blank or no CV content exists', () => {
    const empty = makeSite();
    expect(createCvModel(empty).ready).toBe(false);

    const noName = makeSite({
      projects: [makeItem()],
    });
    noName.settings.name = '   ';
    expect(createCvModel(noName).ready).toBe(false);
  });
});
