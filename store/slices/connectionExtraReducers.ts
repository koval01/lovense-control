import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { initializeLovenseSession } from './connectionThunks';
import type { ConnectionState } from './connectionState';

export function registerConnectionExtraReducers(builder: ActionReducerMapBuilder<ConnectionState>) {
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
}
