import apiClient from './axios-config'

// ============================================================================
// TYPES
// ============================================================================

export interface HealthMetricSection {
  id: number
  name: string
  description?: string
  display_order: number
  is_active: boolean
  created_by: number
  created_at: string
  updated_at?: string
  updated_by?: number
  metrics_count: number
}

export interface HealthMetric {
  id: number
  section_id: number
  name: string
  unit?: string
  reference_data?: any
  description?: string
  is_active: boolean
  created_by: number
  created_at: string
  updated_at?: string
  updated_by?: number
  data_points_count: number
}

export interface HealthMetricDataPoint {
  id: number
  metric_id: number
  user_id: number
  value: number
  recorded_date: string
  status: 'normal' | 'abnormal' | 'critical' | 'unknown'
  notes?: string
  source?: string
  created_at: string
  updated_at?: string
  updated_by?: number
}

export interface MetricWithData {
  id: number
  name: string
  unit?: string
  reference_data?: any
  current_value?: number
  current_status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
  trend?: 'improving' | 'declining' | 'stable' | 'unknown'
  change_from_previous?: number
  data_points: HealthMetricDataPoint[]
}

export interface SectionWithMetrics {
  id: number
  name: string
  description?: string
  display_order: number
  metrics: MetricWithData[]
}

export interface HealthAnalysis {
  id: number
  user_id: number
  analysis_date: string
  analysis_type: string
  insights?: any
  areas_of_concern?: any[]
  positive_trends?: any[]
  recommendations?: any[]
  created_at: string
  updated_at?: string
  updated_by?: number
}

export interface HealthMetricTemplate {
  id: number
  section_name: string
  metric_name: string
  unit?: string
  normal_range_min?: number
  normal_range_max?: number
  description?: string
  is_active: boolean
  created_by: number
  created_at: string
  updated_at?: string
  updated_by?: number
}

export interface MetricSuggestion {
  type: 'existing' | 'template'
  name: string
  unit?: string
  reference_data?: any
  count?: number
  section_name?: string
}

export interface AnalysisDashboardResponse {
  sections: SectionWithMetrics[]
  latest_analysis?: HealthAnalysis
  summary_stats?: {
    total_metrics: number
    total_data_points: number
    abnormal_metrics: number
    normal_metrics: number
  }
}

// ============================================================================
// API SERVICE
// ============================================================================

export class HealthMetricsApiService {
  // Health Metric Sections
  static async createSection(section: {
    name: string
    description?: string
    display_order?: number
  }): Promise<HealthMetricSection> {
    try {
      const response = await apiClient.post('/health-metrics/sections', section)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create section'
      throw new Error(message)
    }
  }

  static async getSections(): Promise<HealthMetricSection[]> {
    try {
      const response = await apiClient.get('/health-metrics/sections')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get sections'
      throw new Error(message)
    }
  }

