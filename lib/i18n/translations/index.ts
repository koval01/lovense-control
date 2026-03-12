import type { LanguageCode, TranslationMap } from '@/lib/i18n/types';
import { enTranslations } from '@/lib/i18n/translations/en';
import { ruTranslations } from '@/lib/i18n/translations/ru';
import { deTranslations } from '@/lib/i18n/translations/de';
import { beTranslations } from '@/lib/i18n/translations/be';
import { ukTranslations } from '@/lib/i18n/translations/uk';

export const TRANSLATIONS: Record<LanguageCode, TranslationMap> = {
  en: enTranslations,
  ru: ruTranslations,
  de: deTranslations,
  be: beTranslations,
  uk: ukTranslations,
};
