"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '@/contexts/language-context'
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

const REMINDER_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
]

export function MedicationsDialog({ isOpen, onClose, onSave, editingMedication }: MedicationsDialogProps) {
  const { t } = useLanguage()
  
  // Frequency options with translations
  const FREQUENCY_OPTIONS = useMemo(() => [
    { value: 'once-daily', label: t('medications.onceDaily') },
    { value: 'twice-daily', label: t('medications.twiceDaily') },
    { value: 'three-times-daily', label: t('medications.threeTimesDaily') },
    { value: 'four-times-daily', label: t('medications.fourTimesDaily') },
    { value: 'as-needed', label: t('medications.asNeeded') },
    { value: 'weekly', label: t('medications.weekly') },
    { value: 'monthly', label: t('medications.monthly') }
  ], [t])
  
  // Reminder days with translations
  const REMINDER_DAYS = useMemo(() => [
    { value: 'monday', label: t('medications.mondayFull') },
    { value: 'tuesday', label: t('medications.tuesdayFull') },
    { value: 'wednesday', label: t('medications.wednesdayFull') },
    { value: 'thursday', label: t('medications.thursdayFull') },
    { value: 'friday', label: t('medications.fridayFull') },
    { value: 'saturday', label: t('medications.saturdayFull') },
    { value: 'sunday', label: t('medications.sundayFull') }
  ], [t])
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
      newErrors.push(t('medications.drugNameRequired'))
    }

    if (!formData.purpose?.trim()) {
      newErrors.push(t('medications.purposeRequired'))
    }

    if (!formData.dosage?.trim()) {
      newErrors.push(t('medications.dosageRequired'))
    }

    if (!formData.frequency) {
      newErrors.push(t('medications.frequencyRequired'))
    }

    if (formData.hasReminder && !formData.reminderTime) {
      newErrors.push(t('medications.reminderTimeRequired'))
    }

    if (formData.hasReminder && (!formData.reminderDays || formData.reminderDays.length === 0)) {
      newErrors.push(t('medications.reminderDaysRequired'))
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
            {isEditing ? t('medications.editMedicationTitle') : t('medications.addNewMedicationTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('medications.editMedicationDesc')
              : t('medications.addNewMedicationDesc')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('medications.basicInformation')}</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="drugName">{t('medications.medicationName')} *</Label>
                <Input
                  id="drugName"
                  value={formData.drugName || ''}
                  onChange={(e) => setFormData({ ...formData, drugName: e.target.value })}
                  placeholder={t('medications.medicationNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">{t('medications.dosage')} *</Label>
                <Input
                  id="dosage"
                  value={formData.dosage || ''}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder={t('medications.dosagePlaceholderDialog')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">{t('medications.purpose')} *</Label>
                <Input
                  id="purpose"
                  value={formData.purpose || ''}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder={t('medications.purposePlaceholderDialog')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">{t('medications.frequency')} *</Label>
                <Select
                  value={formData.frequency || ''}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('medications.selectFrequency')} />
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
                {t('medications.setReminderForMedication')}
              </Label>
            </div>

            {formData.hasReminder && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="reminderTime">{t('medications.reminderTime')}</Label>
                  <Select
                    value={formData.reminderTime || ''}
                    onValueChange={(value) => setFormData({ ...formData, reminderTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('medications.selectTime')} />
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
                  <Label>{t('medications.reminderDays')}</Label>
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
            {t('health.dialog.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? t('medications.updateMedication') : t('medications.addMedication')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
