import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'
import { createClient } from '@/lib/supabase-client'

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

// Helper function to check if token is expired or about to expire (within 1 minute)
const isTokenExpiredOrExpiringSoon = (token: string): boolean => {
  try {
    // Decode JWT without verification (we just need the expiration time)
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp
    if (!exp) return true // No expiration means we should refresh
    
    // Check if token expires within the next 1 minute (60 seconds)
    const currentTime = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = exp - currentTime
    
    // Refresh if expired or expires within 60 seconds
    return timeUntilExpiry <= 60
  } catch (error) {
    // If we can't decode the token, assume it's invalid
    return true
  }
}

// Request interceptor to add auth token and refresh if needed
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (fallback for SSR compatibility)
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      
      // Check if token is expired or about to expire
      if (token && isTokenExpiredOrExpiringSoon(token)) {
        // Token is expired or expiring soon, try to refresh it
        if (refreshToken) {
          try {
            const supabase = createClient()
            
            // First, try to set the session with the current tokens to ensure Supabase knows about them
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: refreshToken
            })
            
            if (!sessionError && sessionData?.session) {
              // Update tokens in localStorage
              token = sessionData.session.access_token
              localStorage.setItem('access_token', token)
              if (sessionData.session.refresh_token) {
                localStorage.setItem('refresh_token', sessionData.session.refresh_token)
              }
              if (sessionData.session.expires_in) {
                localStorage.setItem('expires_in', sessionData.session.expires_in.toString())
              }
              console.log('✅ Token refreshed successfully via setSession')
            } else {
              // If setSession didn't work, try refreshSession
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
              
              if (!refreshError && refreshData?.session) {
                // Update tokens in localStorage
                token = refreshData.session.access_token
                localStorage.setItem('access_token', token)
                if (refreshData.session.refresh_token) {
                  localStorage.setItem('refresh_token', refreshData.session.refresh_token)
                }
                if (refreshData.session.expires_in) {
                  localStorage.setItem('expires_in', refreshData.session.expires_in.toString())
                }
                console.log('✅ Token refreshed successfully via refreshSession')
              } else {
                console.warn('⚠️ Token refresh failed:', refreshError || sessionError)
                // Continue with the existing token - the response interceptor will handle 401
              }
            }
          } catch (error) {
            console.error('❌ Token refresh error in interceptor:', error)
            // Continue with the expired token - the response interceptor will handle it
          }
        } else {
          console.warn('⚠️ No refresh token available, cannot refresh access token')
        }
      }
      
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
