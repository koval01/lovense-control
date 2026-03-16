import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FeatureGroup } from '@/lib/lovense-domain';

export interface ControlState {
  limits: Record<string, number>;
  groups: FeatureGroup[];
}

const initialState: ControlState = {
  limits: {},
  groups: [],
};

const controlSlice = createSlice({
  name: 'control',
  initialState,
  reducers: {
    setLimit(state, action: PayloadAction<{ featureId: string; value: number }>) {
      state.limits[action.payload.featureId] = action.payload.value;
    },
    setLimits(state, action: PayloadAction<Record<string, number>>) {
      state.limits = action.payload;
    },
    setGroups(state, action: PayloadAction<FeatureGroup[]>) {
      state.groups = action.payload;
    },
    resetGroups(state) {
      state.groups = [];
    },
    pruneGroupsByFeatureIds(state, action: PayloadAction<string[]>) {
      const allowed = new Set(action.payload);
      state.groups = state.groups
        .map((group) => ({
          ...group,
          featureIds: group.featureIds.filter((featureId) => allowed.has(featureId)),
        }))
        .filter((group) => group.featureIds.length >= 2);
    },
    pruneLimitsByFeatureIds(state, action: PayloadAction<string[]>) {
      const allowed = new Set(action.payload);
      const next: Record<string, number> = {};
      for (const [featureId, value] of Object.entries(state.limits)) {
        if (allowed.has(featureId)) {
          next[featureId] = value;
        }
      }
      state.limits = next;
    },
  },
});

export const { setLimit, setLimits, setGroups, resetGroups, pruneGroupsByFeatureIds, pruneLimitsByFeatureIds } =
  controlSlice.actions;

export default controlSlice.reducer;
