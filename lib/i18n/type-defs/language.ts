export const SUPPORTED_LANGUAGES = ['en', 'ru', 'de', 'be', 'uk', 'zh'] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
}
