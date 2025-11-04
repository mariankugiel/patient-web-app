"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Home, 
  FileText, 
  ClipboardList, 
  Pill, 
  MessageSquare, 
  Calendar,
  ExternalLink,
  Clock,
  Shield,
  Mail,
  User
} from 'lucide-react'
import { AuthAPI, AccessiblePatient } from '@/lib/api/auth-api'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { formatDistanceToNow } from 'date-fns'

// Define available pages for patient access with permission mapping
const ACCESSIBLE_PAGES = [
  { 
    name: 'dashboard', 
    href: '/patient/dashboard', 
    icon: Home,
    labelKey: 'nav.dashboard',
    description: 'View patient dashboard',
    permissionKey: null // Dashboard shown if any permission exists
  },
  { 
    name: 'health-records', 
    href: '/patient/health-records', 
    icon: FileText,
    labelKey: 'nav.healthRecords',
    description: 'View health records',
    permissionKey: 'can_view_health_records' as const
  },
  { 
    name: 'history', 
    href: '/patient/health-records/history', 
    icon: FileText,
    labelKey: 'Medical History', // Direct label since translation key may not exist
    description: 'View medical history',
    permissionKey: 'can_view_medical_history' as const
  },
  { 
    name: 'health-plan', 
    href: '/patient/health-plan', 
    icon: ClipboardList,
    labelKey: 'nav.healthPlan',
    description: 'View health plan',
    permissionKey: 'can_view_health_plans' as const
  },
  { 
    name: 'medications', 
    href: '/patient/medications', 
    icon: Pill,
    labelKey: 'nav.medications',
    description: 'View medications',
    permissionKey: 'can_view_medications' as const
  },
  { 
    name: 'messages', 
    href: '/patient/messages', 
    icon: MessageSquare,
    labelKey: 'nav.messages',
    description: 'View messages',
    permissionKey: 'can_view_messages' as const
  },
  { 
    name: 'appointments', 
    href: '/patient/appointments', 
    icon: Calendar,
    labelKey: 'nav.appointments',
    description: 'View appointments',
    permissionKey: 'can_view_appointments' as const
  },
]

