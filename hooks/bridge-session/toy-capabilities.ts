import type { Toy } from '@/lib/lovense-domain';
import type { BridgeToyCapability } from '@/lib/bridge/protocol';
import type { RawToy } from './types';

export function normalizeSupportedFunctions(rawToy: RawToy): string[] {
  const full = Array.isArray(rawToy.fullFunctionNames) ? rawToy.fullFunctionNames : [];
  const short = Array.isArray(rawToy.shortFunctionNames) ? rawToy.shortFunctionNames : [];
  const shortToFull: Record<string, string> = {
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
  const merged = [...full, ...short.map((token) => shortToFull[token.toLowerCase()] || token)];
  return Array.from(new Set(merged.map((name) => name.trim()).filter(Boolean)));
}

export function lovenseToyListToCapabilities(toyList: RawToy[]): BridgeToyCapability[] {
  return toyList
    .filter((t) => t.connected)
    .map((toy) => ({
      id: toy.id,
      name: toy.name || 'Unknown',
      toyType: toy.toyType,
      supportedFunctions: normalizeSupportedFunctions(toy),
      maxLevel: 20,
      maxTimeSec: 0,
    }));
}

export function mapRemoteCapabilitiesToToyMap(toys: BridgeToyCapability[]): Record<string, Toy> {
  return Object.fromEntries(
    toys.map((toy) => [
      toy.id,
      {
        id: toy.id,
        name: toy.name,
        connected: true,
        battery: 100,
        toyType: toy.toyType,
        supportedFunctions: toy.supportedFunctions || [],
      },
    ])
  );
}
