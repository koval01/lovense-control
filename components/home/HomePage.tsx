'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useLovense } from '@/hooks/use-lovense';
import { CHAT_MAX_LENGTH, PAIR_CODE_LENGTH, useBridgeSession } from '@/hooks/use-bridge-session';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/contexts/i18n-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { AppLoadingSkeleton } from '@/components/home/AppLoadingSkeleton';
import { SplashScreen } from '@/components/home/SplashScreen';
import { useOnboardingFlow } from '@/components/home/hooks/useOnboardingFlow';
import { useSplashState } from '@/components/home/hooks/useSplashState';
import { HomeOnboardingView } from '@/components/home/HomeOnboardingView';
import { HomeMainView } from '@/components/home/HomeMainView';
import { HomeActionSheet } from '@/components/home/HomeActionSheet';
import { PartnerChatFloating } from '@/components/partner/PartnerChatFloating';
import { PartnerChatModal } from '@/components/partner/PartnerChatModal';
import { StatusQrView } from '@/components/status/StatusQrView';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMode, type ConnectionMode } from '@/store/slices/connectionSlice';
import { syncActiveToyIds, toggleToy } from '@/store/slices/selectionSlice';
import { fadeVariants } from '@/constants/animation-variants';

function hashToMode(): ConnectionMode {
  if (typeof window === 'undefined') return 'unselected';
  const h = window.location.hash.slice(1).toLowerCase();
  if (h === 'self') return 'self';
  if (h === 'partner') return 'partner';
  return 'unselected';
}

