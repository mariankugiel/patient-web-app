'use client'

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
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useAnalysisDashboard } from "@/hooks/use-health-records"
import { AnalysisOverviewSection } from "@/components/health-records/analysis-overview-section"
import { useAIAnalysis } from "@/hooks/use-ai-analysis"
import { AIAnalysisSection } from "@/components/health-records/ai-analysis-section"
import {
  HealthRecordSection,
} from "@/lib/api/health-records-api"
import { LabDocumentUpload } from "@/components/lab-document-upload"
import { toast } from "react-toastify"
import { medicalDocumentsApiService, MedicalDocument } from "@/lib/api/medical-documents-api"

export default function AnalysisPage() {
  const { t } = useLanguage()
  const { sections, loading, createSection, updateSection, createMetric, updateMetric, createRecord, refresh } = useAnalysisDashboard()
  
  const { analysis: aiAnalysis, loading: aiLoading, generateAnalysis, checkForUpdates, error: aiError } = useAIAnalysis()

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

  // Function to trigger AI analysis
  const handleGenerateAIAnalysis = useCallback(async (forceCheck: boolean = false) => {
    try {
      await generateAnalysis(forceCheck) // Type ID is now built into the hook
    } catch (error) {
      console.error('Failed to generate AI analysis:', error)
    }
  }, [generateAnalysis])

  // Auto-load AI analysis when page loads
  useEffect(() => {
    if (!loading && !aiAnalysisAttempted.current) {
      aiAnalysisAttempted.current = true
      handleGenerateAIAnalysis(false) // Follow 5-day rule
    }
  }, [loading, handleGenerateAIAnalysis])


  // Fetch medical documents
  const fetchMedicalDocuments = async () => {
    try {
      setDocumentsLoading(true)
      const documents = await medicalDocumentsApiService.getMedicalDocuments(0, 2, 'lab_result')
      setMedicalDocuments(documents)
    } catch (error) {
      console.error('Failed to fetch medical documents:', error)
      toast.error('Failed to load medical documents')
    } finally {
      setDocumentsLoading(false)
    }
  }

  const fetchAllDocuments = async (page: number = 0) => {
    try {
      setAllDocumentsLoading(true)
      const documents = await medicalDocumentsApiService.getMedicalDocuments(page * 10, 10, 'lab_result')
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
    setAllDocumentsOpen(true)
    fetchAllDocuments(0)
  }

  // Load medical documents on component mount
  useEffect(() => {
    fetchMedicalDocuments()
  }, [])

  // Handle document download
  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    try {
      const response = await medicalDocumentsApiService.downloadMedicalDocument(documentId)
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

  // Remove main loading state to prevent white page - let individual components handle loading

  return (
    <div className="space-y-6">
      {/* AI Summary and Lab Document Management in one row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Summary Card */}
        <div className="md:col-span-2">
          <AIAnalysisSection
            title="AI Health Analysis"
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
                    Lab Documents
                  </CardTitle>
                  <CardDescription>
                    Recent test results
                  </CardDescription>
            </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLabUploadOpen(true)}
                  className="flex items-center gap-1"
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
                ) : medicalDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {medicalDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-start justify-between p-3 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-semibold text-gray-900 leading-tight flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            {doc.lab_test_date ? new Date(doc.lab_test_date).toLocaleDateString() : 'No date'}
                            {doc.provider && (
                              <span className="text-gray-600 font-normal"> • {doc.provider}</span>
                            )}
                          </p>
                          {doc.lab_test_name && (
                            <p className="text-xs text-gray-700 mt-1 font-medium">{doc.lab_test_name}</p>
                          )}
                          {doc.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.description}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadDocument(doc.id, doc.file_name)}
                          className="ml-2 h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
                        >
                          <Download className="h-3 w-3" />
                      </Button>
                    </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No lab documents yet</p>
                </div>
                )}

                {medicalDocuments.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleSeeAllDocuments}
                  >
                    See All Documents
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
      />

      {/* All Documents Dialog */}
      <Dialog open={allDocumentsOpen} onOpenChange={setAllDocumentsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
            <DialogTitle>All Lab Documents</DialogTitle>
            <DialogDescription>
              View and download all your lab documents
            </DialogDescription>
            </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {allDocumentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading documents...</span>
              </div>
            ) : allDocuments.length > 0 ? (
              <div className="space-y-3">
                {allDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-start justify-between p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-semibold text-gray-900 leading-tight flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        {doc.lab_test_date ? new Date(doc.lab_test_date).toLocaleDateString() : 'No date'}
                        {doc.provider && (
                          <span className="text-gray-600 font-normal"> • {doc.provider}</span>
                        )}
                      </p>
                      {doc.lab_test_name && (
                        <p className="text-sm text-gray-700 mt-1 font-medium">{doc.lab_test_name}</p>
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

      {/* Lab Document Upload Dialog */}
      <LabDocumentUpload
        open={labUploadOpen}
        onOpenChange={setLabUploadOpen}
        onAnalysisComplete={(results) => {
          console.log('Lab analysis completed:', results)
          toast.success('Lab document uploaded and analyzed successfully!')
          // Refresh the dashboard to show new data
          refresh()
        }}
      />
    </div>
  )
}