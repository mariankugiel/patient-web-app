'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { useAIAnalysis } from '@/hooks/use-ai-analysis'
import { useAnalysisDashboard } from '@/hooks/use-health-records'
import { AnalysisOverviewSection } from '@/components/health-records/analysis-overview-section'
import { AIAnalysisSection } from '@/components/health-records/ai-analysis-section'

export default function VitalsPage() {
  const { t } = useLanguage()
  const { analysis: aiAnalysis, loading: aiLoading, generateAnalysis, checkForUpdates } = useAIAnalysis(2) // Vitals type ID
  const { sections, loading, createSection, updateSection, createMetric, updateMetric, createRecord, refresh } = useAnalysisDashboard(2) // Vitals type ID
  
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
        title={t("health.aiHealthAnalysis")}
        analysis={aiAnalysis}
        loading={aiLoading}
        error={null}
        onCheckForUpdates={checkForUpdates}
      />

      {/* Analysis Overview Section */}
      <AnalysisOverviewSection
        title={t("health.vitalsMetrics")}
        description={t("health.vitalsMeasurements")}
        sections={sections}
        loading={loading}
        createSection={createSection}
        updateSection={updateSection}
        createMetric={createMetric}
        updateMetric={updateMetric}
        createRecord={createRecord}
        refresh={refresh}
        onDataUpdated={handleGenerateAIAnalysis}
        healthRecordTypeId={2}
      />
    </div>
  )
}