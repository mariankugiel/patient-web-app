"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileImage, Plus } from "lucide-react"
import { useAIAnalysis } from "@/hooks/use-ai-analysis"
import { MedicalImageUploadDialog } from "@/components/medical-images/medical-image-upload-dialog"
import { MedicalImageList } from "@/components/medical-images/medical-image-list"
import { AIAnalysisSection } from "@/components/health-records/ai-analysis-section"

export default function ExamsPage() {
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
    setRefreshTrigger(prev => prev + 1)
    // Optionally regenerate AI analysis after new image is added
    generateAnalysis(false)
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      <AIAnalysisSection
        title="AI Medical Exams Analysis"
        analysis={aiAnalysis}
        loading={aiLoading}
        error={aiError}
        onCheckForUpdates={checkForUpdates}
      />

      {/* Medical Exams Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileImage className="h-6 w-6" />
          Medical Exams
        </h2>
        <Button 
          onClick={() => setUploadDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Exam
        </Button>
      </div>

      {/* Medical Exams List */}
      <MedicalImageList onImageUploaded={handleImageSaved} />

      {/* Upload Dialog */}
      <MedicalImageUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onImageSaved={handleImageSaved}
      />
    </div>
  )
}