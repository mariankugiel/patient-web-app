import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { MedicalConditionApiService, BackendMedicalCondition, BackendFamilyHistory } from '@/lib/api/medical-condition-api'

// ============================================================================
// TYPES
// ============================================================================

export interface CurrentCondition {
  id?: number
  condition: string
  diagnosedDate: string
  treatedWith: string
  status: 'controlled' | 'partiallyControlled' | 'uncontrolled'
  notes: string
}

export interface PastCondition {
  id?: number
  condition: string
  diagnosedDate: string
  treatedWith: string
  resolvedDate: string
  notes: string
}

export interface FamilyHistoryEntry {
  id?: number
  relation: string
  is_deceased?: boolean
  age_at_death?: number
  cause_of_death?: string
  current_age?: number
  gender?: string
  chronic_diseases?: Array<{
    disease: string
    age_at_diagnosis: string
    comments?: string
  }>
  // Legacy fields for backward compatibility
  condition?: string
  ageOfOnset?: string
  outcome?: string
}

// ============================================================================
// CURRENT MEDICAL CONDITIONS HOOK
// ============================================================================

export function useCurrentMedicalConditions() {
  const [conditions, setConditions] = useState<CurrentCondition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConditions = async () => {
    try {
      setLoading(true)
      setError(null)
      const backendConditions = await MedicalConditionApiService.getCurrentHealthProblems()
      
      const transformedConditions: CurrentCondition[] = backendConditions.map(condition => ({
        id: condition.id,
        condition: condition.condition_name,
        diagnosedDate: condition.diagnosed_date ? condition.diagnosed_date.split('T')[0] : '', // Keep ISO date format (YYYY-MM-DD)
        treatedWith: condition.treatment_plan || '',
        status: MedicalConditionApiService.mapStatusToFrontend(condition.status) as 'controlled' | 'partiallyControlled' | 'uncontrolled',
        notes: condition.description || ''
      }))
      
      setConditions(transformedConditions)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load current conditions: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addCondition = async (condition: Omit<CurrentCondition, 'id'>) => {
    try {
      // Handle date conversion properly
      let yearOfDiagnosis = ''
      if (condition.diagnosedDate) {
        try {
          // Handle both YYYY-MM-DD and other date formats
          const dateStr = condition.diagnosedDate
          if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            yearOfDiagnosis = dateStr.split('-')[0]
          } else {
            // Other formats, try to parse
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              yearOfDiagnosis = date.getFullYear().toString()
            }
          }
        } catch (e) {
          console.warn('Invalid date format:', condition.diagnosedDate)
        }
      }

      const backendData = {
        condition: condition.condition,
        yearOfDiagnosis: yearOfDiagnosis,
        diagnosticProvider: condition.treatedWith,
        treatment: condition.treatedWith,
        comments: condition.notes,
        status: condition.status,
        diagnosedDate: condition.diagnosedDate // Send the full date
      }

      const result = await MedicalConditionApiService.createCurrentHealthProblem(backendData)
      
      const newCondition: CurrentCondition = {
        id: result.id,
        condition: result.condition_name,
        diagnosedDate: result.diagnosed_date ? new Date(result.diagnosed_date).toLocaleDateString() : '',
        treatedWith: result.treatment_plan || '',
        status: MedicalConditionApiService.mapStatusToFrontend(result.status) as 'controlled' | 'partiallyControlled' | 'uncontrolled',
        notes: result.description || ''
      }
      
      setConditions(prev => [...prev, newCondition])
      toast.success('Current condition added successfully')
      return newCondition
    } catch (err: any) {
      toast.error(`Failed to add condition: ${err.message}`)
      throw err
    }
  }

  const updateCondition = async (id: number, condition: Omit<CurrentCondition, 'id'>) => {
    try {
      // Handle date conversion properly
      let yearOfDiagnosis = ''
      if (condition.diagnosedDate) {
        try {
          // Handle both YYYY-MM-DD and other date formats
          const dateStr = condition.diagnosedDate
          if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            yearOfDiagnosis = dateStr.split('-')[0]
          } else {
            // Other formats, try to parse
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              yearOfDiagnosis = date.getFullYear().toString()
            }
          }
        } catch (e) {
          console.warn('Invalid date format:', condition.diagnosedDate)
        }
      }

      const backendData = {
        condition: condition.condition,
        yearOfDiagnosis: yearOfDiagnosis,
        diagnosticProvider: condition.treatedWith,
        treatment: condition.treatedWith,
        comments: condition.notes,
        status: condition.status,
        diagnosedDate: condition.diagnosedDate // Send the full date
      }

      const result = await MedicalConditionApiService.updateCurrentHealthProblem(id, backendData)
      
      const updatedCondition: CurrentCondition = {
        id: result.id,
        condition: result.condition_name,
        diagnosedDate: result.diagnosed_date ? new Date(result.diagnosed_date).toLocaleDateString() : '',
        treatedWith: result.treatment_plan || '',
        status: MedicalConditionApiService.mapStatusToFrontend(result.status) as 'controlled' | 'partiallyControlled' | 'uncontrolled',
        notes: result.description || ''
      }
      
      setConditions(prev => prev.map(c => c.id === id ? updatedCondition : c))
      toast.success('Current condition updated successfully')
      return updatedCondition
    } catch (err: any) {
      toast.error(`Failed to update condition: ${err.message}`)
      throw err
    }
  }

  const deleteCondition = async (id: number) => {
    try {
      await MedicalConditionApiService.deleteCurrentHealthProblem(id)
      setConditions(prev => prev.filter(c => c.id !== id))
      toast.success('Current condition deleted successfully')
    } catch (err: any) {
      toast.error(`Failed to delete condition: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    loadConditions()
  }, [])

  return {
    conditions,
    loading,
    error,
    addCondition,
    updateCondition,
    deleteCondition,
    refresh: loadConditions
  }
}

// ============================================================================
// PAST MEDICAL CONDITIONS HOOK
// ============================================================================

export function usePastMedicalConditions() {
  const [conditions, setConditions] = useState<PastCondition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConditions = async () => {
    try {
      setLoading(true)
      setError(null)
      const backendConditions = await MedicalConditionApiService.getPastMedicalConditions()
      
      const transformedConditions: PastCondition[] = backendConditions.map(condition => ({
        id: condition.id,
        condition: condition.condition_name,
        diagnosedDate: condition.diagnosed_date ? condition.diagnosed_date.split('T')[0] : '', // Keep ISO date format (YYYY-MM-DD)
        treatedWith: condition.treatment_plan || '',
        resolvedDate: condition.resolved_date ? condition.resolved_date.split('T')[0] : '', // Keep ISO date format (YYYY-MM-DD)
        notes: condition.description || ''
      }))
      
      setConditions(transformedConditions)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load past conditions: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addCondition = async (condition: Omit<PastCondition, 'id'>) => {
    try {
      // Handle date conversion properly
      let yearOfDiagnosis = ''
      let yearResolved = ''
      
      if (condition.diagnosedDate) {
        try {
          // Handle both YYYY-MM-DD and other date formats
          const dateStr = condition.diagnosedDate
          if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            yearOfDiagnosis = dateStr.split('-')[0]
          } else {
            // Other formats, try to parse
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              yearOfDiagnosis = date.getFullYear().toString()
            }
          }
        } catch (e) {
          console.warn('Invalid diagnosed date format:', condition.diagnosedDate)
        }
      }
      
      if (condition.resolvedDate) {
        try {
          // Handle both YYYY-MM-DD and other date formats
          const dateStr = condition.resolvedDate
          if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            yearResolved = dateStr.split('-')[0]
          } else {
            // Other formats, try to parse
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              yearResolved = date.getFullYear().toString()
            }
          }
        } catch (e) {
          console.warn('Invalid resolved date format:', condition.resolvedDate)
        }
      }

      const backendData = {
        condition: condition.condition,
        yearOfDiagnosis: yearOfDiagnosis,
        yearResolved: yearResolved,
        treatment: condition.treatedWith,
        comments: condition.notes,
        diagnosedDate: condition.diagnosedDate, // Send the full date
        resolvedDate: condition.resolvedDate // Send the full date
      }
      
      const result = await MedicalConditionApiService.createPastMedicalCondition(backendData)
      
      const newCondition: PastCondition = {
        id: result.id,
        condition: result.condition_name,
        diagnosedDate: result.diagnosed_date ? new Date(result.diagnosed_date).toLocaleDateString() : '',
        treatedWith: result.treatment_plan || '',
        resolvedDate: result.resolved_date ? new Date(result.resolved_date).toLocaleDateString() : '',
        notes: result.description || ''
      }
      
      setConditions(prev => [...prev, newCondition])
      toast.success('Past condition added successfully')
      return newCondition
    } catch (err: any) {
      toast.error(`Failed to add past condition: ${err.message}`)
      throw err
    }
  }

  const updateCondition = async (id: number, condition: Omit<PastCondition, 'id'>) => {
    try {
      // Handle date conversion properly
      let yearOfDiagnosis = ''
      let yearResolved = ''
      
      if (condition.diagnosedDate) {
        try {
          // Handle both YYYY-MM-DD and other date formats
          const dateStr = condition.diagnosedDate
          if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            yearOfDiagnosis = dateStr.split('-')[0]
          } else {
            // Other formats, try to parse
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              yearOfDiagnosis = date.getFullYear().toString()
            }
          }
        } catch (e) {
          console.warn('Invalid diagnosed date format:', condition.diagnosedDate)
        }
      }
      
      if (condition.resolvedDate) {
        try {
          // Handle both YYYY-MM-DD and other date formats
          const dateStr = condition.resolvedDate
          if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            yearResolved = dateStr.split('-')[0]
          } else {
            // Other formats, try to parse
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              yearResolved = date.getFullYear().toString()
            }
          }
        } catch (e) {
          console.warn('Invalid resolved date format:', condition.resolvedDate)
        }
      }

      const backendData = {
        condition: condition.condition,
        yearOfDiagnosis: yearOfDiagnosis,
        yearResolved: yearResolved,
        treatment: condition.treatedWith,
        comments: condition.notes,
        diagnosedDate: condition.diagnosedDate, // Send the full date
        resolvedDate: condition.resolvedDate // Send the full date
      }

      const result = await MedicalConditionApiService.updatePastMedicalCondition(id, backendData)
      
      const updatedCondition: PastCondition = {
        id: result.id,
        condition: result.condition_name,
        diagnosedDate: result.diagnosed_date ? new Date(result.diagnosed_date).toLocaleDateString() : '',
        treatedWith: result.treatment_plan || '',
        resolvedDate: result.resolved_date ? new Date(result.resolved_date).toLocaleDateString() : '',
        notes: result.description || ''
      }
      
      setConditions(prev => prev.map(c => c.id === id ? updatedCondition : c))
      toast.success('Past condition updated successfully')
      return updatedCondition
    } catch (err: any) {
      toast.error(`Failed to update past condition: ${err.message}`)
      throw err
    }
  }

  const deleteCondition = async (id: number) => {
    try {
      await MedicalConditionApiService.deletePastMedicalCondition(id)
      setConditions(prev => prev.filter(c => c.id !== id))
      toast.success('Past condition deleted successfully')
    } catch (err: any) {
      toast.error(`Failed to delete past condition: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    loadConditions()
  }, [])

  return {
    conditions,
    loading,
    error,
    addCondition,
    updateCondition,
    deleteCondition,
    refresh: loadConditions
  }
}

