import {
  defaultDarkTheme,
  defaultLightTheme,
  getTheme,
  legacyThemeStorageKey,
  normalizeThemePreference,
  themeStorageKey,
  type ThemePreference,
} from '../lib/themes';

function readStoredPreference(): ThemePreference {
  try {
    const primary = localStorage.getItem(themeStorageKey);
    if (primary !== null) return normalizeThemePreference(primary);
    const legacy = localStorage.getItem(legacyThemeStorageKey);
    if (legacy !== null) return normalizeThemePreference(legacy);
  } catch {}
  return 'system';
}

export function initializeThemePicker() {
  const picker = document.querySelector<HTMLElement>('[data-theme-picker]');
  if (!picker || picker.dataset.initialized) return;
  picker.dataset.initialized = 'true';

  const buttons = [...picker.querySelectorAll<HTMLButtonElement>('[data-theme-option]')];
  const deviceTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference: ThemePreference = readStoredPreference();

  function apply(next: ThemePreference) {
    preference = next;
    if (next === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;

    for (const button of buttons) {
      button.setAttribute('aria-pressed', button.dataset.themeOption === next ? 'true' : 'false');
    }

    const selected = getTheme(next);
    const resolved = selected || getTheme(deviceTheme.matches ? defaultDarkTheme : defaultLightTheme)!;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved.colors.bg);
  }

  apply(preference);

  picker.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-theme-option]') : null;
    if (!target) return;
    const next = normalizeThemePreference(target.dataset.themeOption);
    apply(next);
    try {
      if (next === 'system') localStorage.removeItem(themeStorageKey);
      else localStorage.setItem(themeStorageKey, next);
      localStorage.removeItem(legacyThemeStorageKey);
    } catch {}
  });

  deviceTheme.addEventListener('change', () => {
    if (preference === 'system') apply('system');
  });

  window.addEventListener('storage', event => {
    if (event.key === themeStorageKey || event.key === legacyThemeStorageKey || event.key === null) {
      apply(readStoredPreference());
    }
  });
}
