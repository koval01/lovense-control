import type { BridgeSocketPayload, SocketHandlerDeps } from '../socket-handler-deps';

export function handleSelfSessionSocketEvents(
  event: string,
  payload: BridgeSocketPayload,
  d: SocketHandlerDeps
): void {
  if (event === 'bridge_self_app_status') {
    if (payload?.status === 1) {
      d.selfSessionReadyRef.current = true;
      d.setSelfSessionReady(true);
      d.setPartnerAuthLatch(true);
      d.setSelfQrUrl(null);
      d.setSelfQrCode(null);
    } else {
      d.selfSessionReadyRef.current = false;
      d.setSelfSessionReady(false);
    }
  }
  if (event === 'basicapi_get_qrcode_tc') {
    if (d.selfSessionReadyRef.current) return;
    const qrCodeUrl = payload?.data?.qrcodeUrl;
    const qrCodeRaw = payload?.data?.qrcode;
    if (qrCodeUrl || qrCodeRaw) {
      d.setSelfQrUrl(qrCodeUrl ?? null);
      d.setSelfQrCode(typeof qrCodeRaw === 'string' ? qrCodeRaw : null);
    }
  }
  if (event === 'basicapi_update_app_online_tc' || event === 'basicapi_update_app_status_tc') {
    if (payload?.status === 1) d.setStatus('online');
  }
}
