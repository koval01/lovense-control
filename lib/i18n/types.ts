export const SUPPORTED_LANGUAGES = ['en', 'ru', 'de', 'be', 'uk'] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
}

export type TranslationKey =
  | 'appTitle'
  | 'language'
  | 'theme'
  | 'themeAuto'
  | 'themeLight'
  | 'themeDark'
  | 'languageSelectionTitle'
  | 'languageSelectionSubtitle'
  | 'continue'
  | 'loading'
  | 'myToys'
  | 'stopAll'
  | 'connecting'
  | 'establishingSecureConnection'
  | 'connectionFailed'
  | 'defaultConnectionError'
  | 'tryAgain'
  | 'pairDevice'
  | 'qrInstruction'
  | 'lovenseQrCodeAlt'
  | 'waitingForAppConnection'
  | 'noToysFound'
  | 'emptyStateHint'
  | 'noToysSelected'
  | 'emptySelectionHint'
  | 'record'
  | 'stop'
  | 'play'
  | 'pause'
  | 'resetGroups'
  | 'maxLevel'
  | 'floatMode'
  | 'toysConnected'
  | 'sliders'
  | 'maxLevelForFeature'
  | 'onboardingSkipToQr'
  | 'onboardingLanguageTitle'
  | 'onboardingLanguageSubtitle'
  | 'onboardingUseSuggestedLanguage'
  | 'onboardingThemeTitle'
  | 'onboardingThemeSubtitle'
  | 'onboardingThemeAutoDescription'
  | 'onboardingThemeLightDescription'
  | 'onboardingThemeDarkDescription'
  | 'onboardingDemoTitle'
  | 'onboardingDemoSubtitle'
  | 'onboardingDemoCommandsInfo'
  | 'onboardingContinueToQr'
  | 'onboardingDemoVisualTitle'
  | 'onboardingDemoVisualDescription'
  | 'onboardingDemoBubbleMode'
  | 'onboardingDemoLimitMode'
  | 'onboardingDemoHint1'
  | 'onboardingDemoHint2'
  | 'onboardingDemoHint3'
  | 'onboardingDemoStepGraph'
  | 'onboardingDemoStepBubble'
  | 'onboardingDemoStepLimits'
  | 'onboardingDemoStepSidebar'
  | 'onboardingDemoNextStep'
  | 'onboardingDemoFinishTraining'
  | 'onboardingDemoCompleted'
  | 'controlModeTitle'
  | 'controlModeSubtitle'
  | 'controlModeSelfTitle'
  | 'controlModeSelfDescription'
  | 'controlModePartnerTitle'
  | 'controlModePartnerDescription'
  | 'controlModePartnerUnavailableSuffix'
  | 'partnerModeTitle'
  | 'partnerModeDescription'
  | 'partnerModeCreateCode'
  | 'partnerModeBack'
  | 'partnerModeJoinLabel'
  | 'partnerModeJoinButton'
  | 'partnerModeWaitingForRoom'
  | 'partnerModeShareCode'
  | 'partnerModeCopyCode'
  | 'partnerModeStartLocalTestPeer'
  | 'partnerModeStopLocalTestPeer'
  | 'partnerModeExit';

export type TranslationMap = Record<TranslationKey, string>;

export type TranslationLocation = 'default' | 'sidebarCaption';

export interface TranslateOptions {
  location?: TranslationLocation;
  maxLength?: number;
}
