import { themes, defaultLightTheme, defaultDarkTheme } from './themes';

function declarations(theme: typeof themes[number]): string {
  const c = theme.colors;
  return `--bg:${c.bg};--surface:${c.surface};--surface-alt:${c.surfaceAlt};--ink:${c.ink};--muted:${c.muted};--accent:${c.accent};--accent-soft:${c.accentSoft};--line:${c.line};--shadow:${theme.mode === 'dark' ? 'none' : '0 12px 40px #1f3c2c08'};color-scheme:${theme.mode};accent-color:var(--accent)`;
}

const light = themes.find(theme => theme.id === defaultLightTheme)!;
const dark = themes.find(theme => theme.id === defaultDarkTheme)!;

// Render the palette rules with the document so System also works without JavaScript.
export const themeStyles = [
  `:root{${declarations(light)}}`,
  `@media(prefers-color-scheme:dark){:root:not([data-theme]){${declarations(dark)}}}`,
  ...themes.map(theme => `:root[data-theme="${theme.id}"]{${declarations(theme)}}`),
].join('\n');
