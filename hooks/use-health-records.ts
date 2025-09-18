import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { 
  HealthRecordsApiService, 
  HealthRecordSection, 
  HealthRecordMetric, 
  HealthRecord,
  AnalysisDashboardResponse,
  SectionWithMetrics,
  MetricWithData
} from '@/lib/api/health-records-api'

// ============================================================================
// HEALTH RECORD SECTIONS HOOK
// ============================================================================

export function useHealthRecordSections() {
  const [sections, setSections] = useState<HealthRecordSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSections = async (typeId?: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await HealthRecordsApiService.getSections(typeId)
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
    display_name: string
    description?: string
    health_record_type_id: number
    is_default?: boolean
  }) => {
    try {
      const newSection = await HealthRecordsApiService.createSection(section)
      setSections(prev => {
        const exists = prev.some(section => section.id === newSection.id)
        if (exists) {
          console.log('Hook: Section already exists, not adding duplicate:', newSection.id)
          return prev
        }
        return [...prev, newSection]
      })
      toast.success('Section created successfully')
      return newSection
    } catch (err: any) {
      toast.error(`Failed to create section: ${err.message}`)
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
    loadSections,
    createSection
  }
}

// ============================================================================
// HEALTH RECORD METRICS HOOK
// ============================================================================

export function useHealthRecordMetrics(sectionId: number) {
  const [metrics, setMetrics] = useState<HealthRecordMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = async () => {
    if (!sectionId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await HealthRecordsApiService.getMetrics(sectionId)
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
    display_name: string
    description?: string
    default_unit?: string
    threshold?: any
    data_type: string
  }) => {
    try {
      const newMetric = await HealthRecordsApiService.createMetric(metric)
      setMetrics(prev => [...prev, newMetric])
      toast.success('Metric created successfully')
      return newMetric
    } catch (err: any) {
      toast.error(`Failed to create metric: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [sectionId])

  return {
    metrics,
    loading,
    error,
    loadMetrics,
    createMetric
  }
}

// ============================================================================
// HEALTH RECORDS (DATA POINTS) HOOK
// ============================================================================

export function useHealthRecords(metricId: number) {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecords = async () => {
    if (!metricId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await HealthRecordsApiService.getHealthRecords(metricId)
      setRecords(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load records: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createRecord = async (record: {
    section_id: number
    metric_id: number
    value: any
    status?: string
    recorded_at: string
    notes?: string
    source?: string
  }) => {
    try {
      const newRecord = await HealthRecordsApiService.createHealthRecord(record)
      setRecords(prev => [newRecord, ...prev])
      toast.success('Record created successfully')
      return newRecord
    } catch (err: any) {
      toast.error(`Failed to create record: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    loadRecords()
  }, [metricId])

  return {
    records,
    loading,
    error,
    loadRecords,
    createRecord
  }
}


// ============================================================================
// ANALYSIS DASHBOARD HOOK
// ============================================================================

export function useAnalysisDashboard() {
  const [dashboard, setDashboard] = useState<AnalysisDashboardResponse | null>(null)
  const [sections, setSections] = useState<SectionWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Analysis health record type ID (should be configured/known)
      const ANALYSIS_TYPE_ID = 1
      
      // Get combined sections and templates in one call
      const response = await HealthRecordsApiService.getSectionsCombined(ANALYSIS_TYPE_ID)
      
      const userSections = response.user_sections || []
      const adminTemplates = response.admin_templates || []
      
      // Combine all sections (user sections + admin templates) for display
      const allSections = [...userSections, ...adminTemplates]
      
      // Create dashboard response with only user sections
      const dashboardData: AnalysisDashboardResponse = {
        sections: userSections.map(section => ({
          id: section.id,
          name: section.name,
          display_name: section.display_name,
          description: section.description,
          metrics: [] // Will be populated when metrics are loaded
        })),
        latest_analysis: null,
        summary_stats: {
          total_sections: userSections.length,
          total_metrics: 0,
          total_data_points: 0,
          abnormal_metrics: 0,
          normal_metrics: 0
        }
      }
      
      setDashboard(dashboardData)
      // Convert HealthRecordSection[] to SectionWithMetrics[]
      const sectionsWithMetrics: SectionWithMetrics[] = allSections.map(section => ({
        id: section.id,
        name: section.name,
        display_name: section.display_name,
        description: section.description,
        is_default: section.is_default,
        metrics: (section.metrics || []).map(metric => ({
          ...metric,
          data_points: (metric as any).data_points || [],
          latest_value: (metric as any).latest_value,
          latest_status: (metric as any).latest_status,
          latest_recorded_at: (metric as any).latest_recorded_at,
          total_records: (metric as any).total_records || 0
        }))
      }))
      setSections(sectionsWithMetrics)
      
      console.log('Hook: All sections loaded:', allSections)
      console.log('Hook: Dashboard data created:', dashboardData)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load dashboard: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await loadDashboard()
  }

  const createSection = async (section: {
    name: string
    display_name: string
    description?: string
    health_record_type_id: number
    is_default?: boolean
  }) => {
    try {
      const newSection = await HealthRecordsApiService.createSection(section)
      
      // Don't update state here - let the page component handle it via handleSectionCreated
      // This prevents duplicate sections from being added to the state
      
      return newSection
    } catch (err: any) {
      toast.error(`Failed to create section: ${err.message}`)
      throw err
    }
  }

  const createMetric = async (metric: {
    section_id: number
    name: string
    display_name: string
    description?: string
    default_unit?: string
    threshold?: any
    data_type: string
  }) => {
    try {
      const newMetric = await HealthRecordsApiService.createMetric(metric)
      
      // Don't update state here - let the page component handle it via handleMetricCreated
      // This prevents duplicate metrics from being added to the state
      
      return newMetric
    } catch (err: any) {
      toast.error(`Failed to create metric: ${err.message}`)
      throw err
    }
  }

  const createRecord = async (record: {
    section_id: number
    metric_id: number
    value: any
    status?: string
    recorded_at: string
    notes?: string
    source?: string
  }) => {
    try {
      console.log('Hook: Creating health record:', record)
      const newRecord = await HealthRecordsApiService.createHealthRecord(record)
      console.log('Hook: Health record created successfully:', newRecord)
      
      // Don't update state here - let the page component handle it via handleValueCreated
      return newRecord
    } catch (err: any) {
      console.error('Hook: Failed to create record:', err)
      toast.error(`Failed to create record: ${err.message}`)
      throw err
    }
  }

  const refreshMetric = async (metricId: number) => {
    // For now, just refresh the entire dashboard
    // In the future, this could be optimized to only refresh the specific metric
    await refresh()
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  return {
    dashboard,
    sections,
    setSections,
    loading,
    error,
    loadDashboard,
    refresh,
    createSection,
    createMetric,
    createRecord,
    refreshMetric
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatMetricValue(value: any, unit?: string): string {
  if (value === null || value === undefined) return 'N/A'
  
  // Handle object values (e.g., {value: 20})
  if (typeof value === 'object' && value !== null) {
    if (value.value !== undefined) {
      value = value.value
    } else {
      return 'N/A'
    }
  }
  
  // Convert to number and validate
  const numericValue = Number(value)
  if (isNaN(numericValue)) return 'N/A'
  
  return `${numericValue.toFixed(1)}${unit ? ` ${unit}` : ''}`
}

export function formatReferenceRange(min?: number, max?: number): string {
  if (min === undefined && max === undefined) return 'N/A'
  if (min === undefined) return `≤ ${max}`
  if (max === undefined) return `≥ ${min}`
  return `${min} - ${max}`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'normal': return 'text-green-600'
    case 'abnormal': return 'text-yellow-600'
    case 'critical': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

export function getTrendColor(trend: string): string {
  switch (trend) {
    case 'improving': return 'text-green-600'
    case 'declining': return 'text-red-600'
    case 'stable': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}
