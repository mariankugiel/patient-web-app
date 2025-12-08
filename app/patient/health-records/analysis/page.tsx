'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Calendar,
  FileText,
  Plus,
  Download,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useAnalysisDashboard } from "@/hooks/use-health-records"
import { useAIAnalysis } from "@/hooks/use-ai-analysis"
import {
  HealthRecordSection,
} from "@/lib/api/health-records-api"
import { AnalysisOverviewSection } from "@/components/health-records/analysis-overview-section"
import { AIAnalysisSection } from "@/components/health-records/ai-analysis-section"
import { LabDocumentDialog } from "@/components/lab-documents/lab-document-dialog"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { toast } from "react-toastify"
import { medicalDocumentsApiService, MedicalDocument } from "@/lib/api/medical-documents-api"
import { useSwitchedPatient } from "@/contexts/patient-context"

export default function AnalysisPage() {
  const { t } = useLanguage()
  const { patientId, patientToken, isViewingOtherPatient, switchedPatientInfo } = useSwitchedPatient()

  const switchedPermissions = switchedPatientInfo?.permissions
  const canViewLabDocuments =
    !isViewingOtherPatient || Boolean(switchedPermissions?.can_view_health_records)
  const canDownloadLabDocuments =
    !isViewingOtherPatient || Boolean(switchedPermissions?.health_records_download)
  const canManageLabDocuments = !isViewingOtherPatient
  const canDownload = !isViewingOtherPatient || Boolean(switchedPatientInfo?.permissions?.can_view_health_records && switchedPatientInfo?.permissions?.can_view_health_records && switchedPatientInfo?.permissions?.can_view_health_records && switchedPatientInfo?.permissions?.can_view_health_records) // placeholder line to ensure variable declared
  
  console.log('🔍 [Analysis Page] patientId from context:', patientId, 'isViewingOtherPatient:', isViewingOtherPatient)
  
  const { sections, loading, createSection, updateSection, createMetric, updateMetric, createRecord, refresh } = useAnalysisDashboard(1, patientId)
  
  const { analysis: aiAnalysis, loading: aiLoading, generateAnalysis, checkForUpdates, error: aiError } = useAIAnalysis(1, patientId)

  // Track if we've already attempted to load AI analysis
  const aiAnalysisAttempted = useRef(false)

  // Dialog states
  const [labUploadOpen, setLabUploadOpen] = useState(false)

  // Medical documents state
  const [medicalDocuments, setMedicalDocuments] = useState<MedicalDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [allDocumentsOpen, setAllDocumentsOpen] = useState(false)
  const [allDocuments, setAllDocuments] = useState<MedicalDocument[]>([])
  const [allDocumentsLoading, setAllDocumentsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<MedicalDocument | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [documentToEdit, setDocumentToEdit] = useState<MedicalDocument | null>(null)

  // Function to trigger AI analysis
  const handleGenerateAIAnalysis = useCallback(async (forceCheck: boolean = false) => {
    try {
      await generateAnalysis(forceCheck) // Type ID is now built into the hook
    } catch (error) {
      console.error('Failed to generate AI analysis:', error)
    }
  }, [generateAnalysis])

  // Auto-load AI analysis when page loads or patientId changes
  useEffect(() => {
    // Reset the attempted flag when patientId changes
    aiAnalysisAttempted.current = false
  }, [patientId])

  useEffect(() => {
    if (!loading && !aiAnalysisAttempted.current) {
      aiAnalysisAttempted.current = true
      handleGenerateAIAnalysis(false) // Follow 5-day rule
    }
  }, [loading, handleGenerateAIAnalysis, patientId]) // Add patientId to dependencies


  // Fetch medical documents
  const fetchMedicalDocuments = async () => {
    if (!canViewLabDocuments) {
      setMedicalDocuments([])
      setDocumentsLoading(false)
      return
    }
    try {
      setDocumentsLoading(true)
      const documents = await medicalDocumentsApiService.getMedicalDocuments(
        0,
        2,
        'lab_result',
        patientId || undefined,
        patientToken || undefined
      )
      setMedicalDocuments(documents)
    } catch (error) {
      console.error('Failed to fetch medical documents:', error)
      toast.error('Failed to load medical documents')
    } finally {
      setDocumentsLoading(false)
    }
  }

  const fetchAllDocuments = async (page: number = 0) => {
    if (!canViewLabDocuments) {
      setAllDocuments([])
      setAllDocumentsLoading(false)
      return
    }
    try {
      setAllDocumentsLoading(true)
      const documents = await medicalDocumentsApiService.getMedicalDocuments(
        page * 10,
        10,
        'lab_result',
        patientId || undefined,
        patientToken || undefined
      )
      setAllDocuments(documents)
      setCurrentPage(page)
      // Note: We'll need to update the backend to return total count
      setTotalDocuments(documents.length) // Temporary - should be total count from backend
    } catch (error) {
      console.error('Failed to fetch all documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setAllDocumentsLoading(false)
    }
  }

  const handleSeeAllDocuments = () => {
    if (!canViewLabDocuments) {
      toast.error('You do not have permission to view these documents.')
      return
    }
    setAllDocumentsOpen(true)
    fetchAllDocuments(0)
  }

  // Load medical documents on component mount and when patientId changes
  useEffect(() => {
    if (isViewingOtherPatient && !switchedPatientInfo) {
      return
    }
    fetchMedicalDocuments()
  }, [
    patientId,
    patientToken,
    isViewingOtherPatient,
    switchedPatientInfo,
    canViewLabDocuments,
  ]) // Refresh when patient context changes

  // Handle document download
  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    if (!canDownloadLabDocuments) {
      toast.error('You do not have permission to download this document.')
      return
    }
    try {
      const response = await medicalDocumentsApiService.downloadMedicalDocument(
        documentId,
        patientId || undefined,
        patientToken || undefined
      )
      const downloadUrl = response.download_url

      if (!downloadUrl) {
        throw new Error('No download URL received')
      }


      // Try direct download first (simpler approach)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Document download started')
    } catch (error) {
      console.error('Failed to download document:', error)
      toast.error(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEditDocument = (document: MedicalDocument) => {
    if (!canManageLabDocuments) return
    setDocumentToEdit(document)
    setEditDialogOpen(true)
  }

  const handleDeleteDocument = (document: MedicalDocument) => {
    if (!canManageLabDocuments) return
    setDocumentToDelete(document)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return

    try {
      await medicalDocumentsApiService.deleteMedicalDocument(documentToDelete.id)
      toast.success('Document deleted successfully')
      
      // Refresh the documents list
      fetchMedicalDocuments()
      fetchAllDocuments(currentPage)
      
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleDocumentUpdated = (updatedDocument: MedicalDocument) => {
    // Update the document in the local state
    setMedicalDocuments(prev => 
      prev.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
    )
    setEditDialogOpen(false)
    setDocumentToEdit(null)
  }

  // Remove main loading state to prevent white page - let individual components handle loading

  return (
    <div className="space-y-6">
      {/* AI Summary and Lab Document Management in one row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Summary Card */}
        <div className="md:col-span-2">
          <AIAnalysisSection
            title={t("health.aiHealthAnalysis")}
            analysis={aiAnalysis}
            loading={aiLoading}
            error={aiError}
            onCheckForUpdates={checkForUpdates}
          />
        </div>

        {/* Lab Document Management Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
            <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t("health.labDocuments")}
                  </CardTitle>
                  <CardDescription>
                    {t("health.recentTestResults")}
                  </CardDescription>
            </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => canManageLabDocuments && setLabUploadOpen(true)}
                  className="flex items-center gap-1"
                  disabled={!canManageLabDocuments}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
                </div>
          </CardHeader>
          <CardContent>
              <div className="space-y-3">
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : !canViewLabDocuments ? (
                  <div className="text-center py-4 text-sm text-gray-600">
                    {t('health.noPermissionViewLabDocuments')}
                  </div>
                ) : medicalDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {medicalDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-start justify-between p-3 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-semibold text-gray-900 leading-tight flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            {doc.lab_test_date ? new Date(doc.lab_test_date).toLocaleDateString() : t('health.noDate')}
                            <span className="text-gray-600 font-normal"> • {doc.provider || t('health.noProvider')}</span>
                          </p>
                          {doc.lab_doc_type && (
                            <p className="text-xs text-gray-700 mt-1 font-medium">{doc.lab_doc_type}</p>
                          )}
                          {doc.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDocument(doc)}
                            className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                            disabled={!canManageLabDocuments}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDocument(doc)}
                            className="h-8 w-8 p-0 hover:bg-red-100 text-red-600 hover:text-red-700 flex-shrink-0"
                            disabled={!canManageLabDocuments}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadDocument(doc.id, doc.file_name)}
                            className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                            disabled={!canDownloadLabDocuments}
                            title={
                              canDownloadLabDocuments
                                ? t('health.downloadDocument')
                                : t('health.downloadPermissionNotGranted')
                            }
                          >
                            <Download className="h-3 w-3" />
                      </Button>
                        </div>
                    </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">{t('health.noLabDocumentsYet')}</p>
                </div>
                )}

                {medicalDocuments.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleSeeAllDocuments}
                    disabled={!canViewLabDocuments}
                  >
                    {t('health.seeAllDocuments')}
              </Button>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Analysis Overview Section */}
      <AnalysisOverviewSection
        title={t("health.analysisOverview")}
        description={t("health.analysisDescription")}
        sections={sections}
        loading={loading}
        createSection={createSection}
        updateSection={updateSection}
        createMetric={createMetric}
        updateMetric={updateMetric}
        createRecord={createRecord}
        refresh={refresh}
        onDataUpdated={handleGenerateAIAnalysis}
        healthRecordTypeId={1}
        patientId={patientId}
        isViewingOtherPatient={isViewingOtherPatient}
      />

      {/* All Documents Dialog */}
      <Dialog open={allDocumentsOpen} onOpenChange={setAllDocumentsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
            <DialogTitle>{t('health.allLabDocuments')}</DialogTitle>
            <DialogDescription>
              {t('health.viewDownloadAllLabDocuments')}
            </DialogDescription>
            </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {allDocumentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">{t('health.loadingDocuments')}</span>
              </div>
            ) : allDocuments.length > 0 ? (
              <div className="space-y-3">
                {allDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-start justify-between p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-semibold text-gray-900 leading-tight flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        {doc.lab_test_date ? new Date(doc.lab_test_date).toLocaleDateString() : 'No date'}
                        <span className="text-gray-600 font-normal"> • {doc.provider || 'No Provider'}</span>
                      </p>
                      {doc.lab_doc_type && (
                        <p className="text-sm text-gray-700 mt-1 font-medium">{doc.lab_doc_type}</p>
                      )}
                      {doc.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{doc.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc.id, doc.file_name)}
                  className="ml-2 h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                  disabled={!canDownloadLabDocuments}
                  title={
                    canDownloadLabDocuments
                      ? 'Download document'
                      : 'Download permission not granted'
                  }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No documents found</p>
            </div>
            )}
      </div>

          {/* Pagination */}
          {allDocuments.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                onClick={() => fetchAllDocuments(currentPage - 1)}
                disabled={currentPage === 0 || allDocumentsLoading}
              >
                Previous
                </Button>
              <span className="text-sm text-gray-500">
                Page {currentPage + 1} • {totalDocuments} total documents
              </span>
                  <Button
                    variant="outline"
                size="sm"
                onClick={() => fetchAllDocuments(currentPage + 1)}
                disabled={allDocuments.length < 10 || allDocumentsLoading}
              >
                Next
                  </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lab Document Dialog (Upload/Edit) */}
      <LabDocumentDialog
        open={labUploadOpen}
        onOpenChange={setLabUploadOpen}
        mode="upload"
        onDocumentCreated={(document) => {
          console.log('Lab document created:', document)
          toast.success('Lab document uploaded successfully!')
          // Refresh the dashboard to show new data
          refresh()
          // Refresh the lab documents list
          fetchMedicalDocuments()
        }}
        onAnalysisComplete={(results) => {
          console.log('Lab analysis completed:', results)
          toast.success('Lab document uploaded and analyzed successfully!')
          // Refresh the dashboard to show new data
          refresh()
          // Refresh the lab documents list
          fetchMedicalDocuments()
        }}
      />

      <LabDocumentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        mode="edit"
        document={documentToEdit}
        onDocumentUpdated={handleDocumentUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteDocument}
        title="Delete Lab Document"
        description="Are you sure you want to delete this lab document? This action cannot be undone."
        itemName={documentToDelete?.file_name}
      />
    </div>
  )
}