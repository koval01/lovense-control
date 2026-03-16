import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OnboardingStage } from '@/components/home/onboarding/storage';

export interface OnboardingState {
  onboardingStage: OnboardingStage;
  isOnboardingReady: boolean;
  hasInitialized: boolean;
}

const initialState: OnboardingState = {
  onboardingStage: 'language',
  isOnboardingReady: false,
  hasInitialized: false,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    initializeOnboarding(state, action: PayloadAction<OnboardingStage>) {
      state.onboardingStage = action.payload;
      state.isOnboardingReady = true;
      state.hasInitialized = true;
    },
    setOnboardingStage(state, action: PayloadAction<OnboardingStage>) {
      state.onboardingStage = action.payload;
    },
    setOnboardingReady(state, action: PayloadAction<boolean>) {
      state.isOnboardingReady = action.payload;
    },
    resetOnboarding(state) {
      state.onboardingStage = 'language';
      state.isOnboardingReady = false;
      state.hasInitialized = false;
    },
  },
});

export const { initializeOnboarding, setOnboardingStage, setOnboardingReady, resetOnboarding } =
  onboardingSlice.actions;

export default onboardingSlice.reducer;
