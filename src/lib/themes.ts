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
    id: 'light-paper', name: 'Paper', mode: 'light',
    colors: { bg: '#f8f7f2', surface: '#fffefa', surfaceAlt: '#eeede5', ink: '#232b28', muted: '#636a63', accent: '#1f6656', accentSoft: '#e3eee7', line: '#d9dcd1' },
  },
  {
    id: 'light-sand', name: 'Sand', mode: 'light',
    colors: { bg: '#faf5eb', surface: '#fffaf2', surfaceAlt: '#eee4d3', ink: '#332b23', muted: '#6b5f50', accent: '#85501e', accentSoft: '#f1e4cc', line: '#dfcfb6' },
  },
  {
    id: 'light-rose', name: 'Rose', mode: 'light',
    colors: { bg: '#fcf3f5', surface: '#fffafb', surfaceAlt: '#f1e3e8', ink: '#39272e', muted: '#705861', accent: '#983f60', accentSoft: '#f5e0e8', line: '#e6ccd6' },
  },
  {
    id: 'light-sky', name: 'Sky', mode: 'light',
    colors: { bg: '#f0f7fc', surface: '#fbfdff', surfaceAlt: '#e0edf6', ink: '#1f3343', muted: '#536777', accent: '#235f99', accentSoft: '#dfedf9', line: '#c9dce9' },
  },
  {
    id: 'light-sage', name: 'Sage', mode: 'light',
    colors: { bg: '#f2f6ed', surface: '#fcfdf8', surfaceAlt: '#e3ecd9', ink: '#2d3929', muted: '#59694f', accent: '#45692a', accentSoft: '#e4edd9', line: '#cddabf' },
  },
  {
    id: 'light-lavender', name: 'Lavender', mode: 'light',
    colors: { bg: '#f6f3fc', surface: '#fdfbff', surfaceAlt: '#eae3f5', ink: '#30283f', muted: '#655b76', accent: '#6b4694', accentSoft: '#ece2f6', line: '#dacde9' },
  },
  {
    id: 'light-peach', name: 'Peach', mode: 'light',
    colors: { bg: '#fff4ed', surface: '#fffbf7', surfaceAlt: '#f6e4d7', ink: '#3b2a22', muted: '#745d50', accent: '#934c2e', accentSoft: '#f7e2d3', line: '#e7cdba' },
  },
  {
    id: 'light-slate', name: 'Slate', mode: 'light',
    colors: { bg: '#f3f5f7', surface: '#fdfefe', surfaceAlt: '#e4e9ef', ink: '#293441', muted: '#5b6775', accent: '#385c83', accentSoft: '#e1eaf3', line: '#cbd4df' },
  },
  {
    id: 'dark-forest', name: 'Forest', mode: 'dark',
    colors: { bg: '#181e1b', surface: '#202824', surfaceAlt: '#28322c', ink: '#eceee5', muted: '#a8b2a8', accent: '#9bcdb7', accentSoft: '#283f34', line: '#3b493e' },
  },
  {
    id: 'dark-midnight', name: 'Midnight', mode: 'dark',
    colors: { bg: '#111320', surface: '#1a1e30', surfaceAlt: '#252b40', ink: '#eceefa', muted: '#aeb7d3', accent: '#a9b9ff', accentSoft: '#2a3357', line: '#3b4260' },
  },
  {
    id: 'dark-charcoal', name: 'Charcoal', mode: 'dark',
    colors: { bg: '#191919', surface: '#232323', surfaceAlt: '#2e2e2e', ink: '#f2f1ec', muted: '#b7b5ae', accent: '#e3c979', accentSoft: '#423b28', line: '#45443e' },
  },
  {
    id: 'dark-plum', name: 'Plum', mode: 'dark',
    colors: { bg: '#211522', surface: '#2d1e2f', surfaceAlt: '#3a293c', ink: '#f6e9f4', muted: '#c5aac1', accent: '#e7a9dd', accentSoft: '#4d2c49', line: '#583950' },
  },
  {
    id: 'dark-navy', name: 'Navy', mode: 'dark',
    colors: { bg: '#101c2b', surface: '#17283c', surfaceAlt: '#23364c', ink: '#e8f1fc', muted: '#a5bad1', accent: '#8dbcf2', accentSoft: '#233d5c', line: '#344f6c' },
  },
  {
    id: 'dark-ember', name: 'Ember', mode: 'dark',
    colors: { bg: '#251915', surface: '#32211b', surfaceAlt: '#402d24', ink: '#f9eee6', muted: '#ccb1a0', accent: '#f0b08a', accentSoft: '#563725', line: '#624532' },
  },
  {
    id: 'dark-espresso', name: 'Espresso', mode: 'dark',
    colors: { bg: '#211c18', surface: '#2d2620', surfaceAlt: '#3a3128', ink: '#f3ede3', muted: '#c4b8a5', accent: '#d6c193', accentSoft: '#493d28', line: '#564a38' },
  },
  {
    id: 'dark-ocean', name: 'Ocean', mode: 'dark',
    colors: { bg: '#102124', surface: '#173034', surfaceAlt: '#213d40', ink: '#e5f4f2', muted: '#a1c2c0', accent: '#80d4cb', accentSoft: '#224c4b', line: '#35595a' },
  },
] as const satisfies readonly { id: string; name: string; mode: ThemeMode; colors: ThemeColors }[];

export type Theme = (typeof themes)[number];
export type ThemeId = Theme['id'];
export type ThemePreference = 'system' | ThemeId;

export const themeStorageKey = 'notebook-theme';
export const defaultLightTheme = 'light-paper' satisfies ThemeId;
export const defaultDarkTheme = 'dark-forest' satisfies ThemeId;

/** Keep existing visitors' light/dark choices while accepting only known themes. */
export function normalizeThemePreference(value: unknown): ThemePreference {
  if (value === 'light') return defaultLightTheme;
  if (value === 'dark') return defaultDarkTheme;
  return themes.some(theme => theme.id === value) ? value as ThemeId : 'system';
}

export function getTheme(preference: ThemePreference): Theme | undefined {
  return themes.find(theme => theme.id === preference);
}
