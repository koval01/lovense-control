import { configureStore } from '@reduxjs/toolkit';
import connectionReducer from '@/store/slices/connectionSlice';
import onboardingReducer from '@/store/slices/onboardingSlice';
import selectionReducer from '@/store/slices/selectionSlice';
import controlReducer from '@/store/slices/controlSlice';

export const store = configureStore({
  reducer: {
    connection: connectionReducer,
    onboarding: onboardingReducer,
    selection: selectionReducer,
    control: controlReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
