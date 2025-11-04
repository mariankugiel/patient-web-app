"use client"

import { usePatientContext } from '@/hooks/use-patient-context'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { AuthAPI } from '@/lib/api/auth-api'

export function PatientViewBanner() {
  const { patientId, isViewingOtherPatient } = usePatientContext()
  const router = useRouter()
  const [patientName, setPatientName] = useState<string | null>(null)
  const [patientSupabaseId, setPatientSupabaseId] = useState<string | null>(null)

  useEffect(() => {
    if (isViewingOtherPatient && patientId) {
      // Fetch patient name and supabase ID
      const fetchPatientInfo = async () => {
        try {
          const response = await AuthAPI.getAccessiblePatients()
          const patient = response.accessible_patients?.find(
            p => p.patient_id === patientId
          )
          if (patient) {
            setPatientName(patient.patient_name)
            setPatientSupabaseId(patient.patient_supabase_id)
          }
        } catch (error) {
          console.error('Failed to fetch patient info:', error)
        }
      }
      fetchPatientInfo()
    } else {
      setPatientName(null)
      setPatientSupabaseId(null)
    }
  }, [isViewingOtherPatient, patientId])

  if (!isViewingOtherPatient) return null

  const handleClearPatient = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('patientId')
    router.push(url.pathname + url.search)
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return (
    <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {patientSupabaseId && (
            <Avatar className="h-10 w-10">
              <AvatarImage src={`/api/avatar/${patientSupabaseId}`} />
              <AvatarFallback className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                {patientName ? getInitials(patientName) : '?'}
              </AvatarFallback>
            </Avatar>
          )}
          <span>
            Viewing data for: <strong>{patientName || `Patient #${patientId}`}</strong>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearPatient}
          className="ml-4 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}

