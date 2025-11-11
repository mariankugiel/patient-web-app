'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { useAIAnalysis } from '@/hooks/use-ai-analysis'
import { useAnalysisDashboard } from '@/hooks/use-health-records'
import { AnalysisOverviewSection } from '@/components/health-records/analysis-overview-section'
import { AIAnalysisSection } from '@/components/health-records/ai-analysis-section'

export default function LifestylePage() {
  const { t } = useLanguage()
  const { analysis: aiAnalysis, loading: aiLoading, generateAnalysis, checkForUpdates } = useAIAnalysis(3) // Lifestyle type ID
  const { sections, loading, createSection, updateSection, createMetric, updateMetric, createRecord, refresh } = useAnalysisDashboard(3) // Lifestyle type ID
  
  // Track if we've already attempted to load AI analysis
  const aiAnalysisAttempted = useRef(false)

  // Function to trigger AI analysis
  const handleGenerateAIAnalysis = async (forceCheck: boolean = false) => {
    try {
      await generateAnalysis(forceCheck) // Type ID is now built into the hook
    } catch (error) {
      console.error('Failed to generate AI analysis:', error)
    }
  }

  // Auto-load AI analysis when page loads
  useEffect(() => {
    if (!loading && !aiAnalysisAttempted.current) {
      aiAnalysisAttempted.current = true
      handleGenerateAIAnalysis(false) // Follow 5-day rule
    }
  }, [loading, handleGenerateAIAnalysis])

  return (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      <AIAnalysisSection
        title="AI Health Analysis"
        analysis={aiAnalysis}
        loading={aiLoading}
        error={null}
        onCheckForUpdates={checkForUpdates}
      />

      {/* Analysis Overview Section */}
      <AnalysisOverviewSection
        title={t("health.lifestyleMetrics")}
        description={t("health.lifestyleMeasurements")}
        sections={sections}
        loading={loading}
        createSection={createSection}
        updateSection={updateSection}
        createMetric={createMetric}
        updateMetric={updateMetric}
        createRecord={createRecord}
        refresh={refresh}
        onDataUpdated={handleGenerateAIAnalysis}
        healthRecordTypeId={3}
      />
    </div>
  )
}