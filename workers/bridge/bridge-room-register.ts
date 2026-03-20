import { decodeTicket, sessionIdFromProof } from './auth';
import { getSocketUrl, buildWebSocketUrl, LovenseApiError } from './lovense';
import { BridgeRoomAlarmHttp } from './bridge-room-alarm-http';

export abstract class BridgeRoomRegister extends BridgeRoomAlarmHttp {
  protected async handleRegister(request: Request): Promise<Response> {
    const secret = this.env.JWT_SECRET;
    if (!secret) return Response.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    let body: { authToken?: string; ticket?: string; sessionProof?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const { authToken, ticket, sessionProof } = body;
    if (!authToken || !ticket) {
      return Response.json({ error: 'authToken and ticket required' }, { status: 400 });
    }
    let roomId: string;
    let role: 'host' | 'guest';
    try {
      const decoded = await decodeTicket(ticket, secret);
      roomId = decoded.roomId;
      role = decoded.role;
    } catch {
      return Response.json({ detail: 'Invalid ticket' }, { status: 401 });
    }
    this.roomId = roomId;
    let socketInfo;
    try {
      socketInfo = await getSocketUrl(authToken);
    } catch (e) {
      if (e instanceof LovenseApiError) {
        return Response.json({ detail: e.message }, { status: e.status });
      }
      console.error('[BridgeRoom] Lovense getSocketUrl failed:', e);
      return Response.json({ detail: 'Lovense service temporarily unavailable' }, { status: 502 });
    }
    const wsUrl = buildWebSocketUrl(socketInfo, authToken);
    const guestSessionId = await sessionIdFromProof(sessionProof, secret);
    if (role === 'host') {
      this.hostAuthToken = authToken;
      this.hostSessionId = guestSessionId;
      this.hostSessionReady = false;
    }
    const allowSelfPairing =
      this.env.ALLOW_SELF_PAIRING === '1' ||
      this.env.ALLOW_SELF_PAIRING === 'true' ||
      this.env.ALLOW_SELF_PAIRING === 'yes';
    if (role === 'guest') {
      if (!allowSelfPairing && this.hostSessionId && guestSessionId && guestSessionId === this.hostSessionId) {
        return Response.json(
          {
            detail:
              'Self-pairing is disabled. Use a different browser or device (different session) to join as guest.',
          },
          { status: 403 }
        );
      }
      if (allowSelfPairing) {
        const sameSession = this.hostSessionId && guestSessionId === this.hostSessionId;
        const sameToken = this.hostAuthToken && this.hostAuthToken === authToken;
        if (sameSession || sameToken) {
          this.guestUsesHostBackend = true;
          return Response.json({ ok: true });
        }
      }
      this.guestSessionId = guestSessionId ?? undefined;
      this.guestSessionReady = false;
    }
    if (role === 'host' && !allowSelfPairing && this.guestSessionId && this.hostSessionId) {
      if (this.guestSessionId === this.hostSessionId && this.guestFrontend) {
        try {
          this.guestFrontend.close(1008, 'Same session as host; use different device');
        } catch {
          /* ignore */
        }
        this.guestFrontend = null;
      }
    }
    this.spawnBackendTunnel(wsUrl, role);
    return Response.json({ ok: true });
  }

  protected abstract spawnBackendTunnel(wsUrl: string, role: 'host' | 'guest'): void;
}
