"use client"

import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentCard } from "@/components/patient/appointment-card"
import { appointments } from "@/lib/data"
import { Calendar, Plus, Video, MapPin, Phone, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { appointmentsApiService } from "@/lib/api/appointments-api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RecipientAutocomplete, type Contact } from "@/components/messages/recipient-autocomplete"
import { useCallback } from "react"
import type { Doctor as DoctorType } from "@/lib/api/appointments-api"

// Doctor type for the component
interface Doctor {
  id: string | number
  name: string
  firstName?: string
  lastName?: string
  specialty?: string | null
  avatar?: string | null
  isOnline?: boolean
  email?: string
}

// Sample data for doctors (deprecated - now using API)
const doctorsData = [
  {
    id: "dr-johnson",
    name: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    location: "Main Hospital - Downtown",
    image: "/female-doctor-stethoscope.png",
    availableTypes: ["virtual", "in-person", "phone"],
    availableSlots: [
      { date: "2023-06-01", slots: ["09:00", "10:00", "14:00", "15:00"] },
      { date: "2023-06-02", slots: ["11:00", "13:00", "16:00"] },
      { date: "2023-06-05", slots: ["09:30", "10:30", "14:30"] },
    ],
    acceptedInsurance: ["Blue Cross", "Aetna", "UnitedHealthcare", "Cigna"],
  },
  {
    id: "dr-chen",
    name: "Dr. Michael Chen",
    specialty: "Primary Care",
    location: "North Medical Center",
    image: "/placeholder.svg?key=hfzdk",
    availableTypes: ["virtual", "in-person"],
    availableSlots: [
      { date: "2023-06-01", slots: ["08:00", "08:30", "13:00"] },
      { date: "2023-06-03", slots: ["09:00", "09:30", "10:00", "10:30"] },
      { date: "2023-06-04", slots: ["14:00", "14:30", "15:00", "15:30"] },
    ],
    acceptedInsurance: ["Blue Cross", "UnitedHealthcare", "Medicare"],
  },
  {
    id: "dr-rodriguez",
    name: "Dr. Emily Rodriguez",
    specialty: "Endocrinology",
    location: "South Medical Center",
    image: "/placeholder.svg?key=w7skg",
    availableTypes: ["in-person", "phone"],
    availableSlots: [
      { date: "2023-06-02", slots: ["10:00", "11:00", "12:00"] },
      { date: "2023-06-03", slots: ["14:00", "15:00", "16:00"] },
      { date: "2023-06-06", slots: ["09:00", "10:00", "11:00"] },
    ],
    acceptedInsurance: ["Aetna", "Cigna", "Humana"],
  },
  {
    id: "dr-wilson",
    name: "Dr. James Wilson",
    specialty: "Dermatology",
    location: "East Medical Center",
    image: "/placeholder.svg?key=yx5mj",
    availableTypes: ["virtual", "in-person"],
    availableSlots: [
      { date: "2023-06-01", slots: ["11:00", "11:30", "12:00"] },
      { date: "2023-06-02", slots: ["14:00", "14:30", "15:00"] },
      { date: "2023-06-05", slots: ["10:00", "10:30", "11:00"] },
    ],
    acceptedInsurance: ["Blue Cross", "Cigna", "Kaiser Permanente"],
  },
  {
    id: "dr-patel",
    name: "Dr. Lisa Patel",
    specialty: "Psychiatry",
    location: "Telehealth Only",
    image: "/placeholder.svg?key=oh95f",
    availableTypes: ["virtual", "phone"],
    availableSlots: [
      { date: "2023-06-01", slots: ["13:00", "13:30", "14:00", "14:30"] },
      { date: "2023-06-03", slots: ["10:00", "10:30", "11:00", "11:30"] },
      { date: "2023-06-04", slots: ["15:00", "15:30", "16:00", "16:30"] },
    ],
    acceptedInsurance: ["UnitedHealthcare", "Aetna", "Medicare", "Medicaid"],
  },
  {
    id: "dr-smith",
    name: "Dr. Robert Smith",
    specialty: "Cardiology",
    location: "West Medical Center",
    image: "/placeholder.svg?key=e2vhr",
    availableTypes: ["in-person"],
    availableSlots: [
      { date: "2023-06-02", slots: ["09:00", "10:00", "11:00"] },
      { date: "2023-06-04", slots: ["13:00", "14:00", "15:00"] },
      { date: "2023-06-06", slots: ["10:00", "11:00", "12:00"] },
    ],
    acceptedInsurance: ["Blue Cross", "Medicare", "Medicaid"],
  },
  {
    id: "dr-nguyen",
    name: "Dr. Kim Nguyen",
    specialty: "Neurology",
    location: "Main Hospital - Downtown",
    image: "/asian-female-neurologist.png",
    availableTypes: ["virtual", "in-person"],
    availableSlots: [
      { date: "2023-06-01", slots: ["10:00", "11:00", "15:00"] },
      { date: "2023-06-03", slots: ["09:00", "10:00", "14:00"] },
      { date: "2023-06-05", slots: ["11:00", "13:00", "16:00"] },
    ],
    acceptedInsurance: ["Cigna", "Humana", "Kaiser Permanente"],
  },
  {
    id: "dr-garcia",
    name: "Dr. Carlos Garcia",
    specialty: "Gastroenterology",
    location: "South Medical Center",
    image: "/placeholder.svg?key=rk3fn",
    availableTypes: ["in-person", "phone"],
    availableSlots: [
      { date: "2023-06-02", slots: ["09:30", "10:30", "14:30"] },
      { date: "2023-06-04", slots: ["11:30", "13:30", "15:30"] },
      { date: "2023-06-06", slots: ["10:30", "11:30", "14:30"] },
    ],
    acceptedInsurance: ["Aetna", "UnitedHealthcare", "Medicaid"],
  },
  {
    id: "dr-williams",
    name: "Dr. Jennifer Williams",
    specialty: "Obstetrics & Gynecology",
    location: "North Medical Center",
    image: "/placeholder.svg?key=3l1r9",
    availableTypes: ["virtual", "in-person"],
    availableSlots: [
      { date: "2023-06-01", slots: ["09:00", "10:00", "11:00"] },
      { date: "2023-06-03", slots: ["13:00", "14:00", "15:00"] },
      { date: "2023-06-05", slots: ["10:00", "11:00", "14:00"] },
    ],
    acceptedInsurance: ["Blue Cross", "Aetna", "Cigna", "Humana"],
  },
  {
    id: "dr-brown",
    name: "Dr. David Brown",
    specialty: "Orthopedics",
    location: "East Medical Center",
    image: "/placeholder.svg?key=qcn6w",
    availableTypes: ["in-person"],
    availableSlots: [
      { date: "2023-06-02", slots: ["08:00", "09:00", "10:00"] },
      { date: "2023-06-04", slots: ["13:00", "14:00", "15:00"] },
      { date: "2023-06-06", slots: ["09:00", "10:00", "11:00"] },
    ],
    acceptedInsurance: ["Medicare", "Medicaid", "Kaiser Permanente"],
  },
]

// Get unique specialties from doctors data
const specialties = Array.from(new Set(doctorsData.map((doctor) => doctor.specialty))).sort()

// Get unique locations from doctors data
const locations = Array.from(new Set(doctorsData.map((doctor) => doctor.location))).sort()

// Get unique insurance companies from doctors data
const insuranceCompanies = Array.from(new Set(doctorsData.flatMap((doctor) => doctor.acceptedInsurance))).sort()

// Extended appointment type with cost information
interface ExtendedAppointment {
  id: string
  doctor: string
  specialty: string
  date: string
  status: "upcoming" | "completed" | "cancelled"
  type: "virtual" | "in-person" | "phone"
  cost?: {
    total: number
    insurance: number
    patient: number
  }
}


// Combined date and time slot type
interface TimeSlot {
  id: string
  date: string
  time: string
  formattedDateTime: string
}

export default function AppointmentsClientPage() {
  const { toast } = useToast()
  const { language, t } = useLanguage()

  const [appointmentsData, setAppointmentsData] = useState<ExtendedAppointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null)
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<ExtendedAppointment | null>(null)

  // New appointment form state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [selectedType, setSelectedType] = useState<"virtual" | "in-person" | "phone" | "">("")
  const [appointmentReason, setAppointmentReason] = useState<string>("")

  // Acuity embed state
  const [acuityEmbedUrl, setAcuityEmbedUrl] = useState<string | null>(null)
  const embedScriptLoaded = useRef(false)

  // Doctor search state
  const [availableDoctors, setAvailableDoctors] = useState<Contact[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingMoreDoctors, setLoadingMoreDoctors] = useState(false)
  const [hasMoreDoctors, setHasMoreDoctors] = useState(false)
  const [doctorsOffset, setDoctorsOffset] = useState(0)
  const doctorsOffsetRef = useRef(0) // Use ref to track offset for callbacks
  const [currentSearchQuery, setCurrentSearchQuery] = useState("")
  const doctorsLimit = 20
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Available time slots for selected doctor
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])

  // Load doctors from API
  const loadDoctors = useCallback(async (reset: boolean = false, searchQuery: string = "") => {
    try {
      if (reset) {
        setLoadingDoctors(true)
        setDoctorsOffset(0)
        doctorsOffsetRef.current = 0
      } else {
        setLoadingMoreDoctors(true)
      }

      // Use ref to get current offset value (avoids stale closure)
      const currentOffset = reset ? 0 : doctorsOffsetRef.current
      
      const doctors = await appointmentsApiService.getDoctors({
        search: searchQuery || undefined,
        offset: currentOffset,
        limit: doctorsLimit
      })
      
      // Transform to Contact format for RecipientAutocomplete
      const contacts: Contact[] = doctors.map((doctor) => ({
        id: doctor.id.toString(),
        name: doctor.name,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        role: doctor.specialty || "Doctor",
        specialty: doctor.specialty || undefined,
        avatar: doctor.avatar || undefined,
        isOnline: doctor.isOnline || false,
        acuityCalendarId: doctor.acuityCalendarId || undefined,
        acuityOwnerId: doctor.acuityOwnerId || undefined
      }))
      
      // Check if there are more doctors to load
      const hasMore = contacts.length >= doctorsLimit
      setHasMoreDoctors(hasMore)
      
      if (reset) {
        setAvailableDoctors(contacts)
        const newOffset = contacts.length
        setDoctorsOffset(newOffset)
        doctorsOffsetRef.current = newOffset
      } else {
        setAvailableDoctors(prev => [...prev, ...contacts])
        const newOffset = doctorsOffsetRef.current + contacts.length
        setDoctorsOffset(newOffset)
        doctorsOffsetRef.current = newOffset
      }
    } catch (error) {
      console.error("Failed to load doctors:", error)
      if (reset) {
        setAvailableDoctors([])
      }
      setHasMoreDoctors(false)
    } finally {
      setLoadingDoctors(false)
      setLoadingMoreDoctors(false)
    }
  }, [doctorsLimit]) // No dependencies on doctorsOffset - using ref instead

  const handleSearchDoctors = useCallback((query: string) => {
    setCurrentSearchQuery(query)
    loadDoctors(true, query)
  }, [loadDoctors])

  const loadMoreDoctors = useCallback(async () => {
    if (loadingMoreDoctors || !hasMoreDoctors) return
    await loadDoctors(false, currentSearchQuery)
  }, [loadingMoreDoctors, hasMoreDoctors, currentSearchQuery, loadDoctors])

  // Load doctors when dialog opens - only once
  useEffect(() => {
    if (isDialogOpen) {
      // Reset state and load doctors
      setCurrentSearchQuery("")
      setAvailableDoctors([])
      setDoctorsOffset(0)
      doctorsOffsetRef.current = 0
      setHasMoreDoctors(false)
      
      // Load doctors - call directly since we're resetting state
      loadDoctors(true, "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen]) // Only run when dialog opens/closes, not when loadDoctors changes

  // Construct Acuity embed URL when doctor is selected
  useEffect(() => {
    if (!selectedDoctor) {
      setAcuityEmbedUrl(null)
      setAvailableTimeSlots([])
      setSelectedTimeSlot(null)
      return
    }

    // Construct Acuity iframe URL from doctor's owner ID and calendar ID
    const ownerId = selectedDoctor.acuityOwnerId
    const calendarId = selectedDoctor.acuityCalendarId

    if (ownerId && calendarId) {
      const iframeUrl = `https://app.acuityscheduling.com/schedule.php?owner=${ownerId}&calendarID=${calendarId}&ref=embedded_csp`
      setAcuityEmbedUrl(iframeUrl)
      
      // Load Acuity embed script if not already loaded
      if (!embedScriptLoaded.current && typeof window !== 'undefined') {
        const script = document.createElement('script')
        script.src = 'https://embed.acuityscheduling.com/js/embed.js'
        script.async = true
        script.type = 'text/javascript'
        document.body.appendChild(script)
        embedScriptLoaded.current = true
      }
    } else {
      setAcuityEmbedUrl(null)
      console.warn('Doctor missing Acuity owner ID or calendar ID:', { ownerId, calendarId })
    }
  }, [selectedDoctor])

  // Fetch appointments from API
  useEffect(() => {
    const loadAppointments = async () => {
      setLoadingAppointments(true)
      try {
        const apiAppointments = await appointmentsApiService.fetchAppointments()
        // Transform API appointments to ExtendedAppointment format
        const transformed: ExtendedAppointment[] = apiAppointments.map((apt) => ({
          id: apt.id.toString(),
          doctor: `Dr. ${apt.professional_id}`, // TODO: Get doctor name from professional_id
          specialty: "", // TODO: Get specialty from professional
          date: apt.appointment_date || apt.scheduled_at,
          status: apt.status?.toLowerCase() === "cancelled" ? "cancelled" : 
                  apt.status?.toLowerCase() === "completed" ? "completed" : "upcoming",
          type: apt.consultation_type?.replace("_", "-") as "virtual" | "in-person" | "phone" || "in-person",
          cost: {
            total: apt.cost || (apt.consultation_type === "virtual" ? 120 : 180),
            insurance: (apt.cost || (apt.consultation_type === "virtual" ? 120 : 180)) * 0.8,
            patient: (apt.cost || (apt.consultation_type === "virtual" ? 120 : 180)) * 0.2,
          }
        }))
        setAppointmentsData(transformed)
      } catch (error: any) {
        console.error("Error fetching appointments:", error)
        toast({
          title: "Error",
          description: "Failed to load appointments. Please try again.",
          variant: "destructive"
        })
        // Fallback to empty array or mock data for development
        setAppointmentsData([])
      } finally {
        setLoadingAppointments(false)
    }
    }

    loadAppointments()
  }, [toast])

  // Filter appointments by status
  const upcomingAppointments = appointmentsData.filter((appointment) => appointment.status === "upcoming")
  const pastAppointments = appointmentsData.filter((appointment) => appointment.status === "completed")
  const cancelledAppointments = appointmentsData.filter((appointment) => appointment.status === "cancelled")

  // Handle appointment cancellation
  const handleCancelAppointment = (id: string) => {
    setAppointmentToCancel(id)
  }

  const confirmCancelAppointment = async () => {
    if (appointmentToCancel) {
      try {
        await appointmentsApiService.cancelAppointment(parseInt(appointmentToCancel))
      setAppointmentsData(
        appointmentsData.map((appointment) =>
          appointment.id === appointmentToCancel ? { ...appointment, status: "cancelled" } : appointment,
        ),
      )
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Failed to cancel appointment. Please try again.",
          variant: "destructive"
        })
      } finally {
      setAppointmentToCancel(null)
      }
    }
  }

  // Handle appointment rescheduling
  const handleRescheduleAppointment = (id: string) => {
    const appointment = appointmentsData.find((apt) => apt.id === id)
    if (appointment) {
      // Initialize form with current appointment details
      const date = new Date(appointment.date)
      setSelectedTimeSlot({
        id: `reschedule-${id}`,
        date: date.toISOString().split("T")[0],
        time: date.toTimeString().slice(0, 5),
        formattedDateTime: formatDateTime(date),
      })
      setSelectedType(appointment.type)
      setAppointmentToReschedule(appointment)
    }
  }

  const confirmRescheduleAppointment = async () => {
    if (appointmentToReschedule && selectedTimeSlot) {
      // Create new date from form inputs
      const newDate = new Date(`${selectedTimeSlot.date}T${selectedTimeSlot.time}:00`)

      try {
        await appointmentsApiService.rescheduleAppointment(
          parseInt(appointmentToReschedule.id),
          newDate.toISOString()
        )
      setAppointmentsData(
        appointmentsData.map((appointment) =>
          appointment.id === appointmentToReschedule.id
            ? {
                ...appointment,
                date: newDate.toISOString(),
                type: selectedType || "in-person",
                // Update cost based on appointment type
                cost: {
                  total: selectedType === "virtual" ? 120 : 180,
                  insurance: selectedType === "virtual" ? 100 : 140,
                  patient: selectedType === "virtual" ? 20 : 40,
                },
              }
            : appointment,
        ),
      )
      toast({
        title: "Appointment Rescheduled",
        description: `Your appointment has been rescheduled to ${formatDateTime(newDate)}.`,
      })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Failed to reschedule appointment. Please try again.",
          variant: "destructive"
        })
      } finally {
      setAppointmentToReschedule(null)
      }
    }
  }

  // Handle join call
  const handleJoinCall = async (id: string) => {
    try {
    toast({
      title: "Joining Video Call",
      description: "Connecting to your appointment...",
    })

      const roomData = await appointmentsApiService.getVideoRoomUrl(parseInt(id))
      const joinUrl = `${roomData.room_url}?t=${roomData.patient_token}`
      
      // Open Daily.co room in new tab
      window.open(joinUrl, '_blank')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to join video call. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle booking a new appointment
  const handleBookAppointment = () => {
    if (selectedDoctor && selectedTimeSlot && selectedType) {
      const newAppointmentDate = new Date(`${selectedTimeSlot.date}T${selectedTimeSlot.time}:00`)

      // Create new appointment
      const newAppointment: ExtendedAppointment = {
        id: `app-${Date.now()}`,
        doctor: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date: newAppointmentDate.toISOString(),
        status: "upcoming",
        type: selectedType,
        cost: {
          total: selectedType === "virtual" ? 120 : 180,
          insurance: selectedType === "virtual" ? 100 : 140,
          patient: selectedType === "virtual" ? 20 : 40,
        },
      }

      // Add to appointments
      setAppointmentsData([...appointmentsData, newAppointment])

      // Show success toast
      toast({
        title: "Appointment Booked",
        description: `Your appointment with ${selectedDoctor.name} on ${formatDateTime(newAppointmentDate)} has been booked.`,
      })

      // Reset form
      setSelectedDoctor(null)
      setSelectedTimeSlot(null)
      setSelectedType("")
      setAppointmentReason("")
    }
  }

  // Reset dialog state
  const resetDialog = () => {
    setSelectedDoctor(null)
    setAcuityEmbedUrl(null)
    setCurrentSearchQuery("")
    setAvailableDoctors([])
    setDoctorsOffset(0)
    doctorsOffsetRef.current = 0
    setHasMoreDoctors(false)
  }

  // Handle doctor selection from RecipientAutocomplete
  const handleSelectDoctor = (contact: Contact | null) => {
    if (contact) {
      // Convert Contact to Doctor format
      const doctor: Doctor = {
        id: contact.id,
        name: contact.name,
        firstName: contact.firstName,
        lastName: contact.lastName,
        specialty: contact.specialty || null,
        avatar: contact.avatar || null,
        isOnline: contact.isOnline,
        acuityCalendarId: contact.acuityCalendarId || null,
        acuityOwnerId: contact.acuityOwnerId || null
      }
      setSelectedDoctor(doctor)
    } else {
      setSelectedDoctor(null)
    }
  }

  // Format date and time for display
  function formatDateTime(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }

    return date.toLocaleDateString(language === "es" ? "es-ES" : language === "pt" ? "pt-BR" : "en-US", options)
  }

  // Get appointment type label
  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case "virtual":
        return t("appointments.type.virtual")
      case "in-person":
        return t("appointments.type.inPerson")
      case "phone":
        return t("appointments.type.phone")
      default:
        return type
    }
  }

  // Get appointment type icon
  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case "virtual":
        return <Video className="h-4 w-4" />
      case "in-person":
        return <MapPin className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      default:
        return null
    }
  }

  // Get user data from Redux store
  const { user } = useSelector((state: RootState) => state.auth)
  const userName = user?.user_metadata?.full_name || "User"
  const firstName = userName.split(' ')[0] || "User"

  return (
    <div className="container py-4">
      <div className="mb-4 flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800">
              <Plus className="mr-2 h-4 w-4" />
              {t("appointments.bookNew")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{t("appointments.bookNew")}</DialogTitle>
              <DialogDescription>{t("appointments.fillDetails")}</DialogDescription>
            </DialogHeader>

            {/* Doctor Search */}
            <div className="mb-4">
              <Label className="mb-2 block">{t("appointments.searchDoctors")}</Label>
              <RecipientAutocomplete
                selectedRecipient={selectedDoctor ? {
                  id: selectedDoctor.id.toString(),
                  name: selectedDoctor.name,
                  firstName: selectedDoctor.firstName,
                  lastName: selectedDoctor.lastName,
                  role: selectedDoctor.specialty || "Doctor",
                  specialty: selectedDoctor.specialty || undefined,
                  avatar: selectedDoctor.avatar || undefined,
                  isOnline: selectedDoctor.isOnline || false
                } : null}
                onSelectRecipient={handleSelectDoctor}
                onSearch={handleSearchDoctors}
                contacts={availableDoctors}
                loading={loadingDoctors}
                placeholder={t("appointments.searchDoctorsPlaceholder")}
                hasMore={hasMoreDoctors}
                onLoadMore={loadMoreDoctors}
                loadingMore={loadingMoreDoctors}
              />
            </div>

            <div className="flex-1 overflow-hidden">
              {/* Appointment Details / Acuity Embed */}
              <div className="border rounded-md overflow-hidden flex flex-col w-full">
                <div className="bg-muted p-2 font-medium">
                    {selectedDoctor ? (
                          <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedDoctor.avatar || "/placeholder.svg"} alt={selectedDoctor.name} />
                            <AvatarFallback>
                              {selectedDoctor.firstName?.charAt(0) || selectedDoctor.name.charAt(0)}
                              {selectedDoctor.lastName?.charAt(0) || ""}
                            </AvatarFallback>
                            </Avatar>
                          <div>
                        <div className="font-medium text-sm">{selectedDoctor.name}</div>
                        <div className="text-xs text-muted-foreground">{selectedDoctor.specialty || t("appointments.doctor")}</div>
                            </div>
                    </div>
                  ) : (
                    t("appointments.appointmentDetails")
                  )}
              </div>
                <div className="flex-1 overflow-hidden">
                    {selectedDoctor ? (
                    acuityEmbedUrl ? (
                      <div className="w-full h-[600px]">
                        <iframe
                          src={acuityEmbedUrl}
                          title="Schedule Appointment"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allow="payment"
                          className="border-0"
                            />
                          </div>
                    ) : (
                      <div className="h-[600px] flex items-center justify-center p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Unable to load booking calendar.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            This doctor does not have Acuity scheduling configured. Please contact support or try selecting another doctor.
                          </p>
                        </div>
                                </div>
                    )
                    ) : (
                    <div className="h-[600px] flex items-center justify-center text-muted-foreground p-4">
                      <p className="text-sm">{t("appointments.selectDoctorFromList")}</p>
                      </div>
                    )}
                  </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline" 
                onClick={() => {
                  resetDialog()
                }}
              >
                {t("appointments.clear")}
              </Button>
              {acuityEmbedUrl && (
                <p className="text-xs text-muted-foreground flex items-center">
                  {t("appointments.bookDirectly")}
                </p>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={!!appointmentToReschedule} onOpenChange={(open) => !open && setAppointmentToReschedule(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("appointments.rescheduleAppointment")}</DialogTitle>
            <DialogDescription>
              {appointmentToReschedule && (
                <>
                  {t("appointments.rescheduleWith")} {appointmentToReschedule.doctor}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reschedule-date-time" className="text-right">
                {t("appointments.newDateTime")}
              </Label>
              <Input
                id="reschedule-date-time"
                type="datetime-local"
                className="col-span-3"
                value={selectedTimeSlot ? `${selectedTimeSlot.date}T${selectedTimeSlot.time}` : ""}
                onChange={(e) => {
                  const dateTime = new Date(e.target.value)
                  setSelectedTimeSlot({
                    id: "manual-selection",
                    date: dateTime.toISOString().split("T")[0],
                    time: dateTime.toTimeString().slice(0, 5),
                    formattedDateTime: formatDateTime(dateTime),
                  })
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("appointments.appointmentType")}</Label>
              <div className="col-span-3">
                <RadioGroup
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as "virtual" | "in-person" | "phone")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="virtual" id="virtual-reschedule" />
                    <Label htmlFor="virtual-reschedule" className="flex items-center">
                      <Video className="mr-2 h-4 w-4" />
                      Video Call
                      <span className="ml-2 text-xs text-muted-foreground">$20 copay</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-person" id="in-person-reschedule" />
                    <Label htmlFor="in-person-reschedule" className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      In-Person
                      <span className="ml-2 text-xs text-muted-foreground">$40 copay</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone-reschedule" />
                    <Label htmlFor="phone-reschedule" className="flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      Phone
                      <span className="ml-2 text-xs text-muted-foreground">$20 copay</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentToReschedule(null)}>
              {t("action.cancel")}
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800"
              onClick={confirmRescheduleAppointment}
            >
              {t("appointments.confirmReschedule")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!appointmentToCancel} onOpenChange={(open) => !open && setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("appointments.cancelAppointment")}</AlertDialogTitle>
            <AlertDialogDescription>{t("appointments.cancelConfirmation")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("appointments.keepAppointment")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelAppointment} className="bg-red-600 hover:bg-red-700">
              {t("appointments.yesCancelAppointment")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
            {t("appointments.upcoming")} ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 sm:flex-none">
            {t("appointments.past")} ({pastAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 sm:flex-none">
            {t("appointments.cancelled")} ({cancelledAppointments.length})
          </TabsTrigger>
        </TabsList>

        {loadingAppointments ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
        <TabsContent value="upcoming">
          {upcomingAppointments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  id={appointment.id}
                  doctor={appointment.doctor}
                  specialty={appointment.specialty}
                  date={appointment.date}
                  status={appointment.status}
                  type={appointment.type}
                  cost={appointment.cost}
                  onCancel={handleCancelAppointment}
                  onReschedule={handleRescheduleAppointment}
                  onJoinCall={handleJoinCall}
                />
              ))}
            </div>
          ) : (
            <Card className="flex h-40 flex-col items-center justify-center p-6 text-center">
              <Calendar className="mb-2 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">{t("appointments.noUpcoming")}</h3>
              <p className="text-sm text-muted-foreground">{t("appointments.bookToGetStarted")}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastAppointments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  id={appointment.id}
                  doctor={appointment.doctor}
                  specialty={appointment.specialty}
                  date={appointment.date}
                  status={appointment.status}
                  type={appointment.type}
                  cost={appointment.cost}
                />
              ))}
            </div>
          ) : (
            <Card className="flex h-40 flex-col items-center justify-center p-6 text-center">
              <Calendar className="mb-2 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">{t("appointments.noPast")}</h3>
              <p className="text-sm text-muted-foreground">{t("appointments.historyWillAppear")}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {cancelledAppointments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cancelledAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  id={appointment.id}
                  doctor={appointment.doctor}
                  specialty={appointment.specialty}
                  date={appointment.date}
                  status={appointment.status}
                  type={appointment.type}
                  cost={appointment.cost}
                />
              ))}
            </div>
          ) : (
            <Card className="flex h-40 flex-col items-center justify-center p-6 text-center">
              <Calendar className="mb-2 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">{t("appointments.noCancelled")}</h3>
              <p className="text-sm text-muted-foreground">{t("appointments.cancelledWillAppear")}</p>
            </Card>
          )}
        </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
