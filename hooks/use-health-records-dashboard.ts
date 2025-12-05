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
import { useLanguage } from '@/contexts/language-context'

export function useHealthRecordsDashboard(healthRecordTypeId: number, patientId?: number | null) {
  const { language } = useLanguage()
  const [dashboard, setDashboard] = useState<AnalysisDashboardResponse | null>(null)
  const [sections, setSections] = useState<SectionWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [Hook] useHealthRecordsDashboard.loadDashboard - patientId:', patientId, 'healthRecordTypeId:', healthRecordTypeId)
      
      // Get the actual dashboard data with metrics and health records
      const dashboardData = await HealthRecordsApiService.getAnalysisDashboard(patientId || undefined)
      
      // Also get combined sections and templates for creating new sections
      const response = await HealthRecordsApiService.getSectionsCombined(healthRecordTypeId, patientId || undefined)
      const userSections = response.user_sections || []
      const adminTemplates = response.admin_templates || []
      const allSections = [...userSections, ...adminTemplates]
      
      setDashboard(dashboardData)
      setSections(dashboardData.sections || []) // Use the sections with actual data
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
      
      // Add section to state for display (both template and custom)
      // But only if it doesn't already exist
      setSections(prev => {
        const exists = prev.some(section => section.id === newSection.id)
        if (exists) {
          return prev
        }
        // Convert HealthRecordSection to SectionWithMetrics
        const sectionWithMetrics: SectionWithMetrics = {
          id: newSection.id,
          name: newSection.name,
          display_name: newSection.display_name,
          description: newSection.description,
          section_template_id: newSection.section_template_id,
          is_default: newSection.is_default,
          metrics: []
        }
        return [...prev, sectionWithMetrics]
      })
      
      // Also update dashboard sections (but only if section doesn't already exist)
      setDashboard(prev => {
        if (!prev) return prev
        const exists = prev.sections.some(section => section.id === newSection.id)
        if (exists) {
          return prev
        }
        return {
          ...prev,
          sections: [...prev.sections, {
            id: newSection.id,
            name: newSection.name,
            display_name: newSection.display_name,
            description: newSection.description,
            metrics: []
          }]
        }
      })
      
      toast.success('Section added successfully')
      
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
      await refresh() // Refresh the dashboard to get the latest data from the server
      toast.success('Metric created successfully')
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
      const newRecord = await HealthRecordsApiService.createHealthRecord(record)
      
      // Refresh the dashboard to get the latest data from the server
      await refresh()
      
      toast.success('Record created successfully')
      return newRecord
    } catch (err: any) {
      toast.error(`Failed to create record: ${err.message}`)
      throw err
    }
  }

  const refreshMetric = async (metricId: number) => {
    // This would need to be implemented to refresh a specific metric
    // For now, just refresh the entire dashboard
    await refresh()
  }

  useEffect(() => {
    loadDashboard()
  }, [healthRecordTypeId, patientId, language])

  return {
    dashboard,
    sections,
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
