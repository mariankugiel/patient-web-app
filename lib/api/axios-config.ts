import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'
import { createClient } from '@/lib/supabase-client'
import { recordConnectionSuccess, recordConnectionFailure } from '@/lib/connection-monitor'

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
  timeout: 120000, // 2 minutes default timeout (increased for AI operations and long-running requests)
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
    // Log all requests to /messages endpoints
    if (config.url?.includes('/messages') || config.url?.includes('/conversations')) {
      console.log('🌐 ========== [AXIOS REQUEST INTERCEPTOR] ==========')
      console.log('🌐 Request URL:', config.url)
      console.log('🌐 Request method:', config.method?.toUpperCase())
      console.log('🌐 Request params:', config.params)
      console.log('🌐 Full config URL:', config.baseURL + config.url)
      console.log('🌐 ================================================')
    }
    
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
            
            // First check if we have a valid Supabase session
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
            
            // Only try to refresh via Supabase if we have a valid Supabase session with matching refresh token
            // If tokens are from backend API (not Supabase), skip Supabase refresh
            if (currentSession && currentSession.refresh_token && currentSession.refresh_token === refreshToken) {
              // Verify this is a Supabase token by checking if refresh works
              // Try to refresh the Supabase session manually (auto-refresh is disabled)
              try {
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
                  console.log('✅ Token refreshed via Supabase')
                } else if (refreshError) {
                  // Supabase refresh failed - tokens are likely from backend API
                  // Don't log as error - this is expected for backend tokens
                  // The response interceptor will handle 401 errors
                }
              } catch (refreshException: any) {
                // Catch any errors during refresh attempt (like 400 errors)
                // This is expected when using backend tokens, so don't log as error
                const is400Error = refreshException?.status === 400 || 
                                   refreshException?.code === 400 ||
                                   refreshException?.message?.includes('400')
                if (!is400Error) {
                  console.warn('Supabase refresh error:', refreshException?.message || refreshException)
                }
              }
            } else {
              // No valid Supabase session or refresh tokens don't match - tokens are from backend API
              // Don't try to refresh via Supabase, let backend handle it via 401 response
              // The response interceptor will handle 401 errors and redirect to login if needed
            }
          } catch (error: any) {
            // Silently handle Supabase refresh errors - these are expected if using backend tokens
            const isRefreshError = error?.message?.includes('refresh_token') || 
                                  error?.message?.includes('400') ||
                                  error?.status === 400 ||
                                  error?.code === 400
            if (!isRefreshError) {
              console.error('Token refresh error in interceptor:', error)
            }
            // Continue with the existing token - the response interceptor will handle 401 errors
          }
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        
        // Log auth token info for messages endpoints
        if (config.url?.includes('/messages') || config.url?.includes('/conversations')) {
          console.log('🌐 [AXIOS REQUEST] Token added:', token ? 'Yes (length: ' + token.length + ')' : 'No token')
        }
      }
    }
    
    if (config.url?.includes('/messages') || config.url?.includes('/conversations')) {
      console.log('🌐 [AXIOS REQUEST] Final config headers:', {
        Authorization: config.headers.Authorization ? 'Present' : 'Missing',
        'Content-Type': config.headers['Content-Type']
      })
      console.log('🌐 [AXIOS REQUEST] About to send request to:', config.baseURL + config.url)
    }

    return config
  },
  (error) => {
    console.error('🌐 [AXIOS REQUEST INTERCEPTOR] Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log responses to /messages endpoints
    if (response.config.url?.includes('/messages') || response.config.url?.includes('/conversations')) {
      console.log('✅ [AXIOS RESPONSE] Success:', {
        status: response.status,
        url: response.config.url,
        dataKeys: Object.keys(response.data || {}),
        conversationsCount: response.data?.conversations?.length || 0
      })
    }
    
    // Record successful connection
    recordConnectionSuccess()
    return response
  },
  (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      // Record connection failure for timeout errors (but not for long-running operations)
      const isAIAnalysis = error.config?.url?.includes('/ai-analysis')
      const isOCRProcessing = error.config?.url?.includes('/health-record-doc-lab/upload') && 
                             error.config?.data?.get?.('use_ocr') === 'true'
      
      // Don't record timeout failures for long-running operations (these are expected)
      if (!isAIAnalysis && !isOCRProcessing) {
        recordConnectionFailure()
      }
      
      // Check if we're currently switching users (suppress errors during switching)
      const isUserSwitching = (window as any).__isUserSwitching === true
      
      // Don't show timeout errors during user switching - these are expected
      if (!isUserSwitching) {
        if (isAIAnalysis) {
          toast.error("AI analysis is taking longer than expected. Please try again.")
        } else if (isOCRProcessing) {
          toast.error("OCR processing is taking longer than expected. The file may be too large or complex. Please try again.")
        } else {
          toast.error("Connection failed. Please check your internet connection and try again.")
        }
      }
      return Promise.reject(error)
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('connection closed') || error.message?.includes('Connection closed') ||
        error.message?.includes('socket hang up') || error.message?.includes('ECONNRESET') ||
        error.message?.includes('Connection failed') || error.message?.includes('timeout')) {
      
      // Record connection failure
      recordConnectionFailure()
      
      // Only show toast for non-auth endpoints and non-profile endpoints to avoid spam during login/session restore
      const isAuthEndpoint = error.config?.url?.includes('/login') || 
                             error.config?.url?.includes('/register') ||
                             error.config?.url?.includes('/auth/login') ||
                             error.config?.url?.includes('/auth/register')
      
      const isProfileEndpoint = error.config?.url?.includes('/auth/profile') ||
                                error.config?.url?.includes('/auth/accessible-patients') ||
                                error.config?.url?.includes('/auth/patient-profile')
      
      // Check if we're currently switching users (suppress all errors during switching)
      const isUserSwitching = (window as any).__isUserSwitching === true
      
      // Don't show toast for auth endpoints, profile endpoints, or during user switching
      // These are handled gracefully by the components
      if (!isAuthEndpoint && !isProfileEndpoint && !isUserSwitching) {
        // Only show toast if we haven't shown one recently (prevent spam)
        const lastErrorTime = (window as any).__lastConnectionErrorTime || 0
        const now = Date.now()
        if (now - lastErrorTime > 5000) { // Only show once every 5 seconds
          (window as any).__lastConnectionErrorTime = now
          toast.error("Unable to connect to server. Please check your internet connection.")
        }
      }
      return Promise.reject(error)
    }
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Don't redirect for auth-related endpoints (login, register, etc.)
      const isAuthEndpoint = error.config?.url?.includes('/login') || 
                             error.config?.url?.includes('/register') ||
                             error.config?.url?.includes('/auth/')
      
      const detail = error.response?.data?.detail
      const normalizedDetail = typeof detail === 'string' ? detail.toLowerCase() : ''
      const shouldForceLogout =
        normalizedDetail.includes('invalid token') ||
        normalizedDetail.includes('token missing') ||
        normalizedDetail.includes('invalid authorization header format') ||
        normalizedDetail.includes('authentication failed') ||
        normalizedDetail.includes('session expired') ||
        normalizedDetail.includes('token expired')
      
      if (!isAuthEndpoint && shouldForceLogout) {
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
