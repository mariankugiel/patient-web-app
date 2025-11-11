"use client"

import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from "react"
import { parseISO, format, startOfWeek, addDays } from "date-fns"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentCard } from "@/components/patient/appointment-card"
import { Calendar, Plus, Video, MapPin, Phone, Search, Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
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
import { PermissionGuard } from "@/components/patient/permission-guard"
import type { Contact } from "@/components/messages/recipient-autocomplete"
import { detectUserTimezone } from "@/lib/utils/timezone"
import type { FrontendAppointment } from "@/types/appointments"

interface Doctor {
  id: string | number
  name: string
  firstName?: string
  lastName?: string
  specialty?: string | null
  avatar?: string | null
  isOnline?: boolean
  email?: string
  timezone?: string | null
  acuityCalendarId?: string | null
  acuityOwnerId?: string | null
}

// Combined date and time slot type
interface TimeSlot {
  id: string
  date: string
  time: string
  formattedDateTime: string
  displayTime: string
  isoTime?: string
  rawTime?: string
}

export default function AppointmentsClientPage() {
  return (
    <PermissionGuard requiredPermission="can_view_appointments">
      <AppointmentsClientPageContent />
    </PermissionGuard>
  )
}

function AppointmentsClientPageContent() {
  const { toast } = useToast()
  const { language, t } = useLanguage()

  const [appointmentsData, setAppointmentsData] = useState<FrontendAppointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null)
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null)

  // New appointment form state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [selectedType, setSelectedType] = useState<"virtual" | "in-person" | "phone" | "">("")
  const [appointmentNote, setAppointmentNote] = useState<string>("")
  const [appointmentPhone, setAppointmentPhone] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [currentWeekStart, setCurrentWeekStart] = useState<string>("")
  const [selectedTimezone, setSelectedTimezone] = useState<string>("")
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [isBooking, setIsBooking] = useState(false)

  // Doctor search state
  const [availableDoctors, setAvailableDoctors] = useState<Contact[]>([])
  const [doctorLoadError, setDoctorLoadError] = useState<string | null>(null)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingMoreDoctors, setLoadingMoreDoctors] = useState(false)
  const [hasMoreDoctors, setHasMoreDoctors] = useState(false)
  const [doctorsOffset, setDoctorsOffset] = useState(0)
  const doctorsOffsetRef = useRef(0) // Use ref to track offset for callbacks
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const [currentSearchQuery, setCurrentSearchQuery] = useState("")
  const doctorsLimit = 20
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isRescheduleMode = Boolean(rescheduleAppointmentId)

  // Available time slots for selected doctor (from Acuity API)
  const [weeklyTimeSlots, setWeeklyTimeSlots] = useState<{ date: string; slots: TimeSlot[] }[]>([])
  const selectedDateRef = useRef(selectedDate)

  const fallbackTimezone = useMemo(() => detectUserTimezone(), [])
  const resolvedTimezone = selectedDoctor?.timezone || selectedTimezone || fallbackTimezone
  const timezoneDisplay = useMemo(() => {
    if (!resolvedTimezone) {
      return ""
    }
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: resolvedTimezone,
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "shortOffset",
      })
      const parts = formatter.formatToParts(new Date())
      const offsetPart = parts.find((part) => part.type === "timeZoneName")?.value
      return offsetPart ? `${resolvedTimezone} (${offsetPart})` : resolvedTimezone
    } catch (error) {
      console.warn("Failed to format timezone:", error)
      return resolvedTimezone
    }
  }, [resolvedTimezone])

  const weekRangeLabel = useMemo(() => {
    if (!currentWeekStart) return ""
    try {
      const startDate = parseISO(`${currentWeekStart}T00:00:00`)
      const endDate = addDays(startDate, 6)
      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
    } catch {
      return ""
    }
  }, [currentWeekStart])

  const weekColumnsData = useMemo(
    () => weeklyTimeSlots.filter((day) => day.slots && day.slots.length > 0),
    [weeklyTimeSlots]
  )

  const weekColumns = useMemo(() => {
    return weekColumnsData.map((day) => {
      const dayDate = parseISO(`${day.date}T00:00:00`)
      const isActiveDay = day.date === selectedDate
      return (
        <div
          key={day.date}
          className={`flex h-full flex-col rounded-md border p-3 transition-colors ${isActiveDay ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30" : "border-border bg-background"
            }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">{format(dayDate, "EEE")}</span>
            <span className="text-xs text-muted-foreground">{format(dayDate, "MMM d")}</span>
          </div>
          <div className="mt-3 space-y-2 flex-1 overflow-y-auto pr-1">
            {day.slots.map((slot) => {
              const isSelected = selectedTimeSlot?.id === slot.id
              return (
                <Button
                  key={slot.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-center ${isSelected ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                  onClick={() => {
                    setSelectedDate(day.date)
                    setSelectedTimeSlot(slot)
                  }}
                >
                  {slot.displayTime}
                </Button>
              )
            })}
          </div>
        </div>
      )
    })
  }, [weekColumnsData, selectedDate, selectedTimeSlot])

  const weekColumnsCount = weekColumns.length
  const weekGridStyle = useMemo<CSSProperties | undefined>(() => {
    if (weekColumnsCount === 0) {
      return undefined
    }
    return {
      gridTemplateColumns: `repeat(${weekColumnsCount}, minmax(180px, 1fr))`,
    }
  }, [weekColumnsCount])

  const normalizeIsoString = (value: string): string => {
    if (!value) return ""
    const trimmed = value.trim()
    if (/[\+\-]\d{4}$/.test(trimmed) && trimmed[trimmed.length - 3] !== ":") {
      return `${trimmed.slice(0, -2)}:${trimmed.slice(-2)}`
    }
    return trimmed
  }

  const buildIsoFromParts = (rawTime: string, date: string): string => {
    if (!rawTime) return ""
    const trimmed = rawTime.trim()
    if (!trimmed) return ""
    if (trimmed.includes("T")) {
      return normalizeIsoString(trimmed)
    }
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (match) {
      const hours = match[1].padStart(2, "0")
      const minutes = match[2]
      const seconds = match[3] || "00"
      return `${date}T${hours}:${minutes}:${seconds}`
    }
    return ""
  }

  const deriveSlotMetadata = (slot: any, date: string) => {
    let rawValue = ""
    if (typeof slot === "string") {
      rawValue = slot.trim()
    } else if (typeof slot === "object" && slot !== null) {
      const candidate =
        slot.time ??
        slot.datetime ??
        slot.start_time ??
        slot.startTime ??
        null
      if (candidate !== null && candidate !== undefined) {
        rawValue = candidate.toString().trim()
      }
    }

    let isoCandidate = ""
    if (typeof slot === "object" && slot?.datetime) {
      isoCandidate = slot.datetime.toString()
    } else if (rawValue && rawValue.includes("T")) {
      isoCandidate = rawValue
    }

    let iso = ""
    if (isoCandidate) {
      const normalized = normalizeIsoString(isoCandidate)
      try {
        parseISO(normalized)
        iso = normalized
      } catch {
        iso = ""
      }
    }

    if (!iso) {
      const fallbackIso = buildIsoFromParts(rawValue, date)
      if (fallbackIso) {
        try {
          parseISO(fallbackIso)
          iso = fallbackIso
        } catch {
          iso = ""
        }
      }
    }

    let displayTime = rawValue
    if (iso) {
      try {
        displayTime = format(parseISO(iso), "HH:mm")
      } catch {
        displayTime = rawValue
      }
    } else if (rawValue) {
      const match = rawValue.match(/(\d{1,2}):(\d{2})/)
      if (match) {
        displayTime = `${match[1].padStart(2, "0")}:${match[2]}`
      }
    }

    if (!displayTime) {
      displayTime = "—"
    }

    const effectiveRaw = rawValue || iso || displayTime

    return {
      raw: effectiveRaw,
      display: displayTime,
      iso,
    }
  }

  // Load doctors from API
  const loadDoctors = useCallback(async (reset: boolean = false, searchQuery: string = "") => {
    try {
      if (reset) {
        setLoadingDoctors(true)
        setDoctorsOffset(0)
        doctorsOffsetRef.current = 0
        setDoctorLoadError(null)
      } else {
        setLoadingMoreDoctors(true)
      }

      if (!reset) {
        setDoctorLoadError(null)
      }

      // Use ref to get current offset value (avoids stale closure)
      const currentOffset = reset ? 0 : doctorsOffsetRef.current

      const doctors = await appointmentsApiService.getDoctors({
        search: searchQuery || undefined,
        offset: currentOffset,
        limit: doctorsLimit
      })

      // Transform API response to Contact format
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
        acuityOwnerId: doctor.acuityOwnerId || undefined,
        timezone: doctor.timezone || undefined
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
        const errorMessage =
          (error instanceof Error && error.message) ||
          (typeof error === "string" ? error : null) ||
          "error"
        setDoctorLoadError(errorMessage)
      }
      setHasMoreDoctors(false)
    } finally {
      setLoadingDoctors(false)
      setLoadingMoreDoctors(false)
    }
  }, [doctorsLimit]) // No dependencies on doctorsOffset - using ref instead

  const handleSearchDoctors = useCallback((query: string) => {
    setCurrentSearchQuery(query)
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = setTimeout(() => {
      loadDoctors(true, query)
    }, 300)
  }, [loadDoctors])

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])

  useEffect(() => {
    selectedDateRef.current = selectedDate
  }, [selectedDate])

  const loadMoreDoctors = useCallback(async () => {
    if (loadingMoreDoctors || !hasMoreDoctors) return
    await loadDoctors(false, currentSearchQuery)
  }, [loadingMoreDoctors, hasMoreDoctors, currentSearchQuery, loadDoctors])

  const handleWeekChange = useCallback(
    (direction: "prev" | "next") => {
      const baseDate = currentWeekStart
        ? parseISO(`${currentWeekStart}T00:00:00`)
        : startOfWeek(new Date(), { weekStartsOn: 1 })
      const newStart = addDays(baseDate, direction === "next" ? 7 : -7)
      const newStartStr = format(newStart, "yyyy-MM-dd")
      setCurrentWeekStart(newStartStr)
      setSelectedDate(newStartStr)
      setSelectedTimeSlot(null)
    },
    [currentWeekStart]
  )

  const handleAppointmentTypeChange = (value: "virtual" | "in-person" | "phone") => {
    console.log(value);
    setSelectedType(value)
    if (value !== "phone") {
      setAppointmentPhone("")
    }
  };

  // Load doctors when dialog opens - only once
  useEffect(() => {
    if (isDialogOpen) {
      // Reset state and load doctors
      setCurrentSearchQuery("")
      setAvailableDoctors([])
      setDoctorsOffset(0)
      doctorsOffsetRef.current = 0
      setHasMoreDoctors(false)
      if (!isRescheduleMode) {
        setWeeklyTimeSlots([])
        setSelectedDoctor(null)
        setSelectedTimeSlot(null)
        setSelectedType("")
        setSelectedDate("")
        setSelectedTimezone("")
        setCurrentWeekStart("")
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = null
      }

      // Load doctors - call directly since we're resetting state
      if (!isRescheduleMode) {
        loadDoctors(true, "")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen, rescheduleAppointmentId]) // Only run when dialog opens/closes, not when loadDoctors changes

  // Fetch available time slots for the current week
  useEffect(() => {
    if (!selectedDoctor) {
      setWeeklyTimeSlots([])
      setSelectedTimeSlot(null)
      return
    }

    const calendarId = selectedDoctor.acuityCalendarId
    if (!calendarId) {
      console.warn("Doctor missing Acuity calendar ID")
      return
    }

    // Ensure we have a week start date established
    if (!currentWeekStart) {
      const today = new Date()
      const weekStartDate = startOfWeek(today, { weekStartsOn: 1 })
      const weekStartStr = format(weekStartDate, "yyyy-MM-dd")
      setCurrentWeekStart(weekStartStr)
      if (!selectedDate) {
        setSelectedDate(format(today, "yyyy-MM-dd"))
      }
      return
    }

    const weekStartDate = parseISO(`${currentWeekStart}T00:00:00`)
    const weekDates = Array.from({ length: 7 }, (_, index) =>
      format(addDays(weekStartDate, index), "yyyy-MM-dd")
    )

    const currentSelectedDate = selectedDateRef.current
    if (!currentSelectedDate) {
      setSelectedDate(weekDates[0])
      setSelectedTimeSlot(null)
      return
    }
    if (!weekDates.includes(currentSelectedDate)) {
      setSelectedDate(weekDates[0])
      setSelectedTimeSlot(null)
      return
    }

    const fetchTimeSlots = async () => {
      setLoadingTimeSlots(true)
      try {
        const weeklyAvailability = await appointmentsApiService.getAvailabilityWeek(calendarId, currentWeekStart)

        const weekly = weekDates.map((dateStr, index) => {
          const rawSlots = weeklyAvailability[dateStr] || []
          const slots: TimeSlot[] = rawSlots.map((slot: any, slotIndex: number) => {
            const metadata = deriveSlotMetadata(slot, dateStr)
            const isoTime = metadata.iso
            let formattedDateTime = `${dateStr} ${metadata.display}`
            if (isoTime) {
              try {
                formattedDateTime = format(parseISO(isoTime), "PPpp")
              } catch {
                formattedDateTime = `${dateStr} ${metadata.display}`
              }
            }
            return {
              id: `${dateStr}-slot-${slotIndex}`,
              date: dateStr,
              time: metadata.display,
              formattedDateTime,
              displayTime: metadata.display,
              isoTime,
              rawTime: metadata.raw,
            }
          })
          return {
            date: dateStr,
            slots,
          }
        })

        setWeeklyTimeSlots(weekly)
        setSelectedTimeSlot((previousSlot) => {
          if (!previousSlot) return null
          const foundDay = weekly.find((day) => day.date === previousSlot.date)
          if (!foundDay) return null
          return foundDay.slots.find((slot) => slot.displayTime === previousSlot.displayTime) || null
        })
      } catch (error: any) {
        console.error("Failed to fetch time slots:", error)
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Failed to load available time slots",
          variant: "destructive",
        })
        setWeeklyTimeSlots([])
        setSelectedTimeSlot(null)
      } finally {
        setLoadingTimeSlots(false)
      }
    }

    fetchTimeSlots()
  }, [selectedDoctor, currentWeekStart])

  const loadAppointments = useCallback(async () => {
    setLoadingAppointments(true)
    try {
      const apiAppointments = await appointmentsApiService.fetchAppointments()
      const transformed: FrontendAppointment[] = apiAppointments.map((apt) => {
        let appointmentStatus: "upcoming" | "completed" | "cancelled" = "upcoming"
        if (apt.frontend_status) {
          appointmentStatus = apt.frontend_status
        } else {
          const statusUpper = apt.status?.toUpperCase() || ""
          if (statusUpper.includes("CANCELLED") || statusUpper.includes("CANCELED")) {
            appointmentStatus = "cancelled"
          } else if (statusUpper === "COMPLETED") {
            appointmentStatus = "completed"
          } else {
            appointmentStatus = "upcoming"
          }
        }

        let appointmentType: "virtual" | "in-person" | "phone" = "in-person"
        if (apt.consultation_type === "virtual") {
          appointmentType = "virtual"
        } else if (apt.consultation_type === "phone") {
          appointmentType = "phone"
        }

        const costValue =
          typeof apt.cost === "number"
            ? apt.cost
            : apt.consultation_type === "virtual"
              ? 120
              : 180

        return {
          id: apt.id.toString(),
          doctor: apt.doctor_name || `Dr. ${apt.professional_id}`,
          doctorId: apt.professional_id,
          specialty: apt.doctor_specialty || "",
          date: apt.appointment_date || apt.scheduled_at || apt.created_at,
          status: appointmentStatus,
          type: appointmentType,
          cost: costValue,
          virtual_meeting_url: apt.virtual_meeting_url,
          timezone: apt.timezone,
          acuityCalendarId: apt.acuity_calendar_id || null,
          notes: apt.notes || "",
        }
      })
      setAppointmentsData(transformed)
    } catch (error: any) {
      console.error("Error fetching appointments:", error)
      toast({
        title: "Error",
        description: "Failed to load appointments. Please try again.",
        variant: "destructive",
      })
      setAppointmentsData([])
    } finally {
      setLoadingAppointments(false)
    }
  }, [toast])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // Filter appointments by status
  const upcomingAppointments = appointmentsData.filter((appointment) => appointment.status === "upcoming")
  const pastAppointments = appointmentsData.filter((appointment) => appointment.status === "completed")
  const cancelledAppointments = appointmentsData.filter((appointment) => appointment.status === "cancelled")

  // Handle appointment cancellation
  const handleCancelAppointment = (id: string) => {
    setAppointmentToCancel(id)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      resetDialog()
    }
  }

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) {
      return
    }

    try {
      await appointmentsApiService.cancelAppointment(appointmentToCancel)
      setAppointmentsData((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentToCancel
            ? { ...appointment, status: "cancelled", frontend_status: "cancelled" }
            : appointment,
        ),
      )
      toast({
        title: t("appointments.cancelSuccessTitle"),
        description: t("appointments.cancelSuccessDescription"),
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || t("appointments.cancelError"),
        variant: "destructive",
      })
    } finally {
      setAppointmentToCancel(null)
    }
  }

  // Handle appointment rescheduling
  const handleRescheduleAppointment = (id: string) => {
    const appointment = appointmentsData.find((apt) => apt.id === id)
    if (!appointment) {
      toast({
        title: "Error",
        description: "Unable to find appointment details.",
        variant: "destructive",
      })
      return
    }

    const appointmentDate = new Date(appointment.date)
    const isoString = appointmentDate.toISOString()
    const dateStr = format(appointmentDate, "yyyy-MM-dd")
    const timeStr = format(appointmentDate, "HH:mm")
    const weekStartStr = format(startOfWeek(appointmentDate, { weekStartsOn: 1 }), "yyyy-MM-dd")

    const doctorNameParts = appointment.doctor.split(" ")
    const doctorFirstName = doctorNameParts[0] || appointment.doctor
    const doctorLastName = doctorNameParts.slice(1).join(" ")

    const doctorIdentifier =
      (appointment.doctorId !== undefined && appointment.doctorId !== null
        ? appointment.doctorId.toString()
        : appointment.acuityCalendarId || appointment.doctor)

    const doctorForReschedule: Doctor = {
      id: doctorIdentifier,
      name: appointment.doctor,
      firstName: doctorFirstName,
      lastName: doctorLastName,
      specialty: appointment.specialty,
      avatar: null,
      isOnline: false,
      acuityCalendarId: appointment.acuityCalendarId || null,
      acuityOwnerId: null,
      timezone: appointment.timezone || null
    }

    setSelectedDoctor(doctorForReschedule)
    setSelectedType(appointment.type)
    setSelectedTimezone(appointment.timezone || fallbackTimezone)
    setSelectedDate(dateStr)
    setCurrentWeekStart(weekStartStr)
    setSelectedTimeSlot({
      id: `reschedule-${id}`,
      date: dateStr,
      time: timeStr,
      formattedDateTime: formatDateTime(appointmentDate),
      displayTime: timeStr,
      isoTime: isoString,
      rawTime: isoString,
    })
    setAppointmentNote(appointment.notes || "")
    setRescheduleAppointmentId(id)
    setIsDialogOpen(true)
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
  const handleBookAppointment = async () => {
    if (isBooking) {
      return
    }

    if (!selectedDoctor || !selectedTimeSlot || !selectedType || !selectedDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (selectedType === "phone" && !appointmentPhone) {
      toast({
        title: "Error",
        description: "Please provide phone number for phone appointment",
        variant: "destructive"
      })
      return
    }

    setIsBooking(true)

    try {
      // Get user info (already available from component level)
      const userEmail = user?.email || ""
      const userName = user?.user_metadata?.full_name || ""
      const nameParts = userName.split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      // Build datetime string with timezone
      const timezoneToUse = selectedDoctor?.timezone || selectedTimezone || fallbackTimezone

      const slotIsoSource =
        selectedTimeSlot.isoTime ||
        buildIsoFromParts(selectedTimeSlot.rawTime || selectedTimeSlot.time, selectedDate)
      const datetimeISO = normalizeIsoString(slotIsoSource || `${selectedDate}T${selectedTimeSlot.time}:00`)

      // Build appointment request
      const appointmentData = {
        calendar_id: selectedDoctor.acuityCalendarId || "",
        datetime: datetimeISO,
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        phone: selectedType === "phone" ? appointmentPhone : undefined,
        appointment_type: selectedType,
        note: appointmentNote || undefined,
        timezone: timezoneToUse || undefined
      }

      if (rescheduleAppointmentId) {
        await appointmentsApiService.rescheduleAppointment(rescheduleAppointmentId, {
          appointment_date: datetimeISO,
          appointment_type: selectedType || undefined,
          notes: appointmentNote || undefined,
        })

        toast({
          title: "Appointment Updated",
          description: "Your appointment has been rescheduled successfully.",
        })
        await loadAppointments()
        setIsDialogOpen(false)
      } else {
        await appointmentsApiService.bookAppointment(appointmentData)

        toast({
          title: "Appointment Booked",
          description: `Your appointment with ${selectedDoctor.name} has been booked successfully.`,
        })
        await loadAppointments()
        setIsDialogOpen(false)
      }
    } catch (error: any) {
      console.error("Failed to book appointment:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to book appointment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsBooking(false)
    }
  }

  // Reset dialog state
  const resetDialog = () => {
    setSelectedDoctor(null)
    setSelectedTimeSlot(null)
    setSelectedType("")
    setAppointmentNote("")
    setAppointmentPhone("")
    setSelectedDate("")
    setSelectedTimezone("")
    setWeeklyTimeSlots([])
    setCurrentWeekStart("")
    setRescheduleAppointmentId(null)
    setIsBooking(false)
    setCurrentSearchQuery("")
    setAvailableDoctors([])
    setDoctorsOffset(0)
    doctorsOffsetRef.current = 0
    setHasMoreDoctors(false)
  }

  // Handle doctor selection from list/search results
  const handleSelectDoctor = (contact: Contact | null) => {
    if (isRescheduleMode) {
      return
    }
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
        acuityOwnerId: contact.acuityOwnerId || null,
        timezone: contact.timezone || null
      }
      setSelectedDoctor(doctor)
      const today = new Date()
      const todayStr = format(today, "yyyy-MM-dd")
      const weekStartStr = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
      setSelectedDate(todayStr)
      setCurrentWeekStart(weekStartStr)
      setSelectedTimeSlot(null)
      setWeeklyTimeSlots([])
      setSelectedTimezone(contact.timezone || fallbackTimezone)
    } else {
      setSelectedDoctor(null)
      setSelectedTimezone("")
      setSelectedDate("")
      setCurrentWeekStart("")
      setWeeklyTimeSlots([])
      setSelectedTimeSlot(null)
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
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800">
              <Plus className="mr-2 h-4 w-4" />
              {t("appointments.bookNew")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1120px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {rescheduleAppointmentId
                  ? t("appointments.rescheduleAppointment")
                  : t("appointments.bookNew")}
              </DialogTitle>
              <DialogDescription>
                {rescheduleAppointmentId
                  ? t("appointments.rescheduleDescription")
                  : t("appointments.fillDetails")}
              </DialogDescription>
            </DialogHeader>

            {/* Side-by-side layout: Doctor List and Schedule Panel */}
            <div className={`flex-1 flex overflow-hidden min-h-0 ${!isRescheduleMode ? "gap-4" : ""}`}>
              {!isRescheduleMode && (
                <div className="w-[26%] max-w-[280px] min-w-[240px] border rounded-md overflow-hidden flex flex-col">
                  <div className="border-b bg-muted/60 p-3 space-y-3">
                    <div className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                      {t("appointments.selectDoctor")}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={currentSearchQuery}
                        onChange={(e) => handleSearchDoctors(e.target.value)}
                        placeholder={t("appointments.searchDoctorsPlaceholder")}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                      {doctorLoadError ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 p-4 text-center">
                          <AlertCircle className="h-6 w-6 text-muted-foreground" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{t("appointments.doctorLoadError")}</p>
                            {doctorLoadError && doctorLoadError !== "error" && (
                              <p className="text-xs text-muted-foreground break-words">{doctorLoadError}</p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadDoctors(true, currentSearchQuery)}
                            disabled={loadingDoctors}
                          >
                            {loadingDoctors ? t("common.loading") : t("common.retry")}
                          </Button>
                        </div>
                      ) : (
                        <>
                          {availableDoctors.map((doctor) => (
                            <div
                              key={doctor.id}
                              onClick={() => handleSelectDoctor(doctor)}
                              className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedDoctor?.id.toString() === doctor.id.toString()
                                ? "bg-teal-50 dark:bg-teal-900 border-teal-500"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={doctor.avatar || "/placeholder.svg"} alt={doctor.name} />
                                  <AvatarFallback>
                                    {doctor.firstName?.charAt(0) || doctor.name.charAt(0)}
                                    {doctor.lastName?.charAt(0) || ""}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{doctor.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{doctor.specialty || "Doctor"}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {loadingDoctors && (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                          {!loadingDoctors && availableDoctors.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground p-4">
                              {t("appointments.noDoctorsFound")}
                            </div>
                          )}
                          {hasMoreDoctors && !loadingDoctors && (
                            <div className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={loadMoreDoctors}
                                disabled={loadingMoreDoctors}
                              >
                                {loadingMoreDoctors ? "Loading..." : "Load more doctors"}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                <div className="bg-muted p-2 font-medium border-b">
                  {t("appointments.appointmentDetails")}
                </div>
                {selectedDoctor ? (
                  <>
                    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 shadow-sm dark:bg-slate-950">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {timezoneDisplay || t("appointments.timezoneNotAvailable")}
                        </p>
                        {weekRangeLabel && (
                          <p className="text-xs text-muted-foreground mt-1">{weekRangeLabel}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWeekChange("prev")}
                          aria-label="Previous week"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWeekChange("next")}
                          aria-label="Next week"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {isRescheduleMode && selectedDoctor && (
                      <div className="px-4 pt-4">
                        <div className="rounded-md border bg-muted/50 p-3">
                          <p className="text-sm font-medium text-foreground">
                            {t("appointments.reschedulingWith")}{" "}
                            {selectedDoctor.name}
                          </p>
                          {selectedDoctor.specialty && (
                            <p className="text-xs text-muted-foreground mt-1">{selectedDoctor.specialty}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Weekly Availability */}
                      <div className="flex-1 min-h-[200px]">
                        <Label className="mb-2 block">{t("appointments.weeklyAvailability")}</Label>
                        {loadingTimeSlots ? (
                          <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading available slots...</span>
                          </div>
                        ) : weekColumns.length > 0 ? (
                          <div className="grid gap-3 min-h-[220px]" style={weekGridStyle}>
                            {weekColumns}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border rounded-md">
                            No availability for this week
                          </div>
                        )}
                      </div>

                      {/* Appointment Type */}
                      <div>
                        <Label className="mb-2 block">{t("appointments.appointmentType")}</Label>
                        <RadioGroup
                          value={selectedType}
                          onValueChange={(value) => handleAppointmentTypeChange(value as "virtual" | "in-person" | "phone")}
                          className="flex flex-wrap gap-3"
                        >
                          <div
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors cursor-pointer ${
                              selectedType === "virtual"
                                ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-100"
                                : "border-border hover:border-teal-400"
                            }`}
                          >
                            <RadioGroupItem value="virtual" id="virtual-booking" className="sr-only" />
                            <Label
                              htmlFor="virtual-booking"
                              className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                            >
                              <Video className="h-4 w-4" />
                              {t("appointments.type.virtual")}
                            </Label>
                          </div>
                          <div
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors cursor-pointer ${
                              selectedType === "in-person"
                                ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-100"
                                : "border-border hover:border-teal-400"
                            }`}
                          >
                            <RadioGroupItem value="in-person" id="in-person-booking" className="sr-only" />
                            <Label
                              htmlFor="in-person-booking"
                              className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                            >
                              <MapPin className="h-4 w-4" />
                              {t("appointments.type.inPerson")}
                            </Label>
                          </div>
                          <div
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors cursor-pointer ${
                              selectedType === "phone"
                                ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-100"
                                : "border-border hover:border-teal-400"
                            }`}
                          >
                            <RadioGroupItem value="phone" id="phone-booking" className="sr-only" />
                            <Label
                              htmlFor="phone-booking"
                              className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                            >
                              <Phone className="h-4 w-4" />
                              {t("appointments.type.phone")}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {selectedType === "phone" && (
                        <div>
                          <Label htmlFor="appointment-phone">Phone Number</Label>
                          <Input
                            id="appointment-phone"
                            type="tel"
                            value={appointmentPhone}
                            onChange={(e) => setAppointmentPhone(e.target.value)}
                            placeholder="+1234567890"
                            className="mt-1"
                          />
                        </div>
                      )}

                      {/* Note Input */}
                      <div>
                        <Label htmlFor="appointment-note">Note</Label>
                        <Input
                          id="appointment-note"
                          value={appointmentNote}
                          onChange={(e) => setAppointmentNote(e.target.value)}
                          placeholder="Add any notes or special requests"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
                    <p className="text-sm">{t("appointments.selectDoctorFromList")}</p>
                  </div>
                )}
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
              <Button
                className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800"
                onClick={handleBookAppointment}
                disabled={isBooking || !selectedDoctor || !selectedTimeSlot || !selectedType}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {rescheduleAppointmentId ? "Updating..." : "Scheduling..."}
                  </>
                ) : rescheduleAppointmentId ? (
                  "Update Appointment"
                ) : (
                  "Schedule Appointment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                      onJoinCall={appointment.virtual_meeting_url ? handleJoinCall : undefined}
                      virtual_meeting_url={appointment.virtual_meeting_url}
                      timezone={appointment.timezone}
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
                      timezone={appointment.timezone}
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
                      timezone={appointment.timezone}
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
