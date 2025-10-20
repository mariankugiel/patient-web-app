import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

export function useOnboardingAuth() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, isRestoringSession } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Only redirect if we're not loading and not restoring session
    if (!isLoading && !isRestoringSession) {
      if (!isAuthenticated || !user) {
        console.log('No valid authentication found, redirecting to login')
        router.push('/auth/login')
      }
    }
  }, [isAuthenticated, user, isLoading, isRestoringSession, router])

  // Return authentication state and loading status
  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isRestoringSession,
    isReady: !isLoading && !isRestoringSession && isAuthenticated && !!user
  }
}
