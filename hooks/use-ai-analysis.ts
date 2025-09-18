import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { aiAnalysisApiService, AIAnalysisResult, AIAnalysisStatus } from '@/lib/api/ai-analysis-api'

export function useAIAnalysis() {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serviceStatus, setServiceStatus] = useState<AIAnalysisStatus | null>(null)

  const generateAnalysis = useCallback(async (healthRecordTypeId: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Generating AI analysis...')
      const result = await aiAnalysisApiService.generateAnalysis(healthRecordTypeId)
      
      console.log('Hook received result:', result)
      console.log('Result type:', typeof result)
      console.log('Result success field:', result?.success)
      console.log('Result keys:', Object.keys(result || {}))
      
      if (result.success) {
        console.log('Going to success path')
        setAnalysis(result)
        toast.success('AI analysis completed successfully!')
        console.log('AI analysis result:', result)
      } else {
        console.log('Going to fallback path')
        // AI analysis failed but we still got a response with fallback analysis
        setAnalysis(result)
        toast.warning(`AI analysis failed: ${result.message}. Showing fallback analysis.`)
        console.log('AI analysis failed, using fallback:', result)
      }
      
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate AI analysis'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('AI analysis error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getServiceStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const status = await aiAnalysisApiService.getServiceStatus()
      setServiceStatus(status)
      return status
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get AI analysis status'
      setError(errorMessage)
      console.error('AI analysis status error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearAnalysis = useCallback(() => {
    setAnalysis(null)
    setError(null)
  }, [])

  const refreshAnalysis = useCallback(async (healthRecordTypeId: number = 1) => {
    return await generateAnalysis(healthRecordTypeId)
  }, [generateAnalysis])

  return {
    analysis,
    loading,
    error,
    serviceStatus,
    generateAnalysis,
    getServiceStatus,
    clearAnalysis,
    refreshAnalysis
  }
}
