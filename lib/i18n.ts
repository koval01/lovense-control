import { LANGUAGE_OPTIONS, LANGUAGE_STORAGE_KEY } from '@/lib/i18n/constants';
import { LOCATION_KEY_LIMITS } from '@/lib/i18n/limits';
import { TRANSLATIONS } from '@/lib/i18n/translations';
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type LanguageOption,
  type TranslateOptions,
  type TranslationKey,
  type TranslationLocation,
} from '@/lib/i18n/types';

export {
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  type LanguageCode,
  type LanguageOption,
  type TranslateOptions,
  type TranslationKey,
  type TranslationLocation,
};

export function isSupportedLanguage(value: string): value is LanguageCode {
  return SUPPORTED_LANGUAGES.includes(value as LanguageCode);
}

function truncateWithEllipsis(text: string, maxLength: number): string {
  if (maxLength <= 0) return text;
  if (text.length <= maxLength) return text;
  if (maxLength === 1) return '…';
  return `${text.slice(0, maxLength - 1)}…`;
}

export function translate(
  language: LanguageCode,
  key: TranslationKey,
  variables?: Record<string, string | number>,
  options?: TranslateOptions
): string {
  const template = TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key];
  const translated = !variables
    ? template
    : template.replace(/\{(\w+)\}/g, (_match, variableName) => {
        const value = variables[variableName];
        return value === undefined ? `{${variableName}}` : String(value);
      });

  const location = options?.location ?? 'default';
  const configuredLimit = LOCATION_KEY_LIMITS[location]?.[key];
  const effectiveLimit = options?.maxLength ?? configuredLimit;
  if (!effectiveLimit) return translated;

  return truncateWithEllipsis(translated, effectiveLimit);
}
