"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { AuthAPI, AccessiblePatient, UserProfile } from '@/lib/api/auth-api'
import { usePatientContext } from '@/hooks/use-patient-context'

interface SwitchedPatientInfo {
  patient: AccessiblePatient | null
  profile: UserProfile | null
  permissions: AccessiblePatient['permissions'] | null
}

interface PatientContextValue {
  patientId: number | null
  patientToken: string | null
  isViewingOtherPatient: boolean
  switchedPatientInfo: SwitchedPatientInfo | null
  accessiblePatients: AccessiblePatient[]
  isLoading: boolean
  refreshAccessiblePatients: () => Promise<AccessiblePatient[] | null>
}

const PatientContext = createContext<PatientContextValue | undefined>(undefined)

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { patientToken, legacyPatientId } = usePatientContext()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const isRestoringSession = useSelector((s: RootState) => s.auth.isRestoringSession)
  const user = useSelector((s: RootState) => s.auth.user)
  const rawUserId = user?.id
  const parsedUserId =
    typeof rawUserId === 'number'
      ? rawUserId
      : rawUserId != null
        ? Number.parseInt(String(rawUserId), 10)
        : null
  const loggedInUserId = Number.isNaN(parsedUserId as number) ? null : parsedUserId
  
  const [accessiblePatients, setAccessiblePatients] = useState<AccessiblePatient[]>([])
  const [switchedPatientInfo, setSwitchedPatientInfo] = useState<SwitchedPatientInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activePatientId, setActivePatientId] = useState<number | null>(legacyPatientId ?? null)
  const [activePatientToken, setActivePatientToken] = useState<string | null>(patientToken ?? null)
  const fetchingPatientIdRef = useRef<number | null>(null)
  const fetchingPatientTokenRef = useRef<string | null>(null)
  const accessiblePatientsCacheRef = useRef<AccessiblePatient[] | null>(null)

  const isViewingOtherPatient = Boolean(
    activePatientToken || (legacyPatientId && legacyPatientId !== loggedInUserId)
  )

  // Sync active patient token with URL param
  useEffect(() => {
    setActivePatientToken(patientToken ?? null)
  }, [patientToken])

  // Sync active patient id when legacy patient ID is provided (fallback support)
  useEffect(() => {
    if (!patientToken) {
      setActivePatientId(legacyPatientId ?? null)
    }
  }, [legacyPatientId, patientToken])

  // Fetch accessible patients
  const refreshAccessiblePatients = async (): Promise<AccessiblePatient[] | null> => {
    if (!isAuthenticated || isRestoringSession || !user?.id) {
      return null
    }

    try {
      const response = await AuthAPI.getAccessiblePatients()
      const patients = response?.accessible_patients || []
      setAccessiblePatients(patients)
      accessiblePatientsCacheRef.current = patients
      return patients
    } catch (error: any) {
      const isConnectionError = error?.code === 'ECONNABORTED' || 
                                error?.code === 'ERR_NETWORK' ||
                                error?.code === 'ECONNRESET' ||
                                error?.code === 'ECONNREFUSED' ||
                                error?.message?.includes('Connection failed') ||
                                error?.message?.includes('timeout') ||
                                error?.message?.includes('connection closed')
      
      if (!isConnectionError) {
        console.error('Failed to load accessible patients:', error)
      }
      // Keep existing cache on connection error
      if (accessiblePatientsCacheRef.current) {
        setAccessiblePatients(accessiblePatientsCacheRef.current)
        return accessiblePatientsCacheRef.current
      }
      return null
    }
  }

  // Load accessible patients on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated && !isRestoringSession && user?.id) {
      // Use cache if available, otherwise fetch
      if (accessiblePatientsCacheRef.current) {
        setAccessiblePatients(accessiblePatientsCacheRef.current)
      } else {
        refreshAccessiblePatients()
      }
    } else {
      setAccessiblePatients([])
      accessiblePatientsCacheRef.current = null
    }
  }, [isAuthenticated, isRestoringSession, user?.id])

  // Resolve active patient ID when we have a token and accessible patients list
  useEffect(() => {
    if (!activePatientToken) {
      return
    }
    const match = accessiblePatients.find(
      (patient) => patient.patient_token && patient.patient_token === activePatientToken
    )
    if (match && match.patient_id !== activePatientId) {
      setActivePatientId(match.patient_id)
    } else if (!match && accessiblePatients.length > 0 && activePatientId !== null) {
      // Token was not found in the latest list; clear the active patient ID
      setActivePatientId(null)
    }
  }, [activePatientToken, accessiblePatients, activePatientId])

  // Auto-upgrade legacy URLs that still include patientId by replacing with patientToken
  useEffect(() => {
    if (patientToken || !legacyPatientId) {
      return
    }
    const match = accessiblePatients.find(
      (patient) => patient.patient_id === legacyPatientId && patient.patient_token
    )
    if (!match || !match.patient_token) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete('patientId')
    params.set('patientToken', match.patient_token)
    const queryString = params.toString()

    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [patientToken, legacyPatientId, accessiblePatients, router, pathname, searchParams])

  // Fetch switched patient's complete info (patient + profile from Supabase)
  useEffect(() => {
    if (!isAuthenticated || isRestoringSession || !user?.id) {
      setSwitchedPatientInfo(null)
      fetchingPatientIdRef.current = null
      fetchingPatientTokenRef.current = null
      return
    }

    if (!isViewingOtherPatient || !activePatientId) {
      setSwitchedPatientInfo(null)
      fetchingPatientIdRef.current = null
      fetchingPatientTokenRef.current = null
      return
    }

    const fetchSwitchedPatientInfo = async () => {
      const currentFetchPatientId = activePatientId
      const currentFetchPatientToken = activePatientToken ?? null
      
      // Immediately clear old info if patientId changed - this ensures UI shows "Loading..." immediately
      if (
        (fetchingPatientIdRef.current !== null && fetchingPatientIdRef.current !== currentFetchPatientId) ||
        (fetchingPatientTokenRef.current !== null && fetchingPatientTokenRef.current !== currentFetchPatientToken)
      ) {
        setSwitchedPatientInfo(null)
      }
      
      fetchingPatientIdRef.current = currentFetchPatientId
      fetchingPatientTokenRef.current = currentFetchPatientToken

      try {
        setIsLoading(true)

        // Always fetch accessible patients to ensure we have the latest list
        // But use cache if available for faster initial load
        let accessiblePatientsResponse: { accessible_patients: AccessiblePatient[] } | null = null
        
        // Try to get accessible patients (from cache or API)
        if (accessiblePatientsCacheRef.current && accessiblePatientsCacheRef.current.length > 0) {
          // Use cache immediately, but still fetch in background to update
          accessiblePatientsResponse = { accessible_patients: accessiblePatientsCacheRef.current }
          // Fetch in background to update cache
          AuthAPI.getAccessiblePatients().then(response => {
            accessiblePatientsCacheRef.current = response?.accessible_patients || []
            setAccessiblePatients(accessiblePatientsCacheRef.current)
          }).catch(() => {
            // Ignore errors - we already have cache
          })
        } else {
          // No cache, fetch from API
          try {
            const response = await AuthAPI.getAccessiblePatients()
            accessiblePatientsResponse = response
            accessiblePatientsCacheRef.current = response?.accessible_patients || []
            setAccessiblePatients(response?.accessible_patients || [])
          } catch (error: any) {
            const isConnectionError = error?.code === 'ECONNABORTED' || 
                                      error?.code === 'ERR_NETWORK' ||
                                      error?.code === 'ECONNRESET' ||
                                      error?.code === 'ECONNREFUSED' ||
                                      error?.message?.includes('Connection failed') ||
                                      error?.message?.includes('timeout') ||
                                      error?.message?.includes('connection closed')
            if (!isConnectionError) {
              console.error('Failed to fetch accessible patients:', error)
            }
          }
        }

        // Fetch profile - this is critical for displaying user info
        let profile: UserProfile | null = null
        try {
          profile = await AuthAPI.getPatientProfile(currentFetchPatientId)
        } catch (error: any) {
          const isConnectionError = error?.code === 'ECONNABORTED' || 
                                    error?.code === 'ERR_NETWORK' ||
                                    error?.code === 'ECONNRESET' ||
                                    error?.code === 'ECONNREFUSED' ||
                                    error?.message?.includes('Connection failed') ||
                                    error?.message?.includes('timeout') ||
                                    error?.message?.includes('connection closed')
          if (!isConnectionError) {
            console.error('Failed to fetch switched patient profile:', error)
          }
        }

        // Check if patientId changed during fetch
        if (
          fetchingPatientIdRef.current !== currentFetchPatientId ||
          fetchingPatientTokenRef.current !== currentFetchPatientToken
        ) {
          console.log('⚠️ PatientId changed during fetch, ignoring result')
          return
        }

        // Find the patient in accessible patients list
        const patients = accessiblePatientsResponse?.accessible_patients || []
        const patient = patients.find(p => p.patient_id === currentFetchPatientId)

        // Final check before setting state
        if (
          fetchingPatientIdRef.current !== currentFetchPatientId ||
          fetchingPatientTokenRef.current !== currentFetchPatientToken
        ) {
          console.log('⚠️ PatientId changed before setting state, ignoring result')
          return
        }

        // Set patient info - prioritize having complete data
        if (patient) {
          if (profile) {
            // Complete info available
            setSwitchedPatientInfo({
              patient,
              profile,
              permissions: patient.permissions
            })
            console.log('✅ Switched patient info loaded:', {
              name: profile.full_name || patient.patient_name,
              email: profile.email || patient.patient_email,
              permissions: Object.keys(patient.permissions).filter(k => patient.permissions[k as keyof typeof patient.permissions])
            })
          } else {
            // Have patient but not profile - set what we have, will retry profile
            setSwitchedPatientInfo({
              patient,
              profile: null,
              permissions: patient.permissions
            })
            console.log('⚠️ Switched patient loaded but profile pending:', patient.patient_name)
            
            // Retry fetching profile after a short delay
            setTimeout(async () => {
              if (
                fetchingPatientIdRef.current === currentFetchPatientId &&
                fetchingPatientTokenRef.current === currentFetchPatientToken
              ) {
                try {
                  const retryProfile = await AuthAPI.getPatientProfile(currentFetchPatientId)
                  if (
                    fetchingPatientIdRef.current === currentFetchPatientId &&
                    fetchingPatientTokenRef.current === currentFetchPatientToken &&
                    patient
                  ) {
                    setSwitchedPatientInfo({
                      patient,
                      profile: retryProfile,
                      permissions: patient.permissions
                    })
                    console.log('✅ Switched patient profile loaded on retry')
                  }
                } catch (error) {
                  // Ignore retry errors
                }
              }
            }, 1000)
          }
        } else {
          // Patient not found - might have lost access
          console.warn('⚠️ Patient not found in accessible patients list')
          setSwitchedPatientInfo(null)
        }
      } catch (error: any) {
        const isConnectionError = error?.code === 'ECONNABORTED' || 
                                  error?.code === 'ERR_NETWORK' ||
                                  error?.code === 'ECONNRESET' ||
                                  error?.code === 'ECONNREFUSED' ||
                                  error?.message?.includes('Connection failed') ||
                                  error?.message?.includes('timeout') ||
                                  error?.message?.includes('connection closed')
        
        if (!isConnectionError) {
          console.error('Failed to fetch switched patient info:', error)
          setSwitchedPatientInfo(null)
        }
        // On connection error, keep existing info if available (don't clear it)
      } finally {
        setIsLoading(false)
      }
    }

    // Small delay to debounce rapid switches, but ensure we fetch immediately
    const timeoutId = setTimeout(() => {
      fetchSwitchedPatientInfo()
    }, 50)

    return () => {
      clearTimeout(timeoutId)
    }
    }, [activePatientId, activePatientToken, isViewingOtherPatient, isAuthenticated, isRestoringSession, user?.id])

  const value: PatientContextValue = {
    patientId: activePatientId,
    patientToken: activePatientToken,
    isViewingOtherPatient,
    switchedPatientInfo,
    accessiblePatients,
    isLoading,
    refreshAccessiblePatients,
  }

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  )
}

export function useSwitchedPatient() {
  const context = useContext(PatientContext)
  if (context === undefined) {
    throw new Error('useSwitchedPatient must be used within a PatientProvider')
  }
  return context
}