function modeToHash(mode: ConnectionMode): string {
  if (mode === 'self') return '#self';
  if (mode === 'partner') return '#partner';
  return '#';
}

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
  const sessionStarted = useAppSelector((state) => state.connection.sessionStarted);
  const isAppReady = isReady && onboarding.isOnboardingReady && onboarding.isOnboardingComplete;
  const { status, qrUrl, qrCode, toys, error, sendCommand } = useLovense({
    enabled: isAppReady && (mode === 'self' || mode === 'partner'),
  });
  const [pairCodeInput, setPairCodeInput] = useState('');
  const isMobile = useIsMobile();
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const activeToyIds = useAppSelector((state) => state.selection.activeToyIds);
  const limits = useAppSelector((state) => state.control.limits);
  const bridge = useBridgeSession({
    enabled: isAppReady && mode === 'partner',
    localToys: toys,
    onIncomingCommand: () => {},
    activeToyIds: mode === 'partner' ? activeToyIds : undefined,
    limits: mode === 'partner' ? limits : undefined,
    notificationTitle: t('partnerChatNewMessage'),
  });
  const isBridgeAvailable = bridge.isBridgeAvailable;
  const toast = useToast();
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

  // Синхронизация режима с hash: # / #menu → меню, #self → свой режим, #partner → партнёр. Назад — по кнопке «Назад» в браузере.
  useEffect(() => {
    const fromHash = hashToMode();
    dispatch(setMode(fromHash));
  }, [dispatch]);
  useEffect(() => {
    const onHashChange = () => dispatch(setMode(hashToMode()));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [dispatch]);

  const searchParams = useSearchParams();
  const appliedCodeFromUrlRef = useRef(false);
  // Если в URL передан код приглашения (?code=XXXXXX), переключаем в режим партнёра и подставляем код (чтобы в чистом браузере по ссылке сразу предложить войти по коду).
  useEffect(() => {
    if (appliedCodeFromUrlRef.current || typeof window === 'undefined' || !searchParams) return;
    const codeParam = searchParams.get('code');
    const normalized = codeParam?.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, PAIR_CODE_LENGTH) ?? '';
    if (normalized.length !== PAIR_CODE_LENGTH) return;
    appliedCodeFromUrlRef.current = true;
    const modeFromHash = hashToMode();
    if (modeFromHash !== 'partner') {
      dispatch(setMode('partner'));
    }
    setPairCodeInput(normalized);
    // Убираем code из URL после применения, чтобы не светить код в истории/шаринге
    const next = new URLSearchParams(searchParams);
    next.delete('code');
    const qs = next.toString();
    const replace = qs ? `${window.location.pathname}?${qs}#partner` : `${window.location.pathname}#partner`;
    window.history.replaceState(null, '', replace);
  }, [searchParams, dispatch]);

  const setModeAndHash = useCallback(
    (next: ConnectionMode) => {
      dispatch(setMode(next));
      window.history.pushState(null, '', modeToHash(next));
    },
    [dispatch]
  );

  let viewKey: string;
  let viewNode: React.ReactNode;

  if (shouldShowSplash) {
    viewKey = 'splash';
    viewNode = <SplashScreen />;
  } else if (!isReady || !onboarding.isOnboardingReady) {
    viewKey = 'app-loading';
    viewNode = <AppLoadingSkeleton />;
  } else if (!onboarding.isOnboardingComplete) {
    viewKey = 'onboarding';
    viewNode = (
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
  } else if (mode === 'unselected') {
    viewKey = 'mode-select';
    viewNode = (
      <div id="main-content" className="h-full min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-5">
        <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-5 md:p-6">
          <h1 className="text-xl md:text-2xl font-semibold text-[var(--app-text)]">
            {t('controlModeTitle')}
          </h1>
          <p className="mt-2 text-sm text-[var(--app-text-secondary)]">
            {t('controlModeSubtitle')}
          </p>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => setModeAndHash('self')}
              className="rounded-xl border border-[var(--app-border)] p-4 text-left hover:bg-[var(--app-bg)] transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="font-medium text-[var(--app-text)]">
                {t('controlModeSelfTitle')}
              </div>
              <div className="mt-1 text-sm text-[var(--app-text-secondary)]">
                {t('controlModeSelfDescription')}
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isBridgeAvailable) setModeAndHash('partner');
              }}
              disabled={!isBridgeAvailable}
              className="rounded-xl border border-[var(--app-border)] p-4 text-left transition-colors transition-transform disabled:opacity-50 hover:bg-[var(--app-bg)] disabled:hover:bg-[var(--app-bg-elevated)] hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="font-medium text-[var(--app-text)]">
                {t('controlModePartnerTitle')}
              </div>
              <div className="mt-1 text-sm text-[var(--app-text-secondary)]">
                {t('controlModePartnerDescription')}{' '}
                {!isBridgeAvailable ? t('controlModePartnerUnavailableSuffix') : ''}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  } else if (mode === 'partner' && !bridge.roomId) {
    viewKey = 'partner-setup';
    viewNode = (
      <div id="main-content" className="h-full min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-5">
        <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-5 md:p-6">
          <h1 className="text-xl md:text-2xl font-semibold text-[var(--app-text)]">
            {t('partnerModeTitle')}
          </h1>
          <p className="mt-2 text-sm text-[var(--app-text-secondary)]">
            {t('partnerModeDescription')}
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--app-text)] mb-1">
              {t('partnerModeJoinLabel')}
            </label>
            <input
              value={pairCodeInput}
              onChange={(event) => {
                const alphanumeric = event.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, PAIR_CODE_LENGTH);
                setPairCodeInput(alphanumeric);
              }}
              inputMode="text"
              autoComplete="one-time-code"
              className="w-full h-11 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-3 text-base tracking-[0.2em] text-[var(--app-text)] font-mono"
              placeholder={t('partnerModeJoinPlaceholder')}
            />
            {!sessionStarted && (
              <p className="mt-2 text-xs text-[var(--app-text-secondary)]">
                {t('partnerModeJoinRequireConnection')}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                if (sessionStarted) void bridge.joinRoom(pairCodeInput.trim());
              }}
              disabled={pairCodeInput.trim().length !== PAIR_CODE_LENGTH || !sessionStarted}
              className="mt-3 w-full rounded-xl bg-[var(--app-accent)] text-white px-4 py-2.5 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[var(--app-surface-soft)] disabled:text-[var(--app-text-secondary)] disabled:border disabled:border-[var(--app-border)] transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {t('partnerModeJoinButton')}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--app-border)]">
            <p className="text-xs text-[var(--app-text-secondary)] mb-3">
              {t('partnerModeCreateCodeHint')}
            </p>
            {!sessionStarted ? (
              <>
                <p className="text-sm text-[var(--app-text-secondary)] mb-3">
                  {t('partnerModeScanHereOrSelf')}
                </p>
                {status === 'qr_ready' ? (
                  <div className="my-6">
                    <StatusQrView qrUrl={qrUrl} qrCode={qrCode} compact />
                  </div>
                ) : status === 'error' && error ? (
                  <p className="text-sm text-red-500 dark:text-red-400 py-2">{error}</p>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--app-text-secondary)]">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-[var(--app-accent)]" />
                    {t('partnerModeConnectingToys')}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setModeAndHash('self')}
                  className="mt-4 text-sm text-[var(--app-text-secondary)] hover:text-[var(--app-text)] underline underline-offset-2 decoration-[var(--app-border)] hover:decoration-[var(--app-text)] transition-colors"
                >
                  {t('partnerModeGoToSelfToConnect')}
                </button>
              </>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void bridge.createRoom()}
                  className="rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-bg)] transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {t('partnerModeCreateCode')}
                </button>
                <button
                  type="button"
                  onClick={() => setModeAndHash('unselected')}
                  className="rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-bg)] transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {t('partnerModeBack')}
                </button>
              </div>
            )}
          </div>

          {bridge.error ? <p className="mt-4 text-sm text-red-500">{bridge.error}</p> : null}
        </div>
      </div>
    );
  } else if (mode === 'partner') {
    viewKey = 'partner-main';
    const partnerStatus =
      bridge.status === 'error'
        ? 'error'
        : bridge.status === 'connecting'
          ? 'connecting'
          : 'online';
    const partnerError = bridge.error;
    const partnerQr = null;
    const partnerToys = bridge.remoteToys;
    const partnerEnabledSet =
      bridge.partnerEnabledToyIds !== undefined ? new Set(bridge.partnerEnabledToyIds) : null;
    const partnerActiveToys = Object.fromEntries(
      Object.entries(partnerToys).filter(([toyId]) => {
        if (!activeToyIds.includes(toyId)) return false;
        if (partnerEnabledSet !== null && !partnerEnabledSet.has(toyId)) return false;
        return true;
      })
    );
    viewNode = (
      <div className="flex flex-col h-full min-h-0 app-min-h-viewport">
        {bridge.status !== 'error' && (
          <div className="shrink-0 px-4 pt-3 pb-2 bg-[var(--app-bg)] border-b border-[var(--app-border)] flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:gap-y-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              {bridge.isHost && !bridge.peerConnected && bridge.pairCode ? (
                <>
                  <span className="text-xs md:text-sm text-[var(--app-text-secondary)] basis-full sm:basis-auto">
                    {t('partnerModeShareCode')}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(bridge.pairCode || '');
                      toast(t('partnerModeCodeCopied'));
                    }}
                    className="rounded-[var(--app-radius-control)] border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold tracking-[0.2em] hover:bg-[var(--app-bg-elevated)] transition-colors cursor-pointer min-w-[7.5rem] touch-manipulation"
                    title={t('partnerModeCopyCode')}
                  >
                    {bridge.pairCode}
                  </button>
                </>
              ) : null}
              {bridge.peerConnected ? (
                <span className="text-xs text-[var(--app-text-secondary)]">
                  {t('partnerModeConnected')}
                  {bridge.rttMs != null ? ` · ${bridge.rttMs} ms` : ''}
                </span>
              ) : bridge.status === 'online' ? (
                <span className="text-xs text-[var(--app-text-secondary)]">{t('partnerModeWaitingForPartner')}</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                bridge.disconnect();
                setModeAndHash('unselected');
              }}
              className="self-end sm:self-center rounded-[var(--app-radius-control)] border border-[var(--app-border)] px-3 py-2 text-xs sm:ml-auto sm:py-1 touch-manipulation"
            >
              {t('partnerModeExit')}
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto">
          <HomeMainView
            statusData={{
              status: partnerStatus,
              qrUrl: partnerQr,
              qrCode: null,
              toys: partnerToys,
              error: partnerError,
              sendCommand: bridge.sendLovenseCommand,
            }}
            activeToyIds={activeToyIds}
            activeToys={partnerActiveToys}
            partnerEnabledToyIds={bridge.partnerEnabledToyIds}
            partnerLimits={bridge.partnerLimits}
            isPartnerMode
            isHeaderVisible={isHeaderVisible}
            emptyStateTitleKey={
              bridge.peerConnected && Object.keys(partnerToys).length === 0
                ? 'partnerModePartnerNoToys'
                : 'partnerModeWaitingForPartner'
            }
            emptyStateHintKey={
              bridge.peerConnected && Object.keys(partnerToys).length === 0
                ? 'partnerModePartnerNoToysHint'
                : 'partnerModeWaitingForPartnerHint'
            }
            t={t}
            themeMode={themeMode}
            themeButtonRef={themeButtonRef}
            languageButtonRef={languageButtonRef}
            onOpenTheme={() => setActiveSheet('theme')}
            onOpenLanguage={() => setActiveSheet('language')}
            onToggleToy={handleToggleToy}
            errorSecondaryAction={
              mode === 'partner'
                ? { label: t('partnerModeExit'), onClick: () => { bridge.disconnect(); setModeAndHash('unselected'); } }
                : undefined
            }
          />
        </div>
        {isMobile ? (
          <div className="shrink-0 border-t border-[var(--app-border)] flex items-center justify-center px-2 py-2">
            <button
              type="button"
              onClick={() => setChatModalOpen(true)}
              className="rounded-[var(--app-radius-control)] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] py-2.5 px-4 text-sm text-[var(--app-text-primary)] flex items-center justify-center gap-2 hover:bg-[var(--app-surface-soft)] transition-colors touch-manipulation"
              aria-label={t('partnerChatTapToOpen')}
            >
              <span className="text-[var(--app-text-secondary)]">💬</span>
              {t('partnerChatTitle')}
            </button>
          </div>
        ) : (
          <PartnerChatFloating
            chatMessages={bridge.chatMessages}
            partnerTyping={bridge.partnerTyping}
            sendChatMessage={bridge.sendChatMessage}
            sendChatTyping={bridge.sendChatTyping}
            sendChatVoice={bridge.sendChatVoice}
            maxLength={CHAT_MAX_LENGTH}
            connectionOk={bridge.status === 'online' || bridge.status === 'waiting_partner'}
            t={t}
          />
        )}
        <PartnerChatModal
          open={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          chatMessages={bridge.chatMessages}
          partnerTyping={bridge.partnerTyping}
          sendChatMessage={bridge.sendChatMessage}
          sendChatTyping={bridge.sendChatTyping}
          sendChatVoice={bridge.sendChatVoice}
          maxLength={CHAT_MAX_LENGTH}
          connectionOk={bridge.status === 'online' || bridge.status === 'waiting_partner'}
          t={t}
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
      </div>
    );
  } else {
    viewKey = 'self-main';
    viewNode = (
      <>
        <HomeMainView
          statusData={{ status, qrUrl, qrCode, toys, error, sendCommand }}
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
