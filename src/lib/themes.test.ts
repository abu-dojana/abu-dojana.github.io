import { describe, expect, it } from 'vitest';
import {
  defaultDarkTheme,
  defaultLightTheme,
  getTheme,
  normalizeThemePreference,
  themes,
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
  it('offers Paper (light) and Charcoal (dark) palettes', () => {
    expect(themes).toHaveLength(2);
    expect(defaultLightTheme).toBe('light-paper');
    expect(defaultDarkTheme).toBe('dark-charcoal');
    expect(getTheme(defaultLightTheme)?.mode).toBe('light');
    expect(getTheme(defaultDarkTheme)?.mode).toBe('dark');
  });

  it('migrates legacy 16-theme choices to Light (Paper) or Dark (Charcoal)', () => {
    expect(normalizeThemePreference('light')).toBe('light-paper');
    expect(normalizeThemePreference('light-sky')).toBe('light-paper');
    expect(normalizeThemePreference('light-paper')).toBe('light-paper');
    expect(normalizeThemePreference('dark')).toBe('dark-charcoal');
    expect(normalizeThemePreference('dark-forest')).toBe('dark-charcoal');
    expect(normalizeThemePreference('dark-charcoal')).toBe('dark-charcoal');
  });

  it.each([undefined, null, '', 'system', 'unknown', 1, {}, ['dark']])(
    'falls back to system preference for unsupported stored values: %j',
    value => {
      expect(normalizeThemePreference(value)).toBe('system');
      expect(getTheme(normalizeThemePreference(value))).toBeUndefined();
    },
  );
});

describe('theme text contrast', () => {
  it.each(themes)('$id meets WCAG AA text contrast across all surfaces', ({ colors }) => {
    for (const color of Object.values(colors)) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    for (const background of [colors.bg, colors.surface, colors.surfaceAlt, colors.accentSoft]) {
      for (const foreground of [colors.ink, colors.muted, colors.accent]) {
        expect(contrast(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(contrast(colors.bg, colors.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
