'use client';

import { useEffect } from 'react';
import { ConfigProvider, AdaptivityProvider, AppRoot } from '@vkontakte/vkui';
import { Provider as ReduxProvider } from 'react-redux';
import { I18nProvider } from '@/contexts/i18n-context';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import type { LanguageCode } from '@/lib/i18n';
import { store } from '@/store';

type Platform = 'ios' | 'android' | 'vkcom';
type Direction = 'ltr' | 'rtl';

type ProvidersProps = {
  children: React.ReactNode;
  platform: Platform;
  direction: Direction;
  initialLanguage: LanguageCode;
};

export function Providers({ children, platform, direction, initialLanguage }: ProvidersProps) {
  useEffect(() => {
    document.documentElement.classList.remove('no-js');
  }, []);

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <ProvidersContent platform={platform} direction={direction} initialLanguage={initialLanguage}>
          {children}
        </ProvidersContent>
      </ThemeProvider>
    </ReduxProvider>
  );
}

function ProvidersContent({
  children,
  platform,
  direction,
  initialLanguage,
}: ProvidersProps) {
  const { resolvedColorScheme } = useTheme();

  return (
    <ConfigProvider
      colorScheme={resolvedColorScheme}
      platform={platform}
      direction={direction}
    >
      <AdaptivityProvider>
        <AppRoot disableSettingVKUIClassesInRuntime>
          <I18nProvider initialDetectedLanguage={initialLanguage}>{children}</I18nProvider>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}
