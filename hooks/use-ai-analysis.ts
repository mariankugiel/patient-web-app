import { useState, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import { aiAnalysisApiService, AIAnalysisResult, AIAnalysisStatus } from '@/lib/api/ai-analysis-api'

// Global state to store analyses by type ID across all hook instances
const globalAnalyses = new Map<number, AIAnalysisResult>()
const globalLoading = new Map<number, boolean>()
const globalErrors = new Map<number, string | null>()

export function useAIAnalysis(healthRecordTypeId: number = 1) {
  // Use global state but with type-specific keys
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(globalAnalyses.get(healthRecordTypeId) || null)
  const [loading, setLoading] = useState<boolean>(globalLoading.get(healthRecordTypeId) || false)
  const [error, setError] = useState<string | null>(globalErrors.get(healthRecordTypeId) || null)
  const [serviceStatus, setServiceStatus] = useState<AIAnalysisStatus | null>(null)

  const generateAnalysis = useCallback(async (forceCheck: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      globalLoading.set(healthRecordTypeId, true)
      globalErrors.set(healthRecordTypeId, null)
      
      const result = await aiAnalysisApiService.generateAnalysis(healthRecordTypeId, forceCheck)
      
      if (result.success) {
        // Store the result in both local and global state
        setAnalysis(result)
        globalAnalyses.set(healthRecordTypeId, result)
        
        // Show success message only for newly generated analysis
        if (!result.cached) {
          toast.success('AI analysis completed successfully!')
        }
        
      } else {
        // AI analysis failed - don't store fallback analysis, set to null
        setAnalysis(null)
        globalAnalyses.delete(healthRecordTypeId)
      }
      
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate AI analysis'
      setError(errorMessage)
      globalErrors.set(healthRecordTypeId, errorMessage)
      toast.error(errorMessage)
      console.error('AI analysis error:', err)
      throw err
    } finally {
      setLoading(false)
      globalLoading.set(healthRecordTypeId, false)
    }
  }, [healthRecordTypeId])

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
    globalAnalyses.delete(healthRecordTypeId)
    globalErrors.delete(healthRecordTypeId)
  }, [healthRecordTypeId])

  const refreshAnalysis = useCallback(async (forceRegenerate: boolean = false) => {
    return await generateAnalysis(forceRegenerate)
  }, [generateAnalysis])

  const checkForNewRecords = useCallback(async () => {
    try {
      const result = await aiAnalysisApiService.checkForNewRecords(healthRecordTypeId)
      return result
    } catch (error: any) {
      console.error('Failed to check for new records:', error)
      return { hasNewRecords: false, reason: 'Unable to check for new records' }
    }
  }, [healthRecordTypeId])

  const checkForUpdates = useCallback(async () => {
    try {
      console.log('Checking for updates...')
      // Always force regeneration when user clicks "Check for Updates"
      // This ensures the analysis is refreshed with any new data
      console.log('Force regenerating analysis...')
      return await generateAnalysis(true)
    } catch (error: any) {
      console.error('Failed to check for updates:', error)
      throw error
    }
  }, [generateAnalysis])

  return {
    analysis,
    loading,
    error,
    serviceStatus,
    generateAnalysis,
    getServiceStatus,
    clearAnalysis,
    refreshAnalysis,
    checkForNewRecords,
    checkForUpdates
  }
}
