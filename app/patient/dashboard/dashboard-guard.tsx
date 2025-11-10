"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useSwitchedPatient } from '@/contexts/patient-context'
import { getFirstAccessiblePage } from '@/lib/utils/patient-navigation'

interface DashboardGuardProps {
  children: React.ReactNode
}

/**
 * DashboardGuard: Prevents access to dashboard when viewing another patient
 * Dashboard is only accessible when viewing your own data
 */
export function DashboardGuard({ children }: DashboardGuardProps) {
  const router = useRouter()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const isRestoringSession = useSelector((s: RootState) => s.auth.isRestoringSession)
  const { patientToken, isViewingOtherPatient, switchedPatientInfo } = useSwitchedPatient()

  useEffect(() => {
    // Wait for authentication to be restored before redirecting
    if (isRestoringSession || !isAuthenticated) {
      return
    }

    // If viewing another patient, redirect immediately to first accessible page
    if (isViewingOtherPatient && patientToken) {
      // Use permissions from switched patient info if available
      const permissions = switchedPatientInfo?.permissions || null
      const accessiblePage = getFirstAccessiblePage(permissions, true)
      router.replace(`${accessiblePage}?patientToken=${encodeURIComponent(patientToken)}`)
    }
  }, [isViewingOtherPatient, patientToken, router, isAuthenticated, isRestoringSession, switchedPatientInfo])

  // If viewing another patient, don't render dashboard (will redirect)
  if (isViewingOtherPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Redirecting...</span>
        </div>
      </div>
    )
  }

  // Only show dashboard when viewing own data
  return <>{children}</>
}

