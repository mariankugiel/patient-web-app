"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, Calendar, FileText, Image, Loader2 } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"
import { MedicalImageUploadDialog } from '@/components/medical-images/medical-image-upload-dialog'
import { LabDocumentDialog } from '@/components/lab-documents/lab-document-dialog'
import { medicalDocumentsApiService } from '@/lib/api/medical-documents-api'
import { medicalImagesApiService } from '@/lib/api/medical-images-api'

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
  
  // Edit states
  const [editingLabDocument, setEditingLabDocument] = useState<any>(null)
  
  // Data states
  const [labDocuments, setLabDocuments] = useState<any[]>([])
  const [medicalImages, setMedicalImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load lab documents
        const labDocs = await medicalDocumentsApiService.getMedicalDocuments()
        setLabDocuments(labDocs)
        
        // Load medical images
        const medImagesResponse = await medicalImagesApiService.getMedicalImages()
        setMedicalImages(medImagesResponse.images)
        
      } catch (error) {
        console.error('Failed to load health records data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Refresh data function
  const refreshData = async () => {
    try {
      // Load lab documents
      const labDocs = await medicalDocumentsApiService.getMedicalDocuments()
      setLabDocuments(labDocs)
      
      // Load medical images
      const medImagesResponse = await medicalImagesApiService.getMedicalImages()
      setMedicalImages(medImagesResponse.images)
    } catch (error) {
      console.error('Failed to refresh health records data:', error)
    }
  }

  // Dialog handlers
  const handleLabDocumentCreated = async () => {
    setShowLabDocumentsDialog(false)
    setEditingLabDocument(null)
    await refreshData() // Refresh data after creation
  }

  const handleMedicalImageSaved = async () => {
    setShowMedicalImagesDialog(false)
    await refreshData() // Refresh data after creation
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
    setEditingLabDocument(null)
    setShowLabDocumentsDialog(true)
  }

  const addImage = () => {
    setShowMedicalImagesDialog(true)
  }

  // Edit handlers
  const handleEditLabDocument = (doc: any) => {
    setEditingLabDocument(doc)
    setShowLabDocumentsDialog(true)
  }

  const handleEditMedicalImage = (image: any) => {
    // Note: MedicalImageUploadDialog doesn't support edit mode yet
    // For now, show a message that edit is not available
    console.log('Edit medical image requested:', image)
    alert('Edit functionality for medical images is not yet implemented. Please delete and re-upload if you need to make changes.')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading health records...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Lab Results Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lab Results ({labDocuments.length})
            </CardTitle>
            <Button onClick={addLabResult} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lab Result
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {labDocuments.length > 0 ? (
            <div className="space-y-3">
              {labDocuments.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{doc.document_name || doc.name || 'Lab Document'}</h4>
                      <p className="text-sm text-gray-600">
                        Uploaded: {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                      {doc.document_type && (
                        <Badge variant="outline" className="mt-1">
                          {doc.document_type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditLabDocument(doc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteLabResult(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No lab results uploaded yet</p>
              <p className="text-sm">Click "Add Lab Result" to upload your first lab document</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Images Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5" />
              Medical Images ({medicalImages.length})
            </CardTitle>
            <Button onClick={addImage} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Medical Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {medicalImages.length > 0 ? (
            <div className="space-y-3">
              {medicalImages.map((image) => (
                <div key={image.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{image.image_name || image.name || 'Medical Image'}</h4>
                      <p className="text-sm text-gray-600">
                        Uploaded: {image.created_at ? new Date(image.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                      {image.image_type && (
                        <Badge variant="outline" className="mt-1">
                          {image.image_type}
                        </Badge>
                      )}
                      {image.conclusion && (
                        <p className="text-sm text-gray-600 mt-1">
                          Conclusion: {image.conclusion}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditMedicalImage(image)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteMedicalImage(image.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No medical images uploaded yet</p>
              <p className="text-sm">Click "Add Medical Image" to upload your first medical image</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LabDocumentDialog
        open={showLabDocumentsDialog}
        onOpenChange={setShowLabDocumentsDialog}
        mode={editingLabDocument ? "edit" : "upload"}
        document={editingLabDocument}
        onDocumentCreated={handleLabDocumentCreated}
        onDocumentUpdated={handleLabDocumentCreated}
      />

      <MedicalImageUploadDialog
        open={showMedicalImagesDialog}
        onOpenChange={setShowMedicalImagesDialog}
        onImageSaved={handleMedicalImageSaved}
      />
    </div>
  )
}