"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, Calendar, FileText, Image, Loader2, Download } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"
import { MedicalImageUploadDialog } from '@/components/medical-images/medical-image-upload-dialog'
import { EditExamDialog } from '@/components/medical-images/edit-exam-dialog'
import { LabDocumentDialog } from '@/components/lab-documents/lab-document-dialog'
import { medicalDocumentsApiService, MedicalDocument } from '@/lib/api/medical-documents-api'
import { medicalImagesApiService, MedicalImageData } from '@/lib/api/medical-images-api'
import { toast } from 'react-toastify'

interface HealthRecordsStepProps {
  formData: { healthRecords: any }
  updateFormData: (data: any) => void
  language: Language
}

export function HealthRecordsStep({ formData, updateFormData, language }: HealthRecordsStepProps) {
  const t = getTranslation(language, "steps.healthRecords")
  
  // Dialog states
  const [showLabDocumentsDialog, setShowLabDocumentsDialog] = useState(false)
  const [showMedicalImagesDialog, setShowMedicalImagesDialog] = useState(false)
  const [showEditLabDocumentDialog, setShowEditLabDocumentDialog] = useState(false)
  const [showEditMedicalImageDialog, setShowEditMedicalImageDialog] = useState(false)
  const [selectedLabDocument, setSelectedLabDocument] = useState<MedicalDocument | null>(null)
  const [selectedMedicalImage, setSelectedMedicalImage] = useState<MedicalImageData | null>(null)

  // Data states
  const [labDocuments, setLabDocuments] = useState<MedicalDocument[]>([])
  const [medicalImages, setMedicalImages] = useState<MedicalImageData[]>([])
  const [labDocumentsLoading, setLabDocumentsLoading] = useState(true)
  const [medicalImagesLoading, setMedicalImagesLoading] = useState(true)
  const [labDocumentsError, setLabDocumentsError] = useState<string | null>(null)
  const [medicalImagesError, setMedicalImagesError] = useState<string | null>(null)

  // Fetch lab documents
  const fetchLabDocuments = async () => {
    try {
      setLabDocumentsLoading(true)
      setLabDocumentsError(null)
      const documents = await medicalDocumentsApiService.getMedicalDocuments(0, 100, 'lab_result')
      setLabDocuments(documents)
    } catch (error: any) {
      console.error('Failed to fetch lab documents:', error)
      setLabDocumentsError(error.message || 'Failed to load lab documents')
      toast.error('Failed to load lab documents')
    } finally {
      setLabDocumentsLoading(false)
    }
  }

  // Fetch medical images
  const fetchMedicalImages = async () => {
    try {
      setMedicalImagesLoading(true)
      setMedicalImagesError(null)
      const response = await medicalImagesApiService.getMedicalImages(0, 100)
      setMedicalImages(response.images || [])
    } catch (error: any) {
      console.error('Failed to fetch medical images:', error)
      setMedicalImagesError(error.message || 'Failed to load medical images')
      toast.error('Failed to load medical images')
    } finally {
      setMedicalImagesLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchLabDocuments()
    fetchMedicalImages()
  }, [])

  // Dialog handlers
  const handleLabDocumentCreated = (document?: MedicalDocument) => {
    // Refresh the lab documents list
    fetchLabDocuments()
    setShowLabDocumentsDialog(false)
    if (document) {
      toast.success('Lab document uploaded successfully!')
    }
  }

  const handleLabDocumentUpdated = (document: MedicalDocument) => {
    // Refresh the lab documents list
    fetchLabDocuments()
    setShowEditLabDocumentDialog(false)
    setSelectedLabDocument(null)
    toast.success('Lab document updated successfully!')
  }

  const handleEditLabDocument = (document: MedicalDocument) => {
    setSelectedLabDocument(document)
    setShowEditLabDocumentDialog(true)
  }

  const handleMedicalImageSaved = () => {
    // Refresh the medical images list
    fetchMedicalImages()
    setShowMedicalImagesDialog(false)
    toast.success('Medical image uploaded successfully!')
  }

  const handleMedicalImageUpdated = (image: MedicalImageData) => {
    // Refresh the medical images list
    fetchMedicalImages()
    setShowEditMedicalImageDialog(false)
    setSelectedMedicalImage(null)
    toast.success('Medical image updated successfully!')
  }

  const handleMedicalImageDeleted = (imageId: number) => {
    // Refresh the medical images list
    fetchMedicalImages()
    setShowEditMedicalImageDialog(false)
    setSelectedMedicalImage(null)
    toast.success('Medical image deleted successfully!')
  }

  const handleEditMedicalImage = (image: MedicalImageData) => {
    setSelectedMedicalImage(image)
    setShowEditMedicalImageDialog(true)
  }

  const handleDownloadLabDocument = async (documentId: number, fileName: string) => {
    try {
      // Get download URL from backend
      const response = await medicalDocumentsApiService.downloadMedicalDocument(documentId)
      window.open(response.download_url, '_blank')
      toast.success('Opening document...')
    } catch (error) {
      console.error('Failed to download document:', error)
      toast.error('Failed to download document')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-8">
      {/* Lab Results Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lab Results
            </CardTitle>
              <CardDescription>
                Upload and manage your lab test results
              </CardDescription>
            </div>
            <Button onClick={() => setShowLabDocumentsDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lab Result
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {labDocumentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading lab documents...</span>
            </div>
          ) : labDocumentsError ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading lab documents: {labDocumentsError}</p>
              <Button 
                onClick={fetchLabDocuments} 
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : labDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No lab results uploaded yet.</p>
              <p className="text-sm mt-2">Click "Add Lab Result" to upload your first lab document.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {labDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-start justify-between p-4 border rounded-lg bg-white hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleEditLabDocument(doc)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(doc.lab_test_date)}
                      </p>
                      {doc.provider && (
                        <span className="text-sm text-gray-600">• {doc.provider}</span>
                      )}
                    </div>
                    {doc.lab_doc_type && (
                      <p className="text-sm font-medium text-gray-700 mb-1">{doc.lab_doc_type}</p>
                    )}
                    {doc.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{doc.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{doc.file_name}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownloadLabDocument(doc.id, doc.file_name)}
                      className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditLabDocument(doc)}
                      className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Images Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5" />
              Medical Images
            </CardTitle>
              <CardDescription>
                Upload and manage your medical imaging results
              </CardDescription>
            </div>
            <Button onClick={() => setShowMedicalImagesDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Medical Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {medicalImagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading medical images...</span>
            </div>
          ) : medicalImagesError ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading medical images: {medicalImagesError}</p>
              <Button 
                onClick={fetchMedicalImages} 
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : medicalImages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No medical images uploaded yet.</p>
              <p className="text-sm mt-2">Click "Add Medical Image" to upload your first medical image.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medicalImages.map((image) => (
                <div 
                  key={image.id} 
                  className="flex items-start justify-between p-4 border rounded-lg bg-white hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleEditMedicalImage(image)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(image.image_date)}
                      </p>
                      {image.image_type && (
                        <Badge variant="secondary" className="ml-2">
                          {image.image_type}
                        </Badge>
                      )}
                    </div>
                    {image.body_part && (
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {image.body_part}
                      </p>
                    )}
                    {image.conclusions && (
                      <p className="text-xs text-gray-500 line-clamp-2">{image.conclusions}</p>
                    )}
                    {image.original_filename && (
                      <p className="text-xs text-gray-400 mt-1">{image.original_filename}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          const response = await medicalImagesApiService.getMedicalImageViewUrl(image.id)
                          window.open(response.download_url, '_blank')
                          toast.success('Opening image...')
                        } catch (error) {
                          console.error('Failed to view image:', error)
                          toast.error('Failed to open image')
                        }
                      }}
                      className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                      title="View"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditMedicalImage(image)}
                      className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LabDocumentDialog
        open={showLabDocumentsDialog}
        onOpenChange={setShowLabDocumentsDialog}
        mode="upload"
        onDocumentCreated={handleLabDocumentCreated}
        onAnalysisComplete={(results) => {
          // Refresh list when analysis is complete
          fetchLabDocuments()
        }}
      />

      <LabDocumentDialog
        open={showEditLabDocumentDialog}
        onOpenChange={(open) => {
          setShowEditLabDocumentDialog(open)
          if (!open) setSelectedLabDocument(null)
        }}
        mode="edit"
        document={selectedLabDocument}
        onDocumentUpdated={handleLabDocumentUpdated}
      />

      <MedicalImageUploadDialog
        open={showMedicalImagesDialog}
        onOpenChange={setShowMedicalImagesDialog}
        onImageSaved={handleMedicalImageSaved}
      />

      <EditExamDialog
        open={showEditMedicalImageDialog}
        onOpenChange={(open) => {
          setShowEditMedicalImageDialog(open)
          if (!open) setSelectedMedicalImage(null)
        }}
        exam={selectedMedicalImage}
        onExamUpdated={handleMedicalImageUpdated}
        onExamDeleted={handleMedicalImageDeleted}
      />
    </div>
  )
}
