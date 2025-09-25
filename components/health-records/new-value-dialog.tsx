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
import { formatReferenceRange } from '@/hooks/use-health-records'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { HealthRecord } from './types'

export interface HealthRecordMetric {
  id: number
  section_id: number
  name: string
  display_name: string
  description?: string
  default_unit?: string
  reference_data?: Record<string, { min?: number; max?: number }>
  data_type: string
  is_default: boolean
  created_at: string
  updated_at?: string
  created_by: number
  updated_by?: number
}


interface NewValueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onValueCreated: (record: HealthRecord) => void
  sectionId?: number
  sectionName?: string
  availableMetrics?: HealthRecordMetric[]
  sections?: Array<{ id: number; display_name: string; name: string; metrics?: HealthRecordMetric[] }>
  createRecord: (recordData: {
    section_id: number
    metric_id: number
    value: number
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
  sections,
  createRecord
}: NewValueDialogProps) {
  const { user } = useSelector((state: RootState) => state.auth)
  const [selectedSectionId, setSelectedSectionId] = useState<number>(sectionId || 0)
  const [selectedSectionName, setSelectedSectionName] = useState<string>(sectionName || '')
  const [selectedMetric, setSelectedMetric] = useState<HealthRecordMetric | null>(null)
  const [metricValue, setMetricValue] = useState<string>('')
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState('')
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [sectionComboboxOpen, setSectionComboboxOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSpecialDialog, setShowSpecialDialog] = useState(false)

  // Clear selected metric when section changes
  useEffect(() => {
    if (selectedSectionId) {
      setSelectedMetric(null)
    }
  }, [selectedSectionId])

  // Get available metrics for the selected section (only user-created metrics)
  const getAvailableMetrics = (): HealthRecordMetric[] => {
    // If we have sections and a selected section, use metrics from that section
    if (sections && selectedSectionId) {
      const selectedSection = sections.find(section => section.id === selectedSectionId)
      console.log('Selected section for metrics:', selectedSection)
      console.log('Section metrics count:', selectedSection?.metrics?.length || 0)
      return selectedSection?.metrics || []
    }
    
    // Fallback to availableMetrics prop if no sections or no section selected
    if (availableMetrics && availableMetrics.length > 0) {
      console.log('Using availableMetrics prop:', availableMetrics.length, 'metrics')
      return availableMetrics
    }
    
    console.log('No metrics available')
    return []
  }

  // Helper function to get gender-specific reference range
  const getGenderSpecificReferenceRange = (metric: HealthRecordMetric) => {
    if (!metric.reference_data) return 'Reference range not specified'
    
    const userGender = user?.user_metadata?.gender?.toLowerCase()
    const gender = userGender === 'female' ? 'female' : 'male'
    const genderData = metric.reference_data[gender]
    
    return formatReferenceRange(genderData?.min, genderData?.max)
  }

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
    if (!selectedSectionId) {
      toast.error('Please select a section')
      return
    }
    
    if (!selectedMetric) {
      toast.error('Please select a metric')
      return
    }

    // Check if metricValue is valid
    if (!metricValue || !metricValue.trim()) {
      toast.error('Please enter a value')
      return
    }

    // Parse the numeric value
    const numValue = parseFloat(metricValue)
    if (isNaN(numValue)) {
      toast.error('Please enter a valid number')
      return
    }

    setLoading(true)
    try {
      // Determine status based on value and reference data
      let status = 'normal'
      if (selectedMetric.reference_data) {
        const userGender = user?.user_metadata?.gender?.toLowerCase()
        const gender = userGender === 'female' ? 'female' : 'male'
        const genderData = selectedMetric.reference_data[gender]
        
        if (genderData?.min !== undefined && genderData?.max !== undefined) {
          if (numValue < genderData.min || numValue > genderData.max) {
            status = 'abnormal'
          }
        }
      }

      // Send the numeric value directly
      const newRecord = await createRecord({
        section_id: selectedSectionId,
        metric_id: selectedMetric.id,
        value: numValue,
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
          <DialogTitle>Add New Value{selectedSectionName ? ` to ${selectedSectionName}` : ''}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {sections && sections.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="sectionSelect">Select Section *</Label>
              <Popover open={sectionComboboxOpen} onOpenChange={setSectionComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={sectionComboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedSectionName || "Select a section..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search sections..." />
                    <CommandList>
                      <CommandEmpty>No sections found.</CommandEmpty>
                      <CommandGroup>
                        {sections.map((section) => (
                          <CommandItem
                            key={section.id}
                            value={section.display_name}
                            onSelect={() => {
                              setSelectedSectionId(section.id)
                              setSelectedSectionName(section.display_name)
                              setSelectedMetric(null) // Clear selected metric when section changes
                              setSectionComboboxOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSectionId === section.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {section.display_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
          
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
                      {getAvailableMetrics().map((metric) => (
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
              
              {selectedMetric.reference_data && (
                <div className="grid gap-2">
                  <Label>Reference Range</Label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {getGenderSpecificReferenceRange(selectedMetric)} {selectedMetric.default_unit}
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
  sections,
  createRecord
}: NewValueDialogProps) {
  const [showSpecialDialog, setShowSpecialDialog] = useState(false)
  const [selectedSpecialMetric, setSelectedSpecialMetric] = useState<HealthRecordMetric | null>(null)

  // const handleSpecialMetricSelect = (metric: HealthRecordMetric) => {
  //   setSelectedSpecialMetric(metric)
  //   setShowSpecialDialog(true)
  // }

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
        sections={sections}
        createRecord={createRecord}
      />
      
      {selectedSpecialMetric && (
        <SpecialMetricDialog
          open={showSpecialDialog}
          onOpenChange={setShowSpecialDialog}
          onValueCreated={handleSpecialValueCreated}
          sectionId={sectionId || 0}
          sectionName={sectionName || ''}
          metricName={selectedSpecialMetric.display_name}
          metricId={selectedSpecialMetric.id}
          createRecord={createRecord}
        />
      )}
    </>
  )
}
