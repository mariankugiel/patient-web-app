import apiClient from './axios-config'

// Types for AI Analysis API
export interface AIAnalysisResult {
  success: boolean
  message: string
  analysis: {
    overall_assessment?: string
    summary?: string
    areas_of_concern?: string[]
    positive_trends?: string[]
    recommendations?: string[]
    risk_factors?: string[]
    next_steps?: string[]
  }
  generated_at?: string
  cached?: boolean
  reason?: string
  data_summary?: {
    total_sections: number
    total_metrics: number
    total_data_points: number
  }
}

export interface AIAnalysisStatus {
  service_status: string
  model: string
  features: string[]
  supported_data_types: string[]
}

class AIAnalysisApiService {
  /**
   * Generate AI-powered health analysis
   */
  async generateAnalysis(healthRecordTypeId: number = 1, forceCheck: boolean = false): Promise<AIAnalysisResult> {
    try {
      console.log('Making AI analysis request to /ai-analysis/analyze...')
      console.log('Request payload:', { health_record_type_id: healthRecordTypeId, force_check: forceCheck })
      const response = await apiClient.post('/ai-analysis/analyze', {
        health_record_type_id: healthRecordTypeId,
        force_check: forceCheck
      }, {
        timeout: 60000 // 60 seconds timeout for AI analysis
      })
      console.log('AI analysis response status:', response.status)
      console.log('AI analysis response data:', response.data)
      console.log('Response data type:', typeof response.data)
      console.log('Response data success field:', response.data?.success)
      console.log('Response data keys:', Object.keys(response.data || {}))
      return response.data
    } catch (error: any) {
      console.error('Failed to generate AI analysis:', error)
      console.error('Error response:', error.response)
      console.error('Error status:', error.response?.status)
      console.error('Error data:', error.response?.data)
      
      // Handle different types of errors
      if (error.response?.status === 500) {
        // Server error - might still have fallback analysis
        if (error.response?.data?.analysis) {
          console.log('Server error but has fallback analysis, returning it')
          return error.response.data
        }
        throw new Error(error.response?.data?.detail || 'AI analysis service error')
      } else if (error.response?.status === 403) {
        throw new Error('AI analysis not available in your region')
      } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
        throw new Error('Network connection error. Please check your internet connection.')
      } else if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        throw new Error('AI analysis is taking longer than expected. Please try again.')
      } else {
        throw new Error(error.response?.data?.detail || error.message || 'Failed to generate AI analysis')
      }
    }
  }

  /**
   * Get AI analysis service status
   */
  async getServiceStatus(): Promise<AIAnalysisStatus> {
    try {
      const response = await apiClient.get('/ai-analysis/status')
      return response.data
    } catch (error: any) {
      console.error('Failed to get AI analysis status:', error)
      throw new Error(error.response?.data?.detail || 'Failed to get AI analysis status')
    }
  }

  /**
   * Check if there are new records since last analysis
   */
  async checkForNewRecords(healthRecordTypeId: number = 1): Promise<{ hasNewRecords: boolean; reason: string }> {
    try {
      console.log('Making request to check for new records...', { healthRecordTypeId })
      const response = await apiClient.get(`/ai-analysis/check-new-records?health_record_type_id=${healthRecordTypeId}`)
      console.log('Check new records response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Failed to check for new records:', error)
      // If the endpoint doesn't exist yet, assume no new records
      return { hasNewRecords: false, reason: 'Unable to check for new records' }
    }
  }
}

// Export singleton instance
export const aiAnalysisApiService = new AIAnalysisApiService()
export default aiAnalysisApiService
