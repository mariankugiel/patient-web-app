"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileImage, Plus } from "lucide-react"
import { useAIAnalysis } from "@/hooks/use-ai-analysis"
import { MedicalImageUploadDialog } from "@/components/medical-images/medical-image-upload-dialog"
import { MedicalImageList } from "@/components/medical-images/medical-image-list"
import { AIAnalysisSection } from "@/components/health-records/ai-analysis-section"
import { useLanguage } from "@/contexts/language-context"

export default function ExamsPage() {
  const { t } = useLanguage()
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // AI Analysis for medical images (type ID 5)
  const { 
    analysis: aiAnalysis, 
    loading: aiLoading, 
    error: aiError, 
    generateAnalysis,
    checkForUpdates
  } = useAIAnalysis(5)

  // Auto-load AI analysis when component mounts
  useEffect(() => {
    generateAnalysis(false)
  }, [generateAnalysis])

  const handleImageSaved = () => {
    generateAnalysis(false)
    setRefreshTrigger(prev => prev + 1) // Trigger refresh of image list
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      <AIAnalysisSection
        title={t("health.aiMedicalExamsAnalysis")}
        analysis={aiAnalysis}
        loading={aiLoading}
        error={aiError}
        onCheckForUpdates={checkForUpdates}
      />

      {/* Medical Exams Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileImage className="h-6 w-6" />
          {t("health.medicalExams")}
        </h2>
        <Button 
          onClick={() => setUploadDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("health.uploadExam")}
        </Button>
      </div>

      {/* Medical Exams List */}
      <MedicalImageList onImageUploaded={handleImageSaved} refreshTrigger={refreshTrigger} />

      {/* Upload Dialog */}
      <MedicalImageUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onImageSaved={handleImageSaved}
      />
    </div>
  )
}