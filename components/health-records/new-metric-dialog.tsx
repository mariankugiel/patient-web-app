'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Info } from 'lucide-react'
import { toast } from 'react-toastify'
import { HealthRecordsApiService } from '@/lib/api/health-records-api'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { MetricAutocomplete, type MetricTemplate } from '@/components/ui/metric-autocomplete'

export interface HealthRecordMetric {
  id: number
  section_id: number
  name: string
  display_name: string
  description?: string
  default_unit?: string
  original_reference?: string // Store original reference string
  reference_data?: Record<string, { min?: number; max?: number }> // Store parsed reference data for all metrics (includes gender-specific when applicable)
  section_template_id?: number
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
  sectionId?: number
  sectionName?: string
  sections?: Array<{ id: number; display_name: string; name: string; section_template_id?: number }>
  existingMetrics?: Array<{
    id: number
    display_name: string
    name: string
    section_id: number
  }>
  healthRecordTypeId?: number
  createMetric: (metricData: {
    section_id: number
    name: string
    display_name: string
    description?: string
    default_unit?: string
    reference_data?: Record<string, { min?: number; max?: number }>
    data_type: string
  }) => Promise<HealthRecordMetric>
}

export function NewMetricDialog({
  open,
  onOpenChange,
  onMetricCreated,
  sectionId,
  sectionName,
  sections,
  existingMetrics = [],
  healthRecordTypeId,
  createMetric
}: NewMetricDialogProps) {
  const { user } = useSelector((state: RootState) => state.auth)
  const [metricName, setMetricName] = useState('')
  const [metricDisplayName, setMetricDisplayName] = useState('')
  const [metricUnit, setMetricUnit] = useState('')
  const [normalRangeMin, setNormalRangeMin] = useState('')
  const [normalRangeMax, setNormalRangeMax] = useState('')
  const [metricDescription, setMetricDescription] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Admin templates
  const [adminTemplates, setAdminTemplates] = useState<MetricTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MetricTemplate | null>(null)
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false)
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false)
  const [isCustomMetric, setIsCustomMetric] = useState(true)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  
  // Section selection state
  const [selectedSectionId, setSelectedSectionId] = useState<number>(0)
  const [selectedSectionName, setSelectedSectionName] = useState<string>('')
  
  // Initialize section when dialog opens with pre-selected section
  useEffect(() => {
    if (open && sectionId && sectionName) {
      setSelectedSectionId(sectionId)
      setSelectedSectionName(sectionName)
    } else if (open && !sectionId) {
      // Reset to no section selected when opening without pre-selection
      setSelectedSectionId(0)
      setSelectedSectionName('')
    }
  }, [open, sectionId, sectionName])
  
  const fetchAdminTemplates = useCallback(async () => {
    if (!selectedSectionId) {
      setAdminTemplates([])
      return
    }
    
    setTemplatesLoading(true)
    try {
      // Find the selected section to get its template ID
      const selectedSection = sections?.find(section => section.id === selectedSectionId)
      const sectionTemplateId = selectedSection?.section_template_id
      
      if (!sectionTemplateId) {
        console.warn('No section_template_id found for selected section:', selectedSectionId)
        setAdminTemplates([])
        return
      }
      
      // Fetch templates filtered by the selected section's template ID
      const templates = await HealthRecordsApiService.getAdminMetricTemplates(sectionTemplateId, healthRecordTypeId || 1)
      // Convert to MetricTemplate format
      const convertedTemplates: MetricTemplate[] = templates.map(template => ({
        id: template.id,
        name: template.name,
        display_name: template.display_name,
        description: template.description,
        default_unit: template.default_unit,
        reference_data: template.reference_data,
        data_type: template.data_type,
        section_template_id: sectionTemplateId
      }))
      setAdminTemplates(convertedTemplates)
    } catch (error) {
      console.error('Failed to fetch admin metric templates:', error)
      setAdminTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }, [selectedSectionId, sections, healthRecordTypeId])

  // Filter out templates that match existing metrics in the selected section
  const availableTemplates = useMemo(() => {
    if (!existingMetrics || existingMetrics.length === 0) {
      return adminTemplates
    }

    // Get existing metrics for the selected section
    const existingMetricsInSection = existingMetrics.filter(
      m => m.section_id === selectedSectionId
    )

    if (existingMetricsInSection.length === 0) {
      return adminTemplates
    }

    // Create sets for quick lookup
    const existingDisplayNames = new Set(
      existingMetricsInSection.map(m => m.display_name.toLowerCase().trim())
    )
    const existingNames = new Set(
      existingMetricsInSection.map(m => m.name.toLowerCase().trim())
    )

    // Filter out templates that:
    // 1. Have a display_name that matches an existing metric's display_name (case-insensitive)
    // 2. Have a name that matches an existing metric's name (case-insensitive)
    return adminTemplates.filter(template => {
      const isDisplayNameUsed = existingDisplayNames.has(template.display_name.toLowerCase().trim())
      const isNameUsed = existingNames.has(template.name.toLowerCase().trim())
      return !isDisplayNameUsed && !isNameUsed
    })
  }, [adminTemplates, existingMetrics, selectedSectionId])
  
  // Only fetch admin templates when a section is selected
  useEffect(() => {
    if (open && selectedSectionId) {
      fetchAdminTemplates()
    } else if (open && !selectedSectionId) {
      // Clear templates when no section is selected
      setAdminTemplates([])
    }
  }, [open, selectedSectionId, fetchAdminTemplates])
  
  // Get gender-specific reference range
  const getGenderSpecificReference = (template: { reference_data?: Record<string, { min?: number; max?: number }> }) => {
    const userGender = user?.user_metadata?.gender?.toLowerCase()
    
    // Default to male if gender is not found
    const gender = userGender === 'female' ? 'female' : 'male'
    
    // Get reference data for the user's gender
    if (template.reference_data) {
      const genderData = template.reference_data[gender]
      return {
        min: genderData?.min,
        max: genderData?.max
      }
    }
    
    // No reference data available
    return {
      min: null,
      max: null
    }
  }

  // Handle autocomplete change
  const handleAutocompleteChange = (value: string, template: MetricTemplate | null | undefined) => {
    setMetricName(value)
    setSelectedTemplate(template || null)
    setIsCustomMetric(!template)
    
    if (template) {
      // If template is selected, populate fields
      setMetricDisplayName(template.display_name)
      setMetricDescription(template.description || '')
      setMetricUnit(template.default_unit || '')
      
      // Get gender-specific reference range
      const referenceRange = getGenderSpecificReference(template)
      setNormalRangeMin(referenceRange.min?.toString() || '')
      setNormalRangeMax(referenceRange.max?.toString() || '')
    } else {
      // If no template, use the typed value as display name
      setMetricDisplayName(value)
    }
  }

  // Handle creating new metric from autocomplete
  const handleNewMetricFromAutocomplete = (newMetricName: string) => {
    setMetricName(newMetricName)
    setMetricDisplayName(newMetricName)
    setSelectedTemplate(null) // Clear template selection when creating new
    setIsCustomMetric(true)
  }

  // Handle create new metric
  const handleCreateMetric = async () => {
    // Validate section selection if sections are provided
    if (sections && sections.length > 0 && !selectedSectionId) {
      toast.error('Please select a section')
      return
    }

    if (!metricName.trim()) {
      toast.error('Please enter a metric name')
      return
    }

    // Unit is optional - no validation needed

    // Parse reference range values (both are optional)
    const minValue = normalRangeMin ? parseFloat(normalRangeMin) : null
    const maxValue = normalRangeMax ? parseFloat(normalRangeMax) : null

    // Reference range is optional - both can be null

    // Validate that provided values are valid numbers
    if ((minValue !== null && isNaN(minValue)) || (maxValue !== null && isNaN(maxValue))) {
      toast.error('Please enter valid numbers for reference range')
      return
    }

    // Validate that min is less than max when both are provided
    if (minValue !== null && maxValue !== null && minValue >= maxValue) {
      toast.error('Minimum value must be less than maximum value')
      return
    }

    setLoading(true)
    try {
      
      let newMetric
      
      if (selectedTemplate && !isCustomMetric) {
        // User selected a template - use the template's reference_data
        newMetric = await createMetric({
          section_id: selectedSectionId || sectionId || 0,
          name: selectedTemplate.name,
          display_name: selectedTemplate.display_name,
          description: selectedTemplate.description || metricDescription,
          default_unit: selectedTemplate.default_unit || metricUnit,
          reference_data: selectedTemplate.reference_data,
          data_type: selectedTemplate.data_type || 'number'
        })
      } else {
        // User created a custom metric - create reference_data based on user's gender
        // const userGender = user?.user_metadata?.gender?.toLowerCase()
        // const gender = userGender === 'female' ? 'female' : 'male'
        
        const customReferenceData = {
          male: { min: minValue || undefined, max: maxValue || undefined },
          female: { min: minValue || undefined, max: maxValue || undefined }
        }
        
        newMetric = await createMetric({
          section_id: selectedSectionId || sectionId || 0,
          name: metricName.toLowerCase().replace(/\s+/g, "_"),
          display_name: metricDisplayName || metricName,
          description: metricDescription,
          default_unit: metricUnit,
          reference_data: customReferenceData,
          data_type: 'number'
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
          <DialogTitle>Add New Metric</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Section Selection */}
          {sections && sections.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="sectionSelect">Select Section <span className="text-red-500">*</span></Label>
              <Popover open={sectionDropdownOpen} onOpenChange={setSectionDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={sectionDropdownOpen}
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
                              setSectionDropdownOpen(false)
                              // Clear selected template and metric name when section changes
                              setSelectedTemplate(null)
                              setIsCustomMetric(true)
                              setMetricName('')
                              setMetricDisplayName('')
                              setMetricDescription('')
                              setMetricUnit('')
                              setNormalRangeMin('')
                              setNormalRangeMax('')
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
            <Label htmlFor="metricName">Enter Metric Name <span className="text-red-500">*</span></Label>
            <MetricAutocomplete
              value={metricName}
              onChange={handleAutocompleteChange}
              templates={availableTemplates}
              placeholder="Search or type a metric name..."
              isLoading={templatesLoading}
              disabled={!selectedSectionId}
              onNewMetric={handleNewMetricFromAutocomplete}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="metricDisplayName">Display Name</Label>
            <Input
              id="metricDisplayName"
              value={metricDisplayName}
              onChange={(e) => setMetricDisplayName(e.target.value)}
              placeholder="e.g., Blood Glucose"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="metricUnit">Unit</Label>
            <Input
              id="metricUnit"
              value={metricUnit}
              onChange={(e) => setMetricUnit(e.target.value)}
              placeholder="e.g., mg/dL, mmol/L, %"
            />
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <Label>Reference Range Min/Max</Label>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                      aria-label="Reference range information"
                    >
                      <Info className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    className="w-auto max-w-none p-4 whitespace-nowrap" 
                    side="right"
                    align="start"
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Reference Range Guide</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Both empty: no reference range (optional)</p>
                        <p>• Min only: means &quot;greater than&quot; (e.g., &gt; 70)</p>
                        <p>• Max only: means &quot;less than&quot; (e.g., &lt; 100)</p>
                        <p>• Both: means &quot;range&quot; (e.g., 70-100)</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="normalRangeMin">Min</Label>
                <Input
                  id="normalRangeMin"
                  type="number"
                  step="0.1"
                  value={normalRangeMin}
                  onChange={(e) => setNormalRangeMin(e.target.value)}
                  placeholder="e.g., 70 (means > 70)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="normalRangeMax">Max</Label>
                <Input
                  id="normalRangeMax"
                  type="number"
                  step="0.1"
                  value={normalRangeMax}
                  onChange={(e) => setNormalRangeMax(e.target.value)}
                  placeholder="e.g., 100 (means < 100)"
                />
              </div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="metricDescription">Description</Label>
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
