import { createTicket } from './auth';
import { generatePairCode, KV_PREFIX_PAIR, KV_PREFIX_ROOM } from './registry-pair-code';
import type { BridgeRegistryKv } from './registry-kv';

export async function registryCreateRoomResponse(kv: BridgeRegistryKv, jwtSecret: string): Promise<Response> {
  if (!jwtSecret) {
    return Response.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
  }

  const roomId = crypto.randomUUID();
  let pairCode = generatePairCode();
  for (let i = 0; i < 100; i++) {
    if (!kv.get(KV_PREFIX_PAIR + pairCode)) break;
    pairCode = generatePairCode();
  }

  kv.put(KV_PREFIX_PAIR + pairCode, roomId);
  kv.put(KV_PREFIX_ROOM + roomId, pairCode);
  const hostTicket = await createTicket(roomId, 'host', jwtSecret);
  console.log(`[BridgeRegistry] Room created: roomId=${roomId} pairCode=${pairCode}`);

  return Response.json({
    roomId,
    pairCode,
    hostTicket,
  });
}
