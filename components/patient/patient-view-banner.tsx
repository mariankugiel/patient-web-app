"use client"

import { usePatientContext } from '@/hooks/use-patient-context'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { AuthAPI } from '@/lib/api/auth-api'

export function PatientViewBanner() {
  const { patientId, isViewingOtherPatient } = usePatientContext()
  const router = useRouter()
  const [patientName, setPatientName] = useState<string | null>(null)

  useEffect(() => {
    if (isViewingOtherPatient && patientId) {
      // Fetch patient name
      const fetchPatientName = async () => {
        try {
          const response = await AuthAPI.getAccessiblePatients()
          const patient = response.accessible_patients?.find(
            p => p.patient_id === patientId
          )
          if (patient) {
            setPatientName(patient.patient_name)
          }
        } catch (error) {
          console.error('Failed to fetch patient name:', error)
        }
      }
      fetchPatientName()
    } else {
      setPatientName(null)
    }
  }, [isViewingOtherPatient, patientId])

  if (!isViewingOtherPatient) return null

  const handleClearPatient = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('patientId')
    router.push(url.pathname + url.search)
  }

  return (
    <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <AlertDescription className="flex items-center justify-between">
        <span>
          Viewing data for: <strong>{patientName || `Patient #${patientId}`}</strong>
        </span>
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

