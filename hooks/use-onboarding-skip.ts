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
    if (isSkipping || !user) return
    
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
    } catch (error: any) {
      console.error('Failed to update profile in backend:', error)
      // Continue with local update even if backend fails
    }
    
    // Always update Redux store with the new user data (even if backend failed)
    dispatch(updateUser({
      user_metadata: {
        onboarding_completed: profileData.onboarding_completed,
        onboarding_skipped: profileData.onboarding_skipped,
        onboarding_skipped_at: profileData.onboarding_skipped_at,
        is_new_user: profileData.is_new_user
      }
    }))
    
    toast.success("Onboarding skipped successfully. You can complete it later from your profile.")
    
    // Redirect to dashboard
    router.push('/patient/dashboard')
    
    setIsSkipping(false)
  }

  return {
    skipOnboarding,
    isSkipping
  }
}
