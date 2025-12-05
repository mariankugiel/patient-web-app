import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { loginSuccess, sessionRestorationStart, sessionRestorationComplete, fetchProfileSuccess } from '@/lib/features/auth/authSlice'
import { AuthApiService } from '@/lib/api/auth-api'
import { createClient } from '@/lib/supabase-client'

export function useSessionPersistence() {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const restoreSession = async () => {
      // Check if we have a stored access token
      const storedToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      
      // Always restore Supabase session if we have tokens (needed for MFA)
      if (storedToken && refreshToken) {
        try {
          const supabase = createClient()
          // Check if session already exists
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            // Only set session if it doesn't exist
            const sessionResult = await supabase.auth.setSession({
              access_token: storedToken,
              refresh_token: refreshToken,
            })
            if (sessionResult.error) {
              console.warn('Failed to restore Supabase session:', sessionResult.error)
            } else {
              console.log('Successfully restored Supabase session')
            }
          }
        } catch (supabaseError) {
          console.warn('Failed to restore Supabase session (exception):', supabaseError)
        }
      }
      
      if (storedToken && !isAuthenticated) {
        dispatch(sessionRestorationStart())
        try {
          // Verify the token is still valid by fetching user profile
          let userProfile
          try {
            userProfile = await AuthApiService.getProfile()
          } catch (profileError: any) {
            // Check if this is a connection error (backend unavailable)
            const isConnectionError = profileError?.code === 'ECONNABORTED' || 
                                      profileError?.code === 'ERR_NETWORK' ||
                                      profileError?.code === 'ECONNRESET' ||
                                      profileError?.code === 'ECONNREFUSED' ||
                                      profileError?.message?.includes('Connection failed') ||
                                      profileError?.message?.includes('timeout') ||
                                      profileError?.message?.includes('connection closed')
            
            // Check if this is an auth error (401, 403) - token is invalid
            const isAuthError = profileError?.response?.status === 401 || 
                               profileError?.response?.status === 403
            
            if (isConnectionError) {
              // Backend is unavailable - restore session with minimal data from token
              // Don't clear tokens, just use minimal profile
              // Silently handle - backend unavailable, will sync when connection restored
              
              // Try to get email from Supabase session if available
              let email = ''
              try {
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                email = session?.user?.email || ''
              } catch (e) {
                // Ignore Supabase errors
              }
              
              userProfile = {
                email: email,
                is_new_user: false,
                onboarding_completed: false,
                onboarding_skipped: false,
              }
            } else if (isAuthError) {
              // Token is invalid - clear tokens and fail
              console.error('Invalid token during session restoration:', profileError)
              localStorage.removeItem('access_token')
              localStorage.removeItem('refresh_token')
              localStorage.removeItem('expires_in')
              dispatch(sessionRestorationComplete())
              return
            } else {
              // Unknown error - rethrow
              throw profileError
            }
          }
          
          // Use the onboarding status directly from the backend profile
          // Don't override the backend values with our own logic
          const isNewUser = userProfile.is_new_user !== undefined ? userProfile.is_new_user : 
                           (!userProfile.onboarding_completed && !userProfile.onboarding_skipped)
          
          // Try to get user ID from Supabase session if available
          let userId = storedToken
          try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            userId = session?.user?.id || storedToken
          } catch (e) {
            // Ignore Supabase errors, use stored token as ID
          }
          
          // Restore user session
          const restoredUser = {
            id: userId,
            email: userProfile.email || '', // Get email from profile or use stored value
            user_metadata: {
              ...userProfile,
              is_new_user: isNewUser,
              // Keep the original onboarding_completed and onboarding_skipped values from backend
            },
            access_token: storedToken,
            refresh_token: refreshToken || '',
            expires_in: parseInt(localStorage.getItem('expires_in') || '0'),
          }
          
          dispatch(loginSuccess(restoredUser))
          // Also store profile in Redux
          dispatch(fetchProfileSuccess(userProfile))
        } catch (error: any) {
          // Only log non-connection errors
          const isConnectionError = error?.code === 'ECONNABORTED' || 
                                    error?.code === 'ERR_NETWORK' ||
                                    error?.code === 'ECONNRESET' ||
                                    error?.code === 'ECONNREFUSED' ||
                                    error?.message?.includes('Connection failed') ||
                                    error?.message?.includes('timeout') ||
                                    error?.message?.includes('connection closed')
          
          if (!isConnectionError) {
            console.error('Failed to restore session:', error)
          }
          
          // Only clear tokens if it's an auth error, not a connection error
          const isAuthError = error?.response?.status === 401 || 
                             error?.response?.status === 403
          
          if (isAuthError) {
            // Clear invalid tokens
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('expires_in')
          }
        } finally {
          dispatch(sessionRestorationComplete())
        }
      } else {
        // No token found, session restoration complete
        dispatch(sessionRestorationComplete())
      }
    }

    restoreSession()
  }, [dispatch, isAuthenticated])

  // Store tokens when user logs in
  useEffect(() => {
    if (user && user.access_token) {
      localStorage.setItem('access_token', user.access_token)
      if (user.refresh_token) {
        localStorage.setItem('refresh_token', user.refresh_token)
      }
      if (user.expires_in) {
        localStorage.setItem('expires_in', user.expires_in.toString())
      }
    }
  }, [user])

  return { user, isAuthenticated }
}

