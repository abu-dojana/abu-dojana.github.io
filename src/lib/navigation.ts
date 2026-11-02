export interface MeasuredNavigationItem {
  id: string;
  width: number;
  pinned?: boolean;
}

/** Choose by measured space, then return both groups in the original menu order. */
export function fitNavigationItems(items: MeasuredNavigationItem[], availableWidth: number, gap: number): {
  visible: string[];
  overflow: string[];
} {
  const available = Number.isFinite(availableWidth) ? Math.max(0, availableWidth) : 0;
  const spacing = Number.isFinite(gap) ? Math.max(0, gap) : 0;
  const visible = new Set<string>();
  let used = 0;

  // Permanent pages are useful anchors; subjects still keep the editor's ordering.
  for (const item of [...items.filter(item => item.pinned), ...items.filter(item => !item.pinned)]) {
    const width = Number.isFinite(item.width) ? Math.max(0, Math.ceil(item.width)) : available + 1;
    const next = used + (visible.size ? spacing : 0) + width;
    if (next <= available) {
      visible.add(item.id);
      used = next;
    }
  }

  return {
    visible: items.filter(item => visible.has(item.id)).map(item => item.id),
    overflow: items.filter(item => !visible.has(item.id)).map(item => item.id),
  };
}

export function isCurrentNavigationItem(
  item: { type: string; target: string },
  href: string,
  pathname: string,
  active = '',
): boolean {
  const normalized = (path: string) => path.replace(/\/+$/, '') || '/';
  if (href.startsWith('/') && normalized(href) === normalized(pathname)) return true;
  if (item.type === 'page' || item.type === 'about') return Boolean(active && active === item.target);
  return item.type === 'cv' && active === 'cv';
}
