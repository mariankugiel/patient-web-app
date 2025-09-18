// Metric Templates Configuration
// This file defines how different metric types should be displayed and edited

export interface MetricField {
  key: string
  label: string
  type: 'number' | 'text' | 'select'
  placeholder?: string
  unit?: string
  options?: Array<{ value: string; label: string }>
  validation?: {
    min?: number
    max?: number
    required?: boolean
  }
}

export interface MetricTemplate {
  name: string
  displayName: string
  icon: string // Lucide icon name
  fields: MetricField[]
  formatValue: (values: Record<string, any>) => string
  parseValue: (value: any) => Record<string, any>
  validateValue: (values: Record<string, any>) => { valid: boolean; errors: string[] }
  getStatus: (values: Record<string, any>, thresholds?: any) => 'normal' | 'abnormal' | 'critical'
}

export const METRIC_TEMPLATES: Record<string, MetricTemplate> = {
  'blood_pressure': {
    name: 'blood_pressure',
    displayName: 'Blood Pressure',
    icon: 'Heart',
    fields: [
      {
        key: 'systolic',
        label: 'Systolic',
        type: 'number',
        placeholder: '120',
        unit: 'mmHg',
        validation: { min: 50, max: 300, required: true }
      },
      {
        key: 'diastolic',
        label: 'Diastolic',
        type: 'number',
        placeholder: '80',
        unit: 'mmHg',
        validation: { min: 30, max: 200, required: true }
      }
    ],
    formatValue: (values) => `${values.systolic || ''}/${values.diastolic || ''}`,
    parseValue: (value) => {
      if (typeof value === 'string' && value.includes('/')) {
        const [systolic, diastolic] = value.split('/')
        return { systolic: parseFloat(systolic) || 0, diastolic: parseFloat(diastolic) || 0 }
      }
      if (typeof value === 'object' && value !== null) {
        return { systolic: value.systolic || 0, diastolic: value.diastolic || 0 }
      }
      return { systolic: 0, diastolic: 0 }
    },
    validateValue: (values) => {
      const errors: string[] = []
      if (!values.systolic || values.systolic < 50 || values.systolic > 300) {
        errors.push('Systolic pressure must be between 50-300 mmHg')
      }
      if (!values.diastolic || values.diastolic < 30 || values.diastolic > 200) {
        errors.push('Diastolic pressure must be between 30-200 mmHg')
      }
      if (values.systolic && values.diastolic && values.systolic <= values.diastolic) {
        errors.push('Systolic pressure must be higher than diastolic')
      }
      return { valid: errors.length === 0, errors }
    },
    getStatus: (values, thresholds) => {
      const systolic = values.systolic
      const diastolic = values.diastolic
      
      if (!systolic || !diastolic) return 'normal'
      
      // Blood pressure categories
      if (systolic >= 180 || diastolic >= 120) return 'critical'
      if (systolic >= 140 || diastolic >= 90) return 'abnormal'
      if (systolic >= 120 || diastolic >= 80) return 'abnormal'
      
      return 'normal'
    }
  },

  'heart_rate': {
    name: 'heart_rate',
    displayName: 'Heart Rate',
    icon: 'Activity',
    fields: [
      {
        key: 'rate',
        label: 'Heart Rate',
        type: 'number',
        placeholder: '72',
        unit: 'bpm',
        validation: { min: 30, max: 250, required: true }
      }
    ],
    formatValue: (values) => `${values.rate || ''}`,
    parseValue: (value) => {
      if (typeof value === 'number') return { rate: value }
      if (typeof value === 'string') return { rate: parseFloat(value) || 0 }
      if (typeof value === 'object' && value !== null) return { rate: value.rate || 0 }
      return { rate: 0 }
    },
    validateValue: (values) => {
      const errors: string[] = []
      if (!values.rate || values.rate < 30 || values.rate > 250) {
        errors.push('Heart rate must be between 30-250 bpm')
      }
      return { valid: errors.length === 0, errors }
    },
    getStatus: (values) => {
      const rate = values.rate
      if (!rate) return 'normal'
      if (rate < 40 || rate > 120) return 'abnormal'
      if (rate < 30 || rate > 150) return 'critical'
      return 'normal'
    }
  },

  'cholesterol': {
    name: 'cholesterol',
    displayName: 'Cholesterol Panel',
    icon: 'Droplets',
    fields: [
      {
        key: 'total',
        label: 'Total Cholesterol',
        type: 'number',
        placeholder: '200',
        unit: 'mg/dL',
        validation: { min: 50, max: 500, required: true }
      },
      {
        key: 'ldl',
        label: 'LDL (Bad)',
        type: 'number',
        placeholder: '100',
        unit: 'mg/dL',
        validation: { min: 20, max: 300, required: true }
      },
      {
        key: 'hdl',
        label: 'HDL (Good)',
        type: 'number',
        placeholder: '60',
        unit: 'mg/dL',
        validation: { min: 10, max: 150, required: true }
      },
      {
        key: 'triglycerides',
        label: 'Triglycerides',
        type: 'number',
        placeholder: '150',
        unit: 'mg/dL',
        validation: { min: 20, max: 1000, required: true }
      }
    ],
    formatValue: (values) => `Total: ${values.total || ''}, LDL: ${values.ldl || ''}, HDL: ${values.hdl || ''}, TG: ${values.triglycerides || ''}`,
    parseValue: (value) => {
      if (typeof value === 'object' && value !== null) {
        return {
          total: value.total || 0,
          ldl: value.ldl || 0,
          hdl: value.hdl || 0,
          triglycerides: value.triglycerides || 0
        }
      }
      return { total: 0, ldl: 0, hdl: 0, triglycerides: 0 }
    },
    validateValue: (values) => {
      const errors: string[] = []
      if (!values.total || values.total < 50 || values.total > 500) {
        errors.push('Total cholesterol must be between 50-500 mg/dL')
      }
      if (!values.ldl || values.ldl < 20 || values.ldl > 300) {
        errors.push('LDL must be between 20-300 mg/dL')
      }
      if (!values.hdl || values.hdl < 10 || values.hdl > 150) {
        errors.push('HDL must be between 10-150 mg/dL')
      }
      if (!values.triglycerides || values.triglycerides < 20 || values.triglycerides > 1000) {
        errors.push('Triglycerides must be between 20-1000 mg/dL')
      }
      return { valid: errors.length === 0, errors }
    },
    getStatus: (values) => {
      const { total, ldl, hdl, triglycerides } = values
      if (!total || !ldl || !hdl || !triglycerides) return 'normal'
      
      let abnormalCount = 0
      if (total > 240 || ldl > 160 || hdl < 40 || triglycerides > 200) abnormalCount++
      if (total > 300 || ldl > 190 || hdl < 30 || triglycerides > 500) return 'critical'
      
      return abnormalCount > 0 ? 'abnormal' : 'normal'
    }
  },

  'temperature': {
    name: 'temperature',
    displayName: 'Body Temperature',
    icon: 'Thermometer',
    fields: [
      {
        key: 'value',
        label: 'Temperature',
        type: 'number',
        placeholder: '98.6',
        unit: '°F',
        validation: { min: 90, max: 110, required: true }
      }
    ],
    formatValue: (values) => `${values.value || ''}`,
    parseValue: (value) => {
      if (typeof value === 'number') return { value }
      if (typeof value === 'string') return { value: parseFloat(value) || 0 }
      if (typeof value === 'object' && value !== null) return { value: value.value || 0 }
      return { value: 0 }
    },
    validateValue: (values) => {
      const errors: string[] = []
      if (!values.value || values.value < 90 || values.value > 110) {
        errors.push('Temperature must be between 90-110°F')
      }
      return { valid: errors.length === 0, errors }
    },
    getStatus: (values) => {
      const temp = values.value
      if (!temp) return 'normal'
      if (temp < 95 || temp > 104) return 'critical'
      if (temp < 97 || temp > 100.4) return 'abnormal'
      return 'normal'
    }
  },

  'vision': {
    name: 'vision',
    displayName: 'Vision Acuity',
    icon: 'Eye',
    fields: [
      {
        key: 'left_eye',
        label: 'Left Eye',
        type: 'text',
        placeholder: '20/20'
      },
      {
        key: 'right_eye',
        label: 'Right Eye',
        type: 'text',
        placeholder: '20/20'
      }
    ],
    formatValue: (values) => `L: ${values.left_eye || ''}, R: ${values.right_eye || ''}`,
    parseValue: (value) => {
      if (typeof value === 'object' && value !== null) {
        return { left_eye: value.left_eye || '', right_eye: value.right_eye || '' }
      }
      return { left_eye: '', right_eye: '' }
    },
    validateValue: (values) => {
      const errors: string[] = []
      if (!values.left_eye) errors.push('Left eye measurement is required')
      if (!values.right_eye) errors.push('Right eye measurement is required')
      return { valid: errors.length === 0, errors }
    },
    getStatus: (values) => {
      // Vision status logic would depend on the specific measurements
      return 'normal'
    }
  }
}

// Helper function to get template by metric name
export function getMetricTemplate(metricName: string): MetricTemplate | null {
  const metricKey = metricName.toLowerCase().replace(/[^a-z0-9]/g, '_')
  
  // Direct match
  if (METRIC_TEMPLATES[metricKey]) {
    return METRIC_TEMPLATES[metricKey]
  }
  
  // Fuzzy match
  for (const [key, template] of Object.entries(METRIC_TEMPLATES)) {
    if (metricName.toLowerCase().includes(template.name.replace('_', ' '))) {
      return template
    }
  }
  
  return null
}

// Helper function to detect if a metric should use structured input
export function shouldUseStructuredInput(metricName: string): boolean {
  return getMetricTemplate(metricName) !== null
}
