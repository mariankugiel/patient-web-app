import apiClient from './axios-config'
import { convertToISODateTime } from '../utils/date-utils'

// ============================================================================
// TYPES FOR MEDICAL CONDITION DATA
// ============================================================================

export interface CurrentHealthProblem {
  condition: string
  yearOfDiagnosis: string
  diagnosticProvider: string
  treatment: string
  comments: string
  status?: string
  diagnosedDate?: string // Full date in YYYY-MM-DD format
}

export interface MedicationSchedule {
  time: string
  days: string[]
}

export interface Medication {
  drugName: string
  purpose: string
  dosage: string
  frequency: string
  schedule: MedicationSchedule[]
  hasReminder: boolean
  reminderTime?: string
  reminderDays?: string[]
}

export interface PastMedicalCondition {
  condition: string
  yearOfDiagnosis: string
  yearResolved: string
  treatment: string
  comments: string
  diagnosedDate?: string // Full date in YYYY-MM-DD format
  resolvedDate?: string // Full date in YYYY-MM-DD format
}

export interface PastSurgery {
  surgeryType: string
  year: string
  location: string
  existingConditions: string
  comments: string
}

export interface MedicalConditionData {
  currentHealthProblems: CurrentHealthProblem[]
  medications: Medication[]
  pastMedicalConditions: PastMedicalCondition[]
  pastSurgeries: PastSurgery[]
}

// ============================================================================
// BACKEND API TYPES (matching backend schemas)
// ============================================================================

export interface BackendMedicalCondition {
  id?: number
  condition_name: string
  description?: string
  diagnosed_date?: string
  status: 'Active' | 'Resolved' | 'Chronic' | 'Remission' | 'Deceased' | 'controlled' | 'partiallyControlled' | 'uncontrolled' | 'resolved'
  severity?: 'Mild' | 'Moderate' | 'Severe' | 'Critical'
  source?: 'Doctor Diagnosis' | 'Self Diagnosis' | 'Lab Results' | 'Imaging' | 'Genetic Testing' | 'Family History'
  treatment_plan?: string
  current_medications?: string[]
  outcome?: string
  resolved_date?: string
}

export interface BackendFamilyHistory {
  id?: number
  condition_name?: string | null
  relation: string
  age_of_onset?: number | null
  description?: string
  outcome?: string | null
  status?: 'Alive' | 'Deceased' | 'Unknown'
  source?: 'Family Member' | 'Medical Records' | 'Genetic Testing' | 'Doctor Interview'
  // New fields for enhanced family history
  current_age?: number | null
  is_deceased?: boolean
  age_at_death?: number | null
  cause_of_death?: string | null
  chronic_diseases?: any[]
  gender?: string | null
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

export class MedicalConditionApiService {
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Maps backend status values to frontend status values
   * Note: Since both frontend and backend now use the same status terms,
   * this function mainly handles legacy data or provides a fallback
   */
  static mapStatusToFrontend(status: string): string {
    // Handle legacy status values if they exist
    switch (status) {
      case 'Active': return 'controlled'
      case 'Chronic': return 'partiallyControlled'
      case 'Resolved': return 'resolved'
      case 'Remission': return 'remission'
      case 'Deceased': return 'deceased'
      // New status values (no mapping needed)
      case 'controlled':
      case 'partiallyControlled':
      case 'uncontrolled':
      case 'resolved':
      case 'remission':
      case 'deceased':
        return status
      default: return 'uncontrolled'
    }
  }

  // ============================================================================
  // GENERAL MEDICAL CONDITIONS
  // ============================================================================

  static async getAllMedicalConditions(): Promise<BackendMedicalCondition[]> {
    try {
      const response = await apiClient.get('/health-records/conditions')
      console.log('getAllMedicalConditions response:', response.data)
      
      // Ensure response.data is an array
      const data = Array.isArray(response.data) ? response.data : []
      console.log('getAllMedicalConditions data array:', data)
      
      return data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get medical conditions'
      throw new Error(message)
    }
  }

  static async getMedications(): Promise<any[]> {
    try {
      const response = await apiClient.get('/medications')
      console.log('getMedications response:', response.data)
      
      // Ensure response.data is an array
      const data = Array.isArray(response.data) ? response.data : []
      console.log('getMedications data array:', data)
      
      return data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get medications'
      throw new Error(message)
    }
  }

  // ============================================================================
  // CURRENT HEALTH PROBLEMS
  // ============================================================================

