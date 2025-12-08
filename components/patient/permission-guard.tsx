"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState, store } from '@/lib/store'
import { useSwitchedPatient } from '@/contexts/patient-context'
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
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const isRestoringSession = useSelector((s: RootState) => s.auth.isRestoringSession)
  const user = useSelector((s: RootState) => s.auth.user)
  const { patientId, patientToken, isViewingOtherPatient } = useSwitchedPatient()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPermission = async () => {
      // Wait for authentication to be restored before checking permissions
      if (isRestoringSession) {
        setLoading(true)
        return
      }
      
      // If session restoration is complete and user is not authenticated, check once more with delay
      // This helps handle timing issues in production where session restoration might complete
      // slightly after isRestoringSession becomes false
      if (!isAuthenticated && !user) {
        // Add a small delay to allow session restoration to complete in production
        // Sometimes in production, session restoration completes but state hasn't updated yet
        const timeoutId = setTimeout(() => {
          const currentState = store.getState()
          const currentAuth = currentState.auth.isAuthenticated
          const currentUser = currentState.auth.user
          
          // Only redirect if still not authenticated after the delay
          if (!currentAuth && !currentUser) {
            console.log('No authentication found after session restoration, redirecting to login')
        router.push('/auth/login')
          }
        }, 1000) // Wait 1 second for session restoration to fully complete
        
        // Cleanup timeout if component unmounts or dependencies change
        return () => {
          clearTimeout(timeoutId)
        }
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
          const redirectUrl = `${accessiblePage}${patientToken ? `?patientToken=${encodeURIComponent(patientToken)}` : ''}`
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
  }, [patientId, patientToken, isViewingOtherPatient, requiredPermission, router, fallbackRoute, isAuthenticated, isRestoringSession, user])

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

