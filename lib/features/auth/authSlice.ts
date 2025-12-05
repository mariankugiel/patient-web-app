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

interface UserProfile {
  email?: string
  full_name?: string
  phone_number?: string
  date_of_birth?: string
  address?: string
  gender?: string
  avatar_url?: string
  timezone?: string
  language?: string
  theme?: string
  is_new_user?: boolean
  onboarding_completed?: boolean
  onboarding_skipped?: boolean
  [key: string]: any
}

interface AuthState {
  user: User | null
  profile: UserProfile | null // Separate profile field for full profile data
  isAuthenticated: boolean
  isLoading: boolean
  isRestoringSession: boolean
  isLoadingProfile: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoringSession: true,
  isLoadingProfile: false,
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
    loginMfaRequired: (state) => {
      // Stop loading state when MFA is required - user needs to enter code
      state.isLoading = false
      state.error = null
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
    fetchProfileStart: (state) => {
      state.isLoadingProfile = true
    },
    fetchProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.isLoadingProfile = false
      state.profile = action.payload
      // Also update user_metadata if user exists
      if (state.user) {
        state.user.user_metadata = {
          ...state.user.user_metadata,
          ...action.payload,
        }
      }
    },
    fetchProfileFailure: (state) => {
      state.isLoadingProfile = false
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = {
          ...state.profile,
          ...action.payload,
        }
      }
      // Also update user_metadata if user exists
      if (state.user) {
        state.user.user_metadata = {
          ...state.user.user_metadata,
          ...action.payload,
        }
      }
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, loginMfaRequired, signupStart, signupSuccess, signupFailure, logout, updateUser, clearError, sessionRestorationStart, sessionRestorationComplete, fetchProfileStart, fetchProfileSuccess, fetchProfileFailure, updateProfile } = authSlice.actions

export default authSlice.reducer
