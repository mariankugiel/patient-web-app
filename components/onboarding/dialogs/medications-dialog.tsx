"use client"

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { getTranslation } from '@/lib/translations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface Medication {
  id: string
  drugName: string
  purpose: string
  dosage: string
  frequency: string
  hasReminder: boolean
  reminderTime?: string
  reminderDays?: string[]
  isValid: boolean
  errors: string[]
}

interface MedicationsDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (medication: Medication) => void
  editingMedication?: Medication | null
}

const FREQUENCY_OPTIONS = [
  { value: 'once-daily', label: 'Once Daily' },
  { value: 'twice-daily', label: 'Twice Daily' },
  { value: 'three-times-daily', label: 'Three Times Daily' },
  { value: 'four-times-daily', label: 'Four Times Daily' },
  { value: 'as-needed', label: 'As Needed' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
]

const REMINDER_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
]

const REMINDER_DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
]

export function MedicationsDialog({ isOpen, onClose, onSave, editingMedication }: MedicationsDialogProps) {
  const { language } = useLanguage()
  const [formData, setFormData] = useState<Partial<Medication>>({
    drugName: '',
    purpose: '',
    dosage: '',
    frequency: '',
    hasReminder: false,
    reminderTime: '',
    reminderDays: []
  })
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (editingMedication) {
      setFormData({
        ...editingMedication
      })
    } else {
      setFormData({
        drugName: '',
        purpose: '',
        dosage: '',
        frequency: '',
        hasReminder: false,
        reminderTime: '',
        reminderDays: []
      })
    }
    setErrors([])
  }, [editingMedication, isOpen])

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.drugName?.trim()) {
      newErrors.push('Drug name is required')
    }

    if (!formData.purpose?.trim()) {
      newErrors.push('Purpose is required')
    }

    if (!formData.dosage?.trim()) {
      newErrors.push('Dosage is required')
    }

    if (!formData.frequency) {
      newErrors.push('Frequency is required')
    }

    if (formData.hasReminder && !formData.reminderTime) {
      newErrors.push('Reminder time is required when reminder is enabled')
    }

    if (formData.hasReminder && (!formData.reminderDays || formData.reminderDays.length === 0)) {
      newErrors.push('At least one reminder day is required')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return

    const medication: Medication = {
      id: editingMedication?.id || `med-${Date.now()}`,
      drugName: formData.drugName || '',
      purpose: formData.purpose || '',
      dosage: formData.dosage || '',
      frequency: formData.frequency || '',
      hasReminder: formData.hasReminder || false,
      reminderTime: formData.reminderTime || '',
      reminderDays: formData.reminderDays || [],
      isValid: true,
      errors: []
    }

    onSave(medication)
    onClose()
  }

  const handleReminderDayChange = (day: string, checked: boolean) => {
    const currentDays = formData.reminderDays || []
    if (checked) {
      setFormData({
        ...formData,
        reminderDays: [...currentDays, day]
      })
    } else {
      setFormData({
        ...formData,
        reminderDays: currentDays.filter(d => d !== day)
      })
    }
  }

  const isEditing = !!editingMedication

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Medication' : 'Add New Medication'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your medication information. You can add detailed scheduling after completing onboarding.'
              : 'Add a new medication to your list. You can add detailed scheduling after completing onboarding.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="drugName">Medication Name *</Label>
                <Input
                  id="drugName"
                  value={formData.drugName || ''}
                  onChange={(e) => setFormData({ ...formData, drugName: e.target.value })}
                  placeholder="e.g., Metformin, Lisinopril"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={formData.dosage || ''}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 500mg, 10mg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Input
                  id="purpose"
                  value={formData.purpose || ''}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="What is this medication for?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select
                  value={formData.frequency || ''}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasReminder"
                checked={formData.hasReminder || false}
                onCheckedChange={(checked) => setFormData({ ...formData, hasReminder: !!checked })}
              />
              <Label htmlFor="hasReminder" className="text-sm font-medium">
                Set reminder for this medication
              </Label>
            </div>

            {formData.hasReminder && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Reminder Time</Label>
                  <Select
                    value={formData.reminderTime || ''}
                    onValueChange={(value) => setFormData({ ...formData, reminderTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_TIMES.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reminder Days</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {REMINDER_DAYS.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.value}
                          checked={formData.reminderDays?.includes(day.value) || false}
                          onCheckedChange={(checked) => handleReminderDayChange(day.value, !!checked)}
                        />
                        <Label htmlFor={day.value} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Update Medication' : 'Add Medication'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
