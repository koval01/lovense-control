'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLovense } from '@/hooks/use-lovense';
import { useBridgeSession } from '@/hooks/use-bridge-session';
import { useI18n } from '@/contexts/i18n-context';
import { useTheme } from '@/contexts/theme-context';
import { SplashScreen } from '@/components/home/SplashScreen';
import { useOnboardingFlow } from '@/components/home/hooks/useOnboardingFlow';
import { useSplashState } from '@/components/home/hooks/useSplashState';
import { HomeOnboardingView } from '@/components/home/HomeOnboardingView';
import { HomeMainView } from '@/components/home/HomeMainView';
import { HomeActionSheet } from '@/components/home/HomeActionSheet';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMode } from '@/store/slices/connectionSlice';
import { syncActiveToyIds, toggleToy } from '@/store/slices/selectionSlice';

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
  const { status, qrUrl, toys, error, sendCommand } = useLovense({
    enabled: isAppReady && mode !== 'unselected',
  });
  const [pairCodeInput, setPairCodeInput] = useState('');
  const bridge = useBridgeSession({
    enabled: isAppReady && mode === 'partner',
    localToys: toys,
    onIncomingCommand: sendCommand,
  });
  const activeToyIds = useAppSelector((state) => state.selection.activeToyIds);
  const controllableToys = mode === 'partner' ? bridge.remoteToys : toys;
  useEffect(() => {
    dispatch(syncActiveToyIds(Object.keys(controllableToys)));
  }, [controllableToys, dispatch]);
  const handleToggleToy = useCallback(
    (toyId: string) => {
      dispatch(toggleToy(toyId));
    },
    [dispatch]
  );
  const activeToys = useMemo(() => {
    const active = new Set(activeToyIds);
    return Object.fromEntries(Object.entries(controllableToys).filter(([toyId]) => active.has(toyId)));
  }, [activeToyIds, controllableToys]);
  const { shouldShowSplash, isHeaderVisible } = useSplashState(isReady && onboarding.isOnboardingReady);
  const [activeSheet, setActiveSheet] = useState<'theme' | 'language' | null>(null);
  const themeButtonRef = useRef<HTMLButtonElement | null>(null);
  const languageButtonRef = useRef<HTMLButtonElement | null>(null);

  if (shouldShowSplash) {
    return <SplashScreen />;
  }

  if (!isReady || !onboarding.isOnboardingReady) {
    return (
      <div id="main-content" className="h-full min-h-screen bg-[var(--app-bg)] flex items-center justify-center">
        <span className="text-[var(--app-text-secondary)]">{t('loading')}</span>
      </div>
    );
  }

  if (!onboarding.isOnboardingComplete) {
    return (
      <HomeOnboardingView
        onboardingStage={onboarding.onboardingStage}
        language={language}
        themeMode={themeMode}
        completeLanguageStep={onboarding.completeLanguageStep}
        setThemeMode={setThemeMode}
        setOnboardingStage={onboarding.setOnboardingStage}
        handleSkipAll={onboarding.handleSkipAll}
      />
    );
  }

  if (mode === 'unselected') {
    return (
      <div id="main-content" className="h-full min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-5">
        <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-5 md:p-6">
          <h1 className="text-xl md:text-2xl font-semibold text-[var(--app-text)]">Choose control mode</h1>
          <p className="mt-2 text-sm text-[var(--app-text-secondary)]">
            Start by selecting how you want to play. No toy connection is created until you pick a mode.
          </p>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => dispatch(setMode('self'))}
              className="rounded-xl border border-[var(--app-border)] p-4 text-left hover:bg-[var(--app-bg)] transition-colors"
            >
              <div className="font-medium text-[var(--app-text)]">Control my toys</div>
              <div className="mt-1 text-sm text-[var(--app-text-secondary)]">
                Use the current direct flow with your own toys.
              </div>
            </button>
            <button
              type="button"
              onClick={() => dispatch(setMode('partner'))}
              className="rounded-xl border border-[var(--app-border)] p-4 text-left hover:bg-[var(--app-bg)] transition-colors"
            >
              <div className="font-medium text-[var(--app-text)]">Play with a partner</div>
              <div className="mt-1 text-sm text-[var(--app-text-secondary)]">
                Commands go through a secure bridge with server-side policy checks.
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'partner' && !bridge.roomId) {
    return (
      <div id="main-content" className="h-full min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-5">
        <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-5 md:p-6">
          <h1 className="text-xl md:text-2xl font-semibold text-[var(--app-text)]">Partner bridge mode</h1>
          <p className="mt-2 text-sm text-[var(--app-text-secondary)]">
            In this mode, your partner controls your toys through a server-validated tunnel, and you control theirs.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void bridge.createRoom();
              }}
              className="rounded-xl bg-[var(--vkui--color_background_accent)] text-[var(--vkui--color_text_contrast)] px-4 py-2 text-sm font-medium"
            >
              Create 6-digit code
            </button>
            <button
              type="button"
              onClick={() => dispatch(setMode('unselected'))}
              className="rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)]"
            >
              Back
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-[var(--app-text-secondary)] mb-1">Join with one-time code</label>
            <input
              value={pairCodeInput}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6);
                setPairCodeInput(digitsOnly);
              }}
              inputMode="numeric"
              className="w-full h-11 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-3 text-base tracking-[0.2em] text-[var(--app-text)]"
              placeholder="000000"
            />
            <button
              type="button"
              onClick={() => {
                void bridge.joinRoom(pairCodeInput.trim());
              }}
              disabled={pairCodeInput.trim().length !== 6}
              className="mt-3 rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Join room
            </button>
          </div>

          {bridge.error ? <p className="mt-4 text-sm text-red-500">{bridge.error}</p> : null}
        </div>
      </div>
    );
  }

  if (mode === 'partner') {
    const partnerStatus = status !== 'online' ? status : bridge.peerConnected ? 'online' : 'connecting';
    const partnerError = error || bridge.error;
    const partnerQr = status !== 'online' ? qrUrl : null;
    const partnerToys = bridge.remoteToys;
    const partnerActiveToys = Object.fromEntries(
      Object.entries(partnerToys).filter(([toyId]) => activeToyIds.includes(toyId))
    );
    return (
      <>
        <div className="px-4 pt-3 pb-2 bg-[var(--app-bg)] border-b border-[var(--app-border)] flex flex-wrap items-center gap-2">
          <span className="text-xs md:text-sm text-[var(--app-text-secondary)]">
            {bridge.pairCode
              ? 'Share this 6-digit code with your partner. It can be used only once.'
              : 'Waiting for partner room session.'}
          </span>
          {bridge.pairCode ? (
            <span className="rounded-lg border border-[var(--app-border)] px-3 py-1 text-xs font-semibold tracking-[0.2em]">
              {bridge.pairCode}
            </span>
          ) : null}
          {bridge.pairCode ? (
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(bridge.pairCode || '');
              }}
              className="rounded-lg border border-[var(--app-border)] px-3 py-1 text-xs"
            >
              Copy code
            </button>
          ) : null}
          {!bridge.isLocalTestPeerActive ? (
            <button
              type="button"
              onClick={() => {
                void bridge.startLocalTestPeer();
              }}
              className="rounded-lg border border-[var(--app-border)] px-3 py-1 text-xs"
            >
              Start local test peer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                bridge.stopLocalTestPeer();
              }}
              className="rounded-lg border border-[var(--app-border)] px-3 py-1 text-xs"
            >
              Stop local test peer
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              bridge.disconnect();
              dispatch(setMode('unselected'));
            }}
            className="rounded-lg border border-[var(--app-border)] px-3 py-1 text-xs"
          >
            Exit partner mode
          </button>
        </div>
        <HomeMainView
          statusData={{
            status: partnerStatus,
            qrUrl: partnerQr,
            toys: partnerToys,
            error: partnerError,
            sendCommand: bridge.sendCommand,
          }}
          activeToyIds={activeToyIds}
          activeToys={partnerActiveToys}
          isHeaderVisible={isHeaderVisible}
          t={t}
          themeMode={themeMode}
          themeButtonRef={themeButtonRef}
          languageButtonRef={languageButtonRef}
          onOpenTheme={() => setActiveSheet('theme')}
          onOpenLanguage={() => setActiveSheet('language')}
          onToggleToy={handleToggleToy}
        />
        <HomeActionSheet
          activeSheet={activeSheet}
          themeMode={themeMode}
          language={language}
          languageOptions={languageOptions}
          themeButtonRef={themeButtonRef}
          languageButtonRef={languageButtonRef}
          t={t}
          setThemeMode={setThemeMode}
          setLanguage={setLanguage}
          setActiveSheet={setActiveSheet}
        />
      </>
    );
  }

  return (
    <>
      <HomeMainView
        statusData={{ status, qrUrl, toys, error, sendCommand }}
        activeToyIds={activeToyIds}
        activeToys={activeToys}
        isHeaderVisible={isHeaderVisible}
        t={t}
        themeMode={themeMode}
        themeButtonRef={themeButtonRef}
        languageButtonRef={languageButtonRef}
        onOpenTheme={() => setActiveSheet('theme')}
        onOpenLanguage={() => setActiveSheet('language')}
        onToggleToy={handleToggleToy}
      />
      <HomeActionSheet
        activeSheet={activeSheet}
        themeMode={themeMode}
        language={language}
        languageOptions={languageOptions}
        themeButtonRef={themeButtonRef}
        languageButtonRef={languageButtonRef}
        t={t}
        setThemeMode={setThemeMode}
        setLanguage={setLanguage}
        setActiveSheet={setActiveSheet}
      />
    </>
  );
}
