// Shared types for health records components

export interface HealthRecordType {
  id: number
  name: string
  display_name: string
  description?: string
  created_at: string
  updated_at?: string
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
  metrics?: HealthRecordMetric[]
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
  reference_data?: Record<string, { min?: number; max?: number }> // Store parsed reference data for all metrics (includes gender-specific when applicable)
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
  value: number // Direct numeric value storage
  status?: string
  source?: string
  measure_start_time?: string // Start time for epoch data, day start for daily data (datetime with timezone)
  measure_end_time?: string // End time for epoch data, null for daily data (datetime with timezone)
  data_type?: string // "epoch" or "daily" to distinguish data types
  device_id?: number
  device_info?: Record<string, unknown>
  accuracy?: string
  location_data?: Record<string, unknown>
  created_at: string
  updated_at?: string
  updated_by?: number
}

export interface MetricWithData {
  id: number
  name: string
  display_name: string
  unit?: string
  default_unit?: string
  reference_data?: Record<string, { min?: number; max?: number }>
  threshold?: {
    min: number
    max: number
  }
  description?: string
  data_type?: string
  is_default?: boolean
  created_at?: string
  created_by?: number
  // Backend returns these field names
  latest_value?: number
  latest_status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
  latest_recorded_at?: string
  total_records?: number
  // Legacy fields for compatibility
  current_value?: number
  current_status?: 'normal' | 'abnormal' | 'critical' | 'unknown'
  trend?: 'improving' | 'declining' | 'stable' | 'unknown'
  change_from_previous?: number
  data_points?: HealthRecord[]
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
  latest_analysis?: Record<string, unknown>
  summary_stats?: {
    total_sections: number
    total_metrics: number
    total_data_points: number
    abnormal_metrics: number
    normal_metrics: number
  }
}

// Special metric types for complex values
export interface CholesterolValue {
  total: number
  ldl: number
  hdl: number
  triglycerides: number
}

export interface BloodPressureValue {
  systolic: number
  diastolic: number
}

export interface SpecialMetricTypes {
  cholesterol: CholesterolValue
  blood_pressure: BloodPressureValue
}
