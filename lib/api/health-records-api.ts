import apiClient from './axios-config'

// ============================================================================
// TYPES - Based on existing health_records system
// ============================================================================

export interface HealthRecordType {
  id: number
  name: string
  display_name: string
  description?: string
  is_active: boolean
  created_by: number
  created_at: string
  updated_at?: string
  updated_by?: number
}

export interface HealthRecordSection {
  id: number
  name: string
  display_name: string
  description?: string
  health_record_type_id: number
  section_template_id?: number
  is_default: boolean
  created_by: number
  created_at: string
  updated_at?: string
  updated_by?: number
  metrics?: HealthRecordMetric[] // Add metrics property
}

export interface HealthRecordSectionTemplate {
  id: number
  name: string
  display_name: string
  name_pt?: string
  display_name_pt?: string
  name_es?: string
  display_name_es?: string
  description?: string
  health_record_type_id: number
  is_default: boolean
}

export interface HealthRecordMetric {
  id: number
  section_id: number
  name: string
  display_name: string
  name_pt?: string
  display_name_pt?: string
  name_es?: string
  display_name_es?: string
  description?: string
  default_unit?: string
  default_unit_pt?: string
  default_unit_es?: string
  unit?: string // Add unit property for compatibility
  original_reference?: string // Store original reference string like "Men: <25%, Female: <35%"
  reference_data?: any // Store parsed reference data for all metrics (includes gender-specific when applicable)
  data_type: string
  is_default: boolean
  created_at: string
  updated_at?: string
  created_by: number
  updated_by?: number
}

export interface HealthRecord {
  id: number
  created_by: number
  section_id: number
  metric_id: number
  value: any // JSON field for flexible data
  status?: string
  source?: string
  recorded_at: string // Changed from recorded_date to match backend schema
  device_id?: number
  device_info?: any // JSON field for device information
  accuracy?: string
  location_data?: any // JSON field for GPS coordinates
  created_at: string
  updated_at?: string
  updated_by?: number
}



export interface MetricWithData {
  id: number
  name: string
  display_name: string
  unit?: string
  default_unit?: string // Add missing property
  reference_data?: any
  threshold?: { // Add missing property
    min: number
    max: number
  }
  data_type?: string
  description?: string
  // Backend returns these field names
  latest_value?: any // Can be object {value: number} or primitive
  latest_status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
  latest_recorded_at?: string
  total_records?: number
  // Legacy fields for compatibility
  current_value?: number
  current_status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
  trend?: 'improving' | 'declining' | 'stable' | 'unknown'
  change_from_previous?: number
  data_points?: HealthRecord[] // Make optional to match usage
}

export interface SectionWithMetrics {
  id: number
  name: string
  display_name: string
  description?: string
  section_template_id?: number
  is_default?: boolean
  metrics: MetricWithData[]
}

export interface AnalysisDashboardResponse {
  sections: SectionWithMetrics[]
  latest_analysis?: any
  summary_stats?: {
    total_sections: number
    total_metrics: number
    total_data_points: number
    abnormal_metrics: number
    normal_metrics: number
  }
}

// ============================================================================
// API SERVICE
// ============================================================================

export class HealthRecordsApiService {
  // Health Record Types
  static async getTypes(): Promise<HealthRecordType[]> {
    const response = await apiClient.get('/health-records/types')
    return response.data
  }

  static async getType(typeId: number): Promise<HealthRecordType> {
    const response = await apiClient.get(`/health-records/types/${typeId}`)
    return response.data
  }

  // Health Record Sections
  static async getSections(typeId?: number): Promise<HealthRecordSection[]> {
    const params: any = typeId ? { health_record_type_id: typeId } : {}
    const response = await apiClient.get('/health-records/sections', { params })
    return response.data
  }

  static async getSectionTemplates(typeId?: number): Promise<HealthRecordSection[]> {
    const params: any = typeId ? { health_record_type_id: typeId } : {}
    const response = await apiClient.get('/health-records/sections/templates', { params })
    return response.data
  }

  // Get combined sections and templates in one call
  static async getSectionsCombined(typeId?: number, patientId?: number): Promise<{
    user_sections: HealthRecordSection[]
    admin_templates: HealthRecordSection[]
  }> {
    const params: any = typeId ? { health_record_type_id: typeId } : {}
    if (patientId) {
      params.patient_id = patientId
    }
    const response = await apiClient.get('/health-records/sections/combined', { params })
    return response.data
  }

  static async createSection(section: {
    name: string
    display_name: string
    description?: string
    health_record_type_id: number
    section_template_id?: number
  }): Promise<HealthRecordSection> {
    const response = await apiClient.post('/health-records/sections', section)
    return response.data
  }

  static async updateSection(sectionId: number, data: {
    display_name?: string
    description?: string
  }): Promise<HealthRecordSection> {
    const response = await apiClient.put(`/health-records/sections/${sectionId}`, data)
    return response.data
  }

  // Health Record Metrics
  static async getMetrics(sectionId: number): Promise<HealthRecordMetric[]> {
    const response = await apiClient.get(`/health-records/sections/${sectionId}/metrics`)
    return response.data
  }

