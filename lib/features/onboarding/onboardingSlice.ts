import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// ============================================================================
// TYPES
// ============================================================================

export interface CurrentHealthProblem {
  id: string
  backendId?: number
  condition: string
  yearOfDiagnosis: string
  diagnosticProvider: string
  treatment: string
  comments: string
  isValid: boolean
  errors: string[]
}

export interface MedicationSchedule {
  id: string
  time: string
  days: string[]
}

export interface Medication {
  id: string
  drugName: string
  purpose: string
  dosage: string
  frequency: string
  schedule: MedicationSchedule[]
  hasReminder: boolean
  reminderTime?: string
  reminderDays?: string[]
  isValid: boolean
  errors: string[]
}

export interface PastMedicalCondition {
  id: string
  backendId?: number
  condition: string
  yearOfDiagnosis: string
  yearResolved: string
  treatment: string
  comments: string
  isValid: boolean
  errors: string[]
}

export interface PastSurgery {
  id: string
  backendId?: number
  surgeryType: string
  year: string
  location: string
  existingConditions: string
  comments: string
  isValid: boolean
  errors: string[]
}

export interface FamilyHistory {
  id: string
  condition: string
  relationship: string
  age: string
  notes: string
  isValid: boolean
  errors: string[]
}

export interface OnboardingState {
  // Step 1: Personal Information
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: string
    gender: string
    address: string
    emergencyContactName: string
    emergencyContactPhone: string
    emergencyContactRelationship: string
    isValid: boolean
    errors: string[]
  }

  // Step 2: Medical Conditions
  medicalConditions: {
    currentHealthProblems: CurrentHealthProblem[]
    medications: Medication[]
    pastMedicalConditions: PastMedicalCondition[]
    pastSurgeries: PastSurgery[]
    familyHistory: FamilyHistory[]
    isValid: boolean
    errors: string[]
  }

  // Step 3: Family History
  familyHistory: {
    entries: FamilyHistory[]
    isValid: boolean
    errors: string[]
  }

  // Step 4: Health Records
  healthRecords: {
    labResults: Array<{
      id: string
      name: string
      date: string
      file: File | null
      fileName: string
    }>
    images: Array<{
      id: string
      category: string
      date: string
      files: File[]
      fileNames: string[]
      conclusion: string
      status: string
    }>
    isValid: boolean
    errors: string[]
  }

  // Step 5: Health Plan
  healthPlan: {
    goals: Array<{
      id: string
      name: string
      targetFigure: string
      deadline: string
      comments: string
    }>
    tasks: Array<{
      id: string
      name: string
      frequency: string
      comments: string
    }>
    isValid: boolean
    errors: string[]
  }

  // Step 6: Appointments
  appointments: {
    upcoming: Array<{
      id: string
      doctorName: string
      doctorEmail: string
      specialty: string
      date: string
      time: string
      location: string
      reason: string
      notes: string
    }>
    isValid: boolean
    errors: string[]
  }

  // Step 7: Access
  access: {
    healthProfessionals: Array<{
      id: string
      name: string
      email: string
      specialty: string
      organization: string
      permissions: Array<{
        area: string
        view: boolean
        download: boolean
        edit: boolean
      }>
    }>
    familyFriends: Array<{
      id: string
      name: string
      email: string
      relationship: string
      permissions: Array<{
        area: string
        view: boolean
        download: boolean
        edit: boolean
      }>
    }>
    isValid: boolean
    errors: string[]
  }

  // Step 8: Settings
  settings: {
    // Safety & Security
    twoFactorAuth: boolean
    passwordChangeRequired: boolean
    sessionTimeout: string
    
    // Notifications
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    appointmentReminders: boolean
    medicationReminders: boolean
    
    // Privacy
    dataSharing: boolean
    analyticsTracking: boolean
    marketingEmails: boolean
    
    // Language & Region
    language: string
    timezone: string
    dateFormat: string
    isValid: boolean
    errors: string[]
  }

  // Overall onboarding state
  currentStep: number
  completedSteps: number[]
  isSubmitting: boolean
  lastSaved: string | null
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: OnboardingState = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    isValid: false,
    errors: []
  },
  medicalConditions: {
    currentHealthProblems: [],
    medications: [],
    pastMedicalConditions: [],
    pastSurgeries: [],
    familyHistory: [],
    isValid: false,
    errors: []
  },
  familyHistory: {
    entries: [],
    isValid: false,
    errors: []
  },
  healthRecords: {
    labResults: [],
    images: [],
    isValid: false,
    errors: []
  },
  healthPlan: {
    goals: [],
    tasks: [],
    isValid: false,
    errors: []
  },
  appointments: {
    upcoming: [],
    isValid: false,
    errors: []
  },
  access: {
    healthProfessionals: [],
    familyFriends: [],
    isValid: false,
    errors: []
  },
  settings: {
    // Safety & Security
    twoFactorAuth: false,
    passwordChangeRequired: false,
    sessionTimeout: "30",
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    appointmentReminders: true,
    medicationReminders: true,
    
    // Privacy
    dataSharing: false,
    analyticsTracking: true,
    marketingEmails: false,
    
    // Language & Region
    language: "en-US",
    timezone: "UTC+00:00",
    dateFormat: "MM/DD/YYYY",
    isValid: false,
    errors: []
  },
  currentStep: 1,
  completedSteps: [1],
  isSubmitting: false,
  lastSaved: null
}

