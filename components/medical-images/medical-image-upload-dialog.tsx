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
import { DuplicateFileDialog } from '@/components/ui/duplicate-file-dialog'
import { useLanguage } from '@/contexts/language-context'

interface MedicalImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImageSaved: () => void
}

export function MedicalImageUploadDialog({ open, onOpenChange, onImageSaved }: MedicalImageUploadDialogProps) {
  const { t } = useLanguage()
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
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<{
    existingDocument: any
    fileName: string
    fileSize: number
  } | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  
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
      toast.error(t('health.dialogs.medicalImage.onlyPdfSupported'))
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
      if (response.duplicate_found || response.status === 409) {
        const existingDoc = response.existing_document
        setDuplicateInfo({
          existingDocument: existingDoc,
          fileName: file.name,
          fileSize: file.size
        })
        setPendingFile(file)
        setShowDuplicateDialog(true)
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
          findings: response.extracted_info.findings || t('health.dialogs.medicalImage.noFindings') // AI-determined findings
        }))
        toast.success(t('health.dialogs.medicalImage.fileUploadedAnalyzed'))
      } else {
        console.log('Upload failed, response:', response)
        toast.error(t('health.dialogs.medicalImage.failedToUploadAnalyze'))
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      console.error('Error details:', error.response?.data || error.message)
      
      // Check if it's a duplicate error from the backend
      if (error.response?.status === 409 || error.response?.data?.duplicate_found) {
        const existingDoc = error.response?.data?.existing_document
        setDuplicateInfo({
          existingDocument: existingDoc,
          fileName: file.name,
          fileSize: file.size
        })
        setPendingFile(file)
        setShowDuplicateDialog(true)
        setUploading(false)
        return
      }
      
      toast.error(t('health.dialogs.medicalImage.failedToUpload'))
    } finally {
      setUploading(false)
    }
  }

  const handleDuplicateCancel = () => {
    setShowDuplicateDialog(false)
    setDuplicateInfo(null)
    setPendingFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDuplicateContinue = async () => {
    if (!pendingFile) return

    setUploading(true)
    try {
      const response = await medicalImagesApiService.uploadMedicalImage(pendingFile)
      
      // If duplicate found again, show dialog again (shouldn't happen, but handle it)
      if (response.duplicate_found || response.status === 409) {
        setShowDuplicateDialog(true)
        setUploading(false)
        return
      }
      
      if (response.success === true) {
        setExtractedInfo(response.extracted_info)
        setFormData(prev => ({
          ...prev,
          original_filename: pendingFile.name,
          file_size_bytes: pendingFile.size,
          image_type: mapExamTypeToImageType(response.extracted_info.exam_type || ''),
          body_part: response.extracted_info.body_area || '',
          image_date: convertDateFormat(response.extracted_info.date_of_exam || ''),
          interpretation: response.extracted_info.interpretation || '',
          conclusions: response.extracted_info.conclusions || '',
          doctor_name: response.extracted_info.doctor_name || '',
          doctor_number: response.extracted_info.doctor_number || '',
          s3_key: response.s3_key,
          findings: response.extracted_info.findings || t('health.dialogs.medicalImage.noFindings')
        }))
        toast.success(t('health.dialogs.medicalImage.fileUploadedAnalyzed'))
        setShowDuplicateDialog(false)
        setDuplicateInfo(null)
        setPendingFile(null)
      } else {
        toast.error(t('health.dialogs.medicalImage.failedToUploadAnalyze'))
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      if (error.response?.status === 409 || error.response?.data?.duplicate_found) {
        setShowDuplicateDialog(true)
      } else {
        toast.error(t('health.dialogs.medicalImage.failedToUpload'))
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    // Prevent double-save
    if (saving) {
      console.warn('Save already in progress, ignoring duplicate call')
      return
    }

    if (!formData.image_type || !formData.image_date) {
      toast.error(t('health.dialogs.medicalImage.pleaseFillRequiredFields'))
      return
    }

    // If no file was uploaded, we need to create a minimal file entry
    if (!formData.s3_key) {
      toast.error(t('health.dialogs.medicalImage.pleaseUploadPdfFirst'))
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
        toast.success(t('health.dialogs.medicalImage.medicalImageSavedSuccess'))
        onImageSaved()
        handleClose()
      } else {
        toast.error(response.message || t('health.dialogs.medicalImage.failedToSaveMedicalImage'))
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error(t('health.dialogs.medicalImage.failedToSaveMedicalImage'))
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
      findings: t('health.dialogs.medicalImage.noFindings')
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
          toast.error(t('health.dialogs.medicalImage.onlyPdfFilesSupported'))
        }
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('health.dialogs.medicalImage.title')}</DialogTitle>
          <DialogDescription>
            {t('health.dialogs.medicalImage.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">{t('health.dialogs.medicalImage.uploadPdfFile')}</Label>
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
                    {t('health.dialogs.medicalImage.clickToSelectDifferent')}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {isDragOver ? t('health.dialogs.medicalImage.dropPdfHere') : t('health.dialogs.medicalImage.dragDropPdf')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{t('health.dialogs.medicalImage.supportedFormats')}</p>
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
              <span>{t('health.dialogs.medicalImage.uploadingAnalyzing')}</span>
            </div>
          )}

          {/* Form Fields - Always Visible */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image_type">{t('health.dialogs.medicalImage.imageType')} *</Label>
                <Select value={formData.image_type} onValueChange={(value) => handleInputChange('image_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('health.dialogs.medicalImage.selectImageType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X-Ray">{t('health.dialogs.medicalImage.xRay')}</SelectItem>
                    <SelectItem value="Ultrasound">{t('health.dialogs.medicalImage.ultrasound')}</SelectItem>
                    <SelectItem value="MRI">{t('health.dialogs.medicalImage.mri')}</SelectItem>
                    <SelectItem value="CT Scan">{t('health.dialogs.medicalImage.ctScan')}</SelectItem>
                    <SelectItem value="ECG">{t('health.dialogs.medicalImage.ecg')}</SelectItem>
                    <SelectItem value="Others">{t('health.dialogs.medicalImage.others')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="body_part">{t('health.dialogs.medicalImage.bodyPart')}</Label>
                <Input
                  id="body_part"
                  value={formData.body_part}
                  onChange={(e) => handleInputChange('body_part', e.target.value)}
                  placeholder={t('health.dialogs.medicalImage.bodyPartPlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image_date">{t('health.dialogs.medicalImage.imageDate')} *</Label>
                <Input
                  id="image_date"
                  type="date"
                  value={formData.image_date}
                  onChange={(e) => handleInputChange('image_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="findings">{t('health.dialogs.medicalImage.findings')}</Label>
                <Select value={formData.findings || t('health.dialogs.medicalImage.noFindings')} onValueChange={(value) => handleInputChange('findings', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('health.dialogs.medicalImage.selectFindings')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No Findings">{t('health.dialogs.medicalImage.noFindings')}</SelectItem>
                    <SelectItem value="Low Risk Findings">{t('health.dialogs.medicalImage.lowRiskFindings')}</SelectItem>
                    <SelectItem value="Relevant Findings">{t('health.dialogs.medicalImage.relevantFindings')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="interpretation">{t('health.dialogs.medicalImage.interpretation')}</Label>
              <Textarea
                id="interpretation"
                value={formData.interpretation}
                onChange={(e) => handleInputChange('interpretation', e.target.value)}
                placeholder={t('health.dialogs.medicalImage.interpretationPlaceholder')}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="conclusions">{t('health.dialogs.medicalImage.conclusions')}</Label>
              <Textarea
                id="conclusions"
                value={formData.conclusions}
                onChange={(e) => handleInputChange('conclusions', e.target.value)}
                placeholder={t('health.dialogs.medicalImage.conclusionsPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctor_name">{t('health.dialogs.medicalImage.doctorName')}</Label>
                <Input
                  id="doctor_name"
                  value={formData.doctor_name}
                  onChange={(e) => handleInputChange('doctor_name', e.target.value)}
                  placeholder={t('health.dialogs.medicalImage.doctorNamePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="doctor_number">{t('health.dialogs.medicalImage.doctorNumber')}</Label>
                <Input
                  id="doctor_number"
                  value={formData.doctor_number}
                  onChange={(e) => handleInputChange('doctor_number', e.target.value)}
                  placeholder={t('health.dialogs.medicalImage.doctorNumberPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              {t('health.dialogs.medicalImage.cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.image_type || !formData.image_date || saving}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('health.dialogs.medicalImage.saving')}
                </>
              ) : (
                t('health.dialogs.medicalImage.saveImage')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <DuplicateFileDialog
      open={showDuplicateDialog}
      onOpenChange={setShowDuplicateDialog}
      onCancel={handleDuplicateCancel}
      onContinue={handleDuplicateContinue}
      existingDocument={duplicateInfo?.existingDocument || null}
      fileName={duplicateInfo?.fileName || ''}
      fileSize={duplicateInfo?.fileSize || 0}
    />
    </>
  )
}
