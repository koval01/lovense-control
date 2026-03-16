export const THEME_STORAGE_KEY = 'lovense-control-theme';

export const THEME_MODES = ['auto', 'light', 'dark'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export function isThemeMode(value: string): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}

export function resolveColorScheme(
  themeMode: ThemeMode,
  prefersDark: boolean
): 'light' | 'dark' {
  if (themeMode === 'auto') {
    return prefersDark ? 'dark' : 'light';
  }
  return themeMode;
}
