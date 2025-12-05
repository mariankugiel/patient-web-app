"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getFirstAccessiblePage, isPageAccessible } from '@/lib/utils/patient-navigation'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { 
  User, 
  LogOut,
  Users,
  Settings,
  UserCog,
  HelpCircle,
  Plus,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { AuthAPI, AccessiblePatient } from '@/lib/api/auth-api'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/lib/store'
import { logout } from '@/lib/features/auth/authSlice'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useSwitchedPatient } from '@/contexts/patient-context'
import { fetchUserProfile } from '@/lib/features/auth/authThunks'

interface UserMenuDropdownProps {
  onLogout?: () => void
}

export function UserMenuDropdown({ onLogout }: UserMenuDropdownProps) {
  const { t } = useLanguage()
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useSelector((state: RootState) => state.auth)
  const { patientId, patientToken, isViewingOtherPatient, accessiblePatients, refreshAccessiblePatients } = useSwitchedPatient()
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [viewingPatient, setViewingPatient] = useState<AccessiblePatient | null>(null)
  const [viewingPatientProfile, setViewingPatientProfile] = useState<any>(null)

  const loadPatients = async () => {
    // Don't load if user is not authenticated
    if (!user?.id) {
      return
    }
    
    try {
      setLoading(true)
      await refreshAccessiblePatients()
    } catch (error: any) {
      const isConnectionError = error?.code === 'ECONNABORTED' || 
                                error?.code === 'ERR_NETWORK' ||
                                error?.message?.includes('Connection failed') ||
                                error?.message?.includes('timeout')
      if (!isConnectionError) {
        console.error('Failed to load accessible patients:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  // Load patients when dropdown opens
  useEffect(() => {
    if (dropdownOpen && user?.id) {
      loadPatients()
    }
  }, [dropdownOpen, user?.id])
  
  // Also load on initial mount to show badge count (only if user is authenticated)
  useEffect(() => {
    if (user?.id) {
      const timer = setTimeout(() => {
        loadPatients()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [user?.id])

  const handlePatientSelect = async (selectedPatient: AccessiblePatient, e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    const selectedPatientId = selectedPatient?.patient_id
    if (!selectedPatientId || isNaN(selectedPatientId)) {
      console.error('❌ Invalid patientId:', selectedPatientId)
      return
    }
    
    console.log('🔄 Switching to patient:', selectedPatientId, 'Current pathname:', pathname)
    
    // Set flag to suppress connection error toasts during user switching
    ;(window as any).__isUserSwitching = true
    
    // Close dropdown immediately for better UX
    setDropdownOpen(false)
    
    // Find the patient in accessible patients list
    let patient: AccessiblePatient | null =
      accessiblePatients.find(p => p.patient_id === selectedPatientId) ?? selectedPatient
    
    // If patient not found in current list, try to reload accessible patients
    // But don't block navigation if API call fails - we'll navigate anyway
    if (!patient) {
      console.log('⚠️ Patient not found in current list, fetching from API...')
      try {
        const refreshed = await refreshAccessiblePatients()
        patient = refreshed?.find(p => p.patient_id === selectedPatientId) || null
        if (patient) {
          console.log('✅ Patient found in refreshed list')
        } else {
          console.warn('⚠️ Patient not found after refresh')
        }
      } catch (error: any) {
        // Silently handle connection errors - don't block navigation
        const isConnectionError = error?.code === 'ECONNABORTED' || 
                                  error?.code === 'ERR_NETWORK' ||
                                  error?.code === 'ECONNRESET' ||
                                  error?.code === 'ECONNREFUSED' ||
                                  error?.message?.includes('Connection failed') ||
                                  error?.message?.includes('timeout') ||
                                  error?.message?.includes('connection closed') ||
                                  error?.message?.includes('Unable to connect')
        
        if (!isConnectionError) {
          console.error('❌ Failed to load accessible patients:', error)
        } else {
          console.log('⚠️ Connection error, continuing with navigation anyway')
        }
        // Continue with navigation even if API call failed
        // The page will handle permission checks
      }
    } else {
      console.log('✅ Patient found in current list')
    }
    
    // Check if this is the current user (granted_for === "Self")
    if (patient?.granted_for === "Self") {
      console.log('🔄 Switching back to own account')
      // Navigate to current page without patientId (viewing own data)
      // If on dashboard or no pathname, go to dashboard (own dashboard is OK)
      const targetPath = pathname && !pathname.includes('/patient/dashboard') 
        ? pathname 
        : '/patient/dashboard'
      console.log('📍 Navigating to:', targetPath)
      router.replace(targetPath)
      
      // Clear the switching flag after navigation
      setTimeout(() => {
        ;(window as any).__isUserSwitching = false
      }, 2000)
      return
    }
    
    // For other patients, determine the target URL
    let targetUrl = ''
    let targetToken = patient?.patient_token
    if (!targetToken) {
      console.warn('⚠️ No patient token in current data, refreshing accessible patients...')
      try {
        const refreshed = await refreshAccessiblePatients()
        targetToken = refreshed?.find(p => p.patient_id === selectedPatientId)?.patient_token || null
      } catch (error) {
        console.error('❌ Failed to refresh accessible patients for token lookup:', error)
      }
    }
    if (!targetToken) {
      console.error('❌ No patient token available for selected patient, aborting switch.')
      setTimeout(() => {
        ;(window as any).__isUserSwitching = false
      }, 500)
      return
    }
    const tokenQuery = `?patientToken=${encodeURIComponent(targetToken)}`
    
    // Check if we're on a restricted page
    const isRestrictedPage = pathname && (
      pathname.includes('/patient/dashboard') || 
      pathname.includes('/patient/profile') || 
      pathname.includes('/patient/permissions')
    )
    
    if (isRestrictedPage) {
      // Redirect to first accessible page
      const accessiblePage = patient?.permissions 
        ? getFirstAccessiblePage(patient.permissions, true)
        : '/patient/health-records'
      targetUrl = `${accessiblePage}${tokenQuery}`
      console.log('📍 On restricted page, redirecting to:', targetUrl)
    } else if (pathname && patient?.permissions) {
      // Check if current page is accessible
      const currentPageAccessible = isPageAccessible(pathname, patient.permissions, true)
      if (currentPageAccessible) {
        // Current page is accessible, stay on it with new patientId
        targetUrl = `${pathname}${tokenQuery}`
        console.log('📍 Current page accessible, staying on:', targetUrl)
      } else {
        // Current page not accessible, redirect to first accessible page
        const accessiblePage = getFirstAccessiblePage(patient.permissions, true)
        targetUrl = `${accessiblePage}${tokenQuery}`
        console.log('📍 Current page not accessible, redirecting to:', targetUrl)
      }
    } else {
      // No pathname or no permissions available, default to health-records
      const accessiblePage = patient?.permissions 
        ? getFirstAccessiblePage(patient.permissions, true)
        : '/patient/health-records'
      targetUrl = `${accessiblePage}${tokenQuery}`
      console.log('📍 Default navigation to:', targetUrl)
    }
    
    // Perform navigation
    if (targetUrl) {
      console.log('🚀 Navigating to:', targetUrl)
      router.replace(targetUrl)
      
      // Clear the switching flag after a short delay to allow navigation to complete
      // This prevents showing connection error toasts during the switch
      setTimeout(() => {
        ;(window as any).__isUserSwitching = false
      }, 2000) // 2 seconds should be enough for navigation and initial API calls
    } else {
      console.error('❌ No target URL determined, cannot navigate')
      // Clear the flag if navigation fails
      ;(window as any).__isUserSwitching = false
    }
  }

  const handleSwitchToMainUser = () => {
    // Only switch if we're currently viewing another patient
    if (!isViewingOtherPatient || !patientToken) {
      setDropdownOpen(false)
      return
    }
    
    console.log('🔄 Switching back to main user')
    
    // Set flag to suppress connection error toasts during user switching
    ;(window as any).__isUserSwitching = true
    
    // Get current pathname
    const currentPath = pathname || '/patient/dashboard'
    
    // Check if we're on a restricted page (dashboard, profile, permissions)
    // These pages should redirect when switching back to main user
    const isRestrictedPage = currentPath.includes('/patient/dashboard') || 
                            currentPath.includes('/patient/profile') || 
                            currentPath.includes('/patient/permissions')
    
    if (isRestrictedPage) {
      // Redirect to dashboard (without patientId)
      router.replace('/patient/dashboard')
    } else {
      // Remove patientToken from current URL
      const newPath = currentPath.split('?')[0] // Remove query params
      router.replace(newPath)
    }
    
    // Clear the switching flag after navigation
    setTimeout(() => {
      ;(window as any).__isUserSwitching = false
    }, 2000)
    
    setDropdownOpen(false)
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      dispatch(logout())
      router.push('/')
    }
  }

  // Fetch viewing patient data when viewing another patient
  useEffect(() => {
    const fetchViewingPatient = async () => {
      // Reset state if not viewing another patient
      if (!isViewingOtherPatient || !patientId || patientId === null) {
        setViewingPatient(null)
        setViewingPatientProfile(null)
        return
      }
      
      // Ensure patientId is a valid number
      const validPatientId = typeof patientId === 'number' && !isNaN(patientId) ? patientId : null
      if (!validPatientId) {
        setViewingPatient(null)
        setViewingPatientProfile(null)
        return
      }
      
      // First, try to find patient in existing accessiblePatients list
      let patient = accessiblePatients.find(p => p.patient_id === validPatientId)
      
      // If not found, try to fetch from API
      if (!patient) {
        try {
          const refreshed = await refreshAccessiblePatients()
          patient = refreshed?.find(p => p.patient_id === validPatientId)
          if (patient) {
            setViewingPatient(patient)
          }
        } catch (error: any) {
          // Silently handle connection errors - don't clear state on connection failure
          const isConnectionError = error?.code === 'ECONNABORTED' || 
                                    error?.code === 'ERR_NETWORK' ||
                                    error?.code === 'ECONNRESET' ||
                                    error?.code === 'ECONNREFUSED' ||
                                    error?.message?.includes('Connection failed') ||
                                    error?.message?.includes('timeout') ||
                                    error?.message?.includes('connection closed') ||
                                    error?.message?.includes('Unable to connect')
          
          if (!isConnectionError) {
            console.error('Failed to fetch viewing patient:', error)
            setViewingPatient(null)
            setViewingPatientProfile(null)
          }
          // On connection error, keep existing state (don't clear)
          return
        }
      } else {
        // Patient found in existing list
        setViewingPatient(patient)
      }
      
      // Fetch full profile for avatar (only if we have a patient)
      if (patient) {
        try {
          const profile = await AuthAPI.getPatientProfile(validPatientId)
          if (profile) {
            setViewingPatientProfile(profile)
          }
        } catch (error: any) {
          // Silently handle connection errors for profile fetch
          const isConnectionError = error?.code === 'ECONNABORTED' || 
                                    error?.code === 'ERR_NETWORK' ||
                                    error?.code === 'ECONNRESET' ||
                                    error?.code === 'ECONNREFUSED' ||
                                    error?.message?.includes('Connection failed') ||
                                    error?.message?.includes('timeout') ||
                                    error?.message?.includes('connection closed') ||
                                    error?.message?.includes('Unable to connect')
          
          if (!isConnectionError) {
            console.error('Failed to fetch viewing patient profile:', error)
          }
          // Don't clear viewingPatient if only profile fetch failed
        }
      } else {
        // Patient not found
        setViewingPatient(null)
        setViewingPatientProfile(null)
      }
    }
    
    fetchViewingPatient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, patientToken, isViewingOtherPatient])

  // Get current user's avatar URL from Redux profile
  const profile = useSelector((state: RootState) => state.auth.profile)
  
  // ALWAYS display current user's info in dropdown (not the switched user)
  // The dropdown should always show who is logged in, not who they're viewing
  // Prioritize profile data (from Supabase) as it's more up-to-date, fallback to user_metadata, then email
  const displayName = (profile?.full_name?.trim() || 
                       user?.user_metadata?.full_name?.trim() || 
                       (user?.email ? user.email.split('@')[0] : null) || 
                       'User') || 'User'
  const displayEmail = user?.email || ''
  
  // Get user initials for avatar
  const getInitials = (name: string | null | undefined) => {
    // Handle null, undefined, or empty strings
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return '?'
    }
    
    try {
      const parts = name.split(' ').filter(Boolean)
      if (parts.length === 0) return '?'
      if (parts.length === 1) {
        // Single word: take first 2 characters
        return parts[0].slice(0, 2).toUpperCase()
      }
      // Multiple words: take first letter of first and last word
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    } catch (error) {
      // Fallback if split fails for any reason
      console.warn('Error generating initials:', error, 'name:', name)
      return '?'
    }
  }
  const avatarUrl = profile?.avatar_url && profile.avatar_url.trim() && profile.avatar_url !== 'null' 
    ? profile.avatar_url 
    : null

  const currentUser = accessiblePatients.find(p => p.granted_for === "Self")
  const otherPatients = accessiblePatients.filter(p => p.granted_for !== "Self" && p.granted_for !== undefined)

  // Get avatar for a patient
  const getPatientAvatar = (patient: AccessiblePatient) => {
    if (patient.granted_for === "Self") {
      return avatarUrl
    }
    // For other patients, we could fetch their avatar, but for now use initials
    return null
  }

  return (
    <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start h-auto py-2 px-2 relative"
          title="User Menu"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="text-xs bg-teal-600 text-white">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {displayEmail}
              </div>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-auto p-0 border-0 shadow-xl"
        sideOffset={8}
      >
        <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {/* Main User Card */}
          <Card className="w-72 shadow-md">
            <CardContent className="p-0">
              {/* User Profile Section - Clickable to switch back to main user */}
              <div 
                className={`p-4 border-b ${isViewingOtherPatient ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors' : ''}`}
                onClick={isViewingOtherPatient ? handleSwitchToMainUser : undefined}
                title={isViewingOtherPatient ? 'Click to switch back to your account' : 'Your account'}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {avatarUrl && <AvatarImage src={avatarUrl} />}
                    <AvatarFallback className="bg-teal-600 text-white text-base">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-base truncate">
                        {displayName}
                      </div>
                      {isViewingOtherPatient && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          Switch back
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {displayEmail}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start font-normal"
                  onClick={() => {
                    router.push('/patient/permissions')
                    setDropdownOpen(false)
                  }}
                >
                  <ShieldCheck className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-400" />
                  <span>Permissions</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start font-normal"
                  onClick={() => {
                    router.push('/patient/profile')
                    setDropdownOpen(false)
                  }}
                >
                  <UserCog className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-400" />
                  <span>Profile Settings</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start font-normal"
                  onClick={() => {
                    router.push('/patient/profile/security')
                    setDropdownOpen(false)
                  }}
                >
                  <Settings className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-400" />
                  <span>Account Settings</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start font-normal"
                  onClick={() => {
                    // Navigate to support/messages
                    router.push('/patient/messages')
                    setDropdownOpen(false)
                  }}
                >
                  <HelpCircle className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-400" />
                  <span>Support</span>
                </Button>
                <div className="border-t my-1" />
                <Button
                  variant="ghost"
                  className="w-full justify-start font-normal text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span>Log out</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Switching Card */}
          <Card className="w-64 shadow-md">
            <CardContent className="p-0">
              {/* Switch User Header */}
              <div className="p-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-sm">Please switch user here</span>
                </div>
              </div>

              {/* Account List */}
              <ScrollArea className="max-h-[400px]">
                <div className="p-2 space-y-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Other Patients Only - Don't show current user */}
                      {otherPatients.length > 0 ? (
                        otherPatients.map((patient) => {
                          const isSelected = patientToken
                            ? patient.patient_token === patientToken
                            : patientId === patient.patient_id
                          return (
                            <Button
                              key={patient.patient_id}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start h-auto py-2 px-3",
                                isSelected && "bg-gray-100 dark:bg-gray-800"
                              )}
                              onClick={(e) => handlePatientSelect(patient, e)}
                            >
                              <Avatar className="h-8 w-8 mr-3 shrink-0">
                                {getPatientAvatar(patient) && (
                                  <AvatarImage src={getPatientAvatar(patient) || ''} />
                                )}
                                <AvatarFallback className="bg-gray-500 text-white text-xs">
                                  {getInitials(patient.patient_name || patient.patient_email || 'User')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="font-medium text-sm truncate">
                                  {patient.patient_name}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="h-2 w-2 rounded-full bg-teal-600 shrink-0" />
                              )}
                            </Button>
                          )
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <Users className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            No other accounts available
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </PopoverContent>
    </Popover>
  )
}

