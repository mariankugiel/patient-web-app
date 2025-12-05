"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, Video, Phone, DollarSign, PhoneCall } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useLanguage } from "@/contexts/language-context"
import { ChangePhoneDialog } from "@/components/patient/change-phone-dialog"

interface AppointmentCardProps {
  id: string
  doctor: string
  specialty: string
  date: string
  status: "upcoming" | "completed" | "cancelled"
  type: "in-person" | "virtual" | "phone"
  cost?: number
  virtual_meeting_url?: string // Video meeting URL for virtual appointments
  timezone?: string
  confirmation_page?: string | null // Acuity confirmation/reschedule/cancel page URL
  duration?: number | null // Duration in minutes
  phone?: string | null // Phone number for phone consultations
  location?: string | null // Location for in-person consultations
  onPhoneUpdate?: () => void // Callback to refresh appointments after phone update
}

export function AppointmentCard({
  id,
  doctor,
  specialty,
  date,
  status,
  type,
  cost = 150,
  virtual_meeting_url,
  timezone,
  confirmation_page,
  duration,
  phone,
  location,
  onPhoneUpdate,
}: AppointmentCardProps) {
  const { t } = useLanguage()
  const appointmentDate = new Date(date)
  const formattedDate = format(appointmentDate, "MMMM d, yyyy")
  const startTime = format(appointmentDate, "h:mm a")
  
  // Calculate end time if duration is available
  let timeDisplay = startTime
  if (duration && duration > 0) {
    const endDate = new Date(appointmentDate.getTime() + duration * 60 * 1000)
    const endTime = format(endDate, "h:mm a")
    timeDisplay = `${startTime} - ${endTime}`
  }
  
  const isUpcoming = status === "upcoming"
  const isVirtual = type === "virtual"
  const isPhone = type === "phone"
  const isInPerson = type === "in-person"
  
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Get status translation
  const getStatusLabel = () => {
    switch (status) {
      case "upcoming":
        return t("appointments.status.upcoming")
      case "completed":
        return t("appointments.status.completed")
      case "cancelled":
        return t("appointments.status.cancelled")
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  // Get type translation
  const getTypeLabel = () => {
    if (isInPerson) {
      return t("appointments.type.inPerson")
    }
    if (isVirtual) {
      return t("appointments.type.virtual")
    }
    if (isPhone) {
      return t("appointments.type.phone")
    }
    return ""
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={`/abstract-geometric-shapes.png?height=40&width=40&query=${doctor}`} alt={doctor} />
              <AvatarFallback>{doctor.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{doctor}</h3>
              <p className="text-sm text-muted-foreground">{specialty}</p>
            </div>
          </div>
          <Badge variant={status === "upcoming" ? "default" : status === "completed" ? "secondary" : "destructive"}>
            {getStatusLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>
              {timeDisplay}
              {timezone ? <span className="ml-2 text-muted-foreground">({timezone})</span> : null}
            </span>
          </div>
          <div className="flex items-center text-sm">
            {isInPerson && <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />}
            {isVirtual && <Video className="mr-2 h-4 w-4 text-muted-foreground" />}
            {isPhone && <Phone className="mr-2 h-4 w-4 text-muted-foreground" />}
            <span>
              {getTypeLabel()}
            </span>
          </div>
          {isInPerson && location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <span><span className="font-semibold">{t("appointments.appointmentLocation")}</span>: {location}</span>
            </div>
          )}
          {isPhone && phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <span><span className="font-semibold">{t("appointments.yourAppointmentNumber")}</span>: {phone}</span>
            </div>
          )}

          {/* Cost information */}
          {cost !== undefined && cost !== null && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                  {t("appointments.totalCost")}
                </span>
                <span className="font-medium">{formatCurrency(cost)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {isUpcoming && (
        <CardFooter className="flex flex-col space-y-2 p-4 pt-0">
          {isVirtual && virtual_meeting_url && (
            <Button
              onClick={() => window.open(virtual_meeting_url, '_blank')}
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
            >
              <Video className="mr-2 h-4 w-4" />
              {t("appointments.joinVideoConference")}
            </Button>
          )}
          {isInPerson && location && (
            <Button
              onClick={() => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
                window.open(mapsUrl, '_blank')
              }}
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
            >
              <MapPin className="mr-2 h-4 w-4" />
              {t("appointments.viewLocation")}
            </Button>
          )}
          {isPhone && (
            <Button
              onClick={() => setIsPhoneDialogOpen(true)}
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
            >
              <PhoneCall className="mr-2 h-4 w-4" />
              {t("appointments.changePhoneNumber")}
            </Button>
          )}
          {confirmation_page && (
            <div className="flex w-full space-x-2">
              <Button
                variant="outline"
                onClick={() => window.open(confirmation_page, '_blank')}
                className="flex-1"
              >
                {t("appointments.reschedule")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => window.open(confirmation_page, '_blank')}
                className="flex-1"
              >
                {t("appointments.cancel")}
              </Button>
            </div>
          )}
        </CardFooter>
      )}
      <ChangePhoneDialog
        open={isPhoneDialogOpen}
        onOpenChange={setIsPhoneDialogOpen}
        currentPhone={phone}
        appointmentId={id}
        onSuccess={() => {
          // Reload appointments after phone update
          onPhoneUpdate?.()
        }}
      />
    </Card>
  )
}
