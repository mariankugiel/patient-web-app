export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          date_of_birth: string | null
          phone_country_code: string | null
          phone: string | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_country_code: string | null
          emergency_contact_phone: string | null
          medical_record_number: string | null
          insurance_provider: string | null
          insurance_policy_number: string | null
          preferred_language: string | null
          height: number | null
          weight: number | null
          waist_diameter: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          date_of_birth?: string | null
          phone_country_code?: string | null
          phone?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_country_code?: string | null
          emergency_contact_phone?: string | null
          medical_record_number?: string | null
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          preferred_language?: string | null
          height?: number | null
          weight?: number | null
          waist_diameter?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          date_of_birth?: string | null
          phone_country_code?: string | null
          phone?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_country_code?: string | null
          emergency_contact_phone?: string | null
          medical_record_number?: string | null
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          preferred_language?: string | null
          height?: number | null
          weight?: number | null
          waist_diameter?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      health_metrics: {
        Row: {
          id: string
          user_id: string
          metric_type: string
          metric_name: string
          value: number
          unit: string | null
          reference_range: string | null
          status: "normal" | "abnormal" | "critical"
          notes: string | null
          recorded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          metric_type: string
          metric_name: string
          value: number
          unit?: string | null
          reference_range?: string | null
          status?: "normal" | "abnormal" | "critical"
          notes?: string | null
          recorded_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          metric_type?: string
          metric_name?: string
          value?: number
          unit?: string | null
          reference_range?: string | null
          status?: "normal" | "abnormal" | "critical"
          notes?: string | null
          recorded_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      blood_pressure_readings: {
        Row: {
          id: string
          user_id: string
          systolic: number
          diastolic: number
          pulse: number | null
          status: "normal" | "abnormal" | "critical"
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          systolic: number
          diastolic: number
          pulse?: number | null
          status?: "normal" | "abnormal" | "critical"
          recorded_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          systolic?: number
          diastolic?: number
          pulse?: number | null
          status?: "normal" | "abnormal" | "critical"
          recorded_at?: string
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          doctor_name: string
          specialty: string | null
          appointment_date: string
          appointment_type: "in-person" | "virtual" | "phone"
          status: "upcoming" | "completed" | "cancelled" | "rescheduled"
          location: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          doctor_name: string
          specialty?: string | null
          appointment_date: string
          appointment_type?: "in-person" | "virtual" | "phone"
          status?: "upcoming" | "completed" | "cancelled" | "rescheduled"
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          doctor_name?: string
          specialty?: string | null
          appointment_date?: string
          appointment_type?: "in-person" | "virtual" | "phone"
          status?: "upcoming" | "completed" | "cancelled" | "rescheduled"
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string | null
          frequency: string | null
          purpose: string | null
          prescribed_by: string | null
          start_date: string | null
          end_date: string | null
          instructions: string | null
          is_active: boolean | null
          prescription_number: string | null
          pharmacy: string | null
          refills_remaining: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dosage?: string | null
          frequency?: string | null
          purpose?: string | null
          prescribed_by?: string | null
          start_date?: string | null
          end_date?: string | null
          instructions?: string | null
          is_active?: boolean | null
          prescription_number?: string | null
          pharmacy?: string | null
          refills_remaining?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          dosage?: string | null
          frequency?: string | null
          purpose?: string | null
          prescribed_by?: string | null
          start_date?: string | null
          end_date?: string | null
          instructions?: string | null
          is_active?: boolean | null
          prescription_number?: string | null
          pharmacy?: string | null
          refills_remaining?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
