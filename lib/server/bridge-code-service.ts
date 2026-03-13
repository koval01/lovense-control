import { getCloudflareContext } from '@opennextjs/cloudflare';

interface CreateCodeResult {
  code: string;
}

interface ConsumeCodeResult {
  roomId: string;
  hostUserId: string;
}

async function getBridgeCodeStub() {
  const { env } = (await getCloudflareContext({ async: true })) as { env: any };
  const id = env.BRIDGE_CODE.idFromName('bridge-code-registry');
  return env.BRIDGE_CODE.get(id);
}

export async function createBridgeInviteCode(roomId: string, hostUserId: string): Promise<CreateCodeResult> {
  const stub = await getBridgeCodeStub();
  const response = await stub.fetch('https://bridge-code/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, hostUserId }),
  });
  const data = (await response.json().catch(() => ({}))) as { code?: string; error?: string };
  if (!response.ok || !data.code) {
    throw new Error(data.error || 'Failed to create invite code');
  }
  return { code: data.code };
}

export async function consumeBridgeInviteCode(
  code: string,
  requesterUserId: string
): Promise<ConsumeCodeResult> {
  const stub = await getBridgeCodeStub();
  const response = await stub.fetch('https://bridge-code/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, requesterUserId }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    roomId?: string;
    hostUserId?: string;
    error?: string;
  };
  if (!response.ok || !data.roomId || !data.hostUserId) {
    throw new Error(data.error || 'Failed to consume invite code');
  }
  return {
    roomId: data.roomId,
    hostUserId: data.hostUserId,
  };
}
