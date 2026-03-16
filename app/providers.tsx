 'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConfigProvider, AdaptivityProvider, AppRoot, Snackbar } from '@vkontakte/vkui';
import { Icon16Done } from '@vkontakte/icons';
import { Provider as ReduxProvider } from 'react-redux';
import { I18nProvider } from '@/contexts/i18n-context';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { ToastContext } from '@/contexts/toast-context';
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

  const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);

  const showToast = useCallback(
    (message: string) => {
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={<Icon16Done fill="var(--vkui--color_icon_positive)" />}
          duration={2000}
        >
          {message}
        </Snackbar>
      );
    },
    []
  );

  return (
    <ConfigProvider
      colorScheme={resolvedColorScheme}
      platform={platform}
      direction={direction}
    >
      <AdaptivityProvider>
        <AppRoot disableSettingVKUIClassesInRuntime>
          <ToastContext.Provider value={showToast}>
            <I18nProvider initialDetectedLanguage={initialLanguage}>
              {children}
              {snackbar}
            </I18nProvider>
          </ToastContext.Provider>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}
