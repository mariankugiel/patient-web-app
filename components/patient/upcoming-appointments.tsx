"use client"

import { Button } from "@/components/ui/button"
import { Video } from "lucide-react"

export default function UpcomingAppointments() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3">
        <p className="font-medium">Dr. Johnson</p>
        <p className="text-sm text-muted-foreground">Blood Pressure Follow-up</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Today, 10:00 AM</p>
          <p className="text-sm text-muted-foreground">Virtual</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full gap-1 border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-950"
        >
          <Video className="h-3 w-3" />
          Join Call
        </Button>
      </div>

      <div className="rounded-lg border p-3">
        <p className="font-medium">Dr. Smith</p>
        <p className="text-sm text-muted-foreground">Annual Physical</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">May 5, 2:30 PM</p>
          <p className="text-sm text-muted-foreground">In-person</p>
        </div>
      </div>
    </div>
  )
}
