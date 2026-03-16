import type { TranslationKey, TranslationLocation } from '@/lib/i18n/types';

export const LOCATION_KEY_LIMITS: Record<
  TranslationLocation,
  Partial<Record<TranslationKey, number>>
> = {
  default: {},
  sidebarCaption: {
    record: 11,
    stop: 11,
    play: 12,
    pause: 12,
    resetGroups: 12,
  },
};
