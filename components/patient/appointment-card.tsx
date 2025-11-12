"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, Video, Phone, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

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
  onJoinCall?: (id: string) => void
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
  onJoinCall,
}: AppointmentCardProps) {
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
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
            {status.charAt(0).toUpperCase() + status.slice(1)}
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
              {isInPerson && "In-person visit"}
              {isVirtual && "Virtual consultation"}
              {isPhone && "Phone consultation"}
            </span>
          </div>

          {/* Cost information */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                Total Cost:
              </span>
              <span className="font-medium">{formatCurrency(cost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Your Responsibility:</span>
              <span className="text-teal-600 dark:text-teal-400">{formatCurrency(cost)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      {isUpcoming && (
        <CardFooter className="flex flex-col space-y-2 p-4 pt-0">
          {isVirtual && virtual_meeting_url && onJoinCall && (
            <Button
              onClick={() => onJoinCall(id)}
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
            >
              <Video className="mr-2 h-4 w-4" />
              Join Video Conference
            </Button>
          )}
          {confirmation_page && (
            <div className="flex w-full space-x-2">
              <Button
                variant="outline"
                onClick={() => window.open(confirmation_page, '_blank')}
                className="flex-1"
              >
                Reschedule
              </Button>
              <Button
                variant="destructive"
                onClick={() => window.open(confirmation_page, '_blank')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
