import { describe, expect, it } from 'vitest';
import { fitNavigationItems, isCurrentNavigationItem } from './navigation';

const items = [
  { id: 'home', width: 60, pinned: true },
  { id: 'projects', width: 100 },
  { id: 'adventures', width: 120 },
  { id: 'cv', width: 45, pinned: true },
];

describe('navigation overflow measured by available space', () => {
  it('shows every link when space permits without a subject-count limit', () => {
    expect(fitNavigationItems(items, 400, 8)).toEqual({ visible: ['home', 'projects', 'adventures', 'cv'], overflow: [] });
    const many = Array.from({ length: 40 }, (_, index) => ({ id: `page-${index}`, width: 50 }));
    expect(fitNavigationItems(many, 3000, 8).visible).toHaveLength(40);
  });

  it('reserves useful Home/CV anchors and keeps both groups in editor order', () => {
    expect(fitNavigationItems(items, 250, 8)).toEqual({ visible: ['home', 'projects', 'cv'], overflow: ['adventures'] });
    expect(fitNavigationItems(items, 150, 8)).toEqual({ visible: ['home', 'cv'], overflow: ['projects', 'adventures'] });
  });

  it('moves long labels into More rather than forcing the row past the viewport', () => {
    const long = [{ id: 'long', width: 2000 }, ...items];
    expect(fitNavigationItems(long, 250, 8)).toEqual({ visible: ['home', 'projects', 'cv'], overflow: ['long', 'adventures'] });
    expect(fitNavigationItems(items, 0, 8).visible).toEqual([]);
  });

  it('keeps the permanent About link beside Home and CV when custom pages overflow', () => {
    const withAbout = [...items.slice(0, -1), { id: 'about', width: 65, pinned: true }, items[items.length - 1]];
    expect(fitNavigationItems(withAbout, 200, 8)).toEqual({ visible: ['home', 'about', 'cv'], overflow: ['projects', 'adventures'] });
  });

  it('recomputes responsive membership and rounds fractional widths conservatively', () => {
    expect(fitNavigationItems([{ id: 'a', width: 50.2 }, { id: 'b', width: 50.2 }], 100.5, 0).visible).toEqual(['a']);
    expect(fitNavigationItems(items, 400, 8).overflow).toEqual([]);
    expect(fitNavigationItems(items, 150, 8).overflow).toEqual(['projects', 'adventures']);
    expect(fitNavigationItems(items, 400, 8).overflow).toEqual([]);
  });
});

describe('current navigation destination', () => {
  it('highlights a page and its child item through the owning page identity', () => {
    const page = { type: 'page', target: 'adventures-id' };
    expect(isCurrentNavigationItem(page, '/pages/adventures/', '/pages/adventures')).toBe(true);
    expect(isCurrentNavigationItem(page, '/pages/adventures/', '/entries/a-walk/', 'adventures-id')).toBe(true);
    expect(isCurrentNavigationItem(page, '/pages/adventures/', '/entries/a-walk/', 'projects-id')).toBe(false);
  });

  it('keeps CV active inside its builder and does not treat an external link as current', () => {
    expect(isCurrentNavigationItem({ type: 'cv', target: '' }, '/cv/', '/cv/build/', 'cv')).toBe(true);
    expect(isCurrentNavigationItem({ type: 'external', target: '' }, 'https://example.com/', '/')).toBe(false);
  });

  it('keeps About active when reading one of its optional items', () => {
    expect(isCurrentNavigationItem({ type: 'about', target: 'about-id' }, '/pages/about/', '/entries/a-milestone/', 'about-id')).toBe(true);
  });
});
