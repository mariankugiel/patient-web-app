'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'react-toastify'
import { SpecialMetricDialog } from './special-metric-dialog'
import { MetricValueEditor } from './metric-value-editor'

export interface HealthRecordMetric {
  id: number
  section_id: number
  name: string
  display_name: string
  description?: string
  default_unit?: string
  threshold?: {
    min: number
    max: number
  }
  data_type: string
  is_default: boolean
  created_at: string
  updated_at?: string
  created_by: number
  updated_by?: number
}

export interface HealthRecord {
  id: number
  created_by: number
  section_id: number
  metric_id: number
  value: any
  status?: string
  source?: string
  recorded_at: string
  device_id?: number
  device_info?: any
  accuracy?: string
  location_data?: any
  created_at: string
  updated_at?: string
  updated_by?: number
}

interface NewValueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onValueCreated: (record: HealthRecord) => void
  sectionId: number
  sectionName: string
  availableMetrics: HealthRecordMetric[]
  createRecord: (recordData: {
    section_id: number
    metric_id: number
    value: any
    status?: string
    recorded_at: string
    notes?: string
    source?: string
  }) => Promise<HealthRecord>
}

export function NewValueDialog({
  open,
  onOpenChange,
  onValueCreated,
  sectionId,
  sectionName,
  availableMetrics,
  createRecord
}: NewValueDialogProps) {
  const [selectedMetric, setSelectedMetric] = useState<HealthRecordMetric | null>(null)
  const [metricValue, setMetricValue] = useState('')
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState('')
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSpecialDialog, setShowSpecialDialog] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedMetric(null)
      setMetricValue('')
      setRecordedDate(new Date().toISOString().split("T")[0])
      setNotes('')
    }
  }, [open])

  // Check if metric is a special metric that needs complex input
  const isSpecialMetric = (metric: HealthRecordMetric) => {
    const name = metric.name.toLowerCase()
    return name.includes('cholesterol') || 
           name.includes('blood_pressure') || 
           name.includes('bp') ||
           name.includes('lipid')
  }

  // Handle metric selection
  const handleMetricSelect = (metric: HealthRecordMetric) => {
    setSelectedMetric(metric)
    setComboboxOpen(false)
    
    // If it's a special metric, show the special dialog
    if (isSpecialMetric(metric)) {
      setShowSpecialDialog(true)
    }
  }

  // Handle create new value
  const handleCreateValue = async () => {
    
    if (!selectedMetric) {
      toast.error('Please select a metric')
      return
    }

    // Check if metricValue is valid (string, number, or object)
    if (!metricValue || (typeof metricValue === 'string' && !metricValue.trim()) || (typeof metricValue === 'object' && Object.keys(metricValue).length === 0)) {
      toast.error('Please enter a value')
      return
    }

    // For structured metrics (like blood pressure), metricValue will be an object
    // For simple metrics, it should be a number
    let numValue: number
    if (typeof metricValue === 'object' && metricValue !== null) {
      // For structured metrics, we'll use the first numeric value for status calculation
      const values = Object.values(metricValue).filter(v => typeof v === 'number' && !isNaN(v))
      if (values.length === 0) {
        toast.error('Please enter valid numeric values')
        return
      }
      numValue = values[0] as number // Use first numeric value for status calculation
    } else {
      numValue = parseFloat(metricValue)
      if (isNaN(numValue)) {
        toast.error('Please enter a valid number')
        return
      }
    }

    setLoading(true)
    try {
      // Determine status based on value and threshold
      let status = 'normal'
      if (selectedMetric.threshold) {
        if (numValue < selectedMetric.threshold.min || numValue > selectedMetric.threshold.max) {
          status = 'abnormal'
        }
      }

      // Wrap the value in the expected dictionary format
      let wrappedValue: Record<string, any>
      if (typeof metricValue === 'object' && metricValue !== null) {
        // For structured metrics (like blood pressure), use the object directly
        wrappedValue = metricValue
      } else {
        // For simple metrics, wrap the value in a 'value' key
        wrappedValue = { value: metricValue }
      }

      const newRecord = await createRecord({
        section_id: sectionId,
        metric_id: selectedMetric.id,
        value: wrappedValue,
        status: status,
        recorded_at: new Date(recordedDate).toISOString(),
        notes: notes,
        source: 'manual_entry'
      })
      
      // Reset form
      setSelectedMetric(null)
      setMetricValue('')
      setRecordedDate(new Date().toISOString().split("T")[0])
      setNotes('')
      onOpenChange(false)
      onValueCreated(newRecord)
      
      toast.success('Value added successfully!')
    } catch (error) {
      console.error('Failed to create record:', error)
      toast.error('Failed to add value')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setSelectedMetric(null)
    setMetricValue('')
    setRecordedDate(new Date().toISOString().split("T")[0])
    setNotes('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Value to {sectionName}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="metricSelect">Select Metric *</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  {selectedMetric ? selectedMetric.display_name : "Select metric..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search metrics..." />
                  <CommandList>
                    <CommandEmpty>No metrics found.</CommandEmpty>
                    <CommandGroup>
                      {availableMetrics.map((metric) => (
                        <CommandItem
                          key={metric.id}
                          value={metric.display_name}
                          onSelect={() => handleMetricSelect(metric)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedMetric?.id === metric.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {metric.display_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {selectedMetric && (
            <>
              <div className="grid gap-2">
                <MetricValueEditor
                  metricName={selectedMetric.display_name}
                  dataType={selectedMetric.data_type}
                  currentValue={metricValue}
                  unit={selectedMetric.default_unit}
                  onValueChange={setMetricValue}
                  disabled={loading}
                />
              </div>
              
              {selectedMetric.threshold && (
                <div className="grid gap-2">
                  <Label>Reference Range</Label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedMetric.threshold.min} - {selectedMetric.threshold.max} {selectedMetric.default_unit}
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="recordedDate">Date *</Label>
            <Input
              id="recordedDate"
              type="date"
              value={recordedDate}
              onChange={(e) => setRecordedDate(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreateValue} disabled={loading || !selectedMetric}>
            {loading ? 'Adding...' : 'Add Value'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Add the special metric dialog component
export function NewValueDialogWithSpecial({
  open,
  onOpenChange,
  onValueCreated,
  sectionId,
  sectionName,
  availableMetrics,
  createRecord
}: NewValueDialogProps) {
  const [showSpecialDialog, setShowSpecialDialog] = useState(false)
  const [selectedSpecialMetric, setSelectedSpecialMetric] = useState<HealthRecordMetric | null>(null)

  const handleSpecialMetricSelect = (metric: HealthRecordMetric) => {
    setSelectedSpecialMetric(metric)
    setShowSpecialDialog(true)
  }

  const handleSpecialValueCreated = (record: HealthRecord) => {
    setShowSpecialDialog(false)
    setSelectedSpecialMetric(null)
    onValueCreated(record)
  }

  return (
    <>
      <NewValueDialog
        open={open}
        onOpenChange={onOpenChange}
        onValueCreated={onValueCreated}
        sectionId={sectionId}
        sectionName={sectionName}
        availableMetrics={availableMetrics}
        createRecord={createRecord}
      />
      
      {selectedSpecialMetric && (
        <SpecialMetricDialog
          open={showSpecialDialog}
          onOpenChange={setShowSpecialDialog}
          onValueCreated={handleSpecialValueCreated}
          sectionId={sectionId}
          sectionName={sectionName}
          metricName={selectedSpecialMetric.display_name}
          metricId={selectedSpecialMetric.id}
          createRecord={createRecord}
        />
      )}
    </>
  )
}
