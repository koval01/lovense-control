'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  THEME_STORAGE_KEY,
  type ThemeMode,
  isThemeMode,
  resolveColorScheme,
} from '@/lib/theme';

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedColorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [resolvedColorScheme, setResolvedColorScheme] = useState<'light' | 'dark'>('light');
  const themeModeRef = useRef<ThemeMode>('auto');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyResolvedColorScheme = (mode: ThemeMode) => {
      const resolved = resolveColorScheme(mode, mediaQuery.matches);
      setResolvedColorScheme(resolved);
    };

    let initialMode: ThemeMode = 'auto';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && isThemeMode(stored)) {
        initialMode = stored;
      }
    } catch {
      // Ignore storage access errors and fallback to auto mode.
    }

    setThemeModeState(initialMode);
    themeModeRef.current = initialMode;
    applyResolvedColorScheme(initialMode);

    const handleMediaChange = () => {
      if (themeModeRef.current !== 'auto') return;
      setResolvedColorScheme(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Ignore storage write errors and keep in-memory theme mode.
    }
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = resolvedColorScheme;
    document.documentElement.classList.toggle('dark', resolvedColorScheme === 'dark');
  }, [themeMode, resolvedColorScheme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    themeModeRef.current = mode;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setResolvedColorScheme(resolveColorScheme(mode, prefersDark));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      setThemeMode,
      resolvedColorScheme,
    }),
    [themeMode, setThemeMode, resolvedColorScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
