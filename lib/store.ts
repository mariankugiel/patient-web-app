import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./features/auth/authSlice"
import healthSlice from "./features/health/healthSlice"
import uiSlice from "./features/ui/uiSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    health: healthSlice,
    ui: uiSlice,
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
