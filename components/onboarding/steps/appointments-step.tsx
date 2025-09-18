"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Calendar, Clock, User, Mail } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"

interface Appointment {
  id: string
  doctorName: string
  doctorEmail: string
  specialty: string
  date: string
  time: string
  location: string
  reason: string
  notes: string
}

interface AppointmentsData {
  upcoming: Appointment[]
}

interface AppointmentsStepProps {
  formData: { appointments: AppointmentsData }
  updateFormData: (data: Partial<AppointmentsData>) => void
  language: Language
}

const specialties = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Gynecology",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Urology",
  "Other"
]

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
]

export function AppointmentsStep({ formData, updateFormData, language }: AppointmentsStepProps) {
  const t = getTranslation(language, "steps.appointments")

  const addAppointment = () => {
    const newAppointment: Appointment = {
      id: `appointment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      doctorName: "",
      doctorEmail: "",
      specialty: "",
      date: "",
      time: "",
      location: "",
      reason: "",
      notes: ""
    }
    updateFormData({
      upcoming: [...(formData.appointments?.upcoming || []), newAppointment]
    })
  }

  const removeAppointment = (appointmentId: string) => {
    updateFormData({
      upcoming: (formData.appointments?.upcoming || []).filter(appointment => appointment.id !== appointmentId)
    })
  }

  const updateAppointment = (appointmentId: string, field: keyof Appointment, value: string) => {
    updateFormData({
      upcoming: (formData.appointments?.upcoming || []).map(appointment => 
        appointment.id === appointmentId ? { ...appointment, [field]: value } : appointment
      )
    })
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Appointments
            <span className="text-sm font-normal text-gray-500">
              ({(formData.appointments?.upcoming || []).length} appointments)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.appointments?.upcoming || []).map((appointment) => (
            <div key={appointment.id} className="border rounded-lg p-4 space-y-4">
              {/* Doctor Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`doctorName-${appointment.id}`} className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Doctor Name
                  </Label>
                  <Input
                    id={`doctorName-${appointment.id}`}
                    value={appointment.doctorName}
                    onChange={(e) => updateAppointment(appointment.id, 'doctorName', e.target.value)}
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor={`doctorEmail-${appointment.id}`} className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Doctor Email
                  </Label>
                  <Input
                    id={`doctorEmail-${appointment.id}`}
                    type="email"
                    value={appointment.doctorEmail}
                    onChange={(e) => updateAppointment(appointment.id, 'doctorEmail', e.target.value)}
                    placeholder="doctor@clinic.com"
                  />
                </div>
              </div>

              {/* Specialty and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`specialty-${appointment.id}`}>Specialty</Label>
                  <Select
                    value={appointment.specialty}
                    onValueChange={(value) => updateAppointment(appointment.id, 'specialty', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty.toLowerCase().replace(' ', '-')}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`location-${appointment.id}`}>Location</Label>
                  <Input
                    id={`location-${appointment.id}`}
                    value={appointment.location}
                    onChange={(e) => updateAppointment(appointment.id, 'location', e.target.value)}
                    placeholder="Clinic name or address"
                  />
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`date-${appointment.id}`} className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </Label>
                  <Input
                    id={`date-${appointment.id}`}
                    type="date"
                    value={appointment.date}
                    onChange={(e) => updateAppointment(appointment.id, 'date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`time-${appointment.id}`} className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time
                  </Label>
                  <Select
                    value={appointment.time}
                    onValueChange={(value) => updateAppointment(appointment.id, 'time', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reason and Notes */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor={`reason-${appointment.id}`}>Reason for Visit</Label>
                  <Input
                    id={`reason-${appointment.id}`}
                    value={appointment.reason}
                    onChange={(e) => updateAppointment(appointment.id, 'reason', e.target.value)}
                    placeholder="e.g., Annual checkup, Follow-up, Specific symptoms"
                  />
                </div>
                <div>
                  <Label htmlFor={`notes-${appointment.id}`}>Notes</Label>
                  <Textarea
                    id={`notes-${appointment.id}`}
                    value={appointment.notes}
                    onChange={(e) => updateAppointment(appointment.id, 'notes', e.target.value)}
                    placeholder="Any additional notes or questions for the doctor"
                    rows={3}
                  />
                </div>
              </div>

              {/* Remove Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAppointment(appointment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Appointment
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addAppointment}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Appointment
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
