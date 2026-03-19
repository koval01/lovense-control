import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import type { Toy } from '@/lib/lovense-domain';
import { extractRequestError, internalApiClient } from '@/lib/api/internal-client';

export type LovenseStatus = 'idle' | 'initializing' | 'connecting' | 'qr_ready' | 'online' | 'error';
export type ConnectionMode = 'unselected' | 'self' | 'partner';

interface InitSessionResponse {
  authToken: string;
  uid: string;
}

interface SocketUrlResponse {
  wsUrl: string;
}

export interface ConnectionState {
  enabled: boolean;
  mode: ConnectionMode;
  /**
   * Bumped when entering or leaving partner mode so bridge hook can drop stale
   * async work and avoid duplicate WebSockets (e.g. exit room → re-enter).
   */
  bridgeSocketGeneration: number;
  status: LovenseStatus;
  /** URL of Lovense-provided QR image (fallback when raw qrCode is missing). */
  qrUrl: string | null;
  /** Raw QR payload from Lovense Socket API (data.qrcode) — use to generate our own SVG. */
  qrCode: string | null;
  toys: Record<string, Toy>;
  error: string | null;
  reconnectAttempt: number;
  sessionStarted: boolean;
}

const initialState: ConnectionState = {
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

export const initializeLovenseSession = createAsyncThunk<
  { wsUrl: string },
  void,
  { rejectValue: string }
>('connection/initializeLovenseSession', async (_, { rejectWithValue }) => {
  try {
    await internalApiClient.get('/api/session');
    let socketAuth: InitSessionResponse;
    try {
      const response = await internalApiClient.post<InitSessionResponse>('/api/lovense/socket', {});
      socketAuth = response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await internalApiClient.get('/api/session');
        const retryResponse = await internalApiClient.post<InitSessionResponse>('/api/lovense/socket', {});
        socketAuth = retryResponse.data;
      } else {
        throw error;
      }
    }

    const { data: socketUrl } = await internalApiClient.post<SocketUrlResponse>('/api/lovense/socket-url', {
      authToken: socketAuth.authToken,
    });

    if (!socketUrl.wsUrl) {
      return rejectWithValue('Failed to initialize socket URL');
    }

    return { wsUrl: socketUrl.wsUrl };
  } catch (error) {
    return rejectWithValue(extractRequestError(error, 'Failed to initialize session'));
  }
});

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setMode(state, action: PayloadAction<ConnectionMode>) {
      const next = action.payload;
      const prev = state.mode;
      if (next !== prev) {
        if (next === 'partner' || prev === 'partner') {
          state.bridgeSocketGeneration += 1;
        }
        state.mode = next;
      }
    },
    setEnabled(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload;
      if (!action.payload) {
        state.status = 'idle';
        state.error = null;
        state.qrUrl = null;
        state.qrCode = null;
        state.toys = {};
        state.sessionStarted = false;
      }
    },
    setStatus(state, action: PayloadAction<LovenseStatus>) {
      state.status = action.payload;
    },
    setQrUrl(state, action: PayloadAction<string | null>) {
      state.qrUrl = action.payload;
    },
    setQrCode(state, action: PayloadAction<string | null>) {
      state.qrCode = action.payload;
    },
    setToys(state, action: PayloadAction<Record<string, Toy>>) {
      state.toys = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    incrementReconnectAttempt(state) {
      state.reconnectAttempt += 1;
    },
    resetReconnectAttempt(state) {
      state.reconnectAttempt = 0;
    },
    setSessionStarted(state, action: PayloadAction<boolean>) {
      state.sessionStarted = action.payload;
    },
    resetConnectionRuntime(state) {
      state.status = state.enabled ? 'initializing' : 'idle';
      state.error = null;
      state.qrUrl = null;
      state.qrCode = null;
      state.toys = {};
      state.reconnectAttempt = 0;
      state.sessionStarted = false;
    },
    /** Invalidate in-flight bridge work (e.g. full reset while still in partner mode). */
    bumpBridgeSocketGeneration(state) {
      state.bridgeSocketGeneration += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeLovenseSession.pending, (state) => {
        state.status = 'initializing';
        state.error = null;
      })
      .addCase(initializeLovenseSession.fulfilled, (state) => {
        state.status = 'connecting';
        state.error = null;
      })
      .addCase(initializeLovenseSession.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload || action.error.message || 'Failed to initialize session';
      });
  },
});

export const {
  setMode,
  setEnabled,
  setStatus,
  setQrUrl,
  setQrCode,
  setToys,
  setError,
  incrementReconnectAttempt,
  resetReconnectAttempt,
  setSessionStarted,
  resetConnectionRuntime,
  bumpBridgeSocketGeneration,
} = connectionSlice.actions;

export default connectionSlice.reducer;
