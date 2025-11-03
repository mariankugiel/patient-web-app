import { createAsyncThunk, AsyncThunkPayloadCreator } from "@reduxjs/toolkit"
import { loginStart, loginSuccess, loginFailure, signupStart, signupSuccess, signupFailure } from "./authSlice"
import { AuthApiService, UserRegistrationData, UserLoginData } from "@/lib/api/auth-api"
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

      const tokenResponse = await AuthApiService.login(loginData)
      
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
        }
      } catch (sessionError) {
        console.error('Failed to set Supabase session (exception):', sessionError)
        // Continue anyway - MFA will not work but other features will
      }
      
      // Get user profile (token automatically added by interceptor)
      const userProfile = await AuthApiService.getProfile()
      
      // Use the onboarding status directly from the backend profile
      // Don't override the backend values with our own logic
      const isNewUser = userProfile.is_new_user !== undefined ? userProfile.is_new_user : 
                       (!userProfile.onboarding_completed && !userProfile.onboarding_skipped)
      
      // Create complete user object with profile data
      const user = {
        id: tokenResponse.access_token, // Use token as temporary ID
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

      const tokenResponse = await AuthApiService.login(loginData)
      
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
        }
      } catch (sessionError) {
        console.error('Failed to set Supabase session (exception):', sessionError)
        // Continue anyway - MFA will not work but other features will
      }
      
      // Get user profile (token automatically added by interceptor)
      const userProfile = await AuthApiService.getProfile()
      
      // Use the onboarding status directly from the backend profile
      const isNewUser = userProfile.is_new_user !== undefined ? userProfile.is_new_user : 
                       (!userProfile.onboarding_completed && !userProfile.onboarding_skipped)
      
      // Create complete user object with profile data and tokens
      const user = {
        id: tokenResponse.access_token,
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
