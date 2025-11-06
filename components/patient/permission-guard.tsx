"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { usePatientContext } from '@/hooks/use-patient-context'
import { AuthAPI, AccessiblePatient } from '@/lib/api/auth-api'
import { getFirstAccessiblePage } from '@/lib/utils/patient-navigation'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredPermission: keyof AccessiblePatient['permissions']
  fallbackRoute?: string
}

export function PermissionGuard({ 
  children, 
  requiredPermission,
  fallbackRoute
}: PermissionGuardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const isRestoringSession = useSelector((s: RootState) => s.auth.isRestoringSession)
  const { patientId, isViewingOtherPatient } = usePatientContext()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPermission = async () => {
      // Wait for authentication to be restored before checking permissions
      if (isRestoringSession || !isAuthenticated) {
        setLoading(true)
        return
      }

      // If not viewing another patient, allow access (viewing own data)
      if (!isViewingOtherPatient || !patientId) {
        setHasPermission(true)
        setLoading(false)
        return
      }

      try {
        const response = await AuthAPI.getAccessiblePatients()
        const patient = response.accessible_patients?.find(p => p.patient_id === patientId)
        
        if (patient && patient.permissions[requiredPermission]) {
          setHasPermission(true)
        } else {
          setHasPermission(false)
          // Get the first accessible page instead of defaulting to dashboard
          const accessiblePage = fallbackRoute || getFirstAccessiblePage(patient?.permissions || null, isViewingOtherPatient)
          const redirectUrl = `${accessiblePage}${patientId ? `?patientId=${patientId}` : ''}`
          router.push(redirectUrl)
        }
      } catch (error: any) {
        // Check if it's a connection error
        const isConnectionError = error?.code === 'ECONNABORTED' || 
                                  error?.code === 'ERR_NETWORK' ||
                                  error?.code === 'ECONNRESET' ||
                                  error?.code === 'ECONNREFUSED' ||
                                  error?.message?.includes('Connection failed') ||
                                  error?.message?.includes('timeout') ||
                                  error?.message?.includes('connection closed') ||
                                  error?.message?.includes('Connection closed') ||
                                  error?.message?.includes('socket hang up') ||
                                  error?.message?.includes('Unable to connect to server')
        
        if (isConnectionError) {
          // On connection error, allow access (backend unavailable)
          // Silently fail - backend is down, allow user to continue
          setHasPermission(true)
        } else {
          // On other errors, still allow access to avoid blocking user
          // Only log non-connection errors
          const shouldLog = !error?.message?.includes('Connection') && 
                           !error?.message?.includes('timeout') &&
                           !error?.message?.includes('network')
          if (shouldLog) {
            console.error('Failed to check permission:', error)
          }
          setHasPermission(true)
        }
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [patientId, isViewingOtherPatient, requiredPermission, router, fallbackRoute, isAuthenticated, isRestoringSession])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (hasPermission === false) {
    return null // Will redirect
  }

  return <>{children}</>
}

