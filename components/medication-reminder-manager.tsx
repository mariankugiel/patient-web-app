"use client"

import { useState, useEffect } from 'react'
import { Clock, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  medicationRemindersApiService,
  MedicationReminder,
  CreateReminderRequest
} from '@/lib/api/medication-reminders-api'

interface MedicationReminderManagerProps {
  medicationId: number
  medicationName: string
  onReminderChange?: () => void
}

const daysOfWeek = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
]

export function MedicationReminderManager({ 
  medicationId, 
  medicationName, 
  onReminderChange 
}: MedicationReminderManagerProps) {
  const [reminders, setReminders] = useState<MedicationReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingReminder, setEditingReminder] = useState<MedicationReminder | null>(null)
  const [newReminder, setNewReminder] = useState<CreateReminderRequest>({
    medication_id: medicationId,
    reminder_time: "08:00",
    user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  })

  useEffect(() => {
    loadReminders()
  }, [medicationId])

  const loadReminders = async () => {
    try {
      setLoading(true)
      const data = await medicationRemindersApiService.getReminders(medicationId)
      setReminders(data)
    } catch (error) {
      console.error('Failed to load reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReminder = async () => {
    try {
      await medicationRemindersApiService.createReminder(newReminder)
      setOpenDialog(false)
      setNewReminder({
        medication_id: medicationId,
        reminder_time: "08:00",
        user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      })
      loadReminders()
      onReminderChange?.()
    } catch (error) {
      console.error('Failed to create reminder:', error)
    }
  }

  const handleToggleReminder = async (reminderId: number) => {
    try {
      await medicationRemindersApiService.toggleReminder(reminderId)
      loadReminders()
      onReminderChange?.()
    } catch (error) {
      console.error('Failed to toggle reminder:', error)
    }
  }

  const handleDeleteReminder = async (reminderId: number) => {
    try {
      await medicationRemindersApiService.deleteReminder(reminderId)
      loadReminders()
      onReminderChange?.()
    } catch (error) {
      console.error('Failed to delete reminder:', error)
    }
  }

  const handleDayToggle = (day: string) => {
    setNewReminder(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }))
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDays = (days: string[]) => {
    if (days.length === 7) return "Daily"
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
      return "Weekdays"
    }
    if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
      return "Weekends"
    }
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(", ")
  }

  if (loading) {
    return <div>Loading reminders...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reminders for {medicationName}</h3>
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reminders set for this medication</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setOpenDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <Card key={reminder.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatTime(reminder.reminder_time)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDays(reminder.days_of_week)}
                      </p>
                      {reminder.next_scheduled_at && (
                        <p className="text-xs text-muted-foreground">
                          Next: {new Date(reminder.next_scheduled_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reminder.enabled}
                      onCheckedChange={() => handleToggleReminder(reminder.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteReminder(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Reminder Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Medication Reminder</DialogTitle>
            <DialogDescription>
              Set a reminder to take your {medicationName}. You'll receive a notification at the specified time.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={newReminder.reminder_time}
                onChange={(e) => setNewReminder({ ...newReminder, reminder_time: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timezone" className="text-right">
                Timezone
              </Label>
              <Input
                id="timezone"
                value={newReminder.user_timezone}
                onChange={(e) => setNewReminder({ ...newReminder, user_timezone: e.target.value })}
                className="col-span-3"
                readOnly
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Days</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={newReminder.days_of_week.includes(day.id)}
                      onCheckedChange={() => handleDayToggle(day.id)}
                    />
                    <Label htmlFor={day.id} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReminder}>
              Save Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
