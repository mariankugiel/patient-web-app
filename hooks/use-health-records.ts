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
    section_template_id?: number
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
    value: number
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

export function useAnalysisDashboard(healthRecordTypeId: number = 1, patientId?: number | null) {
  const [dashboard, setDashboard] = useState<AnalysisDashboardResponse | null>(null)
  const [sections, setSections] = useState<SectionWithMetrics[]>([])
  const [adminTemplates, setAdminTemplates] = useState<HealthRecordSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the provided health record type ID
      const ANALYSIS_TYPE_ID = healthRecordTypeId
      
      // Get combined sections and templates in one call
      const response = await HealthRecordsApiService.getSectionsCombined(ANALYSIS_TYPE_ID, patientId || undefined)
      
      const userSections = response.user_sections || []
      const adminTemplates = response.admin_templates || []
      
      // Store admin templates separately (for creation only)
      setAdminTemplates(adminTemplates)
      
      // Only show user sections in the UI (not admin templates)
      const userSectionsOnly = userSections
      
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
      // Convert HealthRecordSection[] to SectionWithMetrics[] (only user sections)
      const sectionsWithMetrics: SectionWithMetrics[] = userSectionsOnly.map(section => ({
        id: section.id,
        name: section.name,
        display_name: section.display_name,
        description: section.description,
        section_template_id: section.section_template_id,
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
      
      console.log('Hook: User sections loaded:', userSectionsOnly)
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
    section_template_id?: number
  }) => {
    try {
      const newSection = await HealthRecordsApiService.createSection(section)
      
      // Don't update state here - let the page component handle it via handleSectionCreated
      // This prevents duplicate sections from being added to the state
      
      return newSection
    } catch (err: any) {
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
      throw err
    }
  }

  const updateMetric = async (metricId: number, data: {
    name?: string
    display_name?: string
    description?: string
    default_unit?: string
    reference_data?: any
  }) => {
    try {
      const updatedMetric = await HealthRecordsApiService.updateMetric(metricId, data)
      
      // Update the metric in the sections state
      setSections(prev => prev.map(section => ({
        ...section,
        metrics: section.metrics?.map(metric => 
          metric.id === metricId ? { 
            ...metric, 
            name: updatedMetric.name || metric.name,
            display_name: updatedMetric.display_name || metric.display_name,
            description: updatedMetric.description || metric.description,
            default_unit: updatedMetric.default_unit || metric.default_unit,
            reference_data: updatedMetric.reference_data || metric.reference_data
          } : metric
        )
      })))
      
      return updatedMetric
    } catch (err: any) {
      throw err
    }
  }

  const createRecord = async (record: {
    section_id: number
    metric_id: number
    value: number
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
      throw err
    }
  }

  const updateSection = async (sectionId: number, data: {
    display_name?: string
    description?: string
  }) => {
    try {
      const updatedSection = await HealthRecordsApiService.updateSection(sectionId, data)
      
      // Update the section in the local state
      setSections(prevSections => 
        prevSections.map(section => 
          section.id === sectionId 
            ? { ...section, ...updatedSection }
            : section
        )
      )
      
      return updatedSection
    } catch (err: any) {
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
  }, [healthRecordTypeId, patientId])

  return {
    dashboard,
    sections,
    setSections,
    adminTemplates,
    loading,
    error,
    loadDashboard,
    refresh,
    createSection,
    updateSection,
    createMetric,
    updateMetric,
    createRecord,
    refreshMetric
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatMetricValue(value: number, unit?: string): string {
  if (value === null || value === undefined) return 'N/A'
  
  // Convert to number and validate
  const numericValue = Number(value)
  if (isNaN(numericValue)) return 'N/A'
  
  // Use intelligent precision: show up to 2 decimals, remove trailing zeros
  const formatted = numericValue.toFixed(2).replace(/\.?0+$/, '')
  
  return `${formatted}${unit ? ` ${unit}` : ''}`
}

export function formatReferenceRange(min?: number, max?: number): string {
  if (min === undefined && max === undefined) return 'N/A'
  
  // Handle null/undefined cases with user-friendly formatting
  if (min === undefined || min === null) {
    // Case: null - 93.99 should show <94
    // Case: null - 94 should show ≤94 (less than or equal)
    if (max !== undefined && max !== null) {
      // Check if max is a whole number to determine if we should use ≤ or <
      if (max % 1 === 0) {
        return `≤ ${max}`
      } else {
        // For decimals, round up to next whole number
        return `< ${Math.ceil(max)}`
      }
    }
    return 'N/A'
  }
  
  if (max === undefined || max === null) {
    // Case: 92.01 - null should show >92
    // Case: 93 - null should show ≥93 (greater than or equal)
    // Case: 0.91 - null should show >0.9 (preserve decimal precision)
    if (min !== undefined && min !== null) {
      // Check if min is a whole number to determine if we should use ≥ or >
      if (min % 1 === 0) {
        return `≥ ${min}`
      } else {
        // For decimals, round down but preserve decimal places to 0.01
        const roundedMin = Math.floor(min * 100) / 100
        return `> ${roundedMin.toFixed(2)}`
      }
    }
    return 'N/A'
  }
  
  // Case: 92-93, show originally with proper precision
  return `${min.toFixed(2)} - ${max.toFixed(2)}`
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
