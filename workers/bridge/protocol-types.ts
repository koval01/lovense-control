export interface SetToyRulesPayload {
  enabledToyIds?: string[];
  maxPower?: number;
  limits?: Record<string, number>;
  targetRole?: 'host' | 'guest';
}

export interface ChatMessagePayload {
  text: string;
}

export interface ChatVoicePayload {
  id: string;
  ts: number;
  mime: string;
  data: string;
  durationMs?: number;
}

export interface LovenseToyCommandPayload {
  toy: string;
  action: string;
  [key: string]: unknown;
}

export interface RoomRules {
  hostEnabledToyIds: Set<string> | null;
  hostToyMaxPower: number | null;
  hostLimits: Record<string, number> | null;
  guestEnabledToyIds: Set<string> | null;
  guestToyMaxPower: number | null;
  guestLimits: Record<string, number> | null;
}
