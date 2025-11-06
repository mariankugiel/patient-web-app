"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { usePatientContext } from '@/hooks/use-patient-context'
import { AuthAPI } from '@/lib/api/auth-api'
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
  const searchParams = useSearchParams()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const isRestoringSession = useSelector((s: RootState) => s.auth.isRestoringSession)
  const { patientId, isViewingOtherPatient } = usePatientContext()

  useEffect(() => {
    // Wait for authentication to be restored before redirecting
    if (isRestoringSession || !isAuthenticated) {
      return
    }

    // If viewing another patient, redirect immediately to first accessible page
    if (isViewingOtherPatient && patientId) {
      const redirectToFirstAccessible = async () => {
        try {
          const response = await AuthAPI.getAccessiblePatients()
          const patient = response.accessible_patients?.find(p => p.patient_id === patientId)
          const accessiblePage = getFirstAccessiblePage(patient?.permissions || null, true)
          router.replace(`${accessiblePage}?patientId=${patientId}`)
        } catch (error: any) {
          // Silently handle connection errors - just redirect to fallback
          const isConnectionError = error?.code === 'ECONNABORTED' || 
                                    error?.code === 'ERR_NETWORK' ||
                                    error?.code === 'ECONNRESET' ||
                                    error?.code === 'ECONNREFUSED' ||
                                    error?.message?.includes('Connection failed') ||
                                    error?.message?.includes('timeout') ||
                                    error?.message?.includes('connection closed')
          
          if (!isConnectionError) {
            console.error('Failed to redirect from dashboard:', error)
          }
          
          // Fallback to health-records page if we can't determine accessible page
          router.replace(`/patient/health-records?patientId=${patientId}`)
        }
      }
      
      redirectToFirstAccessible()
    }
  }, [isViewingOtherPatient, patientId, router, isAuthenticated, isRestoringSession])

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

