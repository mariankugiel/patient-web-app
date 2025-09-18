import { createAsyncThunk, AsyncThunkPayloadCreator } from "@reduxjs/toolkit"
import { loginStart, loginSuccess, loginFailure, signupStart, signupSuccess, signupFailure } from "./authSlice"
import { AuthApiService, UserRegistrationData, UserLoginData } from "@/lib/api/auth-api"
import { resetSessionExpiredFlag } from "@/lib/api/axios-config"
import { toast } from "react-toastify"

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed"
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
      
      // Create user object that matches our Redux state
      const user = {
        id: userResponse.id.toString(),
        email: userResponse.email,
        user_metadata: {
          full_name: userData.fullName,
          phone_number: userData.mobile,
          date_of_birth: userData.dateOfBirth,
          address: userData.location,
          is_new_user: true, // Flag to indicate this is a new user
          onboarding_completed: false,
        },
        is_active: userResponse.is_active,
        created_at: userResponse.created_at,
      }

      dispatch(signupSuccess(user))
      
      // Reset session expired notification flag after successful signup
      resetSessionExpiredFlag()
      
      toast.success("Account created successfully! Welcome to Saluso!")
      return { user, isNewUser: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed"
      dispatch(signupFailure(message))
      toast.error(message)
      return rejectWithValue(message)
    }
  },
)
