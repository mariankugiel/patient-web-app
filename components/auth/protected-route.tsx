"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/patient/dashboard' 
}: ProtectedRouteProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading, isRestoringSession } = useSelector((state: RootState) => state.auth)
  
  // Check if viewing another patient (patientId in URL)
  const patientId = searchParams.get('patientId')
  const isViewingOtherPatient = !!patientId

  useEffect(() => {
    if (!isLoading && !isRestoringSession) {
      if (requireAuth && !isAuthenticated) {
        // User not authenticated, redirect to login page
        router.push('/auth/login')
      } else if (isAuthenticated && user && !isViewingOtherPatient) {
        // Only check onboarding for the current user, not when viewing another patient
        // When viewing another patient, they are treated as already registered
        // DEVELOPMENT: Always allow access to onboarding (commented out redirect logic)
        // Check if user needs onboarding (has is_new_user flag or hasn't completed/skipped onboarding)
        // const needsOnboarding = user.user_metadata?.is_new_user || 
        //                        (!user.user_metadata?.onboarding_completed && !user.user_metadata?.onboarding_skipped)

        // if (needsOnboarding && redirectTo !== '/onboarding') {
        //   // Redirect users who need onboarding to onboarding
        //   router.push('/onboarding')
        // } else if (!needsOnboarding && redirectTo === '/onboarding') {
        //   // Redirect users who don't need onboarding away from onboarding
        //   router.push('/patient/dashboard')
        // }
      }
    }
  }, [isAuthenticated, user, isLoading, isRestoringSession, router, requireAuth, redirectTo, isViewingOtherPatient])

  if (isLoading || isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }

  return <>{children}</>
}
