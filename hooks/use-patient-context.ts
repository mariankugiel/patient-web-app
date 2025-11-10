import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export function usePatientContext() {
  const searchParams = useSearchParams()
  const patientTokenParam = searchParams.get('patientToken')
  const legacyPatientIdParam = searchParams.get('patientId')

  return useMemo(() => {
    const parsedLegacyId = legacyPatientIdParam ? parseInt(legacyPatientIdParam, 10) : null
    if (legacyPatientIdParam && (parsedLegacyId === null || isNaN(parsedLegacyId))) {
      console.warn('⚠️ [usePatientContext] Invalid patientId in URL:', legacyPatientIdParam)
    }

    if (patientTokenParam) {
      console.log('✅ [usePatientContext] patientToken detected in URL')
    } else if (parsedLegacyId) {
      console.log('✅ [usePatientContext] legacy patientId from URL:', parsedLegacyId)
    }

    return {
      patientToken: patientTokenParam,
      legacyPatientId: parsedLegacyId,
      isViewingOtherPatient: Boolean(patientTokenParam || parsedLegacyId),
    }
  }, [patientTokenParam, legacyPatientIdParam])
}

