import { useMemo } from 'react';
import { buildToyFeatures } from '@/lib/lovense-domain';
import { mapRemoteCapabilitiesToToyMap } from './toy-capabilities';
import type { PartnerSetupPhase } from './types';

interface Args {
  roomId: string | null;
  error: string | null;
  preparingSession: boolean;
  socketIoConnected: boolean;
  selfSessionReady: boolean;
  partnerAuthLatch: boolean;
  remoteCapabilities: import('@/lib/bridge/protocol').BridgeToyCapability[];
  localCapabilities: import('@/lib/bridge/protocol').BridgeToyCapability[];
}

export function useBridgeSessionDerived(s: Args) {
  const remoteToys = useMemo(() => mapRemoteCapabilitiesToToyMap(s.remoteCapabilities), [s.remoteCapabilities]);
  const localToysFromBridge = useMemo(
    () => mapRemoteCapabilitiesToToyMap(s.localCapabilities),
    [s.localCapabilities]
  );
  const localFeatureIdSet = useMemo(
    () => new Set(buildToyFeatures(localToysFromBridge).map((f) => f.id)),
    [localToysFromBridge]
  );

  const partnerSetupPhase = useMemo((): PartnerSetupPhase => {
    if (s.roomId !== null) return 'form';
    if (s.error && !s.socketIoConnected && !s.preparingSession) return 'form';
    if (s.preparingSession) return 'loading';
    if (!s.socketIoConnected) return 'loading';
    if (s.selfSessionReady || s.partnerAuthLatch) return 'form';
    return 'qr';
  }, [
    s.roomId,
    s.error,
    s.preparingSession,
    s.socketIoConnected,
    s.selfSessionReady,
    s.partnerAuthLatch,
  ]);

  return { remoteToys, localToysFromBridge, localFeatureIdSet, partnerSetupPhase };
}
