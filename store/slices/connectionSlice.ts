import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Toy } from '@/lib/lovense-domain';
import { registerConnectionExtraReducers } from './connectionExtraReducers';
import {
  connectionInitialState,
  type ConnectionMode,
  type ConnectionState,
  type LovenseStatus,
} from './connectionState';

export type { ConnectionMode, ConnectionState, LovenseStatus };
export { initializeLovenseSession } from './connectionThunks';

const connectionSlice = createSlice({
  name: 'connection',
  initialState: connectionInitialState,
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
    bumpBridgeSocketGeneration(state) {
      state.bridgeSocketGeneration += 1;
    },
  },
  extraReducers: (builder) => registerConnectionExtraReducers(builder),
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
