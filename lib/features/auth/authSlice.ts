import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    phone_number?: string
    date_of_birth?: string
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    gender?: string
    is_new_user?: boolean
    onboarding_completed?: boolean
    onboarding_skipped?: boolean
    onboarding_completed_at?: string
    onboarding_skipped_at?: string
    [key: string]: any
  }
  access_token?: string
  refresh_token?: string
  expires_in?: number
  is_active?: boolean
  created_at?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isRestoringSession: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoringSession: true,
  error: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload
      state.error = null
      
      // Store tokens in localStorage
      if (typeof window !== 'undefined' && action.payload.access_token) {
        localStorage.setItem('access_token', action.payload.access_token)
        if (action.payload.refresh_token) {
          localStorage.setItem('refresh_token', action.payload.refresh_token)
        }
        if (action.payload.expires_in) {
          localStorage.setItem('expires_in', action.payload.expires_in.toString())
        }
      }
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.error = action.payload
    },
    signupStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    signupSuccess: (state, action: PayloadAction<User>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload
      state.error = null
      
      // Store tokens in localStorage
      if (typeof window !== 'undefined' && action.payload.access_token) {
        localStorage.setItem('access_token', action.payload.access_token)
        if (action.payload.refresh_token) {
          localStorage.setItem('refresh_token', action.payload.refresh_token)
        }
        if (action.payload.expires_in) {
          localStorage.setItem('expires_in', action.payload.expires_in.toString())
        }
      }
    },
    signupFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
      
      // Clear stored tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('expires_in')
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { 
          ...state.user, 
          ...action.payload,
          user_metadata: {
            ...state.user.user_metadata,
            ...action.payload.user_metadata
          }
        }
      }
    },
    clearError: (state) => {
      state.error = null
    },
    sessionRestorationStart: (state) => {
      state.isRestoringSession = true
    },
    sessionRestorationComplete: (state) => {
      state.isRestoringSession = false
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, signupStart, signupSuccess, signupFailure, logout, updateUser, clearError, sessionRestorationStart, sessionRestorationComplete } = authSlice.actions

export default authSlice.reducer
