'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { HealthRecordMetric } from './types'

interface EditMetricDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMetricUpdated: (metric: HealthRecordMetric) => void
  metric: HealthRecordMetric | null
  updateMetric: (metricId: number, metricData: {
    name?: string
    display_name?: string
    description?: string
    default_unit?: string
    reference_data?: any
  }) => Promise<HealthRecordMetric>
}

export function EditMetricDialog({
  open,
  onOpenChange,
  onMetricUpdated,
  metric,
  updateMetric
}: EditMetricDialogProps) {
  const { user } = useSelector((state: RootState) => state.auth)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    default_unit: '',
    minValue: '',
    maxValue: ''
  })

  // Initialize form data when metric changes
  useEffect(() => {
    if (metric) {
      setFormData({
        name: metric.name || '',
        display_name: metric.display_name || '',
        description: metric.description || '',
        default_unit: metric.default_unit || '',
        minValue: '',
        maxValue: ''
      })

      // Extract min/max values from reference_data
      if (metric.reference_data) {
        const userGender = user?.user_metadata?.gender?.toLowerCase()
        const gender = userGender === 'female' ? 'female' : 'male'
        const genderData = metric.reference_data[gender]
        
        if (genderData) {
          setFormData(prev => ({
            ...prev,
            minValue: genderData.min !== null && genderData.min !== undefined ? genderData.min.toString() : '',
            maxValue: genderData.max !== null && genderData.max !== undefined ? genderData.max.toString() : ''
          }))
        }
      }
    }
  }, [metric, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!metric || !updateMetric) {
      toast.error('Edit functionality is not available')
      return
    }

    setLoading(true)
    try {
      // Parse reference range values (both are optional)
      let referenceData: Record<string, { min?: number; max?: number }> | undefined = undefined
      if (formData.minValue || formData.maxValue) {
        const minValue = formData.minValue ? parseFloat(formData.minValue) : null
        const maxValue = formData.maxValue ? parseFloat(formData.maxValue) : null
        
        if ((minValue !== null && isNaN(minValue)) || (maxValue !== null && isNaN(maxValue))) {
          toast.error('Please enter valid numbers for reference range')
          return
        }

        // Create reference data structure for both genders
        referenceData = {
          male: {
            min: minValue ?? undefined,
            max: maxValue ?? undefined
          },
          female: {
            min: minValue ?? undefined,
            max: maxValue ?? undefined
          }
        }
      }

      await updateMetric(metric.id, {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description,
        default_unit: formData.default_unit,
        reference_data: referenceData
      })

      toast.success('Metric updated successfully!')
      onOpenChange(false)
      onMetricUpdated(metric)
    } catch (error: unknown) {
      toast.error(`Failed to update metric: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!metric) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Metric</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., waist_circumference"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="display_name">Display Name *</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              placeholder="e.g., Waist Circumference"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="default_unit">Unit</Label>
            <Input
              id="default_unit"
              value={formData.default_unit}
              onChange={(e) => handleInputChange('default_unit', e.target.value)}
              placeholder="e.g., cm, kg, mg/dL"
            />
          </div>

          <div className="grid gap-2">
            <Label>Reference Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="minValue" className="text-sm text-muted-foreground">Min Value</Label>
                <Input
                  id="minValue"
                  type="number"
                  step="0.01"
                  value={formData.minValue}
                  onChange={(e) => handleInputChange('minValue', e.target.value)}
                  placeholder="e.g., 0.85"
                />
              </div>
              <div>
                <Label htmlFor="maxValue" className="text-sm text-muted-foreground">Max Value</Label>
                <Input
                  id="maxValue"
                  type="number"
                  step="0.01"
                  value={formData.maxValue}
                  onChange={(e) => handleInputChange('maxValue', e.target.value)}
                  placeholder="e.g., 0.95"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              • Leave empty for no reference range
              • Min only: shows &quot;&gt; X&quot; format
              • Max only: shows &quot;&lt; X&quot; format  
              • Both: shows &quot;X - Y&quot; format
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Metric'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
