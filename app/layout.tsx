import type {Metadata, Viewport} from 'next';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import '@vkontakte/vkui/dist/vkui.css';
import './vkui-overrides.css'; // After VK UI so our accent applies to header icons
import { Providers } from './providers';
import { isSupportedLanguage, type LanguageCode } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#090b0f" },
  ]
}

export const metadata: Metadata = {
  title: 'Lovense Controller',
  description: 'Control your Lovense toys',
};

function getPlatformFromUserAgent(userAgent: string): 'ios' | 'android' {
  return /iPhone|iPad|iPod/.test(userAgent) ? 'ios' : 'android';
}

function getDirectionFromAcceptLanguage(acceptLanguage: string): 'ltr' | 'rtl' {
  const lang = acceptLanguage.split(',')[0]?.split('-')[0] || 'en';
  return ['ar', 'he', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr';
}

function getInitialLanguageFromAcceptLanguage(acceptLanguage: string): LanguageCode {
  const parts = acceptLanguage
    .split(',')
    .map((part) => part.trim().split(';')[0]?.trim().toLowerCase())
    .filter(Boolean) as string[];

  for (const part of parts) {
    const base = part.split('-')[0];
    if (isSupportedLanguage(base)) {
      return base;
    }
  }

  return 'en';
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const acceptLanguage = headersList.get('accept-language') || 'en-US';
  const platform = getPlatformFromUserAgent(userAgent);
  const direction = getDirectionFromAcceptLanguage(acceptLanguage);
  const initialLanguage = getInitialLanguageFromAcceptLanguage(acceptLanguage);

  const criticalDarkStyles = [
    /* Embedded in head so dark background applies before any external CSS, no white flicker on reload */
    ':root[data-theme="dark"]{color-scheme:dark}html[data-theme="dark"]{background-color:#090b0f !important}html[data-theme="dark"] body,html[data-theme="dark"] .vkui__root{background-color:#090b0f !important;color:#f4f7fb !important}',
    '@media (prefers-color-scheme: dark) {:root[data-theme="auto"]{color-scheme:dark}html[data-theme="auto"]{background-color:#090b0f !important}html[data-theme="auto"] body,html[data-theme="auto"] .vkui__root{background-color:#090b0f !important;color:#f4f7fb !important}}',
    '.no-js header,.no-js [class*="PanelHeader"]{visibility:hidden !important}',
  ].join('');

  return (
    <html lang="en" dir={direction} className={`vkui no-js dark:bg-black ${inter.className}`} suppressHydrationWarning>
      <head>
        {/* Runs during parse, before first paint — prevents white flash on reload in dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;var k='lovense-control-theme';var s=localStorage.getItem(k);var m=(s==='light'||s==='dark'||s==='auto')?s:'auto';r.dataset.theme=m;var d=m==='dark'||(m==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);r.style.colorScheme=d?'dark':'light';r.classList.toggle('dark',d);r.style.backgroundColor=d?'#090b0f':'#f3f4f6';}catch(e){}})();`,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: criticalDarkStyles }} />
      </head>
      <body className="vkui__root dark:bg-black select-none" suppressHydrationWarning>
        <Providers platform={platform} direction={direction} initialLanguage={initialLanguage}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
