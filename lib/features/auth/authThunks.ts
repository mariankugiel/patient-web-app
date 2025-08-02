import { createAsyncThunk } from "@reduxjs/toolkit"
import { loginStart, loginSuccess, loginFailure } from "./authSlice"

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: { email: string; password: string }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart())

      // Replace with your actual API call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        throw new Error("Login failed")
      }

      const user = await response.json()
      dispatch(loginSuccess(user))
      return user
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed"
      dispatch(loginFailure(message))
      return rejectWithValue(message)
    }
  },
)
