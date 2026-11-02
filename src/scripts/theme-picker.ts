import { defaultDarkTheme, defaultLightTheme, getTheme, normalizeThemePreference, themeStorageKey, type ThemePreference } from '../lib/themes';

export function initializeThemePicker() {
  const picker = document.querySelector<HTMLDetailsElement>('[data-theme-picker]');
  if (!picker || picker.dataset.initialized) return;
  picker.dataset.initialized = 'true';
  const summary = picker.querySelector<HTMLElement>('summary')!;
  const label = picker.querySelector<HTMLElement>('[data-theme-name]')!;
  const options = [...picker.querySelectorAll<HTMLInputElement>('input[data-theme-option]')];
  const deviceTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference: ThemePreference = 'system';
  try { preference = normalizeThemePreference(localStorage.getItem(themeStorageKey)); } catch {}

  function apply(next: ThemePreference) {
    preference = next;
    if (next === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    const selected = getTheme(next);
    label.textContent = selected?.name || 'System';
    picker!.dataset.themeMode = selected?.mode || 'system';
    for (const option of options) option.checked = option.value === next;
    const resolved = selected || getTheme(deviceTheme.matches ? defaultDarkTheme : defaultLightTheme)!;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved.colors.bg);
  }

  apply(preference);
  for (const fields of picker.querySelectorAll<HTMLFieldSetElement>('[data-theme-options]')) fields.disabled = false;
  picker.addEventListener('change', event => {
    if (!(event.target instanceof HTMLInputElement) || !event.target.matches('[data-theme-option]')) return;
    const next = normalizeThemePreference(event.target.value);
    apply(next);
    try {
      if (next === 'system') localStorage.removeItem(themeStorageKey);
      else localStorage.setItem(themeStorageKey, next);
    } catch {}
  });
  function close() {
    picker!.open = false;
    summary.focus();
  }
  picker.querySelector('[data-theme-close]')?.addEventListener('click', close);
  picker.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !picker.open) return;
    event.preventDefault();
    close();
  });
  document.addEventListener('click', event => {
    if (picker.open && event.target instanceof Node && !picker.contains(event.target)) picker.open = false;
  });
  deviceTheme.addEventListener('change', () => { if (preference === 'system') apply('system'); });
  window.addEventListener('storage', event => {
    if (event.key === themeStorageKey || event.key === null) apply(normalizeThemePreference(event.newValue));
  });
}
