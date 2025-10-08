import apiClient from './axios-config'

export interface Medication {
  id: number
  patient_id: number
  medication_name: string
  medication_type: 'prescription' | 'over_the_counter' | 'supplement' | 'vaccine'
  status: 'active' | 'discontinued' | 'completed' | 'on_hold'
  start_date: string
  end_date?: string
  prescribed_by: number
  aws_file_id: string
  created_at: string
  updated_at?: string
  // Additional fields for UI compatibility
  dosage?: string
  frequency?: string
  purpose?: string
  instructions?: string
  reminders?: Array<{
    id: string
    time: string
    days: string[]
    enabled: boolean
  }>
  prescription?: {
    number: string
    pharmacy: string
    originalQuantity: string
    refillsRemaining: string
    lastFilled: string
    datePrescribed: string
    refillsAuthorized: string
    prescriber: string
  }
  reason?: string
}

export interface MedicationCreate {
  medication_name: string
  medication_type: 'prescription' | 'over_the_counter' | 'supplement' | 'vaccine'
  start_date: string
  end_date?: string
}

export interface MedicationUpdate {
  medication_name?: string
  medication_type?: 'prescription' | 'over_the_counter' | 'supplement' | 'vaccine'
  status?: 'active' | 'discontinued' | 'completed' | 'on_hold'
  start_date?: string
  end_date?: string
}

class MedicationsApiService {
  async getMedications(statusFilter?: 'current' | 'previous'): Promise<Medication[]> {
    const params = statusFilter ? { status_filter: statusFilter } : {}
    const response = await apiClient.get('/medications', { params })
    return response.data
  }

  async getMedication(id: number): Promise<Medication> {
    const response = await apiClient.get(`/medications/${id}`)
    return response.data
  }

  async createMedication(medication: MedicationCreate): Promise<Medication> {
    const response = await apiClient.post('/medications', medication)
    return response.data
  }

  async updateMedication(id: number, medication: MedicationUpdate): Promise<Medication> {
    const response = await apiClient.put(`/medications/${id}`, medication)
    return response.data
  }

  async deleteMedication(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`/medications/${id}`)
    return response.data
  }

  async endMedication(id: number): Promise<{ message: string; medication: Medication }> {
    const response = await apiClient.patch(`/medications/${id}/end`)
    return response.data
  }
}

export const medicationsApiService = new MedicationsApiService()
