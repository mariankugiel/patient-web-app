// API Configuration
export const API_CONFIG = {
  // Backend API base URL - update this to match your backend deployment
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/v1/auth/register',
      LOGIN: '/api/v1/auth/login',
      PROFILE: '/api/v1/auth/profile',
    },
    USERS: {
      BASE: '/api/v1/users',
    },
    PATIENTS: {
      BASE: '/api/v1/patients',
    },
  },
}

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// API request headers
export const getApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