// Helper function to get allowed pages for a patient based on permissions
function getAllowedPages(permissions: AccessiblePatient['permissions']): typeof ACCESSIBLE_PAGES {
  // Check if user has at least one permission (for dashboard access)
  const hasAnyPermission = Object.values(permissions).some(value => value === true)
  
  return ACCESSIBLE_PAGES.filter(page => {
    // Dashboard is shown if any permission exists
    if (page.name === 'dashboard') {
      return hasAnyPermission
    }
    
    // Other pages require specific permission
    if (page.permissionKey) {
      return permissions[page.permissionKey] === true
    }
    
    return false
  })
}

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
  const { t } = useLanguage()
  const [accessiblePatients, setAccessiblePatients] = useState<AccessiblePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [internalOpen, setInternalOpen] = useState(false)
  const [expandedPatientId, setExpandedPatientId] = useState<number | null>(null)

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

  const handlePageClick = (patientId: number, pageHref: string) => {
    // Open the page with patientId parameter in a new window
    console.log('🔍 [Dialog] Opening page in new window with patientId:', patientId, 'page:', pageHref)
    const url = new URL(pageHref, window.location.origin)
    url.searchParams.set('patientId', patientId.toString())
    const fullUrl = url.pathname + url.search
    console.log('🔍 [Dialog] Final URL:', fullUrl)
    window.open(fullUrl, '_blank', 'noopener,noreferrer')
    // Keep dialog open so user can open multiple pages
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const getPermissionBadges = (patient: AccessiblePatient) => {
    const badges: string[] = []
    if (patient.permissions) {
      if (patient.permissions.can_view_health_records) badges.push('Health Records')
      if (patient.permissions.can_view_medications) badges.push('Medications')
      if (patient.permissions.can_view_messages) badges.push('Messages')
      if (patient.permissions.can_view_appointments) badges.push('Appointments')
      if (patient.permissions.can_view_health_plans) badges.push('Health Plans')
      if (patient.permissions.can_view_medical_history) badges.push('Medical History')
    }
    return badges.length > 0 ? badges : ['Full Access']
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
            Patients who have granted you access to view their health data
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
            <div className="space-y-3">
              {accessiblePatients.map((patient) => {
                const expired = isExpired(patient.expires_at)
                const isExpanded = expandedPatientId === patient.patient_id
                const isSelected = selectedPatientId === patient.patient_id.toString()
                const permissionBadges = getPermissionBadges(patient)

                return (
                  <div
                    key={patient.patient_id}
                    className={cn(
                      "border rounded-lg p-4 transition-all",
                      isSelected && "border-teal-500 bg-teal-50 dark:bg-teal-950/20",
                      !isSelected && "border-gray-200 dark:border-gray-800",
                      expired && "opacity-60"
                    )}
                  >
                    {/* Patient Header - Clickable to view dashboard (if permission exists) */}
                    <div 
                      className={cn(
                        "flex items-start gap-3 p-2 rounded-lg transition-colors -m-2",
                        getAllowedPages(patient.permissions).some(page => page.name === 'dashboard') 
                          ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          : "cursor-default"
                      )}
                      onClick={() => {
                        if (getAllowedPages(patient.permissions).some(page => page.name === 'dashboard')) {
                          handlePageClick(patient.patient_id, '/patient/dashboard')
                        }
                      }}
                      title={getAllowedPages(patient.permissions).some(page => page.name === 'dashboard')
                        ? "Click to open this patient's dashboard in a new window"
                        : "No permission to access dashboard"}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/api/avatar/${patient.patient_supabase_id}`} />
                        <AvatarFallback className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                          {getInitials(patient.patient_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {patient.patient_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate">{patient.patient_email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {expired && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                            {!expired && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Permission Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {permissionBadges.map((badge, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              {badge}
                            </Badge>
                          ))}
                        </div>

                        {/* Access Info */}
                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
                          {patient.granted_for && (
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              <span>{patient.granted_for}</span>
                            </div>
                          )}
                          {(patient as any).granted_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Granted {formatDate((patient as any).granted_at)}</span>
                            </div>
                          )}
                          {patient.expires_at && (
                            <div className={cn(
                              "flex items-center gap-1",
                              expired && "text-red-500"
                            )}>
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {expired ? 'Expired' : 'Expires'} {formatDate(patient.expires_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 flex gap-2">
                      {getAllowedPages(patient.permissions).some(page => page.name === 'dashboard') && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handlePageClick(patient.patient_id, '/patient/dashboard')}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                          title="Open dashboard in a new window"
                        >
                          <Home className="h-4 w-4 mr-2" />
                          View Dashboard
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedPatientId(
                          isExpanded ? null : patient.patient_id
                        )}
                        className="shrink-0"
                      >
                        <span className={cn(
                          "transition-transform inline-block",
                          isExpanded && "rotate-180"
                        )}>
                          ▼
                        </span>
                      </Button>
                    </div>

                    {/* Expandable Pages List - Only show allowed pages */}
                    {isExpanded && (() => {
                      const allowedPages = getAllowedPages(patient.permissions)
                      
                      if (allowedPages.length === 0) {
                        return (
                          <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                            No pages available. Permission required to access patient data.
                          </div>
                        )
                      }
                      
                      return (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {allowedPages.map((page) => {
                            const Icon = page.icon
                            return (
                              <Button
                                key={page.name}
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageClick(patient.patient_id, page.href)}
                                className="justify-start h-auto py-2 px-3 text-xs"
                              >
                                <Icon className="h-4 w-4 mr-2 shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {page.labelKey.startsWith('nav.') ? t(page.labelKey) || page.labelKey.replace('nav.', '') : page.labelKey}
                                  </div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-500 truncate">
                                    {page.description}
                                  </div>
                                </div>
                                <ExternalLink className="h-3 w-3 ml-2 shrink-0" />
                              </Button>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

