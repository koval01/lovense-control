export function buildLovenseCommandPayload(
  toyId: string,
  action: string,
  timeSec: number = 0,
  loopRunningSec?: number,
  loopPauseSec?: number
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    command: 'Function',
    action,
    timeSec,
    apiVer: 1,
    toy: toyId,
  };
  if (action !== 'Stop') payload.stopPrevious = 0;
  if (loopRunningSec !== undefined && loopPauseSec !== undefined) {
    payload.loopRunningSec = loopRunningSec;
    payload.loopPauseSec = loopPauseSec;
  }
  return payload;
}
