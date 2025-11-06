"use client"

import type React from "react"
import { useSelector } from "react-redux"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef, Suspense } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PatientSidebar from "@/components/patient/sidebar"
import { LanguageProvider, useLanguage } from "@/contexts/language-context"
import { WebSocketProvider } from "@/contexts/websocket-context"
import { type RootState } from "@/lib/store"
import { AuthAPI, AccessiblePatient } from "@/lib/api/auth-api"
import { usePatientContext } from "@/hooks/use-patient-context"
import { Users } from "lucide-react"

function PatientLayoutContent({ children }: { children: React.ReactNode }) {
  
  const user = useSelector((s: RootState) => s.auth.user)
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const isRestoringSession = useSelector((s: RootState) => s.auth.isRestoringSession)
  const { t, setLanguage } = useLanguage()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { patientId, isViewingOtherPatient } = usePatientContext()
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [viewingPatient, setViewingPatient] = useState<AccessiblePatient | null>(null)
  const [viewingPatientProfile, setViewingPatientProfile] = useState<any>(null)
  const fetchingPatientIdRef = useRef<number | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const accessiblePatientsCacheRef = useRef<AccessiblePatient[] | null>(null)

  // Fetch the viewing patient's information when patientId is in URL
  useEffect(() => {
    // Clear any pending fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    const fetchViewingPatient = async () => {
      // Don't make API calls if:
      // 1. User is not authenticated
      // 2. Session is still being restored
      // 3. No patientId in URL
      if (!isAuthenticated || isRestoringSession || !user || !user.id) {
        return
      }
      
      if (!patientId) {
        setViewingPatient(null)
        setViewingPatientProfile(null)
        fetchingPatientIdRef.current = null
        return
      }
      
      // If patientId changed, clear old state immediately to prevent showing wrong patient's info
      // This ensures the header shows "Loading..." instead of the old patient's info
      if (viewingPatient && viewingPatient.patient_id !== patientId) {
        setViewingPatient(null)
        setViewingPatientProfile(null)
        setAvatarUrl("") // Clear avatar too
      }
      
      // Track which patientId we're currently fetching to prevent race conditions
      const currentFetchPatientId = patientId
      fetchingPatientIdRef.current = patientId
      
      // First, try to use cached accessible patients if available
      let patient = accessiblePatientsCacheRef.current?.find(p => p.patient_id === currentFetchPatientId)
      
      // If patient found in cache, use it immediately
      if (patient) {
        setViewingPatient(patient)
        // Still try to fetch profile, but don't block on it
        try {
          const profile = await AuthAPI.getPatientProfile(currentFetchPatientId)
          if (fetchingPatientIdRef.current === currentFetchPatientId) {
            setViewingPatientProfile(profile)
            if (profile.theme) {
              if (profile.theme === 'dark') {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            }
            if (profile.language) {
              setLanguage(profile.language as "en" | "es" | "pt")
            }
          }
        } catch (error: any) {
          // Silently fail - we already have patient data from cache
          const isConnectionError = error?.code === 'ECONNABORTED' || 
                                    error?.code === 'ERR_NETWORK' ||
                                    error?.code === 'ECONNRESET' ||
                                    error?.code === 'ECONNREFUSED' ||
                                    error?.message?.includes('Connection failed') ||
                                    error?.message?.includes('timeout') ||
                                    error?.message?.includes('connection closed')
          if (!isConnectionError) {
            console.error('Failed to fetch viewing patient profile:', error)
          }
        }
        return
      }
      
      // If not in cache, fetch from API
      try {
        // Get from accessible patients list
        const response = await AuthAPI.getAccessiblePatients()
        
        // Update cache
        accessiblePatientsCacheRef.current = response.accessible_patients || []
        
        // Check if patientId changed during the async call
        if (fetchingPatientIdRef.current !== currentFetchPatientId) {
          console.log('⚠️ PatientId changed during fetch, ignoring old result')
          return
        }
        
        patient = response.accessible_patients?.find(p => p.patient_id === currentFetchPatientId)
        
        if (patient) {
          // Final check before setting state
          if (fetchingPatientIdRef.current !== currentFetchPatientId) {
            console.log('⚠️ PatientId changed before setting patient, ignoring result')
            return
          }
          
          // Always update to ensure we have the latest data for the current patientId
          setViewingPatient(patient)
          
          // Fetch full profile for theme/language preferences
          try {
            const profile = await AuthAPI.getPatientProfile(currentFetchPatientId)
            // Final check before setting profile
            if (fetchingPatientIdRef.current === currentFetchPatientId) {
              setViewingPatientProfile(profile)
              
              // Apply viewing patient's theme and language preferences
              if (profile.theme) {
                // Apply theme (dark mode)
                if (profile.theme === 'dark') {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              }
              if (profile.language) {
                setLanguage(profile.language as "en" | "es" | "pt")
              }
            }
          } catch (error: any) {
            // Silently handle connection errors for profile fetch
            const isConnectionError = error?.code === 'ECONNABORTED' || 
                                      error?.code === 'ERR_NETWORK' ||
                                      error?.code === 'ECONNRESET' ||
                                      error?.code === 'ECONNREFUSED' ||
                                      error?.message?.includes('Connection failed') ||
                                      error?.message?.includes('timeout') ||
                                      error?.message?.includes('connection closed')
            if (!isConnectionError) {
              console.error('Failed to fetch viewing patient profile:', error)
            }
          }
        } else {
          // Patient not found in accessible list - might have lost access
          setViewingPatient(null)
          setViewingPatientProfile(null)
        }
      } catch (error: any) {
        // Silently handle connection errors - don't show errors on page reload
        const isConnectionError = error?.code === 'ECONNABORTED' || 
                                  error?.code === 'ERR_NETWORK' ||
                                  error?.code === 'ECONNRESET' ||
                                  error?.code === 'ECONNREFUSED' ||
                                  error?.message?.includes('Connection failed') ||
                                  error?.message?.includes('timeout') ||
                                  error?.message?.includes('connection closed')
        
        // Only log non-connection errors
        if (!isConnectionError) {
          console.error('Failed to fetch viewing patient:', error)
        }
        
        // On connection errors, keep existing state (don't clear it)
        // This allows the page to continue working with cached data
        if (!isConnectionError) {
          setViewingPatient(null)
          setViewingPatientProfile(null)
        }
      }
    }
    
    // Add a small delay to debounce rapid patientId changes during switching
    fetchTimeoutRef.current = setTimeout(() => {
      fetchViewingPatient()
    }, 100)
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [patientId, setLanguage, user, isAuthenticated, isRestoringSession])

  // Reset theme/language when switching back to own account
  useEffect(() => {
    if (!isViewingOtherPatient && user?.user_metadata) {
      // Apply current user's preferences
      if (user.user_metadata.theme) {
        if (user.user_metadata.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      if (user.user_metadata.language) {
        setLanguage(user.user_metadata.language as "en" | "es" | "pt")
      }
    }
  }, [isViewingOtherPatient, user?.user_metadata, setLanguage])

  // Determine which user's information to display in header
  // When viewing another patient, show their info; otherwise show current user's info
  // Only show viewingPatient data if it matches the current patientId
  const isCorrectPatient = viewingPatient?.patient_id === patientId
  const displayFullName = isViewingOtherPatient
    ? (isCorrectPatient ? (viewingPatient?.patient_name || "Loading...") : "Loading...")
    : (user?.user_metadata?.full_name?.trim() || user?.email?.split('@')[0] || "User")

  const displayEmail = isViewingOtherPatient
    ? (isCorrectPatient ? (viewingPatient?.patient_email || "") : "")
    : (user?.email || "")

  const initials = ((): string => {
    const parts = displayFullName.split(" ").filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  })()

  // Fetch avatar - use viewing patient's profile if available, otherwise fetch
  useEffect(() => {
    const fetchAvatar = async () => {
      if (isViewingOtherPatient && patientId) {
        // Check if viewingPatientProfile matches current patientId
        if (viewingPatientProfile && viewingPatient?.patient_id === patientId) {
          // Use already-fetched viewing patient's profile for avatar
          const avatar = viewingPatientProfile.img_url || viewingPatientProfile.avatar_url || ""
          setAvatarUrl(avatar && avatar.trim() && avatar !== 'null' ? avatar : "")
        } else if (viewingPatient?.patient_id === patientId) {
          // Viewing another patient but profile not yet loaded - fetch their avatar
          try {
            const profile = await AuthAPI.getPatientProfile(patientId)
            const avatar = profile.img_url || profile.avatar_url || ""
            setAvatarUrl(avatar && avatar.trim() && avatar !== 'null' ? avatar : "")
          } catch (error: any) {
            const isConnectionError = error?.code === 'ECONNABORTED' || 
                                      error?.code === 'ERR_NETWORK' ||
                                      error?.message?.includes('Connection failed') ||
                                      error?.message?.includes('timeout')
            if (!isConnectionError) {
              console.error('Failed to fetch viewing patient avatar:', error)
            }
            setAvatarUrl("")
          }
        } else {
          // Patient data not yet loaded, clear avatar
          setAvatarUrl("")
        }
      } else if (user?.id && !isViewingOtherPatient) {
        // Current user's avatar (only fetch if not viewing another patient)
        try {
          const profile = await AuthAPI.getProfile()
          const avatar = profile.img_url || profile.avatar_url || ""
          setAvatarUrl(avatar && avatar.trim() && avatar !== 'null' ? avatar : "")
        } catch (error: any) {
          const isConnectionError = error?.code === 'ECONNABORTED' || 
                                    error?.code === 'ERR_NETWORK' ||
                                    error?.message?.includes('Connection failed') ||
                                    error?.message?.includes('timeout')
          
          if (!isConnectionError) {
            console.error('Failed to fetch avatar:', error)
          }
          setAvatarUrl("")
        }
      } else {
        setAvatarUrl("")
      }
    }

    fetchAvatar()
  }, [user?.id, isViewingOtherPatient, viewingPatient, viewingPatientProfile, patientId])

  const userId = typeof window !== 'undefined' ? 1 : null // TODO: derive from auth

  const subtitle = ((): string => {
    if (pathname.includes("/patient/dashboard")) return t("dashboard.overview")
    if (pathname.includes("/patient/health-records")) return t("health.controlRecords")
    if (pathname.includes("/patient/health-plan")) return t("dashboard.healthPlanProgressDesc")
    if (pathname.includes("/patient/medications")) return t("medications.manageReminders")
    if (pathname.includes("/patient/messages")) return t("messages.subtitle") || "Messages"
    if (pathname.includes("/patient/appointments")) return t("appointments.subtitle") || "Your appointments"
    if (pathname.includes("/patient/permissions")) return t("permissions.subtitle") || "Permissions"
    if (pathname.includes("/patient/profile")) return t("profile.subtitle")
    return ""
  })()

  return (
    <LanguageProvider>
      <WebSocketProvider userId={userId}>
        <div className="flex min-h-screen flex-col md:flex-row">
          <PatientSidebar />
          <main className="flex-1 pt-16 md:ml-64 md:pt-0 flex flex-col min-h-0">
            <div className="">
              <div className="flex items-center space-x-4 p-6 border-b">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayFullName} />}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  {isViewingOtherPatient && (
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-teal-600 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                      <Users className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">{t("greeting.morning")}, {displayFullName}!</h1>
                    {isViewingOtherPatient && (
                      <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-1 rounded-full">
                        Viewing
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{subtitle}</p>
                  {displayEmail && (
                    <p className="text-sm text-muted-foreground mt-1">{displayEmail}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <div className="h-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </WebSocketProvider>
    </LanguageProvider>
  )
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    }>
      <PatientLayoutContent>{children}</PatientLayoutContent>
    </Suspense>
  )
}
