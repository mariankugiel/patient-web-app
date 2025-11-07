"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store"
import { loginSuccess } from "@/lib/features/auth/authSlice"
import { AuthApiService } from "@/lib/api/auth-api"
import { toast } from "react-toastify"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Prevent duplicate processing (React Strict Mode in development)
    if (hasProcessed.current) {
      return
    }
    
    // If already authenticated, redirect immediately
    if (isAuthenticated) {
      router.push('/onboarding')
      return
    }

    // Set flag immediately to prevent duplicate execution
    hasProcessed.current = true

    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        
        // Check if we have tokens in the URL hash (magic link)
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          // Extract tokens from hash
          const urlParams = new URLSearchParams(hash.substring(1))
          const accessToken = urlParams.get('access_token')
          const refreshToken = urlParams.get('refresh_token')
          const expiresAt = urlParams.get('expires_at')
          const tokenType = urlParams.get('token_type') || 'bearer'
          
          if (accessToken && refreshToken) {
            // Store tokens in localStorage FIRST so axios interceptor can use them
            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', accessToken)
              localStorage.setItem('refresh_token', refreshToken)
              if (expiresAt) {
                localStorage.setItem('expires_in', expiresAt)
              }
            }
            
            // Set the session explicitly from URL hash tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (sessionError) {
              console.error('Failed to set session from URL hash:', sessionError)
              toast.error("Authentication failed. Please try again.")
              router.push('/')
              return
            }
            
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
          }
        }
        
        // Get the session (either from URL hash or already set)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Ensure tokens are in localStorage (in case session was already set)
        if (session?.access_token && typeof window !== 'undefined') {
          localStorage.setItem('access_token', session.access_token)
          if (session.refresh_token) {
            localStorage.setItem('refresh_token', session.refresh_token)
          }
          if (session.expires_in) {
            localStorage.setItem('expires_in', session.expires_in.toString())
          }
        }
        
        if (error) {
          console.error('Auth callback error:', error)
          toast.error("Authentication failed. Please try again.")
          router.push('/')
          return
        }

        if (session?.user) {
          // Extract user data from Supabase session
          const { user } = session
          
          // Get user profile from backend
          let userProfile
          let isNewUser = false
          
          try {
            // Try to get profile from backend using Supabase token
            userProfile = await AuthApiService.getProfile()
            console.log('Existing user profile found:', userProfile)
            isNewUser = false
          } catch (error) {
            console.log('Backend profile not found, creating new user profile')
            isNewUser = true
            
            // If backend profile doesn't exist, create one with Supabase data
            userProfile = {
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              is_new_user: true,
              onboarding_completed: false,
              onboarding_skipped: false,
            }
            
            // Try to create the profile in backend
            try {
              await AuthApiService.createOAuthUserProfile({
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar_url: user.user_metadata?.avatar_url,
                provider: 'google'
              })
              console.log('OAuth user profile created successfully')
            } catch (profileError) {
              console.warn('Failed to create OAuth user profile:', profileError)
              // Continue with local profile data
            }
          }

          // Create user object for Redux store
          const userData = {
            id: user.id,
            email: user.email || '',
            user_metadata: {
              ...userProfile,
              is_new_user: isNewUser,
            },
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: session.expires_in,
            is_active: true,
            created_at: user.created_at,
          }

          // Update Redux store
          dispatch(loginSuccess(userData))
          
          // Store tokens in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', session.access_token)
            if (session.refresh_token) {
              localStorage.setItem('refresh_token', session.refresh_token)
            }
            if (session.expires_in) {
              localStorage.setItem('expires_in', session.expires_in.toString())
            }
          }

          // Show success toast (hasProcessed ref ensures this only runs once)
          toast.success("Successfully signed in!")
          
          // DEVELOPMENT: Always redirect to onboarding page
          router.push('/onboarding')
          
          // Redirect based on onboarding status (COMMENTED OUT FOR DEVELOPMENT)
          // const needsOnboarding = isNewUser || 
          //                        (!userProfile.onboarding_completed && !userProfile.onboarding_skipped)
          // 
          // if (needsOnboarding) {
          //   router.push('/onboarding')
          // } else {
          //   router.push('/patient/dashboard')
          // }
        } else {
          toast.error("Authentication failed. Please try again.")
          router.push('/')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error("Authentication failed. Please try again.")
        router.push('/')
      }
    }

    handleAuthCallback()
  }, [dispatch, router, isAuthenticated])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
