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

const KNOWN = new Set([
  'Vibrate',
  'Vibrate1',
  'Vibrate2',
  'Rotate',
  'Pump',
  'Thrusting',
  'Fingering',
  'Suction',
  'Depth',
  'Stroke',
  'Oscillate',
]);

function normalizeToken(token: string): string {
  const raw = token.trim();
  const mapped = SHORT_TO_FULL[raw.toLowerCase()] || raw;
  return KNOWN.has(mapped) ? mapped : '';
}

/** Returns the list of feature names supported by a toy type (e.g. "Nora", "Max"). */
export function getFeaturesForToy(type: string, reportedFunctions?: string[]): string[] {
  const t = type.toLowerCase();

  if (reportedFunctions?.length) {
    const normalized = Array.from(
      new Set(
        reportedFunctions
          .map(normalizeToken)
          .filter((feature): feature is string => Boolean(feature))
      )
    );
    if (normalized.length > 0) {
      return normalized;
    }
  }

  if (t.includes('edge') || t.includes('diamo')) {
    return ['Vibrate1', 'Vibrate2'];
  }

  if (t.includes('nora')) return ['Vibrate', 'Rotate'];
  if (t.includes('max')) return ['Vibrate', 'Rotate', 'Pump'];
  if (t.includes('domi')) return ['Vibrate'];
  if (t.includes('flexer')) return ['Vibrate', 'Fingering'];
  if (t.includes('tenera')) return ['Vibrate', 'Suction'];

  return ['Vibrate'];
}
