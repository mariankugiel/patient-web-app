export type AppointmentStatus = "upcoming" | "completed" | "cancelled"
export type AppointmentConsultationType = "virtual" | "in-person" | "phone"

export interface FrontendAppointment {
  id: string
  doctor: string
  doctorId?: string | number
  specialty: string
  date: string
  status: AppointmentStatus
  type: AppointmentConsultationType
  cost?: number
  amountPaid?: number | null
  virtual_meeting_url?: string
  timezone?: string
  acuityCalendarId?: string | null
  confirmation_page?: string | null  // Acuity confirmation/reschedule/cancel page URL
  notes?: string
  appointmentTypeId?: string | number | null
  appointmentTypeName?: string | null
  appointmentTypeDuration?: number | null
  appointmentTypePrice?: number | null
}

