import { configureStore } from "@reduxjs/toolkit"
import { enableMapSet } from "immer"
import authSlice from "./features/auth/authSlice"
import healthSlice from "./features/health/healthSlice"
import uiSlice from "./features/ui/uiSlice"
import onboardingSlice from "./features/onboarding/onboardingSlice"

// Enable MapSet plugin for Immer to support Set and Map types
enableMapSet()

export const store = configureStore({
  reducer: {
    auth: authSlice,
    health: healthSlice,
    ui: uiSlice,
    onboarding: onboardingSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
