"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { getFirstAccessiblePage, isPageAccessible } from '@/lib/utils/patient-navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { AuthAPI, AccessiblePatient } from '@/lib/api/auth-api'
import { cn } from '@/lib/utils'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

interface AccessiblePatientsDialogProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AccessiblePatientsDialog({ 
  trigger, 
  open: controlledOpen,
  onOpenChange 
}: AccessiblePatientsDialogProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useSelector((state: RootState) => state.auth)
  const [accessiblePatients, setAccessiblePatients] = useState<AccessiblePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [internalOpen, setInternalOpen] = useState(false)

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  useEffect(() => {
    if (isOpen) {
      loadPatients()
    }
  }, [isOpen])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const response = await AuthAPI.getAccessiblePatients()
      setAccessiblePatients(response.accessible_patients || [])
    } catch (error) {
      console.error('Failed to load accessible patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePatientSelect = (patientId: number) => {
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
      setIsOpen(false)
      return
    }
    
    // For other patients, NEVER allow dashboard access
    // If currently on dashboard, redirect to first accessible page
    if (pathname && pathname.includes('/patient/dashboard')) {
      const accessiblePage = getFirstAccessiblePage(patient?.permissions || null, true)
      router.push(`${accessiblePage}?patientId=${patientId}`)
      setIsOpen(false)
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
      setIsOpen(false)
      return
    }
    
    // For other patients, check if current page is accessible
    if (pathname && patient?.permissions) {
      const currentPageAccessible = isPageAccessible(pathname, patient.permissions, true)
      if (currentPageAccessible) {
        // Current page is accessible, stay on it
        router.push(`${pathname}?patientId=${patientId}`)
        setIsOpen(false)
        return
      }
    }
    
    // Current page is not accessible or pathname not available
    // Redirect to first accessible page based on permissions
    const accessiblePage = getFirstAccessiblePage(patient?.permissions || null, true)
    router.push(`${accessiblePage}?patientId=${patientId}`)
    setIsOpen(false)
  }


  const selectedPatientId = searchParams.get('patientId')

  const defaultTrigger = (
    <Button variant="outline" size="icon" className="relative" title="Accessible Patients">
      <Users className="h-4 w-4" />
      {accessiblePatients.length > 0 && (
        <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
          {accessiblePatients.length}
        </Badge>
      )}
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Accessible Patients
          </DialogTitle>
          <DialogDescription>
            Select a patient to view their data (you have permission to access)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading accessible patients...</span>
              </div>
            </div>
          ) : accessiblePatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No accessible patients</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Patients can grant you access to their data through the permissions page
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {accessiblePatients.map((patient) => {
                const isSelected = selectedPatientId === patient.patient_id.toString() || 
                                  (patient.granted_for === "Self" && !selectedPatientId)
                const isSelf = patient.granted_for === "Self"

                return (
                  <Button
                    key={patient.patient_id}
                    variant="ghost"
                    onClick={() => handlePatientSelect(patient.patient_id)}
                    className={cn(
                      "w-full justify-start h-auto py-3 px-3 text-left",
                      isSelected
                        ? "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:hover:bg-teal-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base truncate">
                        {patient.patient_name}
                        {isSelf && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {patient.patient_email}
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

