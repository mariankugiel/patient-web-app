import apiClient from './axios-config'

// ============================================================================
// TYPES - Based on MedicalDocument model
// ============================================================================

export interface MedicalDocument {
  id: number
  created_by: number
  health_record_type_id: number
  lab_doc_type: string
  lab_test_date?: string
  provider?: string
  file_name: string
  s3_url?: string
  file_type?: string
  description?: string
  general_doc_type: string
  created_at: string
  updated_at?: string
  updated_by?: number
}

export interface MedicalDocumentCreate {
  health_record_type_id: number
  lab_doc_type: string
  lab_test_date?: string
  provider?: string
  file_name: string
  s3_url?: string
  file_type?: string
  description?: string
  general_doc_type: string
}

export interface MedicalDocumentUpdate {
  lab_doc_type?: string
  lab_test_date?: string
  provider?: string
  file_name?: string
  s3_url?: string
  file_type?: string
  description?: string
  general_doc_type?: string
}

// ============================================================================
// API SERVICE
// ============================================================================

export class MedicalDocumentsApiService {
  private baseUrl = '/health-records/health-record-doc-lab'

  /**
   * Get medical documents for the current user or a specific patient (if permission granted)
   */
  async getMedicalDocuments(
    skip: number = 0,
    limit: number = 100,
    documentType?: string,
    patientId?: number
  ): Promise<MedicalDocument[]> {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      })
      
      if (documentType) {
        params.append('document_type', documentType)
      }

      if (patientId) {
        params.append('patient_id', patientId.toString())
      }

      const response = await apiClient.get(`${this.baseUrl}?${params}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch medical documents:', error)
      throw error
    }
  }

  /**
   * Get a specific medical document by ID
   */
  async getMedicalDocument(documentId: number): Promise<MedicalDocument> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${documentId}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch medical document ${documentId}:`, error)
      throw error
    }
  }

  /**
   * Create a new medical document
   */
  async createMedicalDocument(documentData: MedicalDocumentCreate): Promise<MedicalDocument> {
    try {
      const response = await apiClient.post(this.baseUrl, documentData)
      return response.data
    } catch (error) {
      console.error('Failed to create medical document:', error)
      throw error
    }
  }

  /**
   * Update a medical document
   */
  async updateMedicalDocument(
    documentId: number,
    documentData: MedicalDocumentUpdate
  ): Promise<MedicalDocument> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${documentId}`, documentData)
      return response.data
    } catch (error) {
      console.error(`Failed to update medical document ${documentId}:`, error)
      throw error
    }
  }

  /**
   * Delete a medical document
   */
  async deleteMedicalDocument(documentId: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${documentId}`)
    } catch (error) {
      console.error(`Failed to delete medical document ${documentId}:`, error)
      throw error
    }
  }

  /**
   * Download a medical document
   */
  async downloadMedicalDocument(documentId: number, patientId?: number): Promise<{ download_url: string }> {
    try {
      const params = new URLSearchParams()
      if (patientId) {
        params.append('patient_id', patientId.toString())
      }
      const url = `${this.baseUrl}/${documentId}/download${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error(`Failed to download medical document ${documentId}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const medicalDocumentsApiService = new MedicalDocumentsApiService()
