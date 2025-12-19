import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { 
  HealthRecordsApiService, 
  SummaryDataResponse
} from '@/lib/api/health-records-api'
import { useSwitchedPatient } from '@/contexts/patient-context'

export function useSummaryData() {
  const { patientToken, patientId } = useSwitchedPatient()
  const [summaryData, setSummaryData] = useState<SummaryDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummaryData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await HealthRecordsApiService.getSummaryData(
        patientId || undefined,
        patientToken || undefined
      )
      
      setSummaryData(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load summary data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [patientId, patientToken])

  useEffect(() => {
    loadSummaryData()
  }, [loadSummaryData])

  return {
    summaryData,
    loading,
    error,
    refresh: loadSummaryData
  }
}

