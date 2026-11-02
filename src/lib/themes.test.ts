import { describe, expect, it } from 'vitest';
import {
  defaultDarkTheme, defaultLightTheme, getTheme, normalizeThemePreference, themes,
} from './themes';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(offset => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

describe('theme choices and saved preferences', () => {
  it('offers eight distinct light and eight distinct dark palettes', () => {
    expect(themes.filter(theme => theme.mode === 'light')).toHaveLength(8);
    expect(themes.filter(theme => theme.mode === 'dark')).toHaveLength(8);
    expect(new Set(themes.map(theme => theme.id)).size).toBe(16);
    expect(new Set(themes.map(theme => JSON.stringify(theme.colors))).size).toBe(16);
    expect(getTheme(defaultLightTheme)?.mode).toBe('light');
    expect(getTheme(defaultDarkTheme)?.mode).toBe('dark');
  });

  it('migrates previous choices and restores every named theme', () => {
    expect(normalizeThemePreference('light')).toBe(defaultLightTheme);
    expect(normalizeThemePreference('dark')).toBe(defaultDarkTheme);
    for (const theme of themes) {
      const preference = normalizeThemePreference(theme.id);
      expect(preference).toBe(theme.id);
      expect(getTheme(preference)).toBe(theme);
    }
  });

  it.each([undefined, null, '', 'system', 'removed-theme', 1, {}, ['dark']])(
    'falls back to device preference for unsupported stored values: %j', value => {
      expect(normalizeThemePreference(value)).toBe('system');
      expect(getTheme(normalizeThemePreference(value))).toBeUndefined();
    },
  );
});

describe('theme text contrast', () => {
  it.each(themes)('$id keeps body text, muted labels, links, and buttons readable', ({ colors }) => {
    for (const color of Object.values(colors)) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    for (const background of [colors.bg, colors.surface, colors.surfaceAlt, colors.accentSoft]) {
      for (const foreground of [colors.ink, colors.muted, colors.accent]) {
        expect(contrast(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    // Existing primary buttons use the page background as text on the accent.
    expect(contrast(colors.bg, colors.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
