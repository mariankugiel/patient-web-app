import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface HealthMetric {
  id: string
  type: "blood_pressure" | "weight" | "heart_rate" | "temperature" | "glucose"
  value: number
  unit: string
  date: string
  notes?: string
}

interface Appointment {
  id: string
  doctorName: string
  specialty: string
  date: string
  time: string
  status: "scheduled" | "completed" | "cancelled"
  type: "in-person" | "virtual"
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate?: string
  instructions?: string
  isActive: boolean
}

interface HealthState {
  metrics: HealthMetric[]
  appointments: Appointment[]
  medications: Medication[]
  isLoading: boolean
  error: string | null
}

const initialState: HealthState = {
  metrics: [],
  appointments: [],
  medications: [],
  isLoading: false,
  error: null,
}

const healthSlice = createSlice({
  name: "health",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setMetrics: (state, action: PayloadAction<HealthMetric[]>) => {
      state.metrics = action.payload
    },
    addMetric: (state, action: PayloadAction<HealthMetric>) => {
      state.metrics.push(action.payload)
    },
    updateMetric: (state, action: PayloadAction<HealthMetric>) => {
      const index = state.metrics.findIndex((m) => m.id === action.payload.id)
      if (index !== -1) {
        state.metrics[index] = action.payload
      }
    },
    deleteMetric: (state, action: PayloadAction<string>) => {
      state.metrics = state.metrics.filter((m) => m.id !== action.payload)
    },
    setAppointments: (state, action: PayloadAction<Appointment[]>) => {
      state.appointments = action.payload
    },
    addAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.push(action.payload)
    },
    updateAppointment: (state, action: PayloadAction<Appointment>) => {
      const index = state.appointments.findIndex((a) => a.id === action.payload.id)
      if (index !== -1) {
        state.appointments[index] = action.payload
      }
    },
    deleteAppointment: (state, action: PayloadAction<string>) => {
      state.appointments = state.appointments.filter((a) => a.id !== action.payload)
    },
    setMedications: (state, action: PayloadAction<Medication[]>) => {
      state.medications = action.payload
    },
    addMedication: (state, action: PayloadAction<Medication>) => {
      state.medications.push(action.payload)
    },
    updateMedication: (state, action: PayloadAction<Medication>) => {
      const index = state.medications.findIndex((m) => m.id === action.payload.id)
      if (index !== -1) {
        state.medications[index] = action.payload
      }
    },
    deleteMedication: (state, action: PayloadAction<string>) => {
      state.medications = state.medications.filter((m) => m.id !== action.payload)
    },
  },
})

export const {
  setLoading,
  setError,
  setMetrics,
  addMetric,
  updateMetric,
  deleteMetric,
  setAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  setMedications,
  addMedication,
  updateMedication,
  deleteMedication,
} = healthSlice.actions

export default healthSlice.reducer
