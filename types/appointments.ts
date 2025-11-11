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
  virtual_meeting_url?: string
  timezone?: string
  acuityCalendarId?: string | null
  notes?: string
}

