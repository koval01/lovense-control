'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/contexts/i18n-context';
import { useTheme } from '@/contexts/theme-context';
import { useOnboardingFlow } from '@/components/home/hooks/useOnboardingFlow';
import { useSplashState } from '@/components/home/hooks/useSplashState';
import { useHomePageConnectionState } from '@/components/home/hooks/useHomePageConnectionState';
import { resolveHomePageView } from '@/components/home/resolveHomePageView';
import { hashToMode, modeToHash } from '@/components/home/hash-mode';
import { useHomeInviteCodeFromUrl } from '@/components/home/useHomeInviteCodeFromUrl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMode, type ConnectionMode } from '@/store/slices/connectionSlice';
import { fadeVariants } from '@/constants/animation-variants';

export function HomePage() {
  const dispatch = useAppDispatch();
  const { t, language, languageOptions, setLanguage, hasSelectedLanguage, isReady } = useI18n();
  const { themeMode, setThemeMode } = useTheme();
  const onboarding = useOnboardingFlow({
    isReady,
    hasSelectedLanguage,
    language,
    setLanguage,
    setThemeMode,
  });
  const mode = useAppSelector((state) => state.connection.mode);
  const isAppReady = isReady && onboarding.isOnboardingReady && onboarding.isOnboardingComplete;
  const { bridge, lovense, activeToyIds, activeToys, handleToggleToy } = useHomePageConnectionState(
    isAppReady,
    mode,
    t('partnerChatNewMessage')
  );
  const [pairCodeInput, setPairCodeInput] = useState('');
  const isMobile = useIsMobile();
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const { shouldShowSplash, isHeaderVisible } = useSplashState(isReady && onboarding.isOnboardingReady);
  const [activeSheet, setActiveSheet] = useState<'theme' | 'language' | null>(null);
  const themeButtonRef = useRef<HTMLButtonElement | null>(null);
  const languageButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    dispatch(setMode(hashToMode()));
    const onHashChange = () => dispatch(setMode(hashToMode()));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [dispatch]);
  useHomeInviteCodeFromUrl(dispatch, setPairCodeInput);
  const setModeAndHash = useCallback(
    (next: ConnectionMode) => {
      dispatch(setMode(next));
      window.history.pushState(null, '', modeToHash(next));
    },
    [dispatch]
  );
  const { key: viewKey, node: viewNode } = resolveHomePageView({
    shouldShowSplash,
    isReady,
    onboarding,
    language,
    themeMode,
    setThemeMode,
    mode,
    bridge,
    lovense,
    pairCodeInput,
    setPairCodeInput,
    t,
    languageOptions,
    themeButtonRef,
    languageButtonRef,
    setActiveSheet,
    setLanguage,
    activeSheet,
    isHeaderVisible,
    isMobile,
    chatModalOpen,
    setChatModalOpen,
    activeToyIds,
    activeToys,
    handleToggleToy,
    setModeAndHash,
  });
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-full"
      >
        {viewNode}
      </motion.div>
    </AnimatePresence>
  );
}
