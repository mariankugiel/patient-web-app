import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { updateUser } from '@/lib/features/auth/authSlice'
import { AuthApiService } from '@/lib/api/auth-api'
import { toast } from 'react-toastify'

export function useOnboardingSkip() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [isSkipping, setIsSkipping] = useState(false)

  const skipOnboarding = async () => {
    if (isSkipping) return
    
    if (!user) {
      toast.error("User not authenticated. Please log in again.")
      router.push('/')
      return
    }
    
    setIsSkipping(true)
    
    // Update user profile to mark onboarding as skipped
    const profileData = {
      onboarding_completed: false,
      onboarding_skipped: true,
      onboarding_skipped_at: new Date().toISOString(),
      is_new_user: false
    }
    
    try {
      // Try to update the backend first
      await AuthApiService.updateProfile(profileData)
      
      // Update Redux store with the new user data
      dispatch(updateUser({
        user_metadata: {
          ...user.user_metadata,
          onboarding_completed: profileData.onboarding_completed,
          onboarding_skipped: profileData.onboarding_skipped,
          onboarding_skipped_at: profileData.onboarding_skipped_at,
          is_new_user: profileData.is_new_user
        }
      }))
      
      toast.success("Onboarding skipped successfully. You can complete it later from your profile.")
      
      // DEVELOPMENT: Always redirect to onboarding page instead of dashboard
      router.push('/onboarding')
      
      // Redirect to dashboard (COMMENTED OUT FOR DEVELOPMENT)
      // router.push('/patient/dashboard')
    } catch (error: any) {
      console.error('Failed to update profile in backend:', error)
      toast.error("Failed to skip onboarding. Please try again.")
    } finally {
      setIsSkipping(false)
    }
  }

  return {
    skipOnboarding,
    isSkipping
  }
}
