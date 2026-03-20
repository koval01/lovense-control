import { KV_PREFIX_PAIR, KV_PREFIX_ROOM } from './registry-pair-code';
import type { BridgeRegistryKv } from './registry-kv';

export function registryRemoveRoomResponse(kv: BridgeRegistryKv, roomId: string | null): Response {
  if (!roomId) {
    return new Response('roomId required', { status: 400 });
  }
  const pairCode = kv.get(KV_PREFIX_ROOM + roomId) as string | undefined;
  if (pairCode) {
    kv.delete(KV_PREFIX_PAIR + pairCode);
    kv.delete(KV_PREFIX_ROOM + roomId);
  }
  return new Response(null, { status: 204 });
}
