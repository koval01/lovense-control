import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SelectionState {
  activeToyIds: string[];
}

const initialState: SelectionState = {
  activeToyIds: [],
};

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    syncActiveToyIds(state, action: PayloadAction<string[]>) {
      const availableIds = action.payload;
      const availableSet = new Set(availableIds);
      const kept = state.activeToyIds.filter((id) => availableSet.has(id));
      const known = new Set(kept);
      const appended = availableIds.filter((id) => !known.has(id));
      state.activeToyIds = [...kept, ...appended];
    },
    toggleToy(state, action: PayloadAction<string>) {
      const toyId = action.payload;
      if (state.activeToyIds.includes(toyId)) {
        state.activeToyIds = state.activeToyIds.filter((id) => id !== toyId);
        return;
      }
      state.activeToyIds.push(toyId);
    },
    resetSelection(state) {
      state.activeToyIds = [];
    },
  },
});

export const { syncActiveToyIds, toggleToy, resetSelection } = selectionSlice.actions;

export default selectionSlice.reducer;
