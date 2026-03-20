import type { MutableRefObject } from 'react';
import type { LovenseWsClient } from '@/lib/lovense/ws-client';

export function sendLovenseToyCommand(
  wsClientRef: MutableRefObject<LovenseWsClient | null>,
  toyId: string,
  action: string,
  timeSec: number = 0,
  loopRunningSec?: number,
  loopPauseSec?: number
): void {
  const command: Record<string, unknown> = {
    command: 'Function',
    action,
    timeSec,
    apiVer: 1,
    toy: toyId,
  };

  if (action !== 'Stop') {
    command.stopPrevious = 0;
  }

  if (loopRunningSec !== undefined && loopPauseSec !== undefined) {
    command.loopRunningSec = loopRunningSec;
    command.loopPauseSec = loopPauseSec;
  }

  wsClientRef.current?.sendEvent('basicapi_send_toy_command_ts', command);
}
