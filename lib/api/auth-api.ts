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
  email?: string
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
  theme?: string
  language?: string
  timezone?: string
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

export interface UserEmergency {
  contacts?: Array<{
    name: string
    relationship: string
    phone: string
    email: string
  }>
  allergies?: string
  medications?: string
  health_problems?: string
  pregnancy_status?: string
  organ_donor?: boolean
}

export interface UserNotifications {
  appointment_hours_before?: string
  medication_minutes_before?: string
  tasks_reminder_time?: string
  email_appointments?: boolean
  sms_appointments?: boolean
  whatsapp_appointments?: boolean
  push_appointments?: boolean
  email_medications?: boolean
  sms_medications?: boolean
  whatsapp_medications?: boolean
  push_medications?: boolean
  email_tasks?: boolean
  sms_tasks?: boolean
  whatsapp_tasks?: boolean
  push_tasks?: boolean
  email_newsletter?: boolean
}

export interface UserIntegrations {
  google_fit?: boolean
  fitbit?: boolean
  garmin?: boolean
  apple_health?: boolean
  withings?: boolean
  oura?: boolean
}

export interface UserPrivacy {
  share_anonymized_data?: boolean
  share_analytics?: boolean
}

export interface UserSharedAccess {
  health_professionals?: Array<{
    id: string
    permissions_contact_type?: string
    profile_fullname?: string
    profile_email?: string
    permissions_relationship?: string
    medical_history_view?: boolean
    medical_history_download?: boolean
    medical_history_edit?: boolean
    health_records_view?: boolean
    health_records_download?: boolean
    health_records_edit?: boolean
    health_plan_view?: boolean
    health_plan_download?: boolean
    health_plan_edit?: boolean
    medications_view?: boolean
    medications_download?: boolean
    medications_edit?: boolean
    appointments_view?: boolean
    appointments_edit?: boolean
    messages_view?: boolean
    messages_edit?: boolean
    accessLevel?: string
    status?: string
    lastAccessed?: string
    expires?: string
  }>
  family_friends?: Array<{
    id: string
    permissions_contact_type?: string
    profile_fullname?: string
    profile_email?: string
    permissions_relationship?: string
    medical_history_view?: boolean
    medical_history_download?: boolean
    medical_history_edit?: boolean
    health_records_view?: boolean
    health_records_download?: boolean
    health_records_edit?: boolean
    health_plan_view?: boolean
    health_plan_download?: boolean
    health_plan_edit?: boolean
    medications_view?: boolean
    medications_download?: boolean
    medications_edit?: boolean
    appointments_view?: boolean
    appointments_edit?: boolean
    messages_view?: boolean
    messages_edit?: boolean
    accessLevel?: string
    status?: string
    lastAccessed?: string
    expires?: string
  }>
}

export interface AccessLogEntry {
  id: string
  name: string
  role: string
  action: string
  date: string
  authorized: boolean
}

export interface UserAccessLogs {
  logs?: AccessLogEntry[]
}

export interface UserDataSharing {
  share_health_data?: boolean
  share_with_other_providers?: boolean
  share_with_researchers?: boolean
  share_with_insurance?: boolean
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

  // Get user emergency data (token automatically added by interceptor)
  static async getEmergency(): Promise<UserEmergency> {
    try {
      const response = await apiClient.get('/auth/emergency')
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to get emergency data')
    }
  }

  // Update user emergency data (token automatically added by interceptor)
  static async updateEmergency(emergencyData: Partial<UserEmergency>): Promise<UserEmergency> {
    try {
      const response = await apiClient.put('/auth/emergency', emergencyData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update emergency data')
    }
  }

  // Get user notifications (token automatically added by interceptor)
  static async getNotifications(): Promise<UserNotifications> {
    try {
      const response = await apiClient.get('/auth/notifications')
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to get notifications')
    }
  }

  // Update user notifications (token automatically added by interceptor)
  static async updateNotifications(notificationsData: Partial<UserNotifications>): Promise<UserNotifications> {
    try {
      const response = await apiClient.put('/auth/notifications', notificationsData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update notifications')
    }
  }

  // Get user integrations (token automatically added by interceptor)
  static async getIntegrations(): Promise<UserIntegrations> {
    try {
      const response = await apiClient.get('/auth/integrations')
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to get integrations')
    }
  }

  // Update user integrations (token automatically added by interceptor)
  static async updateIntegrations(integrationsData: Partial<UserIntegrations>): Promise<UserIntegrations> {
    try {
      const response = await apiClient.put('/auth/integrations', integrationsData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update integrations')
    }
  }

  // Get user privacy (token automatically added by interceptor)
  static async getPrivacy(): Promise<UserPrivacy> {
    try {
      const response = await apiClient.get('/auth/privacy')
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to get privacy settings')
    }
  }

  // Update user privacy (token automatically added by interceptor)
  static async updatePrivacy(privacyData: Partial<UserPrivacy>): Promise<UserPrivacy> {
    try {
      const response = await apiClient.put('/auth/privacy', privacyData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update privacy settings')
    }
  }

  // Get user shared access (token automatically added by interceptor)
  static async getSharedAccess(): Promise<UserSharedAccess> {
    try {
      const response = await apiClient.get('/auth/shared-access')
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to get shared access data')
    }
  }

  // Update user shared access (token automatically added by interceptor)
  static async updateSharedAccess(sharedAccessData: Partial<UserSharedAccess>): Promise<UserSharedAccess> {
    try {
      const response = await apiClient.put('/auth/shared-access', sharedAccessData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update shared access data')
    }
  }

  // Get user access logs (token automatically added by interceptor)
  static async getAccessLogs(): Promise<UserAccessLogs> {
    try {
      const response = await apiClient.get('/auth/access-logs')
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to get access logs')
    }
  }

  // Update user access logs (token automatically added by interceptor)
  static async updateAccessLogs(accessLogsData: Partial<UserAccessLogs>): Promise<UserAccessLogs> {
    try {
      const response = await apiClient.put('/auth/access-logs', accessLogsData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update access logs')
    }
  }

  // Get user data sharing (token automatically added by interceptor)
  static async getDataSharing(): Promise<UserDataSharing> {
    try {
      const response = await apiClient.get('/auth/data-sharing')
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to get data sharing preferences')
    }
  }

  // Update user data sharing (token automatically added by interceptor)
  static async updateDataSharing(dataSharingData: Partial<UserDataSharing>): Promise<UserDataSharing> {
    try {
      const response = await apiClient.put('/auth/data-sharing', dataSharingData)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update data sharing preferences')
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

  // Change password
  static async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to change password')
    }
  }

  // MFA Methods
  static async enrollMFA(friendlyName?: string): Promise<{ id: string, totp: any }> {
    try {
      const response = await apiClient.post('/auth/mfa/enroll', {
        friendly_name: friendlyName || 'My Authenticator App',
      })
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to enroll in MFA')
    }
  }

  static async verifyMFAEnrollment(factorId: string, code: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/mfa/verify', {
        factor_id: factorId,
        code: code,
      })
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to verify MFA')
    }
  }

  static async getMFAFactors(): Promise<Array<{id: string, type: string, friendly_name: string, status: string, created_at: string}>> {
    try {
      const response = await apiClient.get('/auth/mfa/factors')
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to get MFA factors')
    }
  }

  static async deleteMFAFactor(factorId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete(`/auth/mfa/factors/${factorId}`)
      return response.data
    } catch (error: any) {
      throw handleApiError(error, 'Failed to remove MFA factor')
    }
  }
}

