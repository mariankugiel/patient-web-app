import apiClient from './axios-config'

// ============================================================================
// TYPES
// ============================================================================

export interface Doctor {
  id: string | number
  name: string
  firstName?: string
  lastName?: string
  specialty?: string | null
  avatar?: string | null
  isOnline?: boolean
  email?: string
  acuityCalendarId?: string | null
  acuityOwnerId?: string | null
}

export interface Appointment {
  id: number
  patient_id: number
  professional_id: number
  appointment_date: string
  duration_minutes: number
  appointment_type: string
  status: string
  reason?: string
  symptoms?: string
  notes?: string
  diagnosis?: string
  treatment_plan?: string
  prescription?: string
  follow_up_date?: string
  created_at: string
  updated_at?: string
  // Acuity integration fields
  acuity_appointment_id?: string
  acuity_calendar_id?: string
  // Video meeting fields
  virtual_meeting_url?: string
  virtual_meeting_id?: string
  virtual_meeting_platform?: string
  consultation_type?: 'virtual' | 'in_person' | 'phone'
}

export interface AcuityEmbedConfig {
  embed_url: string
  iframe_src: string
  owner_id: string
  calendar_id?: string
}

export interface VideoRoomData {
  room_url: string
  room_name: string
  patient_token: string
  professional_token?: string
}

export interface AppointmentBookRequest {
  professional_id: number
  scheduled_at: string
  consultation_type: 'virtual' | 'in_person' | 'phone'
  reason?: string
  duration_minutes?: number
  appointment_type_id?: number
}

// ============================================================================
// API SERVICE
// ============================================================================

export const appointmentsApiService = {
  /**
   * Get available doctors for appointments with search
   */
  async getDoctors(params?: {
    search?: string
    offset?: number
    limit?: number
  }): Promise<Doctor[]> {
    const response = await apiClient.get('/appointments/doctors', { params })
    return response.data
  },

  /**
   * Get Acuity embed URL for a specific doctor
   */
  async getAcuityEmbedUrl(professionalId: number): Promise<AcuityEmbedConfig> {
    const response = await apiClient.get(`/appointments/doctors/${professionalId}/acuity-embed`)
    return response.data
  },

  /**
   * Get all appointments for current user
   */
  async fetchAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get('/appointments/')
    return response.data
  },

  /**
   * Get appointment by ID
   */
  async getAppointment(appointmentId: number): Promise<Appointment> {
    const response = await apiClient.get(`/appointments/${appointmentId}`)
    return response.data
  },

  /**
   * Get video room URL and token for an appointment
   */
  async getVideoRoomUrl(appointmentId: number): Promise<VideoRoomData> {
    const response = await apiClient.get(`/appointments/${appointmentId}/video-room`)
    return response.data
  },

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: number,
    newDateTime: string
  ): Promise<Appointment> {
    const response = await apiClient.put(`/appointments/${appointmentId}`, {
      appointment_date: newDateTime
    })
    return response.data
  },

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: number): Promise<void> {
    await apiClient.delete(`/appointments/${appointmentId}`)
  },

  /**
   * Create a new appointment (manual creation, typically done via Acuity webhook)
   */
  async bookAppointment(data: AppointmentBookRequest): Promise<Appointment> {
    const response = await apiClient.post('/appointments/', data)
    return response.data
  },
}

export default appointmentsApiService

