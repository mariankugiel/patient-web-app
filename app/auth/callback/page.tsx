"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/lib/store"
import { loginSuccess } from "@/lib/features/auth/authSlice"
import { AuthApiService } from "@/lib/api/auth-api"
import { toast } from "react-toastify"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        
        // Get the session from URL hash
        const { data: { session }, error } = await supabase.auth.getSession()
        
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

          toast.success("Successfully signed in!")
          
          // Redirect based on onboarding status
          const needsOnboarding = isNewUser || 
                                 (!userProfile.onboarding_completed && !userProfile.onboarding_skipped)
          
          if (needsOnboarding) {
            router.push('/onboarding')
          } else {
            router.push('/patient/dashboard')
          }
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
  }, [dispatch, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
