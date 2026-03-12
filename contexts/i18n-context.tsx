'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  type LanguageCode,
  type TranslateOptions,
  type TranslationKey,
  isSupportedLanguage,
  translate,
} from '@/lib/i18n';

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (
    key: TranslationKey,
    variables?: Record<string, string | number>,
    options?: TranslateOptions
  ) => string;
  isReady: boolean;
  hasSelectedLanguage: boolean;
  languageOptions: typeof LANGUAGE_OPTIONS;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialDetectedLanguage = 'en',
}: {
  children: React.ReactNode;
  initialDetectedLanguage?: LanguageCode;
}) {
  const [language, setLanguageState] = useState<LanguageCode>(initialDetectedLanguage);
  const [isReady, setIsReady] = useState(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && isSupportedLanguage(stored)) {
        setLanguageState(stored);
        setHasSelectedLanguage(true);
      } else {
        setLanguageState(initialDetectedLanguage);
        setHasSelectedLanguage(false);
      }
    } catch {
      // Ignore storage access errors and fallback to default language.
      setLanguageState(initialDetectedLanguage);
      setHasSelectedLanguage(false);
    } finally {
      setIsReady(true);
    }
  }, [initialDetectedLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next);
    setHasSelectedLanguage(true);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Ignore storage write errors and keep in-memory language.
    }
  }, []);

  const t = useCallback(
    (
      key: TranslationKey,
      variables?: Record<string, string | number>,
      options?: TranslateOptions
    ) => {
      return translate(language, key, variables, options);
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      isReady,
      hasSelectedLanguage,
      languageOptions: LANGUAGE_OPTIONS,
    }),
    [language, setLanguage, t, isReady, hasSelectedLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
