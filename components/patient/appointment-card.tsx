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
  cost?: {
    total: number
    insurance: number
    patient: number
  }
  onCancel?: (id: string) => void
  onReschedule?: (id: string) => void
  onJoinCall?: (id: string) => void
}

export function AppointmentCard({
  id,
  doctor,
  specialty,
  date,
  status,
  type,
  cost = { total: 150, insurance: 120, patient: 30 }, // Default values if not provided
  onCancel,
  onReschedule,
  onJoinCall,
}: AppointmentCardProps) {
  const appointmentDate = new Date(date)
  const formattedDate = format(appointmentDate, "MMMM d, yyyy")
  const formattedTime = format(appointmentDate, "h:mm a")
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
            <span>{formattedTime}</span>
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
              <span className="font-medium">{formatCurrency(cost.total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Insurance Covers:</span>
              <span>{formatCurrency(cost.insurance)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Your Responsibility:</span>
              <span className="text-teal-600 dark:text-teal-400">{formatCurrency(cost.patient)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      {isUpcoming && (
        <CardFooter className="flex flex-col space-y-2 p-4 pt-0">
          {isVirtual && (
            <Button
              onClick={() => onJoinCall && onJoinCall(id)}
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
            >
              <Video className="mr-2 h-4 w-4" />
              Join Video Conference
            </Button>
          )}
          <div className="flex w-full space-x-2">
            {onReschedule && (
              <Button variant="outline" onClick={() => onReschedule(id)} className="flex-1">
                Reschedule
              </Button>
            )}
            {onCancel && (
              <Button variant="destructive" onClick={() => onCancel(id)} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
