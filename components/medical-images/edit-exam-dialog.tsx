'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-toastify'
import { medicalImagesApiService, MedicalImageData } from '@/lib/api/medical-images-api'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { Trash2 } from 'lucide-react'

interface EditExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExamUpdated: (exam: MedicalImageData) => void
  onExamDeleted: (examId: number) => void
  exam: MedicalImageData | null
}

export function EditExamDialog({
  open,
  onOpenChange,
  onExamUpdated,
  onExamDeleted,
  exam
}: EditExamDialogProps) {
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    image_type: '',
    body_part: '',
    findings: '',
    notes: ''
  })

  // Initialize form data when exam changes
  useEffect(() => {
    if (exam) {
      setFormData({
        image_type: exam.image_type?.trim() || '',
        body_part: exam.body_part?.trim() || '',
        findings: exam.findings?.trim() || '',
        notes: exam.notes?.trim() || ''
      })
    }
  }, [exam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exam) return

    setLoading(true)
    try {
      const updatedExam = await medicalImagesApiService.updateMedicalImage(exam.id, {
        image_type: formData.image_type,
        body_part: formData.body_part,
        findings: formData.findings,
        notes: formData.notes
      })

      toast.success('Exam updated successfully!')
      onOpenChange(false)
      onExamUpdated(updatedExam)
    } catch (error: any) {
      toast.error(`Failed to update exam: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!exam) return

    setLoading(true)
    try {
      await medicalImagesApiService.deleteMedicalImage(exam.id)
      toast.success('Exam deleted successfully!')
      onOpenChange(false)
      onExamDeleted(exam.id)
    } catch (error: any) {
      toast.error(`Failed to delete exam: ${error.message}`)
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

  if (!exam) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Medical Exam</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="image_type">Exam Type *</Label>
              <Select
                value={formData.image_type}
                onValueChange={(value) => handleInputChange('image_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="CT Scan">CT Scan</SelectItem>
                  <SelectItem value="ECG">ECG</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="body_part">Body Part *</Label>
              <Input
                id="body_part"
                value={formData.body_part}
                onChange={(e) => handleInputChange('body_part', e.target.value)}
                placeholder="e.g., Chest, Abdomen, Brain"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="findings">Findings</Label>
              <Select
                value={formData.findings}
                onValueChange={(value) => handleInputChange('findings', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select findings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No Findings">No Findings</SelectItem>
                  <SelectItem value="Low Risk Findings">Low Risk Findings</SelectItem>
                  <SelectItem value="Relevant Findings">Relevant Findings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the exam"
                rows={3}
              />
            </div>

            <div className="text-sm text-gray-500">
              <p><strong>File:</strong> {exam.original_filename}</p>
              <p><strong>Date:</strong> {new Date(exam.image_date).toLocaleDateString()}</p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Exam'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Medical Exam"
        itemName={exam.original_filename}
        loading={loading}
      />
    </>
  )
}
