import apiClient from './axios-config'

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
  status: 'Active' | 'Resolved' | 'Chronic' | 'Remission' | 'Deceased'
  severity?: 'Mild' | 'Moderate' | 'Severe' | 'Critical'
  source?: 'Doctor Diagnosis' | 'Self Diagnosis' | 'Lab Results' | 'Imaging' | 'Genetic Testing' | 'Family History'
  treatment_plan?: string
  current_medications?: string[]
  outcome?: string
  resolved_date?: string
}

export interface BackendFamilyHistory {
  id?: number
  condition_name: string
  relation: 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Child' | 'Maternal Grandfather' | 'Maternal Grandmother' | 'Paternal Grandfather' | 'Paternal Grandmother'
  age_of_onset?: number
  description?: string
  outcome?: string
  status?: 'Alive' | 'Deceased' | 'Unknown'
  source?: 'Family Member' | 'Medical Records' | 'Genetic Testing' | 'Doctor Interview'
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

export class MedicalConditionApiService {
  // ============================================================================
  // CURRENT HEALTH PROBLEMS
  // ============================================================================

  static async createCurrentHealthProblem(problem: CurrentHealthProblem): Promise<BackendMedicalCondition> {
    try {
      const backendData: any = {
        condition_name: problem.condition,
        description: problem.comments,
        status: 'Active',
        source: 'Self Diagnosis',
        treatment_plan: problem.treatment,
        current_medications: [],
        outcome: problem.diagnosticProvider ? `Diagnosed by: ${problem.diagnosticProvider}` : undefined
      }

      // Include diagnosed_date if we have a valid date
      if (problem.diagnosedDate && problem.diagnosedDate.trim()) {
        // If we have a full date, use it directly
        backendData.diagnosed_date = `${problem.diagnosedDate}T00:00:00`
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
      const response = await apiClient.get('/health-records/conditions')
      return response.data.filter((condition: BackendMedicalCondition) => 
        condition.status === 'Active' || condition.status === 'Chronic'
      )
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get health problems'
      throw new Error(message)
    }
  }

  static async updateCurrentHealthProblem(id: number, problem: CurrentHealthProblem): Promise<BackendMedicalCondition> {
    try {
      // Map frontend status to backend status
      const mapStatus = (status: string) => {
        switch (status) {
          case 'controlled': return 'Active'
          case 'partiallyControlled': return 'Chronic'
          case 'uncontrolled': return 'Active'
          default: return 'Active'
        }
      }

      const backendData: any = {
        condition_name: problem.condition,
        description: problem.comments,
        treatment_plan: problem.treatment,
        outcome: problem.diagnosticProvider ? `Diagnosed by: ${problem.diagnosticProvider}` : undefined,
        status: problem.status ? mapStatus(problem.status) : undefined
      }

      // Include diagnosed_date if we have a valid date
      if (problem.diagnosedDate && problem.diagnosedDate.trim()) {
        // If we have a full date, use it directly
        backendData.diagnosed_date = `${problem.diagnosedDate}T00:00:00`
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
        status: 'Resolved',
        source: 'Self Diagnosis',
        treatment_plan: condition.treatment
      }

      // Include dates if we have valid dates
      if (condition.diagnosedDate && condition.diagnosedDate.trim()) {
        // If we have a full date, use it directly
        backendData.diagnosed_date = `${condition.diagnosedDate}T00:00:00`
      } else if (condition.yearOfDiagnosis && condition.yearOfDiagnosis.trim()) {
        // Fallback to year-only format
        backendData.diagnosed_date = `${condition.yearOfDiagnosis}-01-01T00:00:00`
      }
      
      if (condition.resolvedDate && condition.resolvedDate.trim()) {
        // If we have a full date, use it directly
        backendData.resolved_date = `${condition.resolvedDate}T00:00:00`
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
      const response = await apiClient.get('/health-records/conditions')
      return response.data.filter((condition: BackendMedicalCondition) => 
        condition.status === 'Resolved'
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
        status: 'Resolved'
      }

      // Include dates if we have valid dates
      if (condition.diagnosedDate && condition.diagnosedDate.trim()) {
        // If we have a full date, use it directly
        backendData.diagnosed_date = `${condition.diagnosedDate}T00:00:00`
      } else if (condition.yearOfDiagnosis && condition.yearOfDiagnosis.trim()) {
        // Fallback to year-only format
        backendData.diagnosed_date = `${condition.yearOfDiagnosis}-01-01T00:00:00`
      }
      
      if (condition.resolvedDate && condition.resolvedDate.trim()) {
        // If we have a full date, use it directly
        backendData.resolved_date = `${condition.resolvedDate}T00:00:00`
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

  static async createFamilyHistory(history: {
    condition: string
    relationship: string
    age: string
    notes: string
  }): Promise<BackendFamilyHistory> {
    try {
      const backendData: BackendFamilyHistory = {
        condition_name: history.condition,
        relation: history.relationship as any,
        age_of_onset: history.age ? parseInt(history.age) : undefined,
        description: history.notes,
        outcome: history.notes, // Also include outcome field
        status: 'Alive',
        source: 'Family Member'
      }

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

  static async updateFamilyHistory(id: number, history: {
    condition: string
    relationship: string
    age: string
    notes: string
  }): Promise<BackendFamilyHistory> {
    try {
      const backendData: Partial<BackendFamilyHistory> = {
        condition_name: history.condition,
        relation: history.relationship as any,
        age_of_onset: history.age ? parseInt(history.age) : undefined,
        description: history.notes,
        outcome: history.notes, // Also include outcome field
        status: 'Alive',
        source: 'Family Member'
      }

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
      const response = await apiClient.get('/health-records/conditions')
      return response.data.filter((condition: BackendMedicalCondition) => 
        condition.condition_name.startsWith('Surgery:') && condition.status === 'Resolved'
      )
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

  static transformBackendToFrontend(backendCondition: BackendMedicalCondition): CurrentHealthProblem | PastMedicalCondition | PastSurgery {
    const isResolved = backendCondition.status === 'Resolved'
    const isSurgery = backendCondition.condition_name.startsWith('Surgery:')
    
    if (isSurgery) {
      // Extract surgery type from condition name
      const surgeryType = backendCondition.condition_name.replace('Surgery: ', '')
      // Extract location from outcome
      const location = backendCondition.outcome?.replace('Location: ', '') || ''
      
      return {
        surgeryType: surgeryType,
        year: backendCondition.diagnosed_date ? new Date(backendCondition.diagnosed_date).getFullYear().toString() : '',
        location: location,
        existingConditions: backendCondition.treatment_plan || '',
        comments: backendCondition.description || ''
      }
    } else if (isResolved) {
      return {
        condition: backendCondition.condition_name,
        yearOfDiagnosis: backendCondition.diagnosed_date ? new Date(backendCondition.diagnosed_date).getFullYear().toString() : '',
        yearResolved: backendCondition.resolved_date ? new Date(backendCondition.resolved_date).getFullYear().toString() : '',
        treatment: backendCondition.treatment_plan || '',
        comments: backendCondition.description || ''
      }
    } else {
      return {
        condition: backendCondition.condition_name,
        yearOfDiagnosis: backendCondition.diagnosed_date ? new Date(backendCondition.diagnosed_date).getFullYear().toString() : '',
        diagnosticProvider: backendCondition.outcome || '',
        treatment: backendCondition.treatment_plan || '',
        comments: backendCondition.description || ''
      }
    }
  }

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
