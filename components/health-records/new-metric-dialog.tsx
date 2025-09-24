'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

export interface HealthRecordMetric {
  id: number
  section_id: number
  name: string
  display_name: string
  description?: string
  default_unit?: string
  original_reference?: string // Store original reference string
  reference_data?: any // Store parsed reference data for all metrics (includes gender-specific when applicable)
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
  healthRecordTypeId?: number
  createMetric: (metricData: {
    section_id: number
    name: string
    display_name: string
    description?: string
    default_unit?: string
    reference_data?: any
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
  const [adminTemplates, setAdminTemplates] = useState<HealthRecordMetric[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<HealthRecordMetric | null>(null)
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false)
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false)
  const [isCustomMetric, setIsCustomMetric] = useState(true)
  
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
      setAdminTemplates(templates)
    } catch (error) {
      console.error('Failed to fetch admin metric templates:', error)
      setAdminTemplates([])
    }
  }, [selectedSectionId, sections, healthRecordTypeId])
  
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
  const getGenderSpecificReference = (template: any) => {
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

  const handleTemplateSelect = (template: HealthRecordMetric) => {
    setSelectedTemplate(template)
    setMetricName(template.name)
    setMetricDisplayName(template.display_name)
    setMetricDescription(template.description || '')
    setMetricUnit(template.default_unit || '')
    
    // Get gender-specific reference range
    const referenceRange = getGenderSpecificReference(template)
    setNormalRangeMin(referenceRange.min?.toString() || '')
    setNormalRangeMax(referenceRange.max?.toString() || '')
    
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

  // Handle metric name change from combobox input
  const handleMetricNameChange = (value: string) => {
    setMetricName(value)
    // Clear selected template when user types
    if (selectedTemplate) {
      setSelectedTemplate(null)
      setIsCustomMetric(true)
    }
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
        const userGender = user?.user_metadata?.gender?.toLowerCase()
        const gender = userGender === 'female' ? 'female' : 'male'
        
        const customReferenceData = {
          male: { min: minValue, max: maxValue },
          female: { min: minValue, max: maxValue }
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
              <Label htmlFor="sectionSelect">Select Section</Label>
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
            <Label htmlFor="metricName">Enter Metric Name</Label>
            <Popover open={templateDropdownOpen} onOpenChange={setTemplateDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={templateDropdownOpen}
                  className="w-full justify-between"
                  disabled={!selectedSectionId}
                >
                  {!selectedSectionId 
                    ? "Select a section first..." 
                    : selectedTemplate 
                      ? selectedTemplate.display_name 
                      : metricName || "Enter metric name..."
                  }
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search metrics..." 
                    value={metricName}
                    onValueChange={handleMetricNameChange}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {!selectedSectionId ? "Please select a section first" : "No metrics found for this section"}
                    </CommandEmpty>
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
            <Label htmlFor="metricUnit">Unit (optional)</Label>
            <Input
              id="metricUnit"
              value={metricUnit}
              onChange={(e) => setMetricUnit(e.target.value)}
              placeholder="e.g., mg/dL, mmol/L, %"
            />
          </div>
          
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="normalRangeMin">Reference Range Min (Optional)</Label>
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
                <Label htmlFor="normalRangeMax">Reference Range Max (Optional)</Label>
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
            <div className="text-sm text-muted-foreground">
              <p>• Both empty: no reference range (optional)</p>
              <p>• Min only: means "greater than" (e.g., &gt; 70)</p>
              <p>• Max only: means "less than" (e.g., &lt; 100)</p>
              <p>• Both: means "range" (e.g., 70-100)</p>
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
