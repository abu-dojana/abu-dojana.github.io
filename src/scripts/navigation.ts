import { fitNavigationItems } from '../lib/navigation';

function initializeNavigation() {
  const target = document.querySelector<HTMLElement>('[data-responsive-navigation]');
  if (!target || target.dataset.initialized) return;
  const nav = target;
  nav.dataset.initialized = 'true';
  const links = nav.querySelector<HTMLElement>('[data-nav-links]')!;
  const more = nav.querySelector<HTMLDetailsElement>('[data-nav-more]')!;
  const summary = more.querySelector<HTMLElement>('summary')!;
  const overflow = more.querySelector<HTMLElement>('[data-nav-overflow]')!;
  const allItems = [...links.querySelectorAll<HTMLAnchorElement>('[data-nav-item]')];
  let queued = false;

  function measure() {
    queued = false;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusedItem = allItems.find(item => item === focused);
    nav.dataset.navMeasuring = 'true';
    for (const item of allItems) links.append(item);

    const rowGap = Number.parseFloat(getComputedStyle(nav).columnGap) || 0;
    const itemGap = Number.parseFloat(getComputedStyle(links).columnGap) || 0;
    const available = nav.clientWidth - more.getBoundingClientRect().width - rowGap;
    const fitted = fitNavigationItems(allItems.map(item => ({
      id: item.dataset.navItem!, width: item.getBoundingClientRect().width,
      pinned: item.dataset.navPinned === 'true',
    })), available, itemGap);
    const visible = new Set(fitted.visible);
    for (const item of allItems) (visible.has(item.dataset.navItem!) ? links : overflow).append(item);
    overflow.hidden = fitted.overflow.length === 0;
    more.dataset.hasOverflow = fitted.overflow.length ? 'true' : 'false';
    const currentInMore = [...overflow.querySelectorAll('[aria-current="page"]')].length > 0;
    const moreIsCurrent = currentInMore || more.dataset.directoryCurrent === 'true';
    more.dataset.current = moreIsCurrent ? 'true' : 'false';
    summary.setAttribute('aria-label', moreIsCurrent ? 'More pages, including the current page' : 'More pages');
    nav.dataset.navEnhanced = 'true';
    delete nav.dataset.navMeasuring;

    if (focusedItem) {
      if (overflow.contains(focusedItem)) more.open = true;
      if (document.activeElement !== focusedItem) focusedItem.focus({ preventScroll: true });
    }
  }

  function queueMeasurement() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(measure);
  }

  more.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !more.open) return;
    event.preventDefault();
    more.open = false;
    summary.focus();
  });
  document.addEventListener('click', event => {
    if (more.open && event.target instanceof Node && !more.contains(event.target)) more.open = false;
  });
  measure();
  if (typeof ResizeObserver === 'function') new ResizeObserver(queueMeasurement).observe(nav);
  else window.addEventListener('resize', queueMeasurement, { passive: true });
  void document.fonts?.ready.then(queueMeasurement);
}

function initializeTheme() {
  const picker = document.querySelector<HTMLSelectElement>('#theme-select');
  if (!picker || picker.dataset.initialized) return;
  picker.dataset.initialized = 'true';
  const wrapper = picker.closest<HTMLElement>('[data-theme-choice]');
  let theme = 'system';
  try {
    const stored = localStorage.getItem('notebook-theme');
    if (stored === 'light' || stored === 'dark') theme = stored;
  } catch {}
  picker.value = theme;
  if (wrapper) wrapper.dataset.themeChoice = theme;
  picker.disabled = false;
  picker.addEventListener('change', () => {
    const next = picker.value;
    if (next === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    if (wrapper) wrapper.dataset.themeChoice = next;
    try {
      if (next === 'system') localStorage.removeItem('notebook-theme');
      else localStorage.setItem('notebook-theme', next);
    } catch {}
  });
}

initializeNavigation();
initializeTheme();
document.addEventListener('astro:page-load', () => { initializeNavigation(); initializeTheme(); });
