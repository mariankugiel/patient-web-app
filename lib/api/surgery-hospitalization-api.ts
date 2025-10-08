import apiClient from './axios-config'

// ============================================================================
// TYPES
// ============================================================================

export interface SurgeryHospitalization {
  id: number
  user_id: number
  procedure_type: 'surgery' | 'hospitalization'
  name: string
  procedure_date: string
  reason?: string
  treatment?: string
  body_area?: string
  recovery_status: 'full_recovery' | 'partial_recovery' | 'no_recovery'
  notes?: string
  created_at: string
  updated_at?: string
  created_by: number
  updated_by?: number
}

export interface SurgeryHospitalizationCreate {
  procedure_type: 'surgery' | 'hospitalization'
  name: string
  procedure_date: string
  reason?: string
  treatment?: string
  body_area?: string
  recovery_status?: 'full_recovery' | 'partial_recovery' | 'no_recovery'
  notes?: string
}

export interface SurgeryHospitalizationUpdate {
  procedure_type?: 'surgery' | 'hospitalization'
  name?: string
  procedure_date?: string
  reason?: string
  treatment?: string
  body_area?: string
  recovery_status?: 'full_recovery' | 'partial_recovery' | 'no_recovery'
  notes?: string
}

export interface SurgeryHospitalizationListResponse {
  surgeries: SurgeryHospitalization[]
  total: number
  skip: number
  limit: number
}

// ============================================================================
// API SERVICE
// ============================================================================

export class SurgeryHospitalizationApiService {
  // Get all surgeries and hospitalizations
  static async getAll(
    skip: number = 0,
    limit: number = 100
  ): Promise<SurgeryHospitalizationListResponse> {
    const response = await apiClient.get('/health-records/surgeries-hospitalizations', {
      params: { skip, limit }
    })
    return response.data
  }

  // Get a specific surgery or hospitalization
  static async getById(id: number): Promise<SurgeryHospitalization> {
    const response = await apiClient.get(`/health-records/surgeries-hospitalizations/${id}`)
    return response.data
  }

  // Create a new surgery or hospitalization
  static async create(data: SurgeryHospitalizationCreate): Promise<SurgeryHospitalization> {
    const response = await apiClient.post('/health-records/surgeries-hospitalizations', data)
    return response.data
  }

  // Update a surgery or hospitalization
  static async update(id: number, data: SurgeryHospitalizationUpdate): Promise<SurgeryHospitalization> {
    const response = await apiClient.put(`/health-records/surgeries-hospitalizations/${id}`, data)
    return response.data
  }

  // Delete a surgery or hospitalization
  static async delete(id: number): Promise<void> {
    await apiClient.delete(`/health-records/surgeries-hospitalizations/${id}`)
  }
}
