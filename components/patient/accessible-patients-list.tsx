"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, ChevronRight, ChevronDown, Home, FileText, ClipboardList, Pill, MessageSquare, Calendar } from 'lucide-react'
import { AuthAPI, AccessiblePatient } from '@/lib/api/auth-api'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

// Define available pages for patient access
const ACCESSIBLE_PAGES = [
  { 
    name: 'dashboard', 
    href: '/patient/dashboard', 
    icon: Home,
    labelKey: 'nav.dashboard'
  },
  { 
    name: 'health-records', 
    href: '/patient/health-records', 
    icon: FileText,
    labelKey: 'nav.healthRecords'
  },
  { 
    name: 'health-plan', 
    href: '/patient/health-plan', 
    icon: ClipboardList,
    labelKey: 'nav.healthPlan'
  },
  { 
    name: 'medications', 
    href: '/patient/medications', 
    icon: Pill,
    labelKey: 'nav.medications'
  },
  { 
    name: 'messages', 
    href: '/patient/messages', 
    icon: MessageSquare,
    labelKey: 'nav.messages'
  },
  { 
    name: 'appointments', 
    href: '/patient/appointments', 
    icon: Calendar,
    labelKey: 'nav.appointments'
  },
]

export function AccessiblePatientsList() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const { user } = useSelector((state: RootState) => state.auth)
  const [accessiblePatients, setAccessiblePatients] = useState<AccessiblePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)
  const [expandedPatientId, setExpandedPatientId] = useState<number | null>(null)

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

  const handlePatientClick = (patientId: number) => {
    // Toggle expanded state for this patient
    setExpandedPatientId(expandedPatientId === patientId ? null : patientId)
  }

  const handlePageClick = (patientId: number, pageHref: string) => {
    // Navigate to the page with patientId parameter
    const url = new URL(pageHref, window.location.origin)
    url.searchParams.set('patientId', patientId.toString())
    router.push(url.pathname + url.search)
    setExpandedPatientId(null) // Close the expanded menu
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
                const isSelected = selectedPatientId === patient.patient_id.toString()
                const expired = isExpired(patient.expires_at)
                const isExpanded = expandedPatientId === patient.patient_id

                return (
                  <div key={patient.patient_id} className="space-y-1">
                    <Button
                      variant="ghost"
                      onClick={() => handlePatientClick(patient.patient_id)}
                      className={cn(
                        "w-full justify-between h-auto py-2 px-2 text-left",
                        isSelected
                          ? "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:hover:bg-teal-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800",
                        expired && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={`/api/avatar/${patient.patient_supabase_id}`} />
                          <AvatarFallback className="text-xs">
                            {getInitials(patient.patient_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {patient.patient_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {patient.patient_email}
                          </div>
                          {expired && (
                            <div className="text-xs text-red-500">Expired</div>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform ml-2",
                          isExpanded && "transform rotate-180"
                        )}
                      />
                    </Button>
                    
                    {/* Expanded pages list */}
                    {isExpanded && (
                      <div className="ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                        {ACCESSIBLE_PAGES.map((page) => {
                          const Icon = page.icon
                          return (
                            <Button
                              key={page.name}
                              variant="ghost"
                              onClick={() => handlePageClick(patient.patient_id, page.href)}
                              className="w-full justify-start h-auto py-1.5 px-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0 mr-2" />
                              <span>{t(page.labelKey)}</span>
                            </Button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

