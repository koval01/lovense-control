import type { TranslationKeyControl } from './translation-keys-control';
import type { TranslationKeyOnboarding } from './translation-keys-onboarding';
import type { TranslationKeyPartner } from './translation-keys-partner';
import type { TranslationKeyShell } from './translation-keys-shell';

export type TranslationKey =
  | TranslationKeyShell
  | TranslationKeyOnboarding
  | TranslationKeyControl
  | TranslationKeyPartner;
