'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-toastify'
import { SectionWithMetrics, HealthRecordSection } from './types'

interface EditSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: SectionWithMetrics | null
  onSectionUpdated: (section: SectionWithMetrics) => void
  updateSection: (sectionId: number, data: { display_name?: string; description?: string }) => Promise<HealthRecordSection>
}

export function EditSectionDialog({
  open,
  onOpenChange,
  section,
  onSectionUpdated,
  updateSection
}: EditSectionDialogProps) {
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  // Update form when section changes
  useEffect(() => {
    if (section) {
      setDisplayName(section.display_name || section.name || '')
    }
  }, [section])

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a section name')
      return
    }

    if (!section?.id) {
      toast.error('Section not found')
      return
    }

    if (!updateSection) {
      toast.error('Update functionality is not available')
      return
    }

    setLoading(true)
    try {
      const updatedSectionData = await updateSection(section.id, {
        display_name: displayName.trim()
      })
      
      // Create updated section object with new display name
      const updatedSection: SectionWithMetrics = {
        ...section,
        display_name: updatedSectionData.display_name
      }
      
      onSectionUpdated(updatedSection)
      onOpenChange(false)
      toast.success('Section updated successfully!')
    } catch (error) {
      console.error('Error updating section:', error)
      toast.error('Failed to update section')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(section?.display_name || section?.name || '')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Section Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter section name"
              disabled={loading}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
