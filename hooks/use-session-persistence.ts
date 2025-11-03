import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { loginSuccess, sessionRestorationStart, sessionRestorationComplete } from '@/lib/features/auth/authSlice'
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
          const userProfile = await AuthApiService.getProfile()
          
          // Use the onboarding status directly from the backend profile
          // Don't override the backend values with our own logic
          const isNewUser = userProfile.is_new_user !== undefined ? userProfile.is_new_user : 
                           (!userProfile.onboarding_completed && !userProfile.onboarding_skipped)
          
          // Restore user session
          const restoredUser = {
            id: storedToken,
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
        } catch (error) {
          console.error('Failed to restore session:', error)
          // Clear invalid tokens
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('expires_in')
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