  static async getSectionById(sectionId: number): Promise<HealthMetricSection> {
    try {
      const response = await apiClient.get(`/health-metrics/sections/${sectionId}`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get section'
      throw new Error(message)
    }
  }

  static async updateSection(sectionId: number, section: {
    name?: string
    description?: string
    display_order?: number
    is_active?: boolean
  }): Promise<HealthMetricSection> {
    try {
      const response = await apiClient.put(`/health-metrics/sections/${sectionId}`, section)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to update section'
      throw new Error(message)
    }
  }

  static async deleteSection(sectionId: number): Promise<void> {
    try {
      await apiClient.delete(`/health-metrics/sections/${sectionId}`)
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete section'
      throw new Error(message)
    }
  }

  // Health Metrics
  static async createMetric(metric: {
    section_id: number
    name: string
    unit?: string
    reference_data?: any
    description?: string
  }): Promise<HealthMetric> {
    try {
      const response = await apiClient.post('/health-metrics/metrics', metric)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create metric'
      throw new Error(message)
    }
  }

  static async getMetricsBySection(sectionId: number): Promise<HealthMetric[]> {
    try {
      const response = await apiClient.get(`/health-metrics/sections/${sectionId}/metrics`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get metrics'
      throw new Error(message)
    }
  }

  static async getMetric(metricId: number): Promise<MetricWithData> {
    try {
      const response = await apiClient.get(`/health-metrics/metrics/${metricId}`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get metric'
      throw new Error(message)
    }
  }

  static async updateMetric(metricId: number, metric: {
    name?: string
    unit?: string
    reference_data?: any
    description?: string
    is_active?: boolean
  }): Promise<HealthMetric> {
    try {
      const response = await apiClient.put(`/health-metrics/metrics/${metricId}`, metric)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to update metric'
      throw new Error(message)
    }
  }

  static async deleteMetric(metricId: number): Promise<void> {
    try {
      await apiClient.delete(`/health-metrics/metrics/${metricId}`)
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete metric'
      throw new Error(message)
    }
  }

  // Health Metric Data Points
  static async createDataPoint(dataPoint: {
    metric_id: number
    value: number
    recorded_date: string
    status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
    notes?: string
    source?: string
  }): Promise<HealthMetricDataPoint> {
    try {
      const response = await apiClient.post('/health-metrics/data-points', dataPoint)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create data point'
      throw new Error(message)
    }
  }

  static async getDataPoints(metricId: number, days: number = 90): Promise<HealthMetricDataPoint[]> {
    try {
      const response = await apiClient.get(`/health-metrics/metrics/${metricId}/data-points?days=${days}`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get data points'
      throw new Error(message)
    }
  }

  static async updateDataPoint(dataPointId: number, dataPoint: {
    value?: number
    recorded_date?: string
    status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
    notes?: string
    source?: string
  }): Promise<HealthMetricDataPoint> {
    try {
      const response = await apiClient.put(`/health-metrics/data-points/${dataPointId}`, dataPoint)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to update data point'
      throw new Error(message)
    }
  }

  static async deleteDataPoint(dataPointId: number): Promise<void> {
    try {
      await apiClient.delete(`/health-metrics/data-points/${dataPointId}`)
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete data point'
      throw new Error(message)
    }
  }

  // Analysis Dashboard
  static async getAnalysisDashboard(): Promise<AnalysisDashboardResponse> {
    try {
      const response = await apiClient.get('/health-metrics/dashboard')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get analysis dashboard'
      throw new Error(message)
    }
  }

  // Helper function to generate 3 months of sample data for testing
  static generateSampleData(metricName: string, unit: string, normalMin: number, normalMax: number): HealthMetricDataPoint[] {
    const dataPoints: HealthMetricDataPoint[] = []
    const now = new Date()
    
    // Generate data for the last 3 months (90 days)
    for (let i = 90; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Generate realistic data with some variation
      const baseValue = (normalMin + normalMax) / 2
      const variation = (normalMax - normalMin) * 0.3
      const randomVariation = (Math.random() - 0.5) * variation
      const value = Math.max(0, baseValue + randomVariation)
      
      // Determine status based on value
      let status: 'normal' | 'abnormal' | 'critical' | 'unknown' = 'normal'
      if (value < normalMin * 0.8 || value > normalMax * 1.2) {
        status = 'critical'
      } else if (value < normalMin || value > normalMax) {
        status = 'abnormal'
      }
      
      dataPoints.push({
        id: i,
        metric_id: 1,
        user_id: 1,
        value: Math.round(value * 100) / 100,
        recorded_date: date.toISOString(),
        status,
        notes: '',
        source: 'sample_data',
        created_at: date.toISOString(),
        updated_at: undefined,
        updated_by: undefined
      })
    }
    
    return dataPoints
  }

  // Health Metric Template Methods
  static async getTemplates(sectionName?: string): Promise<HealthMetricTemplate[]> {
    try {
      const params = sectionName ? `?section_name=${encodeURIComponent(sectionName)}` : ''
      const response = await apiClient.get(`/health-metrics/templates${params}`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get templates'
      throw new Error(message)
    }
  }

  static async searchTemplates(query: string, limit: number = 10): Promise<HealthMetricTemplate[]> {
    try {
      const response = await apiClient.get(`/health-metrics/templates/search?q=${encodeURIComponent(query)}&limit=${limit}`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to search templates'
      throw new Error(message)
    }
  }

  static async getMetricSuggestions(metricName: string): Promise<MetricSuggestion[]> {
    try {
      const response = await apiClient.get(`/health-metrics/suggestions?metric_name=${encodeURIComponent(metricName)}`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get metric suggestions'
      throw new Error(message)
    }
  }

  static async createTemplate(template: {
    section_name: string
    metric_name: string
    unit?: string
    reference_data?: any
    description?: string
  }): Promise<HealthMetricTemplate> {
    try {
      const response = await apiClient.post('/health-metrics/templates', template)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create template'
      throw new Error(message)
    }
  }
}
