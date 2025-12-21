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
import { useLanguage } from '@/contexts/language-context'

interface HealthRecordsStepProps {
  formData: { healthRecords: any }
  updateFormData: (data: any) => void
}

export function HealthRecordsStep({ formData, updateFormData }: HealthRecordsStepProps) {
  const { t } = useLanguage()
  
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
      setLabDocumentsError(error.message || t('onboarding.healthRecords.failedToLoadLabDocuments'))
      toast.error(t('onboarding.healthRecords.failedToLoadLabDocuments'))
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
      setMedicalImagesError(error.message || t('onboarding.healthRecords.failedToLoadMedicalImages'))
      toast.error(t('onboarding.healthRecords.failedToLoadMedicalImages'))
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
      toast.success(t('onboarding.healthRecords.labDocumentUploadedSuccess'))
    }
  }

  const handleLabDocumentUpdated = (document: MedicalDocument) => {
    // Refresh the lab documents list
    fetchLabDocuments()
    setShowEditLabDocumentDialog(false)
    setSelectedLabDocument(null)
    toast.success(t('onboarding.healthRecords.labDocumentUpdatedSuccess'))
  }

  const handleEditLabDocument = (document: MedicalDocument) => {
    setSelectedLabDocument(document)
    setShowEditLabDocumentDialog(true)
  }

  const handleMedicalImageSaved = () => {
    // Refresh the medical images list
    fetchMedicalImages()
    setShowMedicalImagesDialog(false)
    toast.success(t('onboarding.healthRecords.medicalImageUploadedSuccess'))
  }

  const handleMedicalImageUpdated = (image: MedicalImageData) => {
    // Refresh the medical images list
    fetchMedicalImages()
    setShowEditMedicalImageDialog(false)
    setSelectedMedicalImage(null)
    toast.success(t('onboarding.healthRecords.medicalImageUpdatedSuccess'))
  }

  const handleMedicalImageDeleted = (imageId: number) => {
    // Refresh the medical images list
    fetchMedicalImages()
    setShowEditMedicalImageDialog(false)
    setSelectedMedicalImage(null)
    toast.success(t('onboarding.healthRecords.medicalImageDeletedSuccess'))
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
      toast.success(t('onboarding.healthRecords.openingDocument'))
    } catch (error) {
      console.error('Failed to download document:', error)
      toast.error(t('onboarding.healthRecords.failedToDownloadDocument'))
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('onboarding.healthRecords.noDate')
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
              {t('onboarding.healthRecords.labResults')}
            </CardTitle>
              <CardDescription>
                {t('onboarding.healthRecords.labResultsDesc')}
              </CardDescription>
            </div>
            <Button onClick={() => setShowLabDocumentsDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('onboarding.healthRecords.addLabResult')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {labDocumentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t('onboarding.healthRecords.loadingLabDocuments')}</span>
            </div>
          ) : labDocumentsError ? (
            <div className="text-center py-8 text-red-600">
              <p>{t('onboarding.healthRecords.errorLoadingLabDocuments')} {labDocumentsError}</p>
              <Button 
                onClick={fetchLabDocuments} 
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                {t('onboarding.healthRecords.retry')}
              </Button>
            </div>
          ) : labDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{t('onboarding.healthRecords.noLabResults')}</p>
              <p className="text-sm mt-2">{t('onboarding.healthRecords.noLabResultsDesc')}</p>
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
                      title={t('onboarding.healthRecords.download')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditLabDocument(doc)}
                      className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                      title={t('onboarding.healthRecords.edit')}
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
              {t('onboarding.healthRecords.medicalImages')}
            </CardTitle>
              <CardDescription>
                {t('onboarding.healthRecords.medicalImagesDesc')}
              </CardDescription>
            </div>
            <Button onClick={() => setShowMedicalImagesDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('onboarding.healthRecords.addMedicalImage')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {medicalImagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t('onboarding.healthRecords.loadingMedicalImages')}</span>
            </div>
          ) : medicalImagesError ? (
            <div className="text-center py-8 text-red-600">
              <p>{t('onboarding.healthRecords.errorLoadingMedicalImages')} {medicalImagesError}</p>
              <Button 
                onClick={fetchMedicalImages} 
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                {t('onboarding.healthRecords.retry')}
              </Button>
            </div>
          ) : medicalImages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{t('onboarding.healthRecords.noMedicalImages')}</p>
              <p className="text-sm mt-2">{t('onboarding.healthRecords.noMedicalImagesDesc')}</p>
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
                          toast.success(t('onboarding.healthRecords.openingImage'))
                        } catch (error) {
                          console.error('Failed to view image:', error)
                          toast.error(t('onboarding.healthRecords.failedToOpenImage'))
                        }
                      }}
                      className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                      title={t('onboarding.healthRecords.view')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditMedicalImage(image)}
                      className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                      title={t('onboarding.healthRecords.edit')}
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
