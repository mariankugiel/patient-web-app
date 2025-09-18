import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { 
  HealthMetricsApiService, 
  HealthMetricSection, 
  HealthMetric, 
  HealthMetricDataPoint,
  AnalysisDashboardResponse,
  SectionWithMetrics,
  MetricWithData
} from '@/lib/api/health-metrics-api'

// ============================================================================
// HEALTH METRIC SECTIONS HOOK
// ============================================================================

export function useHealthMetricSections() {
  const [sections, setSections] = useState<HealthMetricSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSections = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await HealthMetricsApiService.getSections()
      setSections(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load sections: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createSection = async (section: {
    name: string
    description?: string
    display_order?: number
  }) => {
    try {
      const newSection = await HealthMetricsApiService.createSection(section)
      setSections(prev => [...prev, newSection])
      toast.success('Section created successfully')
      return newSection
    } catch (err: any) {
      toast.error(`Failed to create section: ${err.message}`)
      throw err
    }
  }

  const updateSection = async (sectionId: number, section: {
    name?: string
    description?: string
    display_order?: number
    is_active?: boolean
  }) => {
    try {
      const updatedSection = await HealthMetricsApiService.updateSection(sectionId, section)
      setSections(prev => prev.map(s => s.id === sectionId ? updatedSection : s))
      toast.success('Section updated successfully')
      return updatedSection
    } catch (err: any) {
      toast.error(`Failed to update section: ${err.message}`)
      throw err
    }
  }

  const deleteSection = async (sectionId: number) => {
    try {
      await HealthMetricsApiService.deleteSection(sectionId)
      setSections(prev => prev.filter(s => s.id !== sectionId))
      toast.success('Section deleted successfully')
    } catch (err: any) {
      toast.error(`Failed to delete section: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    loadSections()
  }, [])

  return {
    sections,
    loading,
    error,
    createSection,
    updateSection,
    deleteSection,
    refresh: loadSections
  }
}

// ============================================================================
// HEALTH METRICS HOOK
// ============================================================================

export function useHealthMetrics(sectionId: number) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await HealthMetricsApiService.getMetricsBySection(sectionId)
      setMetrics(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load metrics: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createMetric = async (metric: {
    section_id: number
    name: string
    unit?: string
    normal_range_min?: number
    normal_range_max?: number
    description?: string
  }) => {
    try {
      const newMetric = await HealthMetricsApiService.createMetric(metric)
      setMetrics(prev => [...prev, newMetric])
      toast.success('Metric created successfully')
      return newMetric
    } catch (err: any) {
      toast.error(`Failed to create metric: ${err.message}`)
      throw err
    }
  }

  const updateMetric = async (metricId: number, metric: {
    name?: string
    unit?: string
    normal_range_min?: number
    normal_range_max?: number
    description?: string
    is_active?: boolean
  }) => {
    try {
      const updatedMetric = await HealthMetricsApiService.updateMetric(metricId, metric)
      setMetrics(prev => prev.map(m => m.id === metricId ? updatedMetric : m))
      toast.success('Metric updated successfully')
      return updatedMetric
    } catch (err: any) {
      toast.error(`Failed to update metric: ${err.message}`)
      throw err
    }
  }

  const deleteMetric = async (metricId: number) => {
    try {
      await HealthMetricsApiService.deleteMetric(metricId)
      setMetrics(prev => prev.filter(m => m.id !== metricId))
      toast.success('Metric deleted successfully')
    } catch (err: any) {
      toast.error(`Failed to delete metric: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    if (sectionId) {
      loadMetrics()
    }
  }, [sectionId])

  return {
    metrics,
    loading,
    error,
    createMetric,
    updateMetric,
    deleteMetric,
    refresh: loadMetrics
  }
}

// ============================================================================
// HEALTH METRIC DATA POINTS HOOK
// ============================================================================

export function useHealthMetricDataPoints(metricId: number, days: number = 90) {
  const [dataPoints, setDataPoints] = useState<HealthMetricDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDataPoints = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await HealthMetricsApiService.getDataPoints(metricId, days)
      setDataPoints(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load data points: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createDataPoint = async (dataPoint: {
    metric_id: number
    value: number
    recorded_date: string
    status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
    notes?: string
    source?: string
  }) => {
    try {
      const newDataPoint = await HealthMetricsApiService.createDataPoint(dataPoint)
      setDataPoints(prev => [newDataPoint, ...prev])
      toast.success('Data point added successfully')
      return newDataPoint
    } catch (err: any) {
      toast.error(`Failed to add data point: ${err.message}`)
      throw err
    }
  }

  const updateDataPoint = async (dataPointId: number, dataPoint: {
    value?: number
    recorded_date?: string
    status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
    notes?: string
    source?: string
  }) => {
    try {
      const updatedDataPoint = await HealthMetricsApiService.updateDataPoint(dataPointId, dataPoint)
      setDataPoints(prev => prev.map(dp => dp.id === dataPointId ? updatedDataPoint : dp))
      toast.success('Data point updated successfully')
      return updatedDataPoint
    } catch (err: any) {
      toast.error(`Failed to update data point: ${err.message}`)
      throw err
    }
  }

  const deleteDataPoint = async (dataPointId: number) => {
    try {
      await HealthMetricsApiService.deleteDataPoint(dataPointId)
      setDataPoints(prev => prev.filter(dp => dp.id !== dataPointId))
      toast.success('Data point deleted successfully')
    } catch (err: any) {
      toast.error(`Failed to delete data point: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    if (metricId) {
      loadDataPoints()
    }
  }, [metricId, days])

  return {
    dataPoints,
    loading,
    error,
    createDataPoint,
    updateDataPoint,
    deleteDataPoint,
    refresh: loadDataPoints
  }
}

// ============================================================================
// ANALYSIS DASHBOARD HOOK
// ============================================================================

export function useAnalysisDashboard() {
  const [dashboard, setDashboard] = useState<AnalysisDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await HealthMetricsApiService.getAnalysisDashboard()
      setDashboard(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load dashboard: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createSection = async (section: {
    name: string
    description?: string
    display_order?: number
  }) => {
    try {
      const newSection = await HealthMetricsApiService.createSection(section)
      // Add the new section to the dashboard state
      if (dashboard) {
        const newSectionWithMetrics = {
          ...newSection,
          metrics: []
        }
        setDashboard({
          ...dashboard,
          sections: [...dashboard.sections, newSectionWithMetrics]
        })
      }
      toast.success('Section created successfully')
      return newSection
    } catch (err: any) {
      toast.error(`Failed to create section: ${err.message}`)
      throw err
    }
  }

  const createMetric = async (metric: {
    section_id: number
    name: string
    unit?: string
    normal_range_min?: number
    normal_range_max?: number
    description?: string
  }) => {
    try {
      const newMetric = await HealthMetricsApiService.createMetric(metric)
      
      // Update the specific section in the dashboard state
      if (dashboard) {
        const updatedSections = dashboard.sections.map(section => {
          if (section.id === metric.section_id) {
            // Check if this metric already exists in the state
            const existingMetricIndex = section.metrics.findIndex(m => m.id === newMetric.id)
            
            if (existingMetricIndex >= 0) {
              // Metric already exists in state, just return the section as is
              return section
            } else {
              // Metric doesn't exist in state, add it (whether it's new or existing from backend)
              return {
                ...section,
                metrics: [...section.metrics, {
                  ...newMetric,
                  data_points: [],
                  current_status: 'unknown' as 'normal' | 'abnormal' | 'critical' | 'unknown',
                  current_value: 0,
                  change_from_previous: 0,
                  trend: 'stable' as 'improving' | 'declining' | 'stable'
                }]
              }
            }
          }
          return section
        })
        
        setDashboard({
          ...dashboard,
          sections: updatedSections
        })
      }
      
      toast.success('Metric created successfully')
      return newMetric
    } catch (err: any) {
      toast.error(`Failed to create metric: ${err.message}`)
      throw err
    }
  }

  const createDataPoint = async (dataPoint: {
    metric_id: number
    value: number
    recorded_date: string
    status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
    notes?: string
    source?: string
  }) => {
    try {
      const newDataPoint = await HealthMetricsApiService.createDataPoint(dataPoint)
      // Update the specific metric in the dashboard state
      if (dashboard) {
        const updatedSections = dashboard.sections.map(section => ({
          ...section,
          metrics: section.metrics.map(metric => {
            if (metric.id === dataPoint.metric_id) {
              // Add the new data point and update current values
              const updatedDataPoints = [...metric.data_points, newDataPoint]
              const sortedDataPoints = updatedDataPoints.sort((a, b) => 
                new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime()
              )
              
              // Calculate current status and trend based on the latest data
              const latestDataPoint = sortedDataPoints[0]
              const previousDataPoint = sortedDataPoints[1]
              
              let currentStatus = 'unknown'
              if (metric.normal_range_min !== undefined && metric.normal_range_max !== undefined) {
                if (latestDataPoint.value < metric.normal_range_min || latestDataPoint.value > metric.normal_range_max) {
                  currentStatus = 'abnormal'
                } else {
                  currentStatus = 'normal'
                }
              }
              
              let trend = 'stable'
              let changeFromPrevious = 0
              if (previousDataPoint) {
                changeFromPrevious = latestDataPoint.value - previousDataPoint.value
                if (changeFromPrevious > 0) {
                  trend = 'improving'
                } else if (changeFromPrevious < 0) {
                  trend = 'declining'
                }
              }
              
              return {
                ...metric,
                data_points: updatedDataPoints,
                current_status: currentStatus as 'normal' | 'abnormal' | 'critical' | 'unknown',
                current_value: latestDataPoint.value,
                change_from_previous: changeFromPrevious,
                trend: trend as 'improving' | 'declining' | 'stable'
              }
            }
            return metric
          })
        }))
        
        setDashboard({
          ...dashboard,
          sections: updatedSections
        })
      }
      toast.success('Data point added successfully')
      return newDataPoint
    } catch (err: any) {
      toast.error(`Failed to add data point: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const refreshMetric = async (metricId: number) => {
    try {
      // Get the specific metric data from the API
      const metricData = await HealthMetricsApiService.getMetric(metricId)
      
      if (dashboard) {
        const updatedSections = dashboard.sections.map(section => ({
          ...section,
          metrics: section.metrics.map(metric => 
            metric.id === metricId ? metricData : metric
          )
        }))
        
        setDashboard({
          ...dashboard,
          sections: updatedSections
        })
      }
    } catch (err: any) {
      console.error('Failed to refresh metric:', err)
      // Fallback to full dashboard refresh
      await loadDashboard()
    }
  }

  return {
    dashboard,
    loading,
    error,
    createSection,
    createMetric,
    createDataPoint,
    refresh: loadDashboard,
    refreshMetric
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatMetricValue(value: number, unit?: string): string {
  if (unit) {
    return `${value} ${unit}`
  }
  return value.toString()
}

export function formatReferenceRange(min?: number, max?: number, unit?: string): string {
  if (min !== undefined && max !== undefined) {
    return `${min}-${max} ${unit || ''}`.trim()
  } else if (min !== undefined) {
    return `>${min} ${unit || ''}`.trim()
  } else if (max !== undefined) {
    return `<${max} ${unit || ''}`.trim()
  }
  return 'N/A'
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'normal':
      return 'text-green-600'
    case 'abnormal':
      return 'text-yellow-600'
    case 'critical':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export function getTrendColor(trend: string): string {
  switch (trend) {
    case 'improving':
      return 'text-green-500'
    case 'declining':
      return 'text-red-500'
    case 'stable':
      return 'text-yellow-500'
    default:
      return 'text-gray-500'
  }
}

export function calculateChangePercentage(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}