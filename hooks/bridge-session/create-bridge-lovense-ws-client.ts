import { LovenseWsClient } from '@/lib/lovense/ws-client';
import { handleBridgeSocketIoEvent } from './handle-socket-io-event';
import type { SocketHandlerDeps } from './socket-handler-deps';
import { createOnSocketClose } from './ws/on-socket-close';
import { createOnSocketError } from './ws/on-socket-error';
import { createOnSocketIoConnected } from './ws/on-socket-io-connected';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';
import type { BridgeSessionStateBag } from './useBridgeSessionState';
export function createBridgeLovenseWsClient(
  refs: BridgeSessionRefs,
  st: BridgeSessionStateBag,
  readBridgeGen: () => number,
  scheduleBridgeReconnect: () => void,
  notificationTitle: string,
  myEpoch: number,
  myClientSerial: number,
  bridgeGenAtSetup: number
): LovenseWsClient {
  return new LovenseWsClient({
    onSocketClose: createOnSocketClose({
      myClientSerial,
      myEpoch,
      bridgeGenAtSetup,
      activeBridgeClientSerialRef: refs.activeBridgeClientSerialRef,
      bridgeConnectionEpochRef: refs.bridgeConnectionEpochRef,
      readBridgeGen,
      intentionalDisconnectRef: refs.intentionalDisconnectRef,
      enabledRef: refs.enabledRef,
      roomSessionTicketRef: refs.roomSessionTicketRef,
      roomIdRef: refs.roomIdRef,
      preflightHostTicketRef: refs.preflightHostTicketRef,
      setPeerConnected: st.setPeerConnected,
      setSocketIoConnected: st.setSocketIoConnected,
      setRttMs: st.setRttMs,
      setStatus: st.setStatus,
      setError: st.setError,
      setBridgeSessionRecovery: st.setBridgeSessionRecovery,
      scheduleBridgeReconnect,
    }),
    onSocketError: createOnSocketError({
      myClientSerial,
      myEpoch,
      bridgeGenAtSetup,
      activeBridgeClientSerialRef: refs.activeBridgeClientSerialRef,
      bridgeConnectionEpochRef: refs.bridgeConnectionEpochRef,
      readBridgeGen,
      intentionalDisconnectRef: refs.intentionalDisconnectRef,
      enabledRef: refs.enabledRef,
      roomSessionTicketRef: refs.roomSessionTicketRef,
      roomIdRef: refs.roomIdRef,
      preflightHostTicketRef: refs.preflightHostTicketRef,
      setBridgeSessionRecovery: st.setBridgeSessionRecovery,
      setError: st.setError,
      setStatus: st.setStatus,
      scheduleBridgeReconnect,
    }),
    onSocketIoConnected: createOnSocketIoConnected({
      myClientSerial,
      myEpoch,
      bridgeGenAtSetup,
      activeBridgeClientSerialRef: refs.activeBridgeClientSerialRef,
      bridgeConnectionEpochRef: refs.bridgeConnectionEpochRef,
      readBridgeGen,
      setStatus: st.setStatus,
      setSocketIoConnected: st.setSocketIoConnected,
      setBridgeSessionRecovery: st.setBridgeSessionRecovery,
    }),
    onSocketIoEvent: (event, payloadData) => {
      if (myClientSerial !== refs.activeBridgeClientSerialRef.current) return;
      if (readBridgeGen() !== bridgeGenAtSetup) return;
      const client = refs.lovenseClientRef.current;
      if (!client) return;
      const d: SocketHandlerDeps = {
        roleRef: refs.roleRef,
        notificationTitle,
        selfSessionReadyRef: refs.selfSessionReadyRef,
        audioObjectUrlsRef: refs.audioObjectUrlsRef,
        typingTimeoutRef: refs.typingTimeoutRef,
        setStatus: st.setStatus,
        setRemoteCapabilities: st.setRemoteCapabilities,
        setHasSelfDeviceInfo: st.setHasSelfDeviceInfo,
        setLocalCapabilities: st.setLocalCapabilities,
        setLocalEnabledToyIds: st.setLocalEnabledToyIds,
        setSelfSessionReady: st.setSelfSessionReady,
        setPartnerAuthLatch: st.setPartnerAuthLatch,
        setSelfQrUrl: st.setSelfQrUrl,
        setSelfQrCode: st.setSelfQrCode,
        setPeerConnected: st.setPeerConnected,
        setPartnerEverConnected: st.setPartnerEverConnected,
        setPartnerEnabledToyIds: st.setPartnerEnabledToyIds,
        setPartnerLimits: st.setPartnerLimits,
        setRttMs: st.setRttMs,
        setChatMessages: st.setChatMessages,
        setPartnerTyping: st.setPartnerTyping,
        client,
      };
      handleBridgeSocketIoEvent(event, payloadData, d);
    },
  });
}
