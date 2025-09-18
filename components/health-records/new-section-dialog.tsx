'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'

export interface HealthRecordSection {
  id: number
  name: string
  display_name: string
  description?: string
  health_record_type_id: number
  is_default: boolean
  created_by: number
  created_at: string
  updated_at?: string
  updated_by?: number
}

interface NewSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSectionCreated: (section: HealthRecordSection) => void
  healthRecordTypeId: number
  availableTemplates: HealthRecordSection[]
  createSection: (sectionData: {
    name: string
    display_name: string
    description?: string
    health_record_type_id: number
    is_default?: boolean
  }) => Promise<HealthRecordSection>
}

export function NewSectionDialog({
  open,
  onOpenChange,
  onSectionCreated,
  healthRecordTypeId,
  availableTemplates,
  createSection
}: NewSectionDialogProps) {
  const [sectionName, setSectionName] = useState('')
  const [sectionDescription, setSectionDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<HealthRecordSection | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [sectionExistsAlert, setSectionExistsAlert] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if section already exists (only for custom sections, not template selections)
  const checkSectionExists = (sectionName: string) => {
    // Only check for duplicates if user is creating a custom section (not selecting a template)
    if (selectedTemplate) {
      return false // Template selection is always allowed
    }
    
    // Check if the section name matches any existing template
    const existingTemplate = availableTemplates.find(t => 
      t.display_name.toLowerCase() === sectionName.toLowerCase()
    )
    return !!existingTemplate
  }

  // Handle section name change
  const handleSectionNameChange = (value: string) => {
    setSectionName(value)
    setSectionExistsAlert(false)
    // Only set template if user explicitly selects from dropdown, not when typing
    // This prevents custom names from being treated as template selections
    setSelectedTemplate(null)
  }

  // Handle create new section
  const handleCreateSection = async () => {
    // If no template is selected, require a section name
    if (!selectedTemplate && !sectionName.trim()) {
      toast.error('Please enter a section name or select a template')
      return
    }

    // Only check for duplicates if creating a custom section (not selecting a template)
    if (!selectedTemplate && checkSectionExists(sectionName)) {
      setSectionExistsAlert(true)
      return
    }

    setLoading(true)
    try {
      let newSection
      console.log('Selected template:', selectedTemplate)
      console.log('Section name:', sectionName)
      
      if (selectedTemplate) {
        // If a template was selected, use the existing template data
        console.log('Creating section from template:', selectedTemplate)
        newSection = await createSection({
          name: selectedTemplate.name,
          display_name: selectedTemplate.display_name,
          description: selectedTemplate.description || sectionDescription,
          health_record_type_id: healthRecordTypeId,
          is_default: true
        })
      } else {
        // If it's a custom section name, create a new section
        const sectionData = {
          name: sectionName.toLowerCase().replace(/\s+/g, "_"),
          display_name: sectionName,
          description: sectionDescription,
          health_record_type_id: healthRecordTypeId,
          is_default: false
        }
        console.log('Creating custom section with data:', sectionData)
        newSection = await createSection(sectionData)
        console.log('Custom section created successfully:', newSection)
      }
      
      // Reset form
      setSectionName('')
      setSectionDescription('')
      setSelectedTemplate(null)
      setSectionExistsAlert(false)
      onOpenChange(false)
      onSectionCreated(newSection)
    } catch (error: any) {
      console.error('Failed to create section:', error)
      console.error('Error details:', error)
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        toast.error('A section with this name already exists. Please choose a different name.')
        setSectionExistsAlert(true)
      } else if (error.response?.status === 404) {
        toast.error('Template not found. Please try again.')
      } else {
        toast.error(`Failed to create section: ${error.response?.data?.detail || error.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setSectionName('')
    setSectionDescription('')
    setSelectedTemplate(null)
    setSectionExistsAlert(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sectionName">Section Name</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  {selectedTemplate ? selectedTemplate.display_name : sectionName || "Enter section name..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search sections..." 
                    value={sectionName}
                    onValueChange={handleSectionNameChange}
                  />
                  <CommandList>
                    <CommandEmpty>No sections found.</CommandEmpty>
                    <CommandGroup>
                      {availableTemplates.map((template) => (
                        <CommandItem
                          key={template.id}
                          value={template.display_name}
                          onSelect={() => {
                            setSelectedTemplate(template)
                            setSectionName('') // Clear section name when template is selected
                            setComboboxOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTemplate?.id === template.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {template.display_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {sectionExistsAlert && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                This section already exists. Please choose a different name.
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="sectionDescription">Description (Optional)</Label>
            <Textarea
              id="sectionDescription"
              value={sectionDescription}
              onChange={(e) => setSectionDescription(e.target.value)}
              placeholder="Enter section description..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreateSection} disabled={loading}>
            {loading ? 'Creating...' : 'Create Section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