  static async createCurrentHealthProblem(problem: CurrentHealthProblem): Promise<BackendMedicalCondition> {
    try {
      const backendData: any = {
        condition_name: problem.condition,
        description: problem.comments,
        status: problem.status || 'uncontrolled',
        source: 'Self Diagnosis',
        treatment_plan: problem.treatment,
        current_medications: [],
        outcome: problem.diagnosticProvider ? `Diagnosed by: ${problem.diagnosticProvider}` : undefined
      }

      // Include diagnosed_date if we have a valid date
      if (problem.diagnosedDate && problem.diagnosedDate.trim()) {
        const isoDateTime = convertToISODateTime(problem.diagnosedDate)
        if (isoDateTime) {
          backendData.diagnosed_date = isoDateTime
        }
      } else if (problem.yearOfDiagnosis && problem.yearOfDiagnosis.trim()) {
        // Fallback to year-only format
        backendData.diagnosed_date = `${problem.yearOfDiagnosis}-01-01T00:00:00`
      }

      console.log('Sending create data:', JSON.stringify(backendData, null, 2))
      const response = await apiClient.post('/health-records/conditions', backendData)
      console.log('Create response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Create error:', error.response?.data || error.message)
      const message = error.response?.data?.detail || error.message || 'Failed to create health problem'
      throw new Error(message)
    }
  }

  static async getCurrentHealthProblems(): Promise<BackendMedicalCondition[]> {
    try {
      const allConditions = await this.getAllMedicalConditions()
      return allConditions.filter((condition: BackendMedicalCondition) => 
        condition.status === 'Active' || 
        condition.status === 'Chronic' ||
        condition.status === 'uncontrolled' ||
        condition.status === 'controlled' ||
        condition.status === 'partiallyControlled'
      )
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get health problems'
      throw new Error(message)
    }
  }

  static async updateCurrentHealthProblem(id: number, problem: CurrentHealthProblem): Promise<BackendMedicalCondition> {
    try {
      const backendData: any = {
        condition_name: problem.condition,
        description: problem.comments,
        treatment_plan: problem.treatment,
        outcome: problem.diagnosticProvider ? `Diagnosed by: ${problem.diagnosticProvider}` : undefined,
        status: problem.status
      }

      // Include diagnosed_date if we have a valid date
      if (problem.diagnosedDate && problem.diagnosedDate.trim()) {
        const isoDateTime = convertToISODateTime(problem.diagnosedDate)
        if (isoDateTime) {
          backendData.diagnosed_date = isoDateTime
        }
      } else if (problem.yearOfDiagnosis && problem.yearOfDiagnosis.trim()) {
        // Fallback to year-only format
        backendData.diagnosed_date = `${problem.yearOfDiagnosis}-01-01T00:00:00`
      }

      console.log('Sending update data:', JSON.stringify(backendData, null, 2))
      const response = await apiClient.put(`/health-records/conditions/${id}`, backendData)
      console.log('Update response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Update error:', error.response?.data || error.message)
      const message = error.response?.data?.detail || error.message || 'Failed to update health problem'
      throw new Error(message)
    }
  }

  static async deleteCurrentHealthProblem(id: number): Promise<void> {
    try {
      await apiClient.delete(`/health-records/conditions/${id}`)
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete health problem'
      throw new Error(message)
    }
  }

  // ============================================================================
  // PAST MEDICAL CONDITIONS
  // ============================================================================

  static async createPastMedicalCondition(condition: PastMedicalCondition): Promise<BackendMedicalCondition> {
    try {
      const backendData: any = {
        condition_name: condition.condition,
        description: condition.comments,
        status: 'resolved',
        source: 'Self Diagnosis',
        treatment_plan: condition.treatment
      }

      // Include dates if we have valid dates
      if (condition.diagnosedDate && condition.diagnosedDate.trim()) {
        // Convert date to ISO format before adding time
        try {
          const date = new Date(condition.diagnosedDate)
          if (!isNaN(date.getTime())) {
            // Convert to YYYY-MM-DD format
            const isoDate = date.toISOString().split('T')[0]
            backendData.diagnosed_date = `${isoDate}T00:00:00`
          }
        } catch (e) {
          console.warn('Invalid date format for diagnosedDate:', condition.diagnosedDate)
        }
      } else if (condition.yearOfDiagnosis && condition.yearOfDiagnosis.trim()) {
        // Fallback to year-only format
        backendData.diagnosed_date = `${condition.yearOfDiagnosis}-01-01T00:00:00`
      }
      
      if (condition.resolvedDate && condition.resolvedDate.trim()) {
        const isoDateTime = convertToISODateTime(condition.resolvedDate)
        if (isoDateTime) {
          backendData.resolved_date = isoDateTime
        }
      } else if (condition.yearResolved && condition.yearResolved.trim()) {
        // Fallback to year-only format
        backendData.resolved_date = `${condition.yearResolved}-01-01T00:00:00`
      }

      console.log('Sending past condition create data:', JSON.stringify(backendData, null, 2))
      const response = await apiClient.post('/health-records/conditions', backendData)
      console.log('Past condition create response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Past condition create error:', error.response?.data || error.message)
      const message = error.response?.data?.detail || error.message || 'Failed to create past medical condition'
      throw new Error(message)
    }
  }

