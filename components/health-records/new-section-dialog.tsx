'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { HealthRecordsApiService } from '@/lib/api/health-records-api'
import { SectionAutocomplete, type SectionTemplate } from '@/components/ui/section-autocomplete'
import { useLanguage } from '@/contexts/language-context'

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
  existingSections?: Array<{
    id: number
    display_name: string
    section_template_id?: number | null
  }>
  createSection: (sectionData: {
    name: string
    display_name: string
    description?: string
    health_record_type_id: number
    is_default?: boolean
    section_template_id?: number
  }) => Promise<HealthRecordSection>
}

export function NewSectionDialog({
  open,
  onOpenChange,
  onSectionCreated,
  healthRecordTypeId,
  existingSections = [],
  createSection
}: NewSectionDialogProps) {
  const { t } = useLanguage()
  const [sectionName, setSectionName] = useState('')
  const [sectionDescription, setSectionDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<SectionTemplate | null>(null)
  const [sectionExistsAlert, setSectionExistsAlert] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Local admin templates state
  const [localAdminTemplates, setLocalAdminTemplates] = useState<SectionTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Fetch admin templates when dialog opens
  useEffect(() => {
    if (open) {
      fetchAdminTemplates()
    }
  }, [open, healthRecordTypeId])

  const fetchAdminTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const templates = await HealthRecordsApiService.getAdminSectionTemplates(healthRecordTypeId)
      // Convert templates to SectionTemplate format
      const convertedTemplates: SectionTemplate[] = templates.map(template => ({
        id: template.id,
        name: template.name,
        display_name: template.display_name,
        description: template.description,
        health_record_type_id: template.health_record_type_id,
        is_default: template.is_default
      }))
      setLocalAdminTemplates(convertedTemplates)
    } catch (error) {
      console.error('Failed to fetch admin templates:', error)
      setLocalAdminTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }

  // Filter out templates that match existing sections
  const availableTemplates = useMemo(() => {
    if (!existingSections || existingSections.length === 0) {
      return localAdminTemplates
    }

    // Create sets for quick lookup
    const existingTemplateIds = new Set(
      existingSections
        .map(s => s.section_template_id)
        .filter((id): id is number => id !== null && id !== undefined)
    )
    const existingDisplayNames = new Set(
      existingSections.map(s => s.display_name.toLowerCase().trim())
    )

    // Filter out templates that:
    // 1. Have a section_template_id that matches an existing section's section_template_id
    // 2. Have a display_name that matches an existing section's display_name (case-insensitive)
    return localAdminTemplates.filter(template => {
      const isTemplateIdUsed = existingTemplateIds.has(template.id)
      const isDisplayNameUsed = existingDisplayNames.has(template.display_name.toLowerCase().trim())
      return !isTemplateIdUsed && !isDisplayNameUsed
    })
  }, [localAdminTemplates, existingSections])

  // Handle autocomplete change
  const handleAutocompleteChange = (value: string, template: SectionTemplate | null | undefined) => {
    setSectionName(value)
    setSectionExistsAlert(false)
    setSelectedTemplate(template || null)
  }

  // Handle creating new section from autocomplete
  const handleNewSectionFromAutocomplete = (newSectionName: string) => {
    setSectionName(newSectionName)
    setSelectedTemplate(null) // Clear template selection when creating new
    setSectionExistsAlert(false)
  }

  // Handle create new section
  const handleCreateSection = async () => {
    // If no template is selected, require a section name
    if (!selectedTemplate && !sectionName.trim()) {
      toast.error(t('health.dialogs.newSection.pleaseEnterSectionName'))
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
          is_default: true,
          section_template_id: selectedTemplate.id  // Pass the template section ID
        })
      } else {
        // If it's a custom section name, create a new section
        const sectionData = {
          name: sectionName.toLowerCase().replace(/\s+/g, "_"),
          display_name: sectionName.trim(),
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
    } catch (error: unknown) {
      console.error('Failed to create section:', error)
      console.error('Error details:', error)
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as { response?: { status?: number; data?: { detail?: string } } }
        if (errorResponse.response?.status === 409) {
          toast.error(t('health.dialogs.newSection.sectionAlreadyExists'))
          setSectionExistsAlert(true)
        } else if (errorResponse.response?.status === 404) {
          toast.error(t('health.dialogs.newSection.templateNotFound'))
        } else {
          toast.error(`${t('health.dialogs.newSection.failedToCreateSection')}: ${errorResponse.response?.data?.detail || 'Unknown error'}`)
        }
      } else {
        toast.error(t('health.dialogs.newSection.failedToCreateSection'))
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
          <DialogTitle>{t('health.dialogs.newSection.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sectionName">{t('health.dialogs.newSection.sectionName')}</Label>
            <SectionAutocomplete
              value={sectionName}
              onChange={handleAutocompleteChange}
              templates={availableTemplates}
              placeholder={t('health.dialogs.newSection.sectionNamePlaceholder')}
              isLoading={templatesLoading}
              onNewSection={handleNewSectionFromAutocomplete}
              error={sectionExistsAlert ? t('health.dialogs.newSection.sectionExistsError') : undefined}
            />
            {sectionExistsAlert && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t('health.dialogs.newSection.sectionExistsError')}
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="sectionDescription">{t('health.dialogs.newSection.description')}</Label>
            <Textarea
              id="sectionDescription"
              value={sectionDescription}
              onChange={(e) => setSectionDescription(e.target.value)}
              placeholder={t('health.dialogs.newSection.descriptionPlaceholder')}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('health.dialogs.newSection.cancel')}
          </Button>
          <Button onClick={handleCreateSection} disabled={loading}>
            {loading ? t('health.dialogs.newSection.creating') : t('health.dialogs.newSection.createSection')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

