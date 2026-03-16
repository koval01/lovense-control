'use client';

import { useEffect, useState } from 'react';

const SPLASH_MIN_MS = 2200;
const SPLASH_FALLBACK_MS = 4500;

export function useSplashState(isAppReady: boolean) {
  const [isSplashMinElapsed, setIsSplashMinElapsed] = useState(false);
  const [isSplashFallbackElapsed, setIsSplashFallbackElapsed] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  const shouldShowSplash = isAppReady ? !isSplashMinElapsed : !isSplashFallbackElapsed;

  useEffect(() => {
    const minTimerId = window.setTimeout(() => setIsSplashMinElapsed(true), SPLASH_MIN_MS);
    const fallbackTimerId = window.setTimeout(() => setIsSplashFallbackElapsed(true), SPLASH_FALLBACK_MS);
    return () => {
      window.clearTimeout(minTimerId);
      window.clearTimeout(fallbackTimerId);
    };
  }, []);

  useEffect(() => {
    if (shouldShowSplash) {
      setIsHeaderVisible(false);
      return;
    }
    const timerId = window.setTimeout(() => setIsHeaderVisible(true), 70);
    return () => window.clearTimeout(timerId);
  }, [shouldShowSplash]);

  return { shouldShowSplash, isHeaderVisible };
}
