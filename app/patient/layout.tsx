"use client"

import type React from "react"
import { useSelector } from "react-redux"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef, Suspense } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PatientSidebar from "@/components/patient/sidebar"
import { LanguageProvider, useLanguage } from "@/contexts/language-context"
import { WebSocketProvider } from "@/contexts/websocket-context"
import { PatientProvider, useSwitchedPatient } from "@/contexts/patient-context"
import { type RootState } from "@/lib/store"
import { AuthAPI, AccessiblePatient } from "@/lib/api/auth-api"
import { Users } from "lucide-react"

function PatientLayoutContent({ children }: { children: React.ReactNode }) {
  
  const user = useSelector((s: RootState) => s.auth.user)
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const isRestoringSession = useSelector((s: RootState) => s.auth.isRestoringSession)
  const { t, setLanguage } = useLanguage()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { patientId, isViewingOtherPatient, switchedPatientInfo, isLoading } = useSwitchedPatient()
  const [avatarUrl, setAvatarUrl] = useState<string>("")

  // Apply theme and language from switched patient info
  useEffect(() => {
    if (isViewingOtherPatient && switchedPatientInfo?.profile) {
      const profile = switchedPatientInfo.profile
      
      // Apply viewing patient's theme preferences
      if (profile.theme) {
        if (profile.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      
      // Apply viewing patient's language preferences
      if (profile.language) {
        setLanguage(profile.language as "en" | "es" | "pt")
      }
    }
  }, [switchedPatientInfo?.profile, isViewingOtherPatient, setLanguage])

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
  // When viewing another patient, show their info from switchedPatientInfo; otherwise show current user's info
  // Prioritize profile data (from Supabase) as it's more up-to-date, fallback to patient data from accessible patients list
  const displayFullName = isViewingOtherPatient
    ? (switchedPatientInfo?.profile?.full_name?.trim() || 
       switchedPatientInfo?.patient?.patient_name || 
       (isLoading ? "Loading..." : "User"))
    : (user?.user_metadata?.full_name?.trim() || user?.email?.split('@')[0] || "User")

  const displayEmail = isViewingOtherPatient
    ? (switchedPatientInfo?.profile?.email || 
       switchedPatientInfo?.patient?.patient_email || 
       "")
    : (user?.email || "")

  const initials = ((): string => {
    const parts = displayFullName.split(" ").filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  })()

  // Fetch avatar - use switched patient's profile if available
  useEffect(() => {
    const fetchAvatar = async () => {
      if (isViewingOtherPatient && switchedPatientInfo) {
        // Use switched patient's profile for avatar
        const avatar = switchedPatientInfo.profile?.img_url || 
                       switchedPatientInfo.profile?.avatar_url || 
                       ""
        setAvatarUrl(avatar && avatar.trim() && avatar !== 'null' ? avatar : "")
      } else {
        // Current user's avatar (only fetch if not viewing another patient)
        if (user?.id) {
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
    }

    fetchAvatar()
  }, [user?.id, isViewingOtherPatient, switchedPatientInfo])

  // WebSocket connection should always use the logged-in user's ID (not the switched patient)
  // This ensures notifications and real-time updates are always for the main user
  // The user ID is derived from Redux auth state - if not available, WebSocket will still work via token
  const loggedInUserId = user?.id ? parseInt(String(user.id)) : null

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
      {/* WebSocket connection is always for the logged-in user, not the switched patient */}
      <WebSocketProvider userId={loggedInUserId}>
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
      <PatientProvider>
        <PatientLayoutContent>{children}</PatientLayoutContent>
      </PatientProvider>
    </Suspense>
  )
}