  static async getPastMedicalConditions(): Promise<BackendMedicalCondition[]> {
    try {
      const allConditions = await this.getAllMedicalConditions()
      return allConditions.filter((condition: BackendMedicalCondition) => 
        condition.status === 'Resolved' ||
        condition.status === 'resolved'
      )
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get past medical conditions'
      throw new Error(message)
    }
  }

  static async updatePastMedicalCondition(id: number, condition: PastMedicalCondition): Promise<BackendMedicalCondition> {
    try {
      const backendData: any = {
        condition_name: condition.condition,
        description: condition.comments,
        treatment_plan: condition.treatment,
        status: 'resolved'
      }

      // Include dates if we have valid dates
      if (condition.diagnosedDate && condition.diagnosedDate.trim()) {
        // Convert date to ISO format before adding time
        try {
          const date = new Date(condition.diagnosedDate)
          if (!isNaN(date.getTime())) {
            // Convert to YYYY-MM-DD format
            const isoDate = date.toISOString().split('T')[0]
            backendData.diagnosed_date = `${isoDate}T00:00:00`
          }
        } catch (e) {
          console.warn('Invalid date format for diagnosedDate:', condition.diagnosedDate)
        }
      } else if (condition.yearOfDiagnosis && condition.yearOfDiagnosis.trim()) {
        // Fallback to year-only format
        backendData.diagnosed_date = `${condition.yearOfDiagnosis}-01-01T00:00:00`
      }
      
      if (condition.resolvedDate && condition.resolvedDate.trim()) {
        const isoDateTime = convertToISODateTime(condition.resolvedDate)
        if (isoDateTime) {
          backendData.resolved_date = isoDateTime
        }
      } else if (condition.yearResolved && condition.yearResolved.trim()) {
        // Fallback to year-only format
        backendData.resolved_date = `${condition.yearResolved}-01-01T00:00:00`
      }

      console.log('Sending past condition update data:', JSON.stringify(backendData, null, 2))
      const response = await apiClient.put(`/health-records/conditions/${id}`, backendData)
      console.log('Past condition update response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Past condition update error:', error.response?.data || error.message)
      const message = error.response?.data?.detail || error.message || 'Failed to update past medical condition'
      throw new Error(message)
    }
  }

  static async deletePastMedicalCondition(id: number): Promise<void> {
    try {
      await apiClient.delete(`/health-records/conditions/${id}`)
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete past medical condition'
      throw new Error(message)
    }
  }

  // ============================================================================
  // FAMILY MEDICAL HISTORY
  // ============================================================================

  static async createFamilyHistory(history: any): Promise<BackendFamilyHistory> {
    try {
      console.log('API Service - Received history data:', history)
      
      const backendData: any = {
        relation: history.relation,
        current_age: history.current_age ? parseInt(history.current_age) : null,
        is_deceased: history.is_deceased || false,
        chronic_diseases: history.chronic_diseases || [],
        condition_name: null,
        age_of_onset: null,
        description: '',
        outcome: null,
        status: history.is_deceased ? 'Deceased' : 'Alive',
        source: 'Family Member'
      }

      // Only include age_at_death and cause_of_death if deceased
      if (history.is_deceased) {
        backendData.age_at_death = history.age_at_death ? parseInt(history.age_at_death) : null
        backendData.cause_of_death = history.cause_of_death || null
      }

      console.log('API Service - Sending backend data:', JSON.stringify(backendData, null, 2))
      const response = await apiClient.post('/health-records/family-history', backendData)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create family history'
      throw new Error(message)
    }
  }

  static async getFamilyHistory(): Promise<BackendFamilyHistory[]> {
    try {
      const response = await apiClient.get('/health-records/family-history')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get family history'
      throw new Error(message)
    }
  }

