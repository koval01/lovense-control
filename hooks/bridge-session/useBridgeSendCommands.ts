import { useCallback } from 'react';
import { validateChatText as validateChatTextClient } from '@/lib/bridge/chat';
import { arrayBufferToBase64 } from './encoding';
import { buildLovenseCommandPayload } from './lovense-command-payload';
import type { BridgeSessionRefs } from './useBridgeSessionRefs';

export function useBridgeSendCommands(
  refs: BridgeSessionRefs,
  bridgeSessionRecovery: 'ok' | 'reconnecting' | 'failed',
  peerConnected: boolean
) {
  const sendCommand = useCallback(
    (toyId: string, action: string, timeSec: number = 0, loopRunningSec?: number, loopPauseSec?: number) => {
      const client = refs.lovenseClientRef.current;
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected || !peerConnected) return;
      client.sendEvent(
        'basicapi_send_toy_command_ts',
        buildLovenseCommandPayload(toyId, action, timeSec, loopRunningSec, loopPauseSec)
      );
    },
    [refs, peerConnected, bridgeSessionRecovery]
  );

  const sendLovenseCommand = useCallback(
    (toyId: string, action: string, timeSec: number = 0, loopRunningSec?: number, loopPauseSec?: number) => {
      const client = refs.lovenseClientRef.current;
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected || !peerConnected) return;
      client.sendEvent(
        'basicapi_send_toy_command_ts',
        buildLovenseCommandPayload(toyId, action, timeSec, loopRunningSec, loopPauseSec)
      );
    },
    [refs, peerConnected, bridgeSessionRecovery]
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const { ok } = validateChatTextClient(trimmed);
      if (!ok) return;
      const client = refs.lovenseClientRef.current;
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected) return;
      client.sendEvent('bridge_chat_message', { text: trimmed, ts: Date.now() });
    },
    [refs, bridgeSessionRecovery]
  );

  const sendChatVoice = useCallback(
    async (blob: Blob, mime: string, durationMs?: number) => {
      const client = refs.lovenseClientRef.current;
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected) return;
      const ts = Date.now();
      const id = crypto.randomUUID();
      const arrayBuffer = await blob.arrayBuffer();
      const data = arrayBufferToBase64(arrayBuffer);
      client.sendEvent('bridge_chat_voice', {
        id,
        ts,
        mime,
        data,
        ...(typeof durationMs === 'number' ? { durationMs } : {}),
      });
    },
    [refs, bridgeSessionRecovery]
  );

  const sendChatTyping = useCallback(
    (typing: boolean) => {
      const client = refs.lovenseClientRef.current;
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected) return;
      client.sendEvent('bridge_chat_typing', { typing });
    },
    [refs, bridgeSessionRecovery]
  );

  const sendBridgeSetToyRules = useCallback(
    (payload: { enabledToyIds?: string[]; maxPower?: number; limits?: Record<string, number> }) => {
      const client = refs.lovenseClientRef.current;
      if (bridgeSessionRecovery !== 'ok' || !client?.isSocketIoConnected) return;
      client.sendEvent('bridge_set_toy_rules', payload);
    },
    [refs, bridgeSessionRecovery]
  );

  return {
    sendCommand,
    sendLovenseCommand,
    sendChatMessage,
    sendChatTyping,
    sendChatVoice,
    sendBridgeSetToyRules,
  };
}
