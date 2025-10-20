import apiClient from './axios-config'

// Types for API requests and responses
export interface UserRegistrationData {
  email: string
  password: string
  full_name?: string
  date_of_birth?: string
  phone_number?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  gender?: string
  blood_type?: string
  allergies?: string
  current_medications?: any
  emergency_medical_info?: string
}

export interface UserLoginData {
  username: string // Backend expects 'username' field for email
  password: string
}

export interface AuthTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface UserResponse {
  id: number
  email: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at?: string
}

export interface UserProfile {
  full_name?: string
  date_of_birth?: string
  phone_country_code?: string
  phone_number?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_country_code?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  gender?: string
  blood_type?: string
  allergies?: string
  current_medications?: any
  emergency_medical_info?: string
  height?: string
  weight?: string
  waist_diameter?: string
  country?: string
  current_health_problems?: string[]
  medications?: Array<{
    drugName: string
    purpose: string
    dosage: string
    frequency: string
  }>
  past_medical_conditions?: string[]
  past_surgeries?: string[]
  onboarding_completed?: boolean
  onboarding_skipped?: boolean
  onboarding_completed_at?: string
  onboarding_skipped_at?: string
  is_new_user?: boolean
}

export interface OAuthUserProfileData {
  email: string
  full_name?: string
  avatar_url?: string
  provider: string
}

// Helper function to handle timeout and network errors
const handleApiError = (error: any, defaultMessage: string): Error => {
  // Handle timeout errors specifically
  if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
    return new Error('Connection failed. Please check your internet connection and try again.')
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
    return new Error('Unable to connect to server. Please check your internet connection.')
  }
  
  const message = error.response?.data?.detail || error.message || defaultMessage
  return new Error(message)
}

// API Service Functions
export class AuthApiService {
  // Register a new user
  static async register(userData: UserRegistrationData): Promise<UserResponse> {
    try {
      const response = await apiClient.post('/auth/register', userData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Registration failed')
    }
  }

  // Login user
  static async login(credentials: UserLoginData): Promise<AuthTokenResponse> {
    try {
      // Backend expects form data for login
      const formData = new FormData()
      formData.append('username', credentials.username)
      formData.append('password', credentials.password)

      const response = await apiClient.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Login failed')
    }
  }

  // Get user profile (token automatically added by interceptor)
  static async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get('/auth/profile')
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to get profile')
    }
  }

  // Update user profile (token automatically added by interceptor)
  static async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiClient.put('/auth/profile', profileData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update profile')
    }
  }

  // Create OAuth user profile (for Google, GitHub, etc.)
  static async createOAuthUserProfile(oauthData: OAuthUserProfileData): Promise<UserProfile> {
    try {
      const response = await apiClient.post('/auth/oauth-profile', oauthData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to create OAuth user profile')
    }
  }

  // Request password reset
  static async resetPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/reset-password', { email })
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to send password reset email')
    }
  }
}