  static async updateFamilyHistory(id: number, history: any): Promise<BackendFamilyHistory> {
    try {
      console.log('API Service - Update received history data:', history)
      
      const backendData: any = {
        relation: history.relation,
        current_age: history.current_age ? parseInt(history.current_age) : null,
        is_deceased: history.is_deceased || false,
        chronic_diseases: history.chronic_diseases || [],
        condition_name: null,
        age_of_onset: null,
        description: '',
        outcome: null,
        status: history.is_deceased ? 'Deceased' : 'Alive',
        source: 'Family Member'
      }

      // Only include age_at_death and cause_of_death if deceased
      if (history.is_deceased) {
        backendData.age_at_death = history.age_at_death ? parseInt(history.age_at_death) : null
        backendData.cause_of_death = history.cause_of_death || null
      }

      console.log('API Service - Update sending backend data:', JSON.stringify(backendData, null, 2))
      const response = await apiClient.put(`/health-records/family-history/${id}`, backendData)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to update family history'
      throw new Error(message)
    }
  }

  static async deleteFamilyHistory(id: number): Promise<void> {
    try {
      await apiClient.delete(`/health-records/family-history/${id}`)
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete family history'
      throw new Error(message)
    }
  }

  // ============================================================================
  // PAST SURGERIES
  // ============================================================================

  static async createPastSurgery(surgery: PastSurgery): Promise<BackendMedicalCondition> {
    try {
      // Store surgery as a medical condition with special source
      const backendData: BackendMedicalCondition = {
        condition_name: `Surgery: ${surgery.surgeryType}`,
        description: surgery.comments,
        diagnosed_date: surgery.year ? `${surgery.year}-01-01T00:00:00` : undefined,
        status: 'Resolved',
        source: 'Doctor Diagnosis',
        treatment_plan: surgery.existingConditions,
        outcome: `Location: ${surgery.location}`,
        resolved_date: surgery.year ? `${surgery.year}-01-01T00:00:00` : undefined
      }

      const response = await apiClient.post('/health-records/conditions', backendData)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create past surgery'
      throw new Error(message)
    }
  }

  static async getPastSurgeries(): Promise<BackendMedicalCondition[]> {
    try {
      const response = await apiClient.get('/health-records/surgeries-hospitalizations')
      console.log('getPastSurgeries response:', response.data)
      
      // Extract surgeries array from response structure {surgeries: [], total: 1, skip: 0, limit: 100}
      const data = response.data?.surgeries || (Array.isArray(response.data) ? response.data : [])
      console.log('getPastSurgeries data array:', data)
      
      // Transform surgery data to match the expected format
      return data.map((surgery: any) => ({
        id: surgery.id,
        condition_name: `Surgery: ${surgery.name}`,
        description: surgery.notes || '',
        status: 'Resolved',
        source: 'Doctor Diagnosis',
        treatment_plan: surgery.treatment || '',
        diagnosed_date: surgery.procedure_date,
        resolved_date: surgery.procedure_date,
        outcome: surgery.recovery_status,
        created_at: surgery.created_at,
        updated_at: surgery.updated_at
      }))
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get past surgeries'
      throw new Error(message)
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  static async saveAllMedicalData(data: MedicalConditionData): Promise<{
    currentHealthProblems: BackendMedicalCondition[]
    pastMedicalConditions: BackendMedicalCondition[]
    pastSurgeries: BackendMedicalCondition[]
    familyHistory: BackendFamilyHistory[]
  }> {
    try {
      const results = {
        currentHealthProblems: [] as BackendMedicalCondition[],
        pastMedicalConditions: [] as BackendMedicalCondition[],
        pastSurgeries: [] as BackendMedicalCondition[],
        familyHistory: [] as BackendFamilyHistory[]
      }

      // Save current health problems
      for (const problem of data.currentHealthProblems) {
        const result = await this.createCurrentHealthProblem(problem)
        results.currentHealthProblems.push(result)
      }

      // Save past medical conditions
      for (const condition of data.pastMedicalConditions) {
        const result = await this.createPastMedicalCondition(condition)
        results.pastMedicalConditions.push(result)
      }

      // Save past surgeries
      for (const surgery of data.pastSurgeries) {
        const result = await this.createPastSurgery(surgery)
        results.pastSurgeries.push(result)
      }

      // Note: Medications would need separate endpoints
      // For now, we'll store them in the user profile as JSON

      return results
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to save medical data'
      throw new Error(message)
    }
  }

  // ============================================================================
  // DATA TRANSFORMATION HELPERS
  // ============================================================================

  static transformFrontendToBackend(problem: CurrentHealthProblem, isResolved: boolean = false): BackendMedicalCondition {
    return {
      condition_name: problem.condition,
      description: problem.comments,
      diagnosed_date: problem.yearOfDiagnosis ? `${problem.yearOfDiagnosis}-01-01T00:00:00` : undefined,
      status: isResolved ? 'Resolved' : 'Active',
      source: 'Self Diagnosis',
      treatment_plan: problem.treatment,
      outcome: isResolved ? undefined : problem.diagnosticProvider
    }
  }
}
