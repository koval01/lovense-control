'use client';

import type { TranslationKey } from '@/lib/i18n';
import type { ConnectionMode } from '@/store/slices/connectionSlice';
import type { PartnerSetupPhase, BridgeSessionRecovery } from '@/hooks/use-bridge-session';
import { HomePartnerSetupRecovery } from './HomePartnerSetupRecovery';
import { HomePartnerSetupLoading } from './HomePartnerSetupLoading';
import { HomePartnerSetupQrPhase } from './HomePartnerSetupQrPhase';
import { HomePartnerSetupJoinForm } from './HomePartnerSetupJoinForm';

interface BridgeSetupSlice {
  partnerSetupPhase: PartnerSetupPhase;
  bridgeSessionRecovery: BridgeSessionRecovery;
  selfQrUrl: string | null;
  selfQrCode: string | null;
  selfSessionReady: boolean;
  error: string | null;
  joinRoom: (code: string) => Promise<void>;
  createRoom: () => Promise<void>;
}

interface Props {
  t: (key: TranslationKey) => string;
  bridge: BridgeSetupSlice;
  pairCodeInput: string;
  setPairCodeInput: (v: string) => void;
  setModeAndHash: (mode: ConnectionMode) => void;
}

export function HomePartnerSetupScreen({ t, bridge, pairCodeInput, setPairCodeInput, setModeAndHash }: Props) {
  const { partnerSetupPhase: setupPhase, bridgeSessionRecovery: setupRecovery } = bridge;
  return (
    <div id="main-content" className="h-full min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-5">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-5 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-[var(--app-text)]">{t('partnerModeTitle')}</h1>
        <HomePartnerSetupRecovery t={t} setupRecovery={setupRecovery} setModeAndHash={setModeAndHash} />
        {setupRecovery === 'ok' && setupPhase === 'loading' ? <HomePartnerSetupLoading t={t} /> : null}
        {setupRecovery === 'ok' && setupPhase === 'qr' ? (
          <HomePartnerSetupQrPhase
            t={t}
            selfQrUrl={bridge.selfQrUrl}
            selfQrCode={bridge.selfQrCode}
            error={bridge.error}
            setModeAndHash={setModeAndHash}
          />
        ) : null}
        {setupRecovery === 'ok' && setupPhase === 'form' ? (
          <HomePartnerSetupJoinForm
            t={t}
            pairCodeInput={pairCodeInput}
            setPairCodeInput={setPairCodeInput}
            selfSessionReady={bridge.selfSessionReady}
            bridgeError={bridge.error}
            joinRoom={bridge.joinRoom}
            createRoom={bridge.createRoom}
            setModeAndHash={setModeAndHash}
          />
        ) : null}
      </div>
    </div>
  );
}
