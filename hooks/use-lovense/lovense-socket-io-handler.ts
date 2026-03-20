import type { MutableRefObject } from 'react';
import type { AppDispatch, AppStore } from '@/store';
import {
  setQrCode,
  setQrUrl,
  setSessionStarted,
  setStatus,
  setToys,
  type LovenseStatus,
} from '@/store/slices/connectionSlice';
import type { RawToy } from './raw-toy';
import { normalizeSupportedFunctions } from './raw-toy';

export type LovenseSocketIoHandlerDeps = {
  dispatch: AppDispatch;
  store: AppStore;
  clearQrRotation: () => void;
  statusRef: MutableRefObject<LovenseStatus>;
};

export function createLovenseSocketIoHandler({
  dispatch,
  store,
  clearQrRotation,
  statusRef,
}: LovenseSocketIoHandlerDeps) {
  return (event: string, payloadData: unknown) => {
    const payload = payloadData as {
      status?: number;
      toyList?: RawToy[];
      data?: { qrcodeUrl?: string; qrcode?: string };
    };

    if (event === 'basicapi_update_app_online_tc' || event === 'basicapi_update_app_status_tc') {
      const isOnline = payload?.status === 1;
      if (isOnline) {
        dispatch(setSessionStarted(true));
        clearQrRotation();
        dispatch(setStatus('online'));
        dispatch(setQrUrl(null));
        dispatch(setQrCode(null));
      } else {
        if (statusRef.current === 'online') return;
        dispatch(setSessionStarted(false));
        dispatch(setStatus('qr_ready'));
      }
      return;
    }

    if (event === 'basicapi_update_device_info_tc') {
      const toyList = payload?.toyList || [];
      const previousToys = store.getState().connection.toys;
      const nextToys = { ...previousToys };
      const currentIds = new Set<string>();

      toyList.forEach((toy) => {
        currentIds.add(toy.id);
        if (toy.connected) {
          const supportedFunctions = normalizeSupportedFunctions(toy);
          nextToys[toy.id] = {
            id: toy.id,
            name: toy.name || 'Unknown',
            connected: true,
            battery: toy.battery ?? 0,
            toyType: toy.toyType || toy.name,
            supportedFunctions,
          };
        } else {
          delete nextToys[toy.id];
        }
      });

      Object.keys(nextToys).forEach((id) => {
        if (!currentIds.has(id)) delete nextToys[id];
      });

      dispatch(setToys(nextToys));
      return;
    }

    if (event === 'basicapi_get_qrcode_tc') {
      const qrCodeUrl = payload?.data?.qrcodeUrl;
      const qrCodeRaw = payload?.data?.qrcode;
      if ((qrCodeUrl || qrCodeRaw) && statusRef.current !== 'online') {
        dispatch(setQrUrl(qrCodeUrl ?? null));
        dispatch(setQrCode(typeof qrCodeRaw === 'string' ? qrCodeRaw : null));
        dispatch(setStatus('qr_ready'));
      }
    }
  };
}