  static async createMetric(metric: {
    section_id: number
    name: string
    display_name: string
    description?: string
    default_unit?: string
    threshold?: any
    data_type: string
  }): Promise<HealthRecordMetric> {
    const response = await apiClient.post('/health-records/metrics', metric)
    return response.data
  }

  static async updateMetric(metricId: number, data: {
    name?: string
    display_name?: string
    description?: string
    default_unit?: string
    reference_data?: any
  }): Promise<HealthRecordMetric> {
    const response = await apiClient.put(`/health-records/metrics/${metricId}`, data)
    return response.data
  }

  // Health Records (Data Points)
  static async getHealthRecords(
    metricId: number, 
    patientId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<HealthRecord[]> {
    const params: any = {}
    if (patientId) {
      params.patient_id = patientId
    }
    if (startDate) {
      params.start_date = startDate
    }
    if (endDate) {
      params.end_date = endDate
    }
    const response = await apiClient.get(`/health-records/metrics/${metricId}/records`, { params })
    return response.data
  }

  static async createHealthRecord(record: {
    section_id: number
    metric_id: number
    value: number
    status?: string
    recorded_at: string
    notes?: string
    source?: string
  }): Promise<HealthRecord> {
    console.log('API: Creating health record:', record)
    const response = await apiClient.post('/health-records', record)
    console.log('API: Health record response:', response.data)
    return response.data
  }


  // Update health record
  static async updateHealthRecord(recordId: number, updates: {
    value?: number
    status?: string
    recorded_at?: string
  }): Promise<HealthRecord> {
    console.log('API: Updating health record:', recordId, updates)
    const response = await apiClient.put(`/health-records/${recordId}`, updates)
    console.log('API: Health record update response:', response.data)
    return response.data
  }

  // Delete health record
  static async deleteHealthRecord(recordId: number): Promise<void> {
    console.log('API: Deleting health record:', recordId)
    await apiClient.delete(`/health-records/${recordId}`)
    console.log('API: Health record deleted successfully')
  }

  // Delete section (cascade deletes metrics and records)
  static async deleteSection(sectionId: number): Promise<void> {
    console.log('API: Deleting section:', sectionId)
    await apiClient.delete(`/health-records/sections/${sectionId}`)
    console.log('API: Section deleted successfully')
  }

  // Delete metric (cascade deletes records)
  static async deleteMetric(metricId: number): Promise<void> {
    console.log('API: Deleting metric:', metricId)
    await apiClient.delete(`/health-records/metrics/${metricId}`)
    console.log('API: Metric deleted successfully')
  }

  // Analysis Dashboard
  static async getAnalysisDashboard(patientId?: number): Promise<AnalysisDashboardResponse> {
    const params: any = {}
    if (patientId) {
      params.patient_id = patientId
      console.log('🔍 [Frontend API] getAnalysisDashboard called with patientId:', patientId)
    } else {
      console.log('📋 [Frontend API] getAnalysisDashboard called without patientId (using current user)')
    }
    const response = await apiClient.get('/health-records/dashboard', { params })
    console.log('📊 [Frontend API] Dashboard response:', response.data)
    return response.data
  }

  // Get all user metrics for health plan dialog
  static async getAllUserMetrics(patientId?: number): Promise<HealthRecordMetric[]> {
    const params: any = {}
    if (patientId) {
      params.patient_id = patientId
    }
    const response = await apiClient.get('/health-records/metrics/all', { params })
    return response.data
  }

  // Health Goals endpoints
  static async getHealthGoals(): Promise<any[]> {
    const response = await apiClient.get('/health-plans/health-goals')
    return response.data
  }

  static async createHealthGoal(goalData: {
    name: string
    target_value: { operator: string, value: string }
    start_date: string
    end_date: string
    metric_id?: number
  }): Promise<any> {
    const response = await apiClient.post('/health-plans/health-goals', goalData)
    return response.data
  }

  static async updateHealthGoal(goalId: number, goalData: any): Promise<any> {
    const response = await apiClient.put(`/health-plans/health-goals/${goalId}`, goalData)
    return response.data
  }

  static async deleteHealthGoal(goalId: number): Promise<void> {
    await apiClient.delete(`/health-plans/health-goals/${goalId}`)
  }

  // Admin Templates
  static async getAdminSectionTemplates(healthRecordTypeId: number = 1): Promise<HealthRecordSectionTemplate[]> {
    const response = await apiClient.get(`/health-records/admin-templates/sections?health_record_type_id=${healthRecordTypeId}`)
    return response.data
  }

  static async getAdminMetricTemplates(sectionTemplateId?: number, healthRecordTypeId: number = 1): Promise<HealthRecordMetric[]> {
    let url = `/health-records/admin-templates/metrics?health_record_type_id=${healthRecordTypeId}`
    if (sectionTemplateId) {
      url += `&section_template_id=${sectionTemplateId}`
    }
    const response = await apiClient.get(url)
    return response.data
  }


}
