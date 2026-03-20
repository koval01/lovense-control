import { createTicket } from './auth';
import { KV_PREFIX_PAIR } from './registry-pair-code';
import type { BridgeRegistryKv } from './registry-kv';
import type { BridgeRegistryEnv } from './registry-env';

export async function registryJoinRoomResponse(
  kv: BridgeRegistryKv,
  env: BridgeRegistryEnv,
  pairCodeRaw: string
): Promise<Response> {
  const pairCode = pairCodeRaw.toUpperCase();
  if (!pairCode) {
    return Response.json({ error: 'pairCode required' }, { status: 400 });
  }

  const roomId = kv.get(KV_PREFIX_PAIR + pairCode) as string | undefined;
  if (!roomId) {
    return Response.json({ detail: 'Room not found' }, { status: 404 });
  }

  try {
    const roomDoId = env.BRIDGE_ROOM.idFromName(roomId);
    const roomStub = env.BRIDGE_ROOM.get(roomDoId);
    const readyRes = await roomStub.fetch('https://internal/internal/ready');
    if (!readyRes.ok) {
      return Response.json({ detail: 'Room not ready yet' }, { status: 409 });
    }
    const ready = (await readyRes.json()) as { hostReady?: boolean };
    if (!ready.hostReady) {
      return Response.json(
        { detail: 'Host session is not verified yet. Complete QR setup first.' },
        { status: 409 }
      );
    }
  } catch {
    return Response.json({ detail: 'Room not ready yet' }, { status: 409 });
  }

  const secret = env.JWT_SECRET;
  if (!secret) {
    return Response.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
  }

  const guestTicket = await createTicket(roomId, 'guest', secret);
  console.log(`[BridgeRegistry] Guest joined: roomId=${roomId} pairCode=${pairCode}`);

  return Response.json({
    roomId,
    guestTicket,
  });
}
