import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'

// Flag to prevent multiple session expired notifications
let sessionExpiredNotificationShown = false

// Router callback for client-side navigation (set by useAuthRedirect hook)
let routerPushCallback: ((path: string) => void) | null = null

// Logout callback to clear Redux state
let logoutCallback: (() => void) | null = null

export const setRouterCallback = (callback: (path: string) => void) => {
  routerPushCallback = callback
}

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback
}

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
      const isOCRProcessing = error.config?.url?.includes('/health-record-doc-lab/upload') && 
                             error.config?.data?.get?.('use_ocr') === 'true'
      
      if (isAIAnalysis) {
        toast.error("AI analysis is taking longer than expected. Please try again.")
      } else if (isOCRProcessing) {
        toast.error("OCR processing is taking longer than expected. The file may be too large or complex. Please try again.")
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
        // Clear localStorage and Redux state, then redirect to login
        if (typeof window !== 'undefined') {
          // Clear localStorage tokens
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('expires_in')
          
          // Clear Redux state via logout callback
          if (logoutCallback) {
            logoutCallback()
          }
          
          // Only show session expired message once
          if (!sessionExpiredNotificationShown) {
            sessionExpiredNotificationShown = true
            toast.error("Session expired. Please log in again.")
            
            // Reset the flag after a delay to allow for future session expirations
            setTimeout(() => {
              sessionExpiredNotificationShown = false
            }, 5000) // 5 seconds
          }
          
          // Use router callback for faster navigation, fallback to window.location
          // Redirect to login page, not homepage
          if (routerPushCallback) {
            routerPushCallback('/auth/login')
          } else {
            window.location.href = '/auth/login'
          }
        }
      }
      // For auth endpoints, let the error bubble up to be handled by the component
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