// ============================================================================
// FAMILY MEDICAL HISTORY HOOK
// ============================================================================

export function useFamilyMedicalHistory() {
  const [history, setHistory] = useState<FamilyHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const backendHistory = await MedicalConditionApiService.getFamilyHistory()
      
      const transformedHistory: FamilyHistoryEntry[] = backendHistory.map(entry => ({
        id: entry.id,
        relation: entry.relation,
        is_deceased: entry.is_deceased,
        age_at_death: entry.age_at_death || undefined,
        cause_of_death: entry.cause_of_death || undefined,
        current_age: entry.current_age || undefined,
        gender: entry.gender || undefined,
        chronic_diseases: entry.chronic_diseases || [],
        // Legacy fields
        condition: entry.condition_name || undefined,
        ageOfOnset: entry.age_of_onset?.toString() || '',
        outcome: entry.outcome || undefined
      }))
      
      setHistory(transformedHistory)
    } catch (err: any) {
      setError(err.message)
      toast.error(`Failed to load family history: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addHistoryEntry = async (entry: any) => {
    try {
      console.log('Hook - addHistoryEntry called with:', entry)
      console.log('Hook - Chronic diseases in entry:', entry?.chronic_diseases)
      // Pass the entry data directly to the API service
      const result = await MedicalConditionApiService.createFamilyHistory(entry)
      
      const newEntry: FamilyHistoryEntry = {
        id: result.id,
        condition: result.condition_name || '',
        relation: result.relation,
        ageOfOnset: result.age_of_onset?.toString() || '',
        outcome: result.outcome || ''
      }
      
      setHistory(prev => [...prev, newEntry])
      toast.success('Family history entry added successfully')
      return newEntry
    } catch (err: any) {
      toast.error(`Failed to add family history entry: ${err.message}`)
      throw err
    }
  }

  const updateHistoryEntry = async (id: number, entry: any) => {
    try {
      // Pass the entry data directly to the API service
      const result = await MedicalConditionApiService.updateFamilyHistory(id, entry)
      
      const updatedEntry: FamilyHistoryEntry = {
        id: result.id,
        condition: result.condition_name || undefined,
        relation: result.relation,
        ageOfOnset: result.age_of_onset?.toString() || '',
        outcome: result.outcome || undefined
      }
      
      setHistory(prev => prev.map(h => h.id === id ? updatedEntry : h))
      toast.success('Family history entry updated successfully')
    } catch (err: any) {
      toast.error(`Failed to update family history entry: ${err.message}`)
      throw err
    }
  }

  const deleteHistoryEntry = async (id: number) => {
    try {
      await MedicalConditionApiService.deleteFamilyHistory(id)
      
      setHistory(prev => prev.filter(h => h.id !== id))
      toast.success('Family history entry deleted successfully')
    } catch (err: any) {
      toast.error(`Failed to delete family history entry: ${err.message}`)
      throw err
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  return {
    history,
    loading,
    error,
    addHistoryEntry,
    updateHistoryEntry,
    deleteHistoryEntry,
    refresh: loadHistory
  }
}
