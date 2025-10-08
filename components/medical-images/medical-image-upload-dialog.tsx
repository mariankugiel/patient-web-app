'use client'

import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { medicalImagesApiService, ExtractedImageInfo, SaveImageRequest } from '@/lib/api/medical-images-api'

interface MedicalImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImageSaved: () => void
}

export function MedicalImageUploadDialog({ open, onOpenChange, onImageSaved }: MedicalImageUploadDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<ExtractedImageInfo | null>(null)
  const [formData, setFormData] = useState<SaveImageRequest>({
    image_type: '',
    body_part: '',
    image_date: '',
    interpretation: '',
    conclusions: '',
    doctor_name: '',
    doctor_number: '',
    original_filename: '',
    file_size_bytes: 0,
    content_type: '',
    s3_key: '',
    findings: 'No Findings'
  })
  const [isDragOver, setIsDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert dd-mm-yyyy to yyyy-mm-dd for HTML date input
  const convertDateFormat = (dateString: string): string => {
    if (!dateString) return ''
    
    // Check if it's already in yyyy-mm-dd format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString
    }
    
    // Convert dd-mm-yyyy to yyyy-mm-dd
    const parts = dateString.split('-')
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    return dateString
  }

  // Map extracted exam type to valid image types, default to "Others" if not found
  const mapExamTypeToImageType = (examType: string): string => {
    if (!examType) return 'Others'
    
    const normalizedType = examType.toLowerCase().trim()
    
    // Map X-Ray variations (based on backend patterns: raio-x, rx, radiograf, x-ray, radiologic)
    if (normalizedType.includes('x-ray') || normalizedType.includes('xray') || normalizedType.includes('raio-x') || 
        normalizedType.includes('rx') || normalizedType.includes('radiograf') || normalizedType.includes('radiologic')) {
      return 'X-Ray'
    }
    
    // Map Ultrasound variations (based on backend patterns: ecografia, ultrason, ultrasound, echografia, sonograf)
    if (normalizedType.includes('ultrasound') || normalizedType.includes('ultrason') || normalizedType.includes('ultrasonography') || 
        normalizedType.includes('ecografia') || normalizedType.includes('echografia') || normalizedType.includes('sonograf')) {
      return 'Ultrasound'
    }
    
    // Map MRI variations
    if (normalizedType.includes('mri') || normalizedType.includes('magnetic resonance')) {
      return 'MRI'
    }
    
    // Map CT Scan variations
    if (normalizedType.includes('ct') || normalizedType.includes('computed tomography') || normalizedType.includes('tomography')) {
      return 'CT Scan'
    }
    
    // Map ECG variations (based on backend patterns: ecg, ekg, electrocardiogram, electro-cardiogr)
    if (normalizedType.includes('ecg') || normalizedType.includes('ekg') || normalizedType.includes('electrocardiogram') || 
        normalizedType.includes('electro-cardiogr')) {
      return 'ECG'
    }
    
    // If no match found, default to "Others"
    return 'Others'
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('File selected:', file.name, file.size, file.type)

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported for medical images')
      return
    }

    // Set filename immediately for UI feedback
    setFormData(prev => ({
      ...prev,
      original_filename: file.name,
      file_size_bytes: file.size,
      content_type: file.type
    }))

    // Duplicate check is now handled by the backend

    setUploading(true)
    try {
      console.log('Starting upload to backend...')
      const response = await medicalImagesApiService.uploadMedicalImage(file)
      console.log('Upload response:', response)
      
      console.log('Response success check:', response.success, typeof response.success)
      
      // Handle duplicate file response
      if (response.status === 409) {
        const shouldUpdate = window.confirm(
          `A similar file already exists.\n\n` +
          `Do you want to update the existing file with the new one?`
        )
        
        if (!shouldUpdate) {
          setUploading(false)
          return
        }
        
        // TODO: Handle file update logic here
        toast.info('File update functionality coming soon')
        setUploading(false)
        return
      }
      
      if (response.success === true) {
        setExtractedInfo(response.extracted_info)
        setFormData(prev => ({
          ...prev, // Preserve existing form data including filename
          image_type: mapExamTypeToImageType(response.extracted_info.exam_type || ''),
          body_part: response.extracted_info.body_area || '',
          image_date: convertDateFormat(response.extracted_info.date_of_exam || ''),
          interpretation: response.extracted_info.interpretation || '',
          conclusions: response.extracted_info.conclusions || '',
          doctor_name: response.extracted_info.doctor_name || '',
          doctor_number: response.extracted_info.doctor_number || '',
          s3_key: response.s3_key,
          findings: response.extracted_info.findings || 'No Findings' // AI-determined findings
        }))
        toast.success('File uploaded and analyzed successfully!')
      } else {
        console.log('Upload failed, response:', response)
        toast.error('Failed to upload and analyze file')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.image_type || !formData.image_date) {
      toast.error('Please fill in all required fields')
      return
    }

    // If no file was uploaded, we need to create a minimal file entry
    if (!formData.s3_key) {
      toast.error('Please upload a PDF file first')
      return
    }

    setSaving(true)
    try {
      // Convert date to proper datetime format
      const dateObj = new Date(formData.image_date)
      const formattedDate = dateObj.toISOString()
      
      const saveData = {
        ...formData,
        image_date: formattedDate
      }
      
      console.log('Sending save data:', saveData)
      console.log('Interpretation value:', formData.interpretation)
      
      const response = await medicalImagesApiService.saveMedicalImage(saveData)
      
      console.log('Save response:', response)
      
      if (response.success) {
        toast.success('Medical image saved successfully!')
        onImageSaved()
        handleClose()
      } else {
        toast.error(response.message || 'Failed to save medical image')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save medical image')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setExtractedInfo(null)
    setFormData({
      image_type: '',
      body_part: '',
      image_date: '',
      interpretation: '',
      conclusions: '',
      doctor_name: '',
      doctor_number: '',
      original_filename: '',
      file_size_bytes: 0,
      content_type: '',
      s3_key: '',
      findings: 'No Findings'
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  const handleInputChange = (field: keyof SaveImageRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
        // Create a fake event to reuse the existing handler
        const fakeEvent = {
          target: { files: [file] }
        } as unknown as React.ChangeEvent<HTMLInputElement>
        handleFileUpload(fakeEvent)
      } else {
        toast.error('Only PDF files are supported')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Medical Image</DialogTitle>
          <DialogDescription>
            Upload and analyze medical image documents (X-Ray, Ultrasound, MRI, CT Scan, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload PDF File</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragOver 
                  ? 'border-primary bg-primary/10' 
                  : formData.original_filename 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {formData.original_filename ? (
                <>
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium text-green-700 mb-1">
                    {formData.original_filename}
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
                </>
              )}
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
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
                <Select value={formData.image_type} onValueChange={(value) => handleInputChange('image_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select image type" />
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
                  value={formData.image_date}
                  onChange={(e) => handleInputChange('image_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="findings">Findings</Label>
                <Select value={formData.findings || 'No Findings'} onValueChange={(value) => handleInputChange('findings', value)}>
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
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.image_type || !formData.image_date || saving}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Image'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
