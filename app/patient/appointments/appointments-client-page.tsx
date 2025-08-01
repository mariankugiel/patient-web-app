"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentCard } from "@/components/patient/appointment-card"
import { appointments } from "@/lib/data"
import { Calendar, Plus, Video, MapPin, Phone, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
import { useTranslation } from "react-i18next"

// Sample data for doctors
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

// Doctor type
interface Doctor {
  id: string
  name: string
  specialty: string
  location: string
  image: string
  availableTypes: string[]
  availableSlots: {
    date: string
    slots: string[]
  }[]
  acceptedInsurance: string[]
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
  const { language } = useLanguage()
  const { t } = useTranslation()

  // Add cost information to appointments
  const extendedAppointments: ExtendedAppointment[] = appointments.map((apt) => ({
    ...apt,
    cost: {
      total: apt.type === "virtual" ? 120 : 180,
      insurance: apt.type === "virtual" ? 100 : 140,
      patient: apt.type === "virtual" ? 20 : 40,
    },
  }))

  const [appointmentsData, setAppointmentsData] = useState<ExtendedAppointment[]>(extendedAppointments)
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null)
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<ExtendedAppointment | null>(null)

  // New appointment form state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [selectedType, setSelectedType] = useState<"virtual" | "in-person" | "phone" | "">("")
  const [appointmentReason, setAppointmentReason] = useState<string>("")

  // Filter states
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("")
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [selectedInsurance, setSelectedInsurance] = useState<string>("")
  const [availableTypes, setAvailableTypes] = useState<{
    virtual: boolean
    inPerson: boolean
    phone: boolean
  }>({
    virtual: true,
    inPerson: true,
    phone: true,
  })
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Filtered doctors based on filters
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(doctorsData)

  // Available time slots for selected doctor
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])

  // Filter doctors based on selected filters
  useEffect(() => {
    let filtered = doctorsData

    // Filter by specialty
    if (selectedSpecialty && selectedSpecialty !== "all") {
      filtered = filtered.filter((doctor) => doctor.specialty === selectedSpecialty)
    }

    // Filter by location
    if (selectedLocation && selectedLocation !== "all") {
      filtered = filtered.filter((doctor) => doctor.location === selectedLocation)
    }

    // Filter by insurance
    if (selectedInsurance && selectedInsurance !== "all") {
      filtered = filtered.filter((doctor) => doctor.acceptedInsurance.includes(selectedInsurance))
    }

    // Filter by available appointment types
    if (!availableTypes.virtual && !availableTypes.inPerson && !availableTypes.phone) {
      // If all types are unchecked, show all doctors (as if all were checked)
      // This prevents no results from showing when all filters are unchecked
      // This prevents no results from showing when all filters are unchecked
    } else {
      filtered = filtered.filter((doctor) => {
        return (
          (availableTypes.virtual && doctor.availableTypes.includes("virtual")) ||
          (availableTypes.inPerson && doctor.availableTypes.includes("in-person")) ||
          (availableTypes.phone && doctor.availableTypes.includes("phone"))
        )
      })
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doctor) => doctor.name.toLowerCase().includes(query) || doctor.specialty.toLowerCase().includes(query),
      )
    }

    setFilteredDoctors(filtered)
  }, [selectedSpecialty, selectedLocation, availableTypes, searchQuery, selectedInsurance])

  // Update available time slots when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      const slots: TimeSlot[] = []

      selectedDoctor.availableSlots.forEach((dateSlot) => {
        const date = new Date(dateSlot.date)

        dateSlot.slots.forEach((timeSlot) => {
          const [hours, minutes] = timeSlot.split(":")
          const slotDate = new Date(date)
          slotDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

          slots.push({
            id: `${dateSlot.date}-${timeSlot}`,
            date: dateSlot.date,
            time: timeSlot,
            formattedDateTime: formatDateTime(slotDate),
          })
        })
      })

      // Sort slots by date and time
      slots.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`)
        const dateB = new Date(`${b.date}T${b.time}`)
        return dateA.getTime() - dateB.getTime()
      })

      setAvailableTimeSlots(slots)
      setSelectedTimeSlot(null)
    } else {
      setAvailableTimeSlots([])
      setSelectedTimeSlot(null)
    }
  }, [selectedDoctor])

  // Filter appointments by status
  const upcomingAppointments = appointmentsData.filter((appointment) => appointment.status === "upcoming")
  const pastAppointments = appointmentsData.filter((appointment) => appointment.status === "completed")
  const cancelledAppointments = appointmentsData.filter((appointment) => appointment.status === "cancelled")

  // Handle appointment cancellation
  const handleCancelAppointment = (id: string) => {
    setAppointmentToCancel(id)
  }

  const confirmCancelAppointment = () => {
    if (appointmentToCancel) {
      setAppointmentsData(
        appointmentsData.map((appointment) =>
          appointment.id === appointmentToCancel ? { ...appointment, status: "cancelled" } : appointment,
        ),
      )
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      })
      setAppointmentToCancel(null)
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

  const confirmRescheduleAppointment = () => {
    if (appointmentToReschedule && selectedTimeSlot) {
      // Create new date from form inputs
      const newDate = new Date(`${selectedTimeSlot.date}T${selectedTimeSlot.time}:00`)

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

      setAppointmentToReschedule(null)
    }
  }

  // Handle join call
  const handleJoinCall = (id: string) => {
    toast({
      title: "Joining Video Call",
      description: "Connecting to your appointment...",
    })

    // In a real app, this would launch the video conference
    window.setTimeout(() => {
      toast({
        title: "Connected",
        description: "You are now connected to your appointment.",
      })
    }, 2000)
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

  // Reset filters
  const resetFilters = () => {
    setSelectedSpecialty("")
    setSelectedLocation("")
    setSelectedInsurance("")
    setAvailableTypes({
      virtual: true,
      inPerson: true,
      phone: true,
    })
    setSearchQuery("")
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

  return (
    <div className="container py-4">
      <div className="flex items-center gap-4 mb-2">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src="/middle-aged-man-profile.png" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("greeting.morning")}, John!</h1>
          <p className="text-muted-foreground">{t("appointments.manageUpcoming")}</p>
        </div>
      </div>
      <div className="mb-4 flex justify-end">
        <Dialog>
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

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="specialty">{t("appointments.specialty")}</Label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("appointments.allSpecialties")}</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">{t("appointments.location")}</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("appointments.allLocations")}</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="insurance">{t("appointments.insurance")}</Label>
                <Select value={selectedInsurance} onValueChange={setSelectedInsurance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Insurance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("appointments.allInsurance")}</SelectItem>
                    {insuranceCompanies.map((insurance) => (
                      <SelectItem key={insurance} value={insurance}>
                        {insurance}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("appointments.appointmentType")}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge
                    variant={availableTypes.virtual ? "default" : "outline"}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => setAvailableTypes({ ...availableTypes, virtual: !availableTypes.virtual })}
                  >
                    <Video className="h-3 w-3 mr-1" />
                    {getAppointmentTypeLabel("virtual")}
                  </Badge>
                  <Badge
                    variant={availableTypes.inPerson ? "default" : "outline"}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => setAvailableTypes({ ...availableTypes, inPerson: !availableTypes.inPerson })}
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {getAppointmentTypeLabel("in-person")}
                  </Badge>
                  <Badge
                    variant={availableTypes.phone ? "default" : "outline"}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => setAvailableTypes({ ...availableTypes, phone: !availableTypes.phone })}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    {getAppointmentTypeLabel("phone")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("appointments.searchDoctors")}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Doctor Selection */}
              <div className="border rounded-md overflow-hidden flex flex-col">
                <div className="bg-muted p-2 font-medium">{t("appointments.selectDoctor")}</div>
                <ScrollArea className="flex-1 h-[300px]">
                  {filteredDoctors.length > 0 ? (
                    <div className="p-2 space-y-2">
                      {filteredDoctors.map((doctor) => (
                        <div
                          key={doctor.id}
                          className={`p-2 border rounded-md cursor-pointer transition-colors ${
                            selectedDoctor?.id === doctor.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedDoctor(doctor)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={doctor.image || "/placeholder.svg"} alt={doctor.name} />
                              <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{doctor.name}</div>
                              <div className="text-sm text-muted-foreground truncate">{doctor.specialty}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <div className="text-xs text-muted-foreground flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {doctor.location}
                            </div>
                            <Separator orientation="vertical" className="h-3 mx-1" />
                            <div className="flex gap-1">
                              {doctor.availableTypes.includes("virtual") && (
                                <Badge variant="outline" className="text-xs py-0 h-5">
                                  <Video className="h-3 w-3 mr-1" />
                                  {getAppointmentTypeLabel("virtual")}
                                </Badge>
                              )}
                              {doctor.availableTypes.includes("in-person") && (
                                <Badge variant="outline" className="text-xs py-0 h-5">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {getAppointmentTypeLabel("in-person")}
                                </Badge>
                              )}
                              {doctor.availableTypes.includes("phone") && (
                                <Badge variant="outline" className="text-xs py-0 h-5">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {getAppointmentTypeLabel("phone")}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium">{t("appointments.insurance")}:</span>{" "}
                            {doctor.acceptedInsurance.slice(0, 2).join(", ")}
                            {doctor.acceptedInsurance.length > 2 && ", ..."}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">{t("appointments.noDoctorsFound")}</div>
                  )}
                </ScrollArea>
              </div>

              {/* Appointment Details */}
              <div className="border rounded-md overflow-hidden flex flex-col">
                <div className="bg-muted p-2 font-medium">{t("appointments.appointmentDetails")}</div>
                <ScrollArea className="flex-1 h-[300px]">
                  <div className="p-4 space-y-4">
                    {selectedDoctor ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedDoctor.image || "/placeholder.svg"} alt={selectedDoctor.name} />
                            <AvatarFallback>{selectedDoctor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{selectedDoctor.name}</div>
                            <div className="text-sm text-muted-foreground">{selectedDoctor.specialty}</div>
                          </div>
                        </div>

                        {/* Date and Time Selection */}
                        <div>
                          <Label>{t("appointments.selectDateTime")}</Label>
                          <div className="mt-2 space-y-2">
                            {availableTimeSlots.map((slot) => (
                              <Button
                                key={slot.id}
                                variant={selectedTimeSlot?.id === slot.id ? "default" : "outline"}
                                size="sm"
                                className="justify-start h-auto py-2 w-full"
                                onClick={() => setSelectedTimeSlot(slot)}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                <span className="text-left">{slot.formattedDateTime}</span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Appointment Type */}
                        {selectedTimeSlot && (
                          <div>
                            <Label>{t("appointments.selectType")}</Label>
                            <RadioGroup
                              value={selectedType}
                              onValueChange={(value) => setSelectedType(value as "virtual" | "in-person" | "phone")}
                              className="mt-2"
                            >
                              {selectedDoctor.availableTypes.includes("virtual") && (
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="virtual" id="virtual" />
                                  <Label htmlFor="virtual" className="flex items-center">
                                    <Video className="mr-2 h-4 w-4" />
                                    {getAppointmentTypeLabel("virtual")}
                                    <span className="ml-2 text-xs text-muted-foreground">$20 copay</span>
                                  </Label>
                                </div>
                              )}
                              {selectedDoctor.availableTypes.includes("in-person") && (
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="in-person" id="in-person" />
                                  <Label htmlFor="in-person" className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {getAppointmentTypeLabel("in-person")}
                                    <span className="ml-2 text-xs text-muted-foreground">$40 copay</span>
                                  </Label>
                                </div>
                              )}
                              {selectedDoctor.availableTypes.includes("phone") && (
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="phone" id="phone" />
                                  <Label htmlFor="phone" className="flex items-center">
                                    <Phone className="mr-2 h-4 w-4" />
                                    {getAppointmentTypeLabel("phone")}
                                    <span className="ml-2 text-xs text-muted-foreground">$20 copay</span>
                                  </Label>
                                </div>
                              )}
                            </RadioGroup>
                          </div>
                        )}

                        {/* Reason */}
                        {selectedTimeSlot && selectedType && (
                          <div>
                            <Label htmlFor="reason">{t("appointments.reasonForVisit")}</Label>
                            <Input
                              id="reason"
                              placeholder={t("appointments.reasonPlaceholder")}
                              value={appointmentReason}
                              onChange={(e) => setAppointmentReason(e.target.value)}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        {t("appointments.selectDoctorFromList")}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={resetFilters}>
                {t("appointments.resetFilters")}
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800"
                disabled={!selectedDoctor || !selectedTimeSlot || !selectedType}
                onClick={handleBookAppointment}
              >
                {t("appointments.bookAppointment")}
              </Button>
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
              <Label className="text-right">{t("appointments.type")}</Label>
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
      </Tabs>
    </div>
  )
}
