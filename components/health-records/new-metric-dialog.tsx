'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'react-toastify'
import { HealthRecordsApiService } from '@/lib/api/health-records-api'

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

interface NewMetricDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMetricCreated: (metric: HealthRecordMetric) => void
  sectionId: number
  sectionName: string
  createMetric: (metricData: {
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
  }) => Promise<HealthRecordMetric>
}

export function NewMetricDialog({
  open,
  onOpenChange,
  onMetricCreated,
  sectionId,
  sectionName,
  createMetric
}: NewMetricDialogProps) {
  const [metricName, setMetricName] = useState('')
  const [metricDisplayName, setMetricDisplayName] = useState('')
  const [metricUnit, setMetricUnit] = useState('')
  const [normalRangeMin, setNormalRangeMin] = useState('')
  const [normalRangeMax, setNormalRangeMax] = useState('')
  const [metricDescription, setMetricDescription] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Admin templates
  const [adminTemplates, setAdminTemplates] = useState<HealthRecordMetric[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<HealthRecordMetric | null>(null)
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false)
  const [isCustomMetric, setIsCustomMetric] = useState(true)
  
  // Fetch admin templates when dialog opens
  useEffect(() => {
    if (open) {
      fetchAdminTemplates()
    }
  }, [open, sectionId])
  
  const fetchAdminTemplates = async () => {
    try {
      const templates = await HealthRecordsApiService.getAdminMetricTemplates(undefined, 1)
      setAdminTemplates(templates)
    } catch (error) {
      console.error('Failed to fetch admin metric templates:', error)
    }
  }
  
  const handleTemplateSelect = (template: HealthRecordMetric) => {
    setSelectedTemplate(template)
    setMetricName(template.name)
    setMetricDisplayName(template.display_name)
    setMetricDescription(template.description || '')
    setMetricUnit(template.default_unit || '')
    
    // Parse threshold for normal range
    if (template.threshold) {
      if (typeof template.threshold === 'object' && 'min' in template.threshold && 'max' in template.threshold) {
        setNormalRangeMin(template.threshold.min?.toString() || '')
        setNormalRangeMax(template.threshold.max?.toString() || '')
      }
    }
    
    setIsCustomMetric(false)
    setTemplateDropdownOpen(false)
  }
  
  const handleCustomMetricToggle = () => {
    setIsCustomMetric(true)
    setSelectedTemplate(null)
    setMetricName('')
    setMetricDisplayName('')
    setMetricDescription('')
    setMetricUnit('')
    setNormalRangeMin('')
    setNormalRangeMax('')
  }

  // Handle create new metric
  const handleCreateMetric = async () => {
    if (!metricName.trim()) {
      toast.error('Please enter a metric name')
      return
    }

    if (!metricUnit.trim()) {
      toast.error('Please enter a unit')
      return
    }

    if (!normalRangeMin || !normalRangeMax) {
      toast.error('Please enter reference range values')
      return
    }

    const minValue = parseFloat(normalRangeMin)
    const maxValue = parseFloat(normalRangeMax)

    if (isNaN(minValue) || isNaN(maxValue)) {
      toast.error('Please enter valid numbers for reference range')
      return
    }

    if (minValue >= maxValue) {
      toast.error('Minimum value must be less than maximum value')
      return
    }

    setLoading(true)
    try {
      
      let newMetric
      
      if (selectedTemplate && !isCustomMetric) {
        // User selected a template
        newMetric = await createMetric({
          section_id: sectionId,
          name: selectedTemplate.name,
          display_name: selectedTemplate.display_name,
          description: selectedTemplate.description || metricDescription,
          default_unit: selectedTemplate.default_unit || metricUnit,
          threshold: selectedTemplate.threshold || {
            min: minValue,
            max: maxValue
          },
          data_type: selectedTemplate.data_type || 'number',
          is_default: true,
          section_template_id: selectedTemplate.section_template_id
        })
      } else {
        // User created a custom metric
        newMetric = await createMetric({
          section_id: sectionId,
          name: metricName.toLowerCase().replace(/\s+/g, "_"),
          display_name: metricDisplayName || metricName,
          description: metricDescription,
          default_unit: metricUnit,
          threshold: {
            min: minValue,
            max: maxValue
          },
          data_type: 'number',
          is_default: false,
          section_template_id: sectionId // For custom metrics, use the section ID as template ID
        })
      }
      
      // Reset form
      setMetricName('')
      setMetricDisplayName('')
      setMetricUnit('')
      setNormalRangeMin('')
      setNormalRangeMax('')
      setMetricDescription('')
      setSelectedTemplate(null)
      setIsCustomMetric(true)
      onOpenChange(false)
      onMetricCreated(newMetric)
    } catch (error) {
      console.error('Failed to create metric:', error)
      toast.error('Failed to create metric')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setMetricName('')
    setMetricDisplayName('')
    setMetricUnit('')
    setNormalRangeMin('')
    setNormalRangeMax('')
    setMetricDescription('')
    setSelectedTemplate(null)
    setIsCustomMetric(true)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Metric to {sectionName}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Template Selection */}
          <div className="grid gap-2">
            <Label>Choose from Admin Templates (Optional)</Label>
            <Popover open={templateDropdownOpen} onOpenChange={setTemplateDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={templateDropdownOpen}
                  className="w-full justify-between"
                >
                  {selectedTemplate ? selectedTemplate.display_name : "Select a template..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search templates..." />
                  <CommandList>
                    <CommandEmpty>No templates found.</CommandEmpty>
                    <CommandGroup>
                      {adminTemplates.map((template) => (
                        <CommandItem
                          key={template.id}
                          value={template.display_name}
                          onSelect={() => handleTemplateSelect(template)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTemplate?.id === template.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{template.display_name}</span>
                            <span className="text-sm text-muted-foreground">
                              {template.default_unit} • {template.description}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedTemplate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCustomMetricToggle}
                className="w-fit"
              >
                Create Custom Metric Instead
              </Button>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="metricName">Metric Name *</Label>
            <Input
              id="metricName"
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              placeholder="e.g., glucose, cholesterol"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="metricDisplayName">Display Name (Optional)</Label>
            <Input
              id="metricDisplayName"
              value={metricDisplayName}
              onChange={(e) => setMetricDisplayName(e.target.value)}
              placeholder="e.g., Blood Glucose"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="metricUnit">Unit *</Label>
            <Input
              id="metricUnit"
              value={metricUnit}
              onChange={(e) => setMetricUnit(e.target.value)}
              placeholder="e.g., mg/dL, mmol/L, %"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="normalRangeMin">Reference Range Min *</Label>
              <Input
                id="normalRangeMin"
                type="number"
                step="0.1"
                value={normalRangeMin}
                onChange={(e) => setNormalRangeMin(e.target.value)}
                placeholder="e.g., 70"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="normalRangeMax">Reference Range Max *</Label>
              <Input
                id="normalRangeMax"
                type="number"
                step="0.1"
                value={normalRangeMax}
                onChange={(e) => setNormalRangeMax(e.target.value)}
                placeholder="e.g., 100"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="metricDescription">Description (Optional)</Label>
            <Textarea
              id="metricDescription"
              value={metricDescription}
              onChange={(e) => setMetricDescription(e.target.value)}
              placeholder="Enter metric description..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreateMetric} disabled={loading}>
            {loading ? 'Creating...' : 'Create Metric'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
