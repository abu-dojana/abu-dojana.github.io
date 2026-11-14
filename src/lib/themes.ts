export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  readonly bg: string;
  readonly surface: string;
  readonly surfaceAlt: string;
  readonly ink: string;
  readonly muted: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly line: string;
}

export const themes = [
  {
    id: 'light-paper',
    name: 'Light',
    mode: 'light',
    colors: {
      bg: '#f8f7f2',
      surface: '#fffefa',
      surfaceAlt: '#eeede5',
      ink: '#232b28',
      muted: '#636a63',
      accent: '#1f6656',
      accentSoft: '#e3eee7',
      line: '#d9dcd1',
    },
  },
  {
    id: 'dark-charcoal',
    name: 'Dark',
    mode: 'dark',
    colors: {
      bg: '#191919',
      surface: '#232323',
      surfaceAlt: '#2e2e2e',
      ink: '#f2f1ec',
      muted: '#b7b5ae',
      accent: '#e3c979',
      accentSoft: '#423b28',
      line: '#45443e',
    },
  },
] as const satisfies readonly { id: string; name: string; mode: ThemeMode; colors: ThemeColors }[];

export type Theme = (typeof themes)[number];
export type ThemeId = Theme['id'];
export type ThemePreference = 'system' | ThemeId;

export const themeStorageKey = 'portfolio-theme';
export const legacyThemeStorageKey = 'notebook-theme';
export const defaultLightTheme = 'light-paper' satisfies ThemeId;
export const defaultDarkTheme = 'dark-charcoal' satisfies ThemeId;

/** Migrate legacy 16-theme choices to Paper (light) or Charcoal (dark). */
export function normalizeThemePreference(value: unknown): ThemePreference {
  if (typeof value !== 'string') return 'system';
  if (value === 'light' || value.startsWith('light-')) return defaultLightTheme;
  if (value === 'dark' || value.startsWith('dark-')) return defaultDarkTheme;
  return 'system';
}

export function getTheme(preference: ThemePreference): Theme | undefined {
  return themes.find(theme => theme.id === preference);
}
