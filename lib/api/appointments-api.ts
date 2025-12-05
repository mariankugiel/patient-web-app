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
  address?: string | null
  isOnline?: boolean
  email?: string
  acuityCalendarId?: string | null
  acuityOwnerId?: string | null
  timezone?: string | null
  appointmentTypes?: Array<{
    id: string
    name?: string
    description?: string
    duration?: number
    price?: number
    type?: string
    category?: string
  }>
}

export interface Appointment {
  id: number
  patient_id: number
  professional_id: number
  appointment_date?: string
  scheduled_at?: string
  duration_minutes: number
  appointment_type: string | number
  status: string
  frontend_status?: 'upcoming' | 'completed' | 'cancelled' // For frontend convenience
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
  confirmation_page?: string | null  // Acuity confirmation/reschedule/cancel page URL
  // Video meeting fields
  virtual_meeting_url?: string
  virtual_meeting_id?: string
  virtual_meeting_platform?: string
  consultation_type?: 'virtual' | 'in_person' | 'phone'
  // Doctor information
  doctor_name?: string
  doctor_specialty?: string
  // Cost information
  cost?: number
  currency?: string
  payment_status?: string
  timezone?: string
  appointment_type_id?: number | null
  appointment_type_name?: string | null
  appointment_type_duration?: number | null
  appointment_type_price?: number | null
  amount_paid?: number | null
  is_paid?: boolean
  phone?: string | null
  location?: string | null
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
  calendar_id: string
  appointment_type_id?: number
  datetime: string // ISO format with timezone
  first_name: string
  last_name: string
  email: string
  phone?: string
  note?: string
  timezone?: string
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
    location?: string
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
   * Get available dates for a calendar
   */
  async getAvailabilityDates(calendarId: string, appointmentTypeId?: number, month?: string): Promise<string[]> {
    const params: any = {
      calendar_id: calendarId,
    }
    if (appointmentTypeId !== undefined && appointmentTypeId !== null) {
      params.appointment_type_id = appointmentTypeId
    }
    if (month) {
      params.month = month
    }
    const response = await apiClient.get('/appointments/availability/dates', { params })
    return response.data.dates || []
  },

  /**
   * Get available time slots for a calendar on a specific date
   */
  async getAvailabilityTimes(calendarId: string, date: string, appointmentTypeId?: number): Promise<any[]> {
    const params: any = {
      calendar_id: calendarId,
      date: date,
    }
    if (appointmentTypeId !== undefined && appointmentTypeId !== null) {
      params.appointment_type_id = appointmentTypeId
    }
    const response = await apiClient.get('/appointments/availability/times', { params })
    return response.data.times || []
  },

  /**
   * Get available time slots for each day in a week
   */
  async getAvailabilityWeek(calendarId: string, startDate: string, appointmentTypeId?: number): Promise<Record<string, any[]>> {
    const params: any = {
      calendar_id: calendarId,
      start_date: startDate,
    }
    if (appointmentTypeId !== undefined && appointmentTypeId !== null) {
      params.appointment_type_id = appointmentTypeId
    }
    const response = await apiClient.get('/appointments/availability/week', { params })
    if (response.data?.week) {
      const result: Record<string, any[]> = {}
      for (const day of response.data.week) {
        if (day?.date) {
          result[day.date] = day.slots || []
        }
      }
      return result
    }
    return {}
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
    appointmentId: string | number,
    data: { appointment_date: string; consultation_type?: string; appointment_type_id?: number; notes?: string }
  ): Promise<{ message: string; appointment: any }> {
    const payload: any = {
      appointment_date: data.appointment_date,
    }
    if (data.consultation_type) {
      payload.consultation_type = data.consultation_type
    }
    if (data.appointment_type_id !== undefined) {
      payload.appointment_type_id = data.appointment_type_id
    }
    if (data.notes) {
      payload.notes = data.notes
    }
    const response = await apiClient.put(`/appointments/${appointmentId}`, payload)
    return response.data
  },

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string | number): Promise<void> {
    await apiClient.delete(`/appointments/${appointmentId}`)
  },

  /**
   * Update phone number for an appointment
   */
  async updateAppointmentPhone(appointmentId: string | number, phone: string): Promise<any> {
    const response = await apiClient.patch(`/appointments/${appointmentId}/phone`, {
      phone
    })
    return response.data
  },

  /**
   * Create a new appointment via Acuity API
   */
  async bookAppointment(data: AppointmentBookRequest): Promise<any> {
    const response = await apiClient.post('/appointments/', data)
    return response.data
  },
}

export default appointmentsApiService