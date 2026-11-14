import { describe, expect, it } from 'vitest';
import { fitNavigationItems, isCurrentNavigationItem } from './navigation';

const items = [
  { id: 'home', width: 60, pinned: true },
  { id: 'projects', width: 100 },
  { id: 'experience', width: 120 },
  { id: 'cv', width: 45, pinned: true },
];

describe('navigation overflow measured by available space', () => {
  it('shows every link when space permits without a subject-count limit', () => {
    expect(fitNavigationItems(items, 400, 8)).toEqual({
      visible: ['home', 'projects', 'experience', 'cv'],
      overflow: [],
    });
    const many = Array.from({ length: 40 }, (_, index) => ({ id: `section-${index}`, width: 50 }));
    expect(fitNavigationItems(many, 3000, 8).visible).toHaveLength(40);
  });

  it('reserves Home and CV anchors and keeps both groups in order', () => {
    expect(fitNavigationItems(items, 250, 8)).toEqual({
      visible: ['home', 'projects', 'cv'],
      overflow: ['experience'],
    });
    expect(fitNavigationItems(items, 150, 8)).toEqual({
      visible: ['home', 'cv'],
      overflow: ['projects', 'experience'],
    });
  });

  it('moves long labels into More rather than forcing overflow', () => {
    const long = [{ id: 'long', width: 2000 }, ...items];
    expect(fitNavigationItems(long, 250, 8)).toEqual({
      visible: ['home', 'projects', 'cv'],
      overflow: ['long', 'experience'],
    });
    expect(fitNavigationItems(items, 0, 8).visible).toEqual([]);
  });

  it('keeps About pinned beside Home and CV when custom sections overflow', () => {
    const withAbout = [...items.slice(0, -1), { id: 'about', width: 65, pinned: true }, items[items.length - 1]];
    expect(fitNavigationItems(withAbout, 200, 8)).toEqual({
      visible: ['home', 'about', 'cv'],
      overflow: ['projects', 'experience'],
    });
  });
});

describe('current navigation destination', () => {
  it('highlights a section and any nested item under that section', () => {
    const section = { type: 'section', target: 'projects' };
    expect(isCurrentNavigationItem(section, '/projects/', '/projects')).toBe(true);
    expect(isCurrentNavigationItem(section, '/projects/', '/projects/spacetabs/', 'projects')).toBe(true);
    expect(isCurrentNavigationItem(section, '/projects/', '/projects/spacetabs/')).toBe(true);
    expect(isCurrentNavigationItem(section, '/projects/', '/experience/acme/', 'experience')).toBe(false);
  });

  it('highlights About and CV accurately and never marks external links as current', () => {
    expect(isCurrentNavigationItem({ type: 'about', target: 'about' }, '/about/', '/about/', 'about')).toBe(true);
    expect(isCurrentNavigationItem({ type: 'cv', target: '' }, '/cv/', '/cv/', 'cv')).toBe(true);
    expect(isCurrentNavigationItem({ type: 'external', target: 'https://github.com' }, 'https://github.com', '/')).toBe(false);
  });
});
