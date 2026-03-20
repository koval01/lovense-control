import type { Toy } from '@/lib/lovense-domain';

export type LovenseStatus = 'idle' | 'initializing' | 'connecting' | 'qr_ready' | 'online' | 'error';
export type ConnectionMode = 'unselected' | 'self' | 'partner';

export interface ConnectionState {
  enabled: boolean;
  mode: ConnectionMode;
  bridgeSocketGeneration: number;
  status: LovenseStatus;
  qrUrl: string | null;
  qrCode: string | null;
  toys: Record<string, Toy>;
  error: string | null;
  reconnectAttempt: number;
  sessionStarted: boolean;
}

export const connectionInitialState: ConnectionState = {
  enabled: true,
  mode: 'unselected',
  bridgeSocketGeneration: 0,
  status: 'initializing',
  qrUrl: null,
  qrCode: null,
  toys: {},
  error: null,
  reconnectAttempt: 0,
  sessionStarted: false,
};
