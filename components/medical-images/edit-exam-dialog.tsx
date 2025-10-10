'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-toastify'
import { medicalImagesApiService, MedicalImageData } from '@/lib/api/medical-images-api'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { Trash2, Upload, FileText, Loader2 } from 'lucide-react'
import apiClient from '@/lib/api/axios-config'

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
  const [uploading, setUploading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    image_type: '',
    body_part: '',
    findings: '',
    notes: '',
    interpretation: '',
    conclusions: '',
    doctor_name: '',
    doctor_number: ''
  })

  // Initialize form data when exam changes
  useEffect(() => {
    if (exam) {
      setFormData({
        image_type: exam.image_type?.trim() || '',
        body_part: exam.body_part?.trim() || '',
        findings: exam.findings?.trim() || '',
        notes: exam.notes?.trim() || '',
        interpretation: exam.interpretation?.trim() || '',
        conclusions: exam.conclusions?.trim() || '',
        doctor_name: exam.doctor_name?.trim() || '',
        doctor_number: exam.doctor_number?.trim() || ''
      })
      setSelectedFile(null)
    }
  }, [exam])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file)
        toast.info('New file selected. Click Update to replace the existing file.')
      } else {
        toast.error('Only PDF files are supported')
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file)
        toast.info('New file selected. Click Update to replace the existing file.')
      } else {
        toast.error('Only PDF files are supported')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exam) return

    setLoading(true)
    try {
      // If a new file is selected, upload and analyze it first
      if (selectedFile) {
        setUploading(true)
        try {
          // Upload new file and get extracted info
          const uploadResponse = await medicalImagesApiService.uploadMedicalImage(selectedFile)
          
          if (uploadResponse.success) {
            // Merge extracted info with current form data (user's manual edits take priority)
            const mergedData = {
              image_type: formData.image_type || uploadResponse.extracted_info.exam_type || '',
              body_part: formData.body_part || uploadResponse.extracted_info.body_area || '',
              findings: formData.findings || uploadResponse.extracted_info.findings || '',
              interpretation: formData.interpretation || uploadResponse.extracted_info.interpretation || '',
              conclusions: formData.conclusions || uploadResponse.extracted_info.conclusions || '',
              doctor_name: formData.doctor_name || uploadResponse.extracted_info.doctor_name || '',
              doctor_number: formData.doctor_number || uploadResponse.extracted_info.doctor_number || '',
              notes: formData.notes,
              s3_key: uploadResponse.s3_key,
              original_filename: selectedFile.name,
              file_size_bytes: selectedFile.size,
              content_type: selectedFile.type
            }
            
            // Update exam with new file and data
            const updatedExam = await medicalImagesApiService.updateMedicalImage(exam.id, mergedData)
            toast.success('Exam file replaced and updated successfully!')
            onOpenChange(false)
            onExamUpdated(updatedExam)
          } else {
            toast.error('Failed to upload new file')
          }
        } catch (uploadError: any) {
          toast.error(`Failed to upload file: ${uploadError.message}`)
        } finally {
          setUploading(false)
          setLoading(false)
        }
      } else {
        // No new file, just update metadata
        const updatedExam = await medicalImagesApiService.updateMedicalImage(exam.id, {
          image_type: formData.image_type,
          body_part: formData.body_part,
          findings: formData.findings,
          notes: formData.notes,
          interpretation: formData.interpretation,
          conclusions: formData.conclusions,
          doctor_name: formData.doctor_name,
          doctor_number: formData.doctor_number
        })

        toast.success('Exam updated successfully!')
        onOpenChange(false)
        onExamUpdated(updatedExam)
        setLoading(false)
      }
    } catch (error: any) {
      toast.error(`Failed to update exam: ${error.message}`)
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medical Exam</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Replace File (Optional)</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragOver 
                    ? 'border-primary bg-primary/10' 
                    : selectedFile 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <>
                    <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium text-green-700 mb-1">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      Click to select a different file
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {isDragOver ? 'Drop your PDF file here' : 'Drag and drop your PDF file here, or click to browse'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Supported formats: PDF only</p>
                    <p className="text-xs mt-2">
                      <span className="text-gray-500">Current: </span>
                      <span className="text-blue-600 font-semibold">{exam.original_filename}</span>
                    </p>
                  </>
                )}
                <Input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading and analyzing file...</span>
              </div>
            )}

            {/* Form Fields - Always Visible */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image_type">Image Type *</Label>
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

                <div>
                  <Label htmlFor="body_part">Body Part</Label>
                  <Input
                    id="body_part"
                    value={formData.body_part}
                    onChange={(e) => handleInputChange('body_part', e.target.value)}
                    placeholder="e.g., Chest, Upper abdomen"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image_date">Image Date *</Label>
                  <Input
                    id="image_date"
                    type="date"
                    value={exam.image_date?.split('T')[0] || ''}
                    onChange={(e) => handleInputChange('image_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="findings">Findings</Label>
                  <Select
                    value={formData.findings || 'No Findings'}
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
              </div>

              <div>
                <Label htmlFor="interpretation">Interpretation</Label>
                <Textarea
                  id="interpretation"
                  value={formData.interpretation}
                  onChange={(e) => handleInputChange('interpretation', e.target.value)}
                  placeholder="Medical interpretation of the image..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="conclusions">Conclusions</Label>
                <Textarea
                  id="conclusions"
                  value={formData.conclusions}
                  onChange={(e) => handleInputChange('conclusions', e.target.value)}
                  placeholder="Conclusions and findings..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doctor_name">Doctor Name</Label>
                  <Input
                    id="doctor_name"
                    value={formData.doctor_name}
                    onChange={(e) => handleInputChange('doctor_name', e.target.value)}
                    placeholder="Doctor's name"
                  />
                </div>

                <div>
                  <Label htmlFor="doctor_number">Doctor Number</Label>
                  <Input
                    id="doctor_number"
                    value={formData.doctor_number}
                    onChange={(e) => handleInputChange('doctor_number', e.target.value)}
                    placeholder="Doctor's license number"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading || uploading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Exam
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading || uploading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || uploading}
                  className="min-w-[140px] bg-blue-600 hover:bg-blue-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : selectedFile ? (
                    'Replace File & Update'
                  ) : (
                    'Update Exam'
                  )}
                </Button>
              </div>
            </div>
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
