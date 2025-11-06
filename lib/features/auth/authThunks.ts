import { createAsyncThunk, AsyncThunkPayloadCreator } from "@reduxjs/toolkit"
import { loginStart, loginSuccess, loginFailure, loginMfaRequired, signupStart, signupSuccess, signupFailure } from "./authSlice"
import { AuthApiService, UserRegistrationData, UserLoginData, LoginResponse } from "@/lib/api/auth-api"
import { resetSessionExpiredFlag } from "@/lib/api/axios-config"
import { toast } from "react-toastify"
import { createClient } from "@/lib/supabase-client"

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: { email: string; password: string }, { dispatch, rejectWithValue }: any) => {
    try {
      dispatch(loginStart())

      const loginData: UserLoginData = {
        username: credentials.email, // Backend expects 'username' field
        password: credentials.password,
      }

      const loginResponse: LoginResponse = await AuthApiService.login(loginData)
      
      // Check if MFA is required - if so, return early WITHOUT setting isAuthenticated
      if (loginResponse.mfa_required && loginResponse.factor_id && loginResponse.access_token) {
        // Store temporary token for MFA verification
        if (typeof window !== 'undefined') {
          localStorage.setItem('mfa_temp_access_token', loginResponse.access_token)
          if (loginResponse.refresh_token) {
            localStorage.setItem('mfa_temp_refresh_token', loginResponse.refresh_token)
          }
        }
        
        // IMPORTANT: Stop loading state when MFA is required
        // This allows the user to enter the MFA code
        dispatch(loginMfaRequired())
        
        // Return MFA requirement - don't dispatch loginSuccess yet
        return {
          mfa_required: true,
          factor_id: loginResponse.factor_id,
          access_token: loginResponse.access_token,
          refresh_token: loginResponse.refresh_token,
          email: credentials.email,
        }
      }
      
      // No MFA required - proceed with normal login
      const tokenResponse = loginResponse
      
      if (!tokenResponse.access_token || !tokenResponse.refresh_token || !tokenResponse.expires_in) {
        throw new Error("Missing token information from login response")
      }
      
      // Store token in localStorage so interceptor can use it
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokenResponse.access_token)
        if (tokenResponse.refresh_token) {
          localStorage.setItem('refresh_token', tokenResponse.refresh_token)
        }
        if (tokenResponse.expires_in) {
          localStorage.setItem('expires_in', tokenResponse.expires_in.toString())
        }
      }
      
      // Set Supabase session for MFA to work
      let supabaseUserId = null
      try {
        const supabase = createClient()
        const sessionResult = await supabase.auth.setSession({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
        })
        if (sessionResult.error) {
          console.error('Failed to set Supabase session:', sessionResult.error)
        } else {
          console.log('Successfully set Supabase session')
          // Get the Supabase user ID from the session
          supabaseUserId = sessionResult.data.session?.user?.id
          console.log('Supabase user ID:', supabaseUserId)
        }
      } catch (sessionError) {
        console.error('Failed to set Supabase session (exception):', sessionError)
        // Continue anyway - MFA will not work but other features will
      }
      
      // Get user profile (token automatically added by interceptor)
      // Handle connection errors gracefully - if backend is down, use minimal user data
      let userProfile
      try {
        userProfile = await AuthApiService.getProfile()
      } catch (profileError: any) {
        // If profile fetch fails due to connection error, use minimal data
        const isConnectionError = profileError?.code === 'ECONNABORTED' || 
                                  profileError?.code === 'ERR_NETWORK' ||
                                  profileError?.code === 'ECONNRESET' ||
                                  profileError?.code === 'ECONNREFUSED' ||
                                  profileError?.message?.includes('Connection failed') ||
                                  profileError?.message?.includes('timeout') ||
                                  profileError?.message?.includes('connection closed')
        
        if (isConnectionError) {
          console.warn('Backend unavailable during login - using minimal user profile')
          // Use minimal profile data - user can still access the app
          userProfile = {
            email: credentials.email,
            is_new_user: true,
            onboarding_completed: false,
            onboarding_skipped: false,
          }
        } else {
          // Re-throw non-connection errors
          throw profileError
        }
      }
      
      // Use the onboarding status directly from the backend profile
      // Don't override the backend values with our own logic
      const isNewUser = userProfile.is_new_user !== undefined ? userProfile.is_new_user : 
                       (!userProfile.onboarding_completed && !userProfile.onboarding_skipped)
      
      // Create complete user object with profile data
      // Use user_id from login response first, then Supabase session, then fallback to token
      const userId = tokenResponse.user_id || supabaseUserId || tokenResponse.access_token
      
      const user = {
        id: userId,
        email: credentials.email,
        user_metadata: {
          ...userProfile,
          is_new_user: isNewUser,
          // Keep the original onboarding_completed and onboarding_skipped values from backend
        },
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
      }

      // Only dispatch loginSuccess once with complete user data
      dispatch(loginSuccess(user))
      
      // Reset session expired notification flag after successful login
      resetSessionExpiredFlag()
      
      toast.success("Login successful! Welcome back!")
      return user
    } catch (error: any) {
      let message = "Login failed"
      
      // Check if this is a connection error
      const isConnectionError = error?.code === 'ECONNABORTED' || 
                                error?.code === 'ERR_NETWORK' ||
                                error?.code === 'ECONNRESET' ||
                                error?.code === 'ECONNREFUSED' ||
                                error?.message?.includes('Connection failed') ||
                                error?.message?.includes('timeout') ||
                                error?.message?.includes('connection closed') ||
                                error?.message?.includes('Connection closed') ||
                                error?.message?.includes('socket hang up')
      
      // Handle connection errors
      if (isConnectionError) {
        message = "Unable to connect to the server. Please check if the backend is running and try again."
        dispatch(loginFailure(message))
        toast.error(message)
        return rejectWithValue(message)
      }
      
      // Handle different error types
      if (error.response?.status === 401) {
        message = error.response?.data?.detail || "Incorrect email or password. Please check your credentials and try again."
      } else if (error.response?.status === 403) {
        // Email not confirmed - show as info message
        message = error.response?.data?.detail || " "
        toast.info(message)
        dispatch(loginFailure(message))
        return rejectWithValue(message)
      } else if (error.response?.status === 429) {
        message = error.response?.data?.detail || "Too many login attempts. Please wait a few minutes before trying again."
      } else if (error.response?.status === 503) {
        message = error.response?.data?.detail || "Unable to connect to authentication service. Please try again later."
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail
      } else if (error.message) {
        message = error.message
      }
      
      dispatch(loginFailure(message))
      toast.info(message)
      return rejectWithValue(message)
    }
  },
)

