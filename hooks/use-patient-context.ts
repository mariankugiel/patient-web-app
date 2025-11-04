import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export function usePatientContext() {
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')
  
  return useMemo(() => {
    const parsedPatientId = patientId ? parseInt(patientId, 10) : null
    if (isNaN(parsedPatientId as any)) {
      console.warn('⚠️ [usePatientContext] Invalid patientId in URL:', patientId)
    } else if (parsedPatientId) {
      console.log('✅ [usePatientContext] patientId from URL:', parsedPatientId)
    }
    return {
      patientId: parsedPatientId,
      isViewingOtherPatient: !!parsedPatientId,
      patientIdParam: parsedPatientId ? { patient_id: parsedPatientId } : {}
    }
  }, [patientId])
}

