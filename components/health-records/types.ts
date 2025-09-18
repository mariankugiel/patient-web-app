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
  description?: string
  default_unit?: string
  threshold?: {
    min: number
    max: number
  }
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
  recorded_at: string
  device_id?: number
  device_info?: any
  accuracy?: string
  location_data?: any
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
  normal_range_min?: number
  normal_range_max?: number
  threshold?: {
    min: number
    max: number
  }
  description?: string
  // Backend returns these field names
  latest_value?: any
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