export const verifyMfaLogin = createAsyncThunk(
  "auth/verifyMfaLogin",
  async (data: { factor_id: string; code: string; access_token: string; email: string }, { dispatch, rejectWithValue }: any) => {
    try {
      dispatch(loginStart())

      const tokenResponse = await AuthApiService.verifyMfaLogin(
        { factor_id: data.factor_id, code: data.code },
        data.access_token
      )
      
      if (!tokenResponse.access_token || !tokenResponse.refresh_token || !tokenResponse.expires_in) {
        throw new Error("Missing token information from MFA verification")
      }
      
      // Store token in localStorage so interceptor can use it
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokenResponse.access_token)
        if (tokenResponse.refresh_token) {
          localStorage.setItem('refresh_token', tokenResponse.refresh_token)
        }
        if (tokenResponse.expires_in) {
          localStorage.setItem('expires_in', tokenResponse.expires_in.toString())
        }
        // Clear temporary MFA tokens
        localStorage.removeItem('mfa_temp_access_token')
        localStorage.removeItem('mfa_temp_refresh_token')
      }
      
      // Set Supabase session
      let supabaseUserId = null
      try {
        const supabase = createClient()
        const sessionResult = await supabase.auth.setSession({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
        })
        if (sessionResult.error) {
          console.error('Failed to set Supabase session:', sessionResult.error)
        } else {
          console.log('Successfully set Supabase session')
          // Get the Supabase user ID from the session
          supabaseUserId = sessionResult.data.session?.user?.id
          console.log('Supabase user ID:', supabaseUserId)
        }
      } catch (sessionError) {
        console.error('Failed to set Supabase session (exception):', sessionError)
      }
      
      // Get user profile
      // Handle connection errors gracefully - if backend is down, use minimal user data
      let userProfile
      try {
        userProfile = await AuthApiService.getProfile()
      } catch (profileError: any) {
        // If profile fetch fails due to connection error, use minimal data
        const isConnectionError = profileError?.code === 'ECONNABORTED' || 
                                  profileError?.code === 'ERR_NETWORK' ||
                                  profileError?.code === 'ECONNRESET' ||
                                  profileError?.code === 'ECONNREFUSED' ||
                                  profileError?.message?.includes('Connection failed') ||
                                  profileError?.message?.includes('timeout') ||
                                  profileError?.message?.includes('connection closed')
        
        if (isConnectionError) {
          console.warn('Backend unavailable during MFA login - using minimal user profile')
          // Use minimal profile data - user can still access the app
          userProfile = {
            email: data.email,
            is_new_user: true,
            onboarding_completed: false,
            onboarding_skipped: false,
          }
        } else {
          // Re-throw non-connection errors
          throw profileError
        }
      }
      
      const isNewUser = userProfile.is_new_user !== undefined ? userProfile.is_new_user : 
                       (!userProfile.onboarding_completed && !userProfile.onboarding_skipped)
      
      // Use user_id from tokenResponse if available (from MFA verification), then Supabase session, then fallback to token
      const userId = tokenResponse.user_id || supabaseUserId || tokenResponse.access_token
      
      const user = {
        id: userId,
        email: data.email,
        user_metadata: {
          ...userProfile,
          is_new_user: isNewUser,
        },
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
      }

      // NOW dispatch loginSuccess - this sets isAuthenticated to true
      dispatch(loginSuccess(user))
      resetSessionExpiredFlag()
      toast.success("Login successful! Welcome back!")
      return user
    } catch (error: any) {
      let message = "MFA verification failed"
      
      if (error.response?.status === 401) {
        message = error.response?.data?.detail || "Invalid verification code. Please try again."
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail
      } else if (error.message) {
        message = error.message
      }
      
      dispatch(loginFailure(message))
      toast.error(message)
      return rejectWithValue(message)
    }
  },
)

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (userData: { email: string; password: string; fullName?: string; mobile?: string; dateOfBirth?: string; location?: string }, { dispatch, rejectWithValue }: any) => {
    try {
      dispatch(signupStart())

      const registrationData: UserRegistrationData = {
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName,
        phone_number: userData.mobile,
        date_of_birth: userData.dateOfBirth,
        address: userData.location,
      }

      const userResponse = await AuthApiService.register(registrationData)
      
      // Auto-login after successful registration
      const loginData: UserLoginData = {
        username: userData.email,
        password: userData.password,
      }

      const loginResponse: LoginResponse = await AuthApiService.login(loginData)
      
      // Check if MFA is required (shouldn't happen during signup, but handle it)
      if (loginResponse.mfa_required && loginResponse.factor_id && loginResponse.access_token) {
        // This shouldn't happen during signup, but if it does, return error
        throw new Error("MFA required during signup - this should not occur")
      }
      
      // No MFA required - proceed with normal login
      const tokenResponse = loginResponse
      
      if (!tokenResponse.access_token || !tokenResponse.refresh_token || !tokenResponse.expires_in) {
        throw new Error("Missing token information from login response")
      }
      
      // Store token in localStorage so interceptor can use it
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokenResponse.access_token)
        if (tokenResponse.refresh_token) {
          localStorage.setItem('refresh_token', tokenResponse.refresh_token)
        }
        if (tokenResponse.expires_in) {
          localStorage.setItem('expires_in', tokenResponse.expires_in.toString())
        }
      }
      
      // Set Supabase session for MFA to work
      let supabaseUserId = null
      try {
        const supabase = createClient()
        const sessionResult = await supabase.auth.setSession({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
        })
        if (sessionResult.error) {
          console.error('Failed to set Supabase session:', sessionResult.error)
        } else {
          console.log('Successfully set Supabase session')
          // Get the Supabase user ID from the session
          supabaseUserId = sessionResult.data.session?.user?.id
          console.log('Supabase user ID:', supabaseUserId)
        }
      } catch (sessionError) {
        console.error('Failed to set Supabase session (exception):', sessionError)
        // Continue anyway - MFA will not work but other features will
      }
      
      // Get user profile (token automatically added by interceptor)
      // Handle connection errors gracefully - if backend is down, use minimal user data
      let userProfile
      try {
        userProfile = await AuthApiService.getProfile()
      } catch (profileError: any) {
        // If profile fetch fails due to connection error, use minimal data
        const isConnectionError = profileError?.code === 'ECONNABORTED' || 
                                  profileError?.code === 'ERR_NETWORK' ||
                                  profileError?.code === 'ECONNRESET' ||
                                  profileError?.code === 'ECONNREFUSED' ||
                                  profileError?.message?.includes('Connection failed') ||
                                  profileError?.message?.includes('timeout') ||
                                  profileError?.message?.includes('connection closed')
        
        if (isConnectionError) {
          console.warn('Backend unavailable during signup - using minimal user profile')
          // Use minimal profile data - user can still access the app
          userProfile = {
            email: userData.email,
            is_new_user: true,
            onboarding_completed: false,
            onboarding_skipped: false,
          }
        } else {
          // Re-throw non-connection errors
          throw profileError
        }
      }
      
      // Use the onboarding status directly from the backend profile
      const isNewUser = userProfile.is_new_user !== undefined ? userProfile.is_new_user : 
                       (!userProfile.onboarding_completed && !userProfile.onboarding_skipped)
      
      // Create complete user object with profile data and tokens
      // Use user_id from login response first, then Supabase session, then fallback to token
      const userId = tokenResponse.user_id || supabaseUserId || tokenResponse.access_token
      
      const user = {
        id: userId,
        email: userProfile.email || userResponse.email,
        user_metadata: {
          ...userProfile,
          is_new_user: isNewUser,
        },
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        is_active: userResponse.is_active,
        created_at: userResponse.created_at,
      }
      
      dispatch(signupSuccess(user))
      
      // Reset session expired notification flag after successful signup
      resetSessionExpiredFlag()
      
      toast.success("Account created successfully! Welcome to Saluso!")
      return { user, isNewUser: true }
    } catch (error: any) {
      let message = "Signup failed"
      
      // Handle different error types
      if (error.response?.status === 400) {
        message = error.response?.data?.detail || "Please check your information and try again."
      } else if (error.response?.status === 503) {
        message = error.response?.data?.detail || "Unable to connect to authentication service. Please try again later."
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail
      } else if (error.message) {
        message = error.message
      }
      
      // Check if this is an email confirmation message (should be shown as info)
      if (message.includes("check your email") || message.includes("confirmation link")) {
        toast.info(message)
        dispatch(signupFailure(message))
        return rejectWithValue(message)
      }
      
      dispatch(signupFailure(message))
      toast.error(message)
      return rejectWithValue(message)
    }
  },
)
