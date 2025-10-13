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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  medicationRemindersApiService,
  MedicationReminder,
  CreateReminderRequest
} from '@/lib/api/medication-reminders-api'
import { toast } from 'react-toastify'

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
  const [reminderToDelete, setReminderToDelete] = useState<number | null>(null)
  const [newReminder, setNewReminder] = useState<CreateReminderRequest>({
    medication_id: medicationId,
    reminder_time: "08:00",
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
      toast.error('Failed to load reminders')
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
        days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      })
      loadReminders()
      onReminderChange?.()
      toast.success('Reminder added successfully!')
    } catch (error) {
      console.error('Failed to create reminder:', error)
      toast.error('Failed to add reminder. Please try again.')
    }
  }

  const handleToggleReminder = async (reminderId: number) => {
    try {
      // Optimistically update the UI
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, enabled: !r.enabled } : r
      ))
      
      await medicationRemindersApiService.toggleReminder(reminderId)
      onReminderChange?.()
    } catch (error) {
      console.error('Failed to toggle reminder:', error)
      // Revert on error
      loadReminders()
    }
  }

  const handleDeleteReminder = async () => {
    if (!reminderToDelete) return
    
    try {
      await medicationRemindersApiService.deleteReminder(reminderToDelete)
      loadReminders()
      onReminderChange?.()
      setReminderToDelete(null)
      toast.success('Reminder deleted successfully!')
    } catch (error) {
      console.error('Failed to delete reminder:', error)
      toast.error('Failed to delete reminder. Please try again.')
      setReminderToDelete(null)
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
      {/* Only show title and Add button if reminders exist */}
      {reminders.length > 0 && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">Reminders for {medicationName}</h4>
          <Button onClick={() => setOpenDialog(true)} size="sm" className="h-6 px-2 text-xs">
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">Reminders for {medicationName}</h4>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No reminders set for this medication</p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-3 h-6 px-2 text-xs"
                onClick={() => setOpenDialog(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add First Reminder
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <Card key={reminder.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">{formatTime(reminder.reminder_time)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDays(reminder.days_of_week)}
                      </p>
                      {reminder.next_scheduled_at && (
                        <p className="text-xs text-muted-foreground">
                          Next: {new Date(reminder.next_scheduled_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={reminder.enabled}
                      onCheckedChange={() => handleToggleReminder(reminder.id)}
                      className="scale-75"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      onClick={() => setReminderToDelete(reminder.id)}
                    >
                      <Trash2 className="h-3 w-3" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={reminderToDelete !== null} onOpenChange={() => setReminderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReminderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReminder}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
