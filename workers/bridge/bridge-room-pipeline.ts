import {
  buildAppMessage,
  isDeviceOrStatusEvent,
  parseAppMessage,
  BRIDGE_SELF_APP_STATUS,
  BRIDGE_SELF_DEVICE_INFO,
  LOVENSE_TOY_COMMAND_EVENT,
} from './protocol';
import { BridgeRoomRegister } from './bridge-room-register';

export abstract class BridgeRoomPipeline extends BridgeRoomRegister {
  protected routeBackendToFrontends(data: string, fromBackendRole: 'host' | 'guest'): void {
    if (isDeviceOrStatusEvent(data)) {
      if (fromBackendRole === 'host') {
        this.lastHostBackendMsg = data;
        if (this.guestUsesHostBackend) this.lastGuestBackendMsg = data;
      } else {
        this.lastGuestBackendMsg = data;
      }
    }
    const parsed = parseAppMessage(data);
    let skipPeerForward = false;
    if (parsed) {
      const [event, payload] = parsed;
      const selfFrontend = fromBackendRole === 'host' ? this.hostFrontend : this.guestFrontend;
      if (
        selfFrontend &&
        (event === 'basicapi_update_device_info_tc' || event === 'basicApi_update_device_info')
      ) {
        this.sendToWebSocket(
          selfFrontend,
          buildAppMessage(BRIDGE_SELF_DEVICE_INFO, payload as Record<string, unknown>)
        );
      } else if (
        selfFrontend &&
        (event === 'basicapi_update_app_online_tc' || event === 'basicapi_update_app_status_tc')
      ) {
        const status = (payload as { status?: unknown }).status;
        if (fromBackendRole === 'host') this.hostSessionReady = status === 1;
        else this.guestSessionReady = status === 1;
        this.sendToWebSocket(
          selfFrontend,
          buildAppMessage(BRIDGE_SELF_APP_STATUS, payload as Record<string, unknown>)
        );
      } else if (selfFrontend && event === 'basicapi_get_qrcode_tc') {
        const sessionReady = fromBackendRole === 'host' ? this.hostSessionReady : this.guestSessionReady;
        if (!sessionReady) this.sendToWebSocket(selfFrontend, data);
        skipPeerForward = true;
      }
    }
    const peerFrontend = fromBackendRole === 'host' ? this.guestFrontend : this.hostFrontend;
    if (peerFrontend && !skipPeerForward) this.sendToWebSocket(peerFrontend, data);
  }

  protected queueToBackend(role: 'host' | 'guest', msg: string): void {
    const backend = role === 'host' ? this.hostBackend : this.guestBackend;
    const queue = role === 'host' ? this.hostBackendQueue : this.guestBackendQueue;
    if (backend && backend.readyState === WebSocket.OPEN) backend.send(msg);
    else queue.push(msg);
  }

  protected forceStopToyOnOwnerBackend(ownerRole: 'host' | 'guest', toyId: string): void {
    const backendRole: 'host' | 'guest' =
      ownerRole === 'host' ? 'host' : this.guestUsesHostBackend ? 'host' : 'guest';
    const stopPayload: Record<string, unknown> = {
      command: 'Function',
      action: 'Stop',
      timeSec: 0,
      apiVer: 1,
      toy: toyId,
    };
    this.queueToBackend(backendRole, buildAppMessage(LOVENSE_TOY_COMMAND_EVENT, stopPayload));
  }

  protected ownerBackendRole(ownerRole: 'host' | 'guest'): 'host' | 'guest' {
    if (ownerRole === 'host') return 'host';
    return this.guestUsesHostBackend ? 'host' : 'guest';
  }

  protected abstract sendToWebSocket(ws: WebSocket | null, msg: string | null): void;
}
