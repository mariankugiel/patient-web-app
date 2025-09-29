import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'

// Flag to prevent multiple session expired notifications
let sessionExpiredNotificationShown = false

// Function to reset the session expired notification flag (call after successful login)
export const resetSessionExpiredFlag = () => {
  sessionExpiredNotificationShown = false
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1',
  timeout: 30000, // 30 seconds default timeout (increased for AI operations)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (fallback for SSR compatibility)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      // Check if it's an AI analysis request
      const isAIAnalysis = error.config?.url?.includes('/ai-analysis')
      if (isAIAnalysis) {
        toast.error("AI analysis is taking longer than expected. Please try again.")
      } else {
        toast.error("Connection failed. Please check your internet connection and try again.")
      }
      return Promise.reject(error)
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      toast.error("Unable to connect to server. Please check your internet connection.")
      return Promise.reject(error)
    }
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Don't redirect for auth-related endpoints (login, register, etc.)
      const isAuthEndpoint = error.config?.url?.includes('/login') || 
                             error.config?.url?.includes('/register') ||
                             error.config?.url?.includes('/auth/')
      
      if (!isAuthEndpoint) {
        // Clear localStorage and redirect to login only for non-auth endpoints
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('expires_in')
          
          // Only show session expired message if it's not a login attempt
          // Login attempts will show their own error messages
          if (!sessionExpiredNotificationShown) {
            sessionExpiredNotificationShown = true
            toast.error("Session expired. Please log in again.")
            
            // Reset the flag after a delay to allow for future session expirations
            setTimeout(() => {
              sessionExpiredNotificationShown = false
            }, 5000) // 5 seconds
          }
          
          window.location.href = '/'
        }
      }
      // For auth endpoints, let the error bubble up to be handled by the component
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