// ============================================================================
// SLICE
// ============================================================================

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    // ============================================================================
    // GENERAL ACTIONS
    // ============================================================================
    
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload
    },

    setCompletedSteps: (state, action: PayloadAction<number[]>) => {
      state.completedSteps = action.payload
    },

    addCompletedStep: (state, action: PayloadAction<number>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload)
      }
    },

    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload
    },

    setLastSaved: (state, action: PayloadAction<string>) => {
      state.lastSaved = action.payload
    },

    // ============================================================================
    // PERSONAL INFO ACTIONS
    // ============================================================================
    
    updatePersonalInfo: (state, action: PayloadAction<Partial<OnboardingState['personalInfo']>>) => {
      state.personalInfo = { ...state.personalInfo, ...action.payload }
    },

    validatePersonalInfo: (state) => {
      const errors: string[] = []
      const { firstName, lastName, email, phone, dateOfBirth, gender } = state.personalInfo

      if (!firstName.trim()) errors.push('First name is required')
      if (!lastName.trim()) errors.push('Last name is required')
      if (!email.trim()) errors.push('Email is required')
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format')
      if (!phone.trim()) errors.push('Phone number is required')
      if (!dateOfBirth.trim()) errors.push('Date of birth is required')
      if (!gender.trim()) errors.push('Gender is required')

      state.personalInfo.errors = errors
      state.personalInfo.isValid = errors.length === 0
    },

    // ============================================================================
    // MEDICAL CONDITIONS ACTIONS
    // ============================================================================
    
    addCurrentHealthProblem: (state, action: PayloadAction<Omit<CurrentHealthProblem, 'isValid' | 'errors'> & { id?: string }>) => {
      const newProblem: CurrentHealthProblem = {
        ...action.payload,
        id: action.payload.id || `health-problem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isValid: false,
        errors: []
      }
      
      // Check if entry with this ID already exists
      const existingIndex = state.medicalConditions.currentHealthProblems.findIndex(p => p.id === newProblem.id)
      if (existingIndex === -1) {
        state.medicalConditions.currentHealthProblems.push(newProblem)
      }
    },

    updateCurrentHealthProblem: (state, action: PayloadAction<{ id: string; updates: Partial<CurrentHealthProblem> }>) => {
      const { id, updates } = action.payload
      const index = state.medicalConditions.currentHealthProblems.findIndex(p => p.id === id)
      if (index !== -1) {
        state.medicalConditions.currentHealthProblems[index] = {
          ...state.medicalConditions.currentHealthProblems[index],
          ...updates
        }
      }
    },

    removeCurrentHealthProblem: (state, action: PayloadAction<string>) => {
      state.medicalConditions.currentHealthProblems = state.medicalConditions.currentHealthProblems.filter(p => p.id !== action.payload)
    },

    validateCurrentHealthProblem: (state, action: PayloadAction<string>) => {
      const problem = state.medicalConditions.currentHealthProblems.find(p => p.id === action.payload)
      if (problem) {
        const errors: string[] = []
        
        if (!problem.condition.trim()) errors.push('Condition name is required')
        if (problem.yearOfDiagnosis && isNaN(parseInt(problem.yearOfDiagnosis))) {
          errors.push('Year of diagnosis must be a valid year')
        }
        if (problem.yearOfDiagnosis && parseInt(problem.yearOfDiagnosis) > new Date().getFullYear()) {
          errors.push('Year of diagnosis cannot be in the future')
        }

        problem.errors = errors
        problem.isValid = errors.length === 0
      }
    },

    addMedication: (state, action: PayloadAction<Omit<Medication, 'id' | 'isValid' | 'errors'>>) => {
      const newMedication: Medication = {
        ...action.payload,
        id: `medication-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isValid: false,
        errors: []
      }
      state.medicalConditions.medications.push(newMedication)
    },

    updateMedication: (state, action: PayloadAction<{ id: string; updates: Partial<Medication> }>) => {
      const { id, updates } = action.payload
      const index = state.medicalConditions.medications.findIndex(m => m.id === id)
      if (index !== -1) {
        state.medicalConditions.medications[index] = {
          ...state.medicalConditions.medications[index],
          ...updates
        }
      }
    },

    removeMedication: (state, action: PayloadAction<string>) => {
      state.medicalConditions.medications = state.medicalConditions.medications.filter(m => m.id !== action.payload)
    },

    validateMedication: (state, action: PayloadAction<string>) => {
      const medication = state.medicalConditions.medications.find(m => m.id === action.payload)
      if (medication) {
        const errors: string[] = []
        
        if (!medication.drugName.trim()) errors.push('Drug name is required')
        if (medication.hasReminder && !medication.reminderTime) {
          errors.push('Reminder time is required when reminder is enabled')
        }
        if (medication.hasReminder && (!medication.reminderDays || medication.reminderDays.length === 0)) {
          errors.push('At least one reminder day must be selected')
        }
        
        medication.schedule.forEach((scheduleEntry, index) => {
          if (!scheduleEntry.time) {
            errors.push(`Schedule ${index + 1}: Time is required`)
          }
          if (!scheduleEntry.days || scheduleEntry.days.length === 0) {
            errors.push(`Schedule ${index + 1}: At least one day must be selected`)
          }
        })

        medication.errors = errors
        medication.isValid = errors.length === 0
      }
    },

    addPastMedicalCondition: (state, action: PayloadAction<Omit<PastMedicalCondition, 'isValid' | 'errors'> & { id?: string }>) => {
      const newCondition: PastMedicalCondition = {
        ...action.payload,
        id: action.payload.id || `past-condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isValid: false,
        errors: []
      }
      
      // Check if entry with this ID already exists
      const existingIndex = state.medicalConditions.pastMedicalConditions.findIndex(c => c.id === newCondition.id)
      if (existingIndex === -1) {
        state.medicalConditions.pastMedicalConditions.push(newCondition)
      }
    },

    updatePastMedicalCondition: (state, action: PayloadAction<{ id: string; updates: Partial<PastMedicalCondition> }>) => {
      const { id, updates } = action.payload
      const index = state.medicalConditions.pastMedicalConditions.findIndex(c => c.id === id)
      if (index !== -1) {
        state.medicalConditions.pastMedicalConditions[index] = {
          ...state.medicalConditions.pastMedicalConditions[index],
          ...updates
        }
      }
    },

    removePastMedicalCondition: (state, action: PayloadAction<string>) => {
      state.medicalConditions.pastMedicalConditions = state.medicalConditions.pastMedicalConditions.filter(c => c.id !== action.payload)
    },

    validatePastMedicalCondition: (state, action: PayloadAction<string>) => {
      const condition = state.medicalConditions.pastMedicalConditions.find(c => c.id === action.payload)
      if (condition) {
        const errors: string[] = []
        
        if (!condition.condition.trim()) errors.push('Condition name is required')
        if (condition.yearOfDiagnosis && isNaN(parseInt(condition.yearOfDiagnosis))) {
          errors.push('Year of diagnosis must be a valid year')
        }
        if (condition.yearResolved && isNaN(parseInt(condition.yearResolved))) {
          errors.push('Year resolved must be a valid year')
        }
        if (condition.yearOfDiagnosis && condition.yearResolved) {
          const diagnosisYear = parseInt(condition.yearOfDiagnosis)
          const resolvedYear = parseInt(condition.yearResolved)
          if (resolvedYear < diagnosisYear) {
            errors.push('Year resolved cannot be before year of diagnosis')
          }
        }
        if (condition.yearOfDiagnosis && parseInt(condition.yearOfDiagnosis) > new Date().getFullYear()) {
          errors.push('Year of diagnosis cannot be in the future')
        }

        condition.errors = errors
        condition.isValid = errors.length === 0
      }
    },

    addPastSurgery: (state, action: PayloadAction<Omit<PastSurgery, 'isValid' | 'errors'> & { id?: string }>) => {
      const newSurgery: PastSurgery = {
        ...action.payload,
        id: action.payload.id || `past-surgery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isValid: false,
        errors: []
      }
      
      // Check if entry with this ID already exists
      const existingIndex = state.medicalConditions.pastSurgeries.findIndex(s => s.id === newSurgery.id)
      if (existingIndex === -1) {
        state.medicalConditions.pastSurgeries.push(newSurgery)
      }
    },

    updatePastSurgery: (state, action: PayloadAction<{ id: string; updates: Partial<PastSurgery> }>) => {
      const { id, updates } = action.payload
      const index = state.medicalConditions.pastSurgeries.findIndex(s => s.id === id)
      if (index !== -1) {
        state.medicalConditions.pastSurgeries[index] = {
          ...state.medicalConditions.pastSurgeries[index],
          ...updates
        }
      }
    },

    removePastSurgery: (state, action: PayloadAction<string>) => {
      state.medicalConditions.pastSurgeries = state.medicalConditions.pastSurgeries.filter(s => s.id !== action.payload)
    },

    validatePastSurgery: (state, action: PayloadAction<string>) => {
      const surgery = state.medicalConditions.pastSurgeries.find(s => s.id === action.payload)
      if (surgery) {
        const errors: string[] = []
        
        if (!surgery.surgeryType.trim()) errors.push('Type of surgery is required')
        if (surgery.year && isNaN(parseInt(surgery.year))) {
          errors.push('Year must be a valid year')
        }
        if (surgery.year && parseInt(surgery.year) > new Date().getFullYear()) {
          errors.push('Year cannot be in the future')
        }

        surgery.errors = errors
        surgery.isValid = errors.length === 0
      }
    },

    // ============================================================================
    // HEALTH RECORDS ACTIONS
    // ============================================================================
    
    updateHealthRecords: (state, action: PayloadAction<Partial<OnboardingState['healthRecords']>>) => {
      state.healthRecords = { ...state.healthRecords, ...action.payload }
    },

    // ============================================================================
    // HEALTH PLAN ACTIONS
    // ============================================================================
    
    updateHealthPlan: (state, action: PayloadAction<Partial<OnboardingState['healthPlan']>>) => {
      state.healthPlan = { ...state.healthPlan, ...action.payload }
    },

    // ============================================================================
    // APPOINTMENTS ACTIONS
    // ============================================================================
    
    updateAppointments: (state, action: PayloadAction<Partial<OnboardingState['appointments']>>) => {
      state.appointments = { ...state.appointments, ...action.payload }
    },

    // ============================================================================
    // ACCESS ACTIONS
    // ============================================================================
    
    updateAccess: (state, action: PayloadAction<Partial<OnboardingState['access']>>) => {
      state.access = { ...state.access, ...action.payload }
    },

    // ============================================================================
    // SETTINGS ACTIONS
    // ============================================================================
    
    updateSettings: (state, action: PayloadAction<Partial<OnboardingState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload }
    },

    // ============================================================================
    // BULK ACTIONS
    // ============================================================================
    
    loadOnboardingData: (state, action: PayloadAction<Partial<OnboardingState>>) => {
      return { ...state, ...action.payload }
    },

    clearOnboardingData: (state) => {
      return initialState
    },

    // ============================================================================
    // VALIDATION ACTIONS
    // ============================================================================
    
    validateMedicalConditions: (state) => {
      const errors: string[] = []
      
      // Validate all health problems
      state.medicalConditions.currentHealthProblems.forEach(problem => {
        if (!problem.isValid) {
          errors.push(...problem.errors)
        }
      })
      
      // Validate all medications
      state.medicalConditions.medications.forEach(medication => {
        if (!medication.isValid) {
          errors.push(...medication.errors)
        }
      })
      
      // Validate all past conditions
      state.medicalConditions.pastMedicalConditions.forEach(condition => {
        if (!condition.isValid) {
          errors.push(...condition.errors)
        }
      })
      
      // Validate all surgeries
      state.medicalConditions.pastSurgeries.forEach(surgery => {
        if (!surgery.isValid) {
          errors.push(...surgery.errors)
        }
      })

      state.medicalConditions.errors = errors
      state.medicalConditions.isValid = errors.length === 0
    }
  }
})

export const {
  // General actions
  setCurrentStep,
  setCompletedSteps,
  addCompletedStep,
  setSubmitting,
  setLastSaved,
  
  // Personal info actions
  updatePersonalInfo,
  validatePersonalInfo,
  
  // Medical conditions actions
  addCurrentHealthProblem,
  updateCurrentHealthProblem,
  removeCurrentHealthProblem,
  validateCurrentHealthProblem,
  addMedication,
  updateMedication,
  removeMedication,
  validateMedication,
  addPastMedicalCondition,
  updatePastMedicalCondition,
  removePastMedicalCondition,
  validatePastMedicalCondition,
  addPastSurgery,
  updatePastSurgery,
  removePastSurgery,
  validatePastSurgery,
  
  // Health records actions
  updateHealthRecords,
  
  // Health plan actions
  updateHealthPlan,
  
  // Appointments actions
  updateAppointments,
  
  // Access actions
  updateAccess,
  
  // Settings actions
  updateSettings,
  
  // Bulk actions
  loadOnboardingData,
  clearOnboardingData,
  validateMedicalConditions
} = onboardingSlice.actions

export default onboardingSlice.reducer
