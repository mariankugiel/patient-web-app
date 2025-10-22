"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, Calendar, FileText, Image } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"
import { MedicalImageUploadDialog } from '@/components/medical-images/medical-image-upload-dialog'
import { LabDocumentDialog } from '@/components/lab-documents/lab-document-dialog'

interface LabResult {
  id: string
  name: string
  date: string
  file: File | null
  fileName: string
  extractedData?: string
  isValid: boolean
  errors: string[]
}

interface MedicalImage {
  id: string
  category: string
  date: string
  files: File[]
  fileNames: string[]
  conclusion: string
  status: string
  extractedData?: string
  isValid: boolean
  errors: string[]
}

interface HealthRecordsData {
  labResults: LabResult[]
  images: MedicalImage[]
}

interface HealthRecordsStepProps {
  formData: { healthRecords: HealthRecordsData }
  updateFormData: (data: Partial<HealthRecordsData>) => void
  language: Language
}

export function HealthRecordsStep({ formData, updateFormData, language }: HealthRecordsStepProps) {
  const t = getTranslation(language, "steps.healthRecords")
  
  // Dialog states
  const [showLabDocumentsDialog, setShowLabDocumentsDialog] = useState(false)
  const [showMedicalImagesDialog, setShowMedicalImagesDialog] = useState(false)

  // Dialog handlers
  const handleLabDocumentCreated = () => {
    // The lab document dialog handles saving to backend
    // We can refresh the data or show a success message
    setShowLabDocumentsDialog(false)
  }

  const handleMedicalImageSaved = () => {
    // The medical image dialog handles saving to backend
    // We can refresh the data or show a success message
    setShowMedicalImagesDialog(false)
  }

  const handleDeleteLabResult = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lab result?')) {
      const updatedResults = (formData.healthRecords?.labResults || []).filter(result => result.id !== id)
      updateFormData({ labResults: updatedResults })
    }
  }

  const handleDeleteMedicalImage = (id: string) => {
    if (window.confirm('Are you sure you want to delete this medical image?')) {
      const updatedImages = (formData.healthRecords?.images || []).filter(image => image.id !== id)
      updateFormData({ images: updatedImages })
    }
  }

  // Add new entries
  const addLabResult = () => {
    setShowLabDocumentsDialog(true)
  }

  const addImage = () => {
    setShowMedicalImagesDialog(true)
  }

  return (
    <div className="space-y-8">
      {/* Lab Results Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lab Results
            </CardTitle>
            <Button onClick={addLabResult} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lab Result
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Upload your lab results using the dialog</p>
            <p className="text-sm">Lab results will be analyzed and saved to your health records</p>
          </div>
        </CardContent>
      </Card>

      {/* Medical Images Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5" />
              Medical Images
            </CardTitle>
            <Button onClick={addImage} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Medical Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Upload your medical images using the dialog</p>
            <p className="text-sm">Medical images will be saved to your health records</p>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LabDocumentDialog
        open={showLabDocumentsDialog}
        onOpenChange={setShowLabDocumentsDialog}
        mode="upload"
        onDocumentCreated={handleLabDocumentCreated}
      />

      <MedicalImageUploadDialog
        open={showMedicalImagesDialog}
        onOpenChange={setShowMedicalImagesDialog}
        onImageSaved={handleMedicalImageSaved}
      />
    </div>
  )
}