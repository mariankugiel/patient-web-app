import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

export function useAuthRedirect() {
  const router = useRouter()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user needs to complete onboarding
      const needsOnboarding = user.user_metadata?.is_new_user || 
                             (!user.user_metadata?.onboarding_completed && !user.user_metadata?.onboarding_skipped)

      if (needsOnboarding) {
        // Redirect users who haven't completed or skipped onboarding
        router.push('/onboarding')
      } else {
        // Redirect users who have completed or skipped onboarding to dashboard
        router.push('/patient/dashboard')
      }
    }
  }, [isAuthenticated, user, router])

  return { user, isAuthenticated }
}
