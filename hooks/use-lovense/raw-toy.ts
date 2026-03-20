/** Raw toy shape from Lovense API device list. */
export interface RawToy {
  id: string;
  name?: string;
  toyType?: string;
  connected?: boolean;
  battery?: number;
  shortFunctionNames?: string[];
  fullFunctionNames?: string[];
}

const SHORT_TO_FULL: Record<string, string> = {
  v: 'Vibrate',
  v1: 'Vibrate1',
  v2: 'Vibrate2',
  r: 'Rotate',
  p: 'Pump',
  t: 'Thrusting',
  f: 'Fingering',
  s: 'Suction',
  d: 'Depth',
  st: 'Stroke',
  o: 'Oscillate',
};

export function normalizeSupportedFunctions(rawToy: RawToy): string[] {
  const full = Array.isArray(rawToy.fullFunctionNames) ? rawToy.fullFunctionNames : [];
  const short = Array.isArray(rawToy.shortFunctionNames) ? rawToy.shortFunctionNames : [];
  const merged = [...full, ...short.map((token) => SHORT_TO_FULL[token.toLowerCase()] || token)];
  return Array.from(
    new Set(
      merged
        .map((name) => name.trim())
        .filter((name) => Boolean(name))
    )
  );
}
