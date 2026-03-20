import type { TranslationKey } from './translation-key';

export type TranslationMap = Record<TranslationKey, string>;

export type TranslationLocation = 'default' | 'sidebarCaption';

export interface TranslateOptions {
  location?: TranslationLocation;
  maxLength?: number;
}
