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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PermissionGuard } from "@/components/patient/permission-guard"
import { detectUserTimezone } from "@/lib/utils/timezone"
import type { FrontendAppointment } from "@/types/appointments"

interface AppointmentTypeOption {
  id: string
  name?: string
  description?: string | null
  duration?: number | null
  price?: number | null
  type?: string | null
  category?: string | null
}

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
  appointmentTypes?: AppointmentTypeOption[]
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

  // New appointment form state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedAppointmentTypeId, setSelectedAppointmentTypeId] = useState<string>("")
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<AppointmentTypeOption | null>(null)
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
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([])
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

  // Available time slots for selected doctor (from Acuity API)
  const [weeklyTimeSlots, setWeeklyTimeSlots] = useState<{ date: string; slots: TimeSlot[] }[]>([])
  const selectedDateRef = useRef(selectedDate)

  const fallbackTimezone = useMemo(() => detectUserTimezone(), [])
  const formatCurrencyValue = useCallback(
    (amount?: number | null) => {
      if (amount === undefined || amount === null || Number.isNaN(amount)) {
        return undefined
      }
      return new Intl.NumberFormat(
        language === "es" ? "es-ES" : language === "pt" ? "pt-BR" : "en-US",
        { style: "currency", currency: "USD" }
      ).format(amount)
    },
    [language]
  )
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
    // Use at least 5 columns, or the actual count if more than 5
    const gridColumnCount = Math.max(5, weekColumnsCount)
    return {
      gridTemplateColumns: `repeat(${gridColumnCount}, minmax(180px, 1fr))`,
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

      const mappedDoctors: Doctor[] = doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialty: doctor.specialty ?? null,
        avatar: doctor.avatar ?? null,
        isOnline: doctor.isOnline ?? false,
        email: doctor.email,
        acuityCalendarId: doctor.acuityCalendarId ?? null,
        acuityOwnerId: doctor.acuityOwnerId ?? null,
        timezone: doctor.timezone ?? null,
        appointmentTypes: (doctor.appointmentTypes ?? []).map((type) => ({
          id: type.id?.toString() ?? "",
          name: type.name,
          description: type.description ?? null,
          duration: typeof type.duration === "number" ? type.duration : null,
          price: type.price !== undefined && type.price !== null ? Number(type.price) : null,
          type: type.type ?? null,
          category: type.category ?? null,
        })),
      }))

      const hasMore = mappedDoctors.length >= doctorsLimit
      setHasMoreDoctors(hasMore)

      if (reset) {
        setAvailableDoctors(mappedDoctors)
        const newOffset = mappedDoctors.length
        setDoctorsOffset(newOffset)
        doctorsOffsetRef.current = newOffset
      } else {
        setAvailableDoctors(prev => [...prev, ...mappedDoctors])
        const newOffset = doctorsOffsetRef.current + mappedDoctors.length
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

  const handleAppointmentTypeSelect = useCallback(
    (typeId: string) => {
      if (!selectedDoctor) {
        return
      }
      setSelectedAppointmentTypeId(typeId)
      const chosen =
        selectedDoctor.appointmentTypes?.find((type) => type.id === typeId) || null
      setSelectedAppointmentType(chosen)
      setSelectedTimeSlot(null)

      if (!selectedDate) {
        const today = new Date()
        setSelectedDate(format(today, "yyyy-MM-dd"))
      }
      if (!currentWeekStart) {
        const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
        setCurrentWeekStart(weekStartStr)
      }
    },
    [selectedDoctor, selectedDate, currentWeekStart]
  )

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
    setSelectedType(value)
    if (value !== "phone") {
      setAppointmentPhone("")
    }
  }

  // Load doctors when dialog opens - only once
  useEffect(() => {
    if (isDialogOpen) {
      // Reset state and load doctors
      setCurrentSearchQuery("")
      setAvailableDoctors([])
      setDoctorsOffset(0)
      doctorsOffsetRef.current = 0
      setHasMoreDoctors(false)
      setWeeklyTimeSlots([])
      setSelectedDoctor(null)
      setSelectedAppointmentTypeId("")
      setSelectedAppointmentType(null)
      setSelectedTimeSlot(null)
      setSelectedType("")
      setSelectedDate("")
      setSelectedTimezone("")
      setCurrentWeekStart("")
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = null
      }

      loadDoctors(true, "")
    }
  }, [isDialogOpen, loadDoctors])

  // Fetch available time slots for the current week (only after appointment type is selected)
  useEffect(() => {
    if (!selectedDoctor) {
      setWeeklyTimeSlots([])
      setSelectedTimeSlot(null)
      return
    }

    // Don't fetch availability until appointment type is selected
    if (!selectedAppointmentTypeId) {
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
        // Validate that selectedAppointmentTypeId belongs to the selected doctor's calendar
        let validAppointmentTypeId: number | undefined = undefined
        if (selectedAppointmentTypeId && selectedDoctor?.appointmentTypes) {
          const isValidType = selectedDoctor.appointmentTypes.some(
            (type) => type.id === selectedAppointmentTypeId
          )
          if (isValidType) {
            validAppointmentTypeId = parseInt(selectedAppointmentTypeId, 10)
          } else {
            // Clear invalid appointment type selection
            console.warn("Selected appointment type does not belong to selected doctor's calendar, clearing selection")
            setSelectedAppointmentTypeId("")
            setSelectedAppointmentType(null)
            setWeeklyTimeSlots([])
            setSelectedTimeSlot(null)
            setLoadingTimeSlots(false)
            return
          }
        }
        
        const weeklyAvailability = await appointmentsApiService.getAvailabilityWeek(
          calendarId,
          currentWeekStart,
          validAppointmentTypeId
        )

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
  }, [selectedDoctor, currentWeekStart, selectedAppointmentTypeId]) // Include selectedAppointmentTypeId to re-validate when it changes

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

        let appointmentTypeIdValue: string | number | null = null
        if (apt.appointment_type_id !== undefined && apt.appointment_type_id !== null) {
          appointmentTypeIdValue = apt.appointment_type_id
        }

        const appointmentTypePriceValue =
          typeof apt.appointment_type_price === "number"
            ? apt.appointment_type_price
            : apt.appointment_type_price != null
            ? Number(apt.appointment_type_price)
            : null

        const costValue =
          typeof apt.cost === "number"
            ? apt.cost
            : appointmentTypePriceValue !== null
            ? appointmentTypePriceValue
            : undefined

        const amountPaidValue =
          typeof apt.amount_paid === "number"
            ? apt.amount_paid
            : apt.amount_paid != null
            ? Number(apt.amount_paid)
            : null

        return {
          id: apt.id.toString(),
          doctor: apt.doctor_name || `Dr. ${apt.professional_id}`,
          doctorId: apt.professional_id,
          specialty: apt.doctor_specialty || "",
          date: apt.appointment_date || apt.scheduled_at || apt.created_at,
          status: appointmentStatus,
          type: appointmentType,
          cost: costValue,
          amountPaid: amountPaidValue,
          virtual_meeting_url: apt.virtual_meeting_url,
          timezone: apt.timezone,
          acuityCalendarId: apt.acuity_calendar_id || null,
          confirmation_page: apt.confirmation_page || null,
          notes: apt.notes || "",
          appointmentTypeId: appointmentTypeIdValue !== null ? String(appointmentTypeIdValue) : null,
          appointmentTypeName: apt.appointment_type_name ?? null,
          appointmentTypeDuration:
            apt.appointment_type_duration !== undefined && apt.appointment_type_duration !== null
              ? Number(apt.appointment_type_duration)
              : null,
          appointmentTypePrice: appointmentTypePriceValue,
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

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      resetDialog()
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
  const handleBookAppointment = async () => {
    if (isBooking) {
      return
    }

    // Validate required fields
    if (!selectedDoctor) {
      toast({
        title: t("appointments.validationError"),
        description: t("appointments.selectDoctorRequired"),
        variant: "destructive",
      })
      setIsBooking(false)
      return
    }
    
    if (!selectedAppointmentTypeId) {
      toast({
        title: t("appointments.validationError"),
        description: t("appointments.selectAppointmentTypeRequired"),
        variant: "destructive",
      })
      setIsBooking(false)
      return
    }
    
    if (!selectedTimeSlot) {
      toast({
        title: t("appointments.validationError"),
        description: t("appointments.selectTimeSlotRequired"),
        variant: "destructive",
      })
      setIsBooking(false)
      return
    }
    
    if (!selectedType) {
      toast({
        title: t("appointments.validationError"),
        description: t("appointments.selectConsultationTypeRequired"),
        variant: "destructive",
      })
      setIsBooking(false)
      return
    }
    
    if (!selectedDate) {
      toast({
        title: t("appointments.validationError"),
        description: t("appointments.fillAllRequiredFields"),
        variant: "destructive"
      })
      setIsBooking(false)
      return
    }

    if (selectedType === "phone" && !appointmentPhone) {
      toast({
        title: t("appointments.validationError"),
        description: t("appointments.providePhoneNumber"),
        variant: "destructive"
      })
      setIsBooking(false)
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

      // Validate lastname is present
      if (!lastName || lastName.trim() === "") {
        toast({
          title: "Profile Incomplete",
          description: "Please complete your profile by adding your last name before scheduling an appointment.",
          variant: "destructive",
          duration: 5000,
        })
        setIsBooking(false)
        return
      }

      // Build datetime string with timezone
      const timezoneToUse = selectedDoctor?.timezone || selectedTimezone || fallbackTimezone

      const slotIsoSource =
        selectedTimeSlot.isoTime ||
        buildIsoFromParts(selectedTimeSlot.rawTime || selectedTimeSlot.time, selectedDate)
      const datetimeISO = normalizeIsoString(slotIsoSource || `${selectedDate}T${selectedTimeSlot.time}:00`)

      // Build appointment request
      const appointmentData = {
        calendar_id: selectedDoctor.acuityCalendarId || "",
        appointment_type_id: selectedAppointmentTypeId ? parseInt(selectedAppointmentTypeId, 10) : undefined,
        datetime: datetimeISO,
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        phone: selectedType === "phone" ? appointmentPhone : undefined,
        consultation_type: selectedType,
        note: appointmentNote || undefined,
        timezone: timezoneToUse || undefined
      }

      await appointmentsApiService.bookAppointment(appointmentData)

      toast({
        title: "Appointment Booked",
        description: `Your appointment with ${selectedDoctor.name} has been booked successfully.`,
      })
      await loadAppointments()
      setIsDialogOpen(false)
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
    setSelectedAppointmentTypeId("")
    setSelectedAppointmentType(null)
    setSelectedTimeSlot(null)
    setSelectedType("")
    setAppointmentNote("")
    setAppointmentPhone("")
    setSelectedDate("")
    setSelectedTimezone("")
    setWeeklyTimeSlots([])
    setCurrentWeekStart("")
    setIsBooking(false)
    setCurrentSearchQuery("")
    setAvailableDoctors([])
    setDoctorsOffset(0)
    doctorsOffsetRef.current = 0
    setHasMoreDoctors(false)
  }

  // Handle doctor selection from list/search results
  const handleSelectDoctor = (doctor: Doctor | null) => {
    if (doctor) {
      setSelectedDoctor(doctor)
      setSelectedAppointmentTypeId("")
      setSelectedAppointmentType(null)
      setSelectedTimeSlot(null)
      setWeeklyTimeSlots([])
      const today = new Date()
      const todayStr = format(today, "yyyy-MM-dd")
      const weekStartStr = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
      setSelectedDate(todayStr)
      setCurrentWeekStart(weekStartStr)
      setSelectedTimezone(doctor.timezone || fallbackTimezone)
    } else {
      setSelectedDoctor(null)
      setSelectedAppointmentTypeId("")
      setSelectedAppointmentType(null)
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

  // Get user data from Redux store
  const { user } = useSelector((state: RootState) => state.auth)
  const userName = user?.user_metadata?.full_name || "User"

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
          <DialogContent className="sm:max-w-[1120px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {t("appointments.bookNew")}
              </DialogTitle>
              <DialogDescription>
                {t("appointments.fillDetails")}
              </DialogDescription>
            </DialogHeader>

            {/* Side-by-side layout: Doctor List and Schedule Panel */}
            <div className="flex-1 flex overflow-hidden min-h-0 gap-4">
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Appointment Type Selection */}
                      <div>
                        <Label className="mb-2 block">
                          {t("appointments.selectAppointmentType") ?? "Select appointment type"}
                        </Label>
                        {selectedDoctor?.appointmentTypes && selectedDoctor.appointmentTypes.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {selectedDoctor.appointmentTypes.map((type) => {
                              const isSelected = selectedAppointmentTypeId === type.id
                              const formattedPrice = formatCurrencyValue(type.price)
                              return (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() => handleAppointmentTypeSelect(type.id)}
                                  className={`rounded-lg border p-3 text-left transition-colors ${
                                    isSelected
                                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/40"
                                      : "border-border hover:border-teal-400"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">
                                      {type.name || t("appointments.appointmentType")}
                                    </span>
                                    {formattedPrice && (
                                      <span className="text-sm text-teal-700 dark:text-teal-200">
                                        {formattedPrice}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                    {type.duration ? <div>{type.duration} min</div> : null}
                                    {type.description ? <div>{type.description}</div> : null}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                            {t("appointments.noAppointmentTypes") ??
                              "No appointment types are available for this doctor."}
                          </div>
                        )}
                      </div>

                      {/* Weekly Availability */}
                      <div className="min-h-[200px]">
                        <Label className="mb-2 block">{t("appointments.weeklyAvailability")}</Label>
                        {!selectedAppointmentTypeId ? (
                          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border rounded-md">
                            {t("appointments.selectAppointmentTypePrompt") ?? "Choose an appointment type to view available times."}
                          </div>
                        ) : loadingTimeSlots ? (
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
                            {t("appointments.noAvailability") ?? "No availability for this week"}
                          </div>
                        )}
                      </div>

                      {/* Consultation Method */}
                      <div>
                        <Label className="mb-2 block">
                          {t("appointments.consultationMethod") ?? "Consultation method"}
                        </Label>
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
                    Scheduling...
                  </>
                ) : (
                  "Schedule Appointment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>


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
                      confirmation_page={appointment.confirmation_page}
                      duration={appointment.appointmentTypeDuration}
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
                      confirmation_page={appointment.confirmation_page}
                      duration={appointment.appointmentTypeDuration}
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
                      confirmation_page={appointment.confirmation_page}
                      duration={appointment.appointmentTypeDuration}
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
