"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, ChevronRight } from 'lucide-react'
import { AuthAPI, AccessiblePatient } from '@/lib/api/auth-api'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { cn } from '@/lib/utils'
import { getFirstAccessiblePage, isPageAccessible } from '@/lib/utils/patient-navigation'

export function AccessiblePatientsList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { user } = useSelector((state: RootState) => state.auth)
  const [accessiblePatients, setAccessiblePatients] = useState<AccessiblePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await AuthAPI.getAccessiblePatients()
        setAccessiblePatients(response.accessible_patients || [])
      } catch (error) {
        console.error('Failed to load accessible patients:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPatients()
  }, [])

  const handlePatientSelect = async (patientId: number, e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Check if this is the current user (granted_for === "Self")
    const patient = accessiblePatients.find(p => p.patient_id === patientId)
    if (patient?.granted_for === "Self") {
      // Navigate to current page without patientId (viewing own data)
      // If on dashboard or no pathname, go to dashboard (own dashboard is OK)
      if (pathname && !pathname.includes('/patient/dashboard')) {
        router.push(pathname)
      } else {
        router.push('/patient/dashboard')
      }
      return
    }
    
    // For other patients, NEVER allow dashboard access
    // If currently on dashboard, redirect to first accessible page
    if (pathname && pathname.includes('/patient/dashboard')) {
      const accessiblePage = getFirstAccessiblePage(patient?.permissions || null, true)
      router.push(`${accessiblePage}?patientId=${patientId}`)
      return
    }
    
    // Dashboard, Profile, and Permissions are NOT accessible when viewing another patient
    // Redirect away from these pages
    if (pathname && (pathname.includes('/patient/dashboard') || 
                     pathname.includes('/patient/profile') || 
                     pathname.includes('/patient/permissions'))) {
      // Redirect to first accessible page
      const accessiblePage = getFirstAccessiblePage(patient?.permissions || null, true)
      router.push(`${accessiblePage}?patientId=${patientId}`)
      return
    }
    
    // For other patients, check if current page is accessible
    if (pathname && patient?.permissions) {
      const currentPageAccessible = isPageAccessible(pathname, patient.permissions, true)
      if (currentPageAccessible) {
        // Current page is accessible, stay on it
        router.push(`${pathname}?patientId=${patientId}`)
        return
      }
    }
    
    // Current page is not accessible or pathname not available
    // Redirect to first accessible page based on permissions
    const accessiblePage = getFirstAccessiblePage(patient?.permissions || null, true)
    router.push(`${accessiblePage}?patientId=${patientId}`)
  }


  const selectedPatientId = searchParams.get('patientId')

  // Don't show if user has no accessible patients
  if (!loading && accessiblePatients.length === 0) {
    return null
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
      <Button
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full justify-between mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Who I Access</span>
          {accessiblePatients.length > 0 && (
            <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
              {accessiblePatients.length}
            </span>
          )}
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform",
            expanded && "transform rotate-90"
          )}
        />
      </Button>

      {expanded && (
        <ScrollArea className="h-auto max-h-[300px]">
          <div className="space-y-1">
            {loading ? (
              <div className="text-sm text-gray-500 px-2 py-1">Loading...</div>
            ) : accessiblePatients.length === 0 ? (
              <div className="text-sm text-gray-500 px-2 py-1">No accessible patients</div>
            ) : (
              accessiblePatients.map((patient) => {
                const isSelected = selectedPatientId === patient.patient_id.toString() || 
                                  (patient.granted_for === "Self" && !selectedPatientId)
                const isSelf = patient.granted_for === "Self"

                return (
                  <Button
                    key={patient.patient_id}
                    variant="ghost"
                    onClick={(e) => handlePatientSelect(patient.patient_id, e)}
                    className={cn(
                      "w-full justify-start h-auto py-2 px-2 text-left cursor-pointer",
                      isSelected
                        ? "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:hover:bg-teal-800"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {patient.patient_name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(You)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {patient.patient_email}
                      </div>
                    </div>
                  </Button>
                )
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

