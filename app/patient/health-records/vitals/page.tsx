'use client'

import React, { useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { useAIAnalysis } from '@/hooks/use-ai-analysis'
import { useAnalysisDashboard } from '@/hooks/use-health-records'
import { AnalysisOverviewSection } from '@/components/health-records/analysis-overview-section'
import { AIAnalysisSection } from '@/components/health-records/ai-analysis-section'

export default function VitalsPage() {
  const { t } = useLanguage()
  const { analysis: aiAnalysis, loading: aiLoading, generateAnalysis, checkForUpdates } = useAIAnalysis(4) // Vitals type ID
  const { sections, adminTemplates, loading, createSection, updateSection, createMetric, updateMetric, createRecord, refresh } = useAnalysisDashboard(4) // Vitals type ID
  
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

  // Auto-load AI analysis when page loads and sections are available
  useEffect(() => {
    if (!loading && sections.length > 0 && !aiAnalysisAttempted.current) {
      aiAnalysisAttempted.current = true
      // Small delay to ensure all data is loaded
      setTimeout(() => {
        handleGenerateAIAnalysis(false) // Follow 5-day rule
      }, 1000)
    }
  }, [loading, sections.length])

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
        title={t("health.vitalsMetrics")}
        description={t("health.vitalsMeasurements")}
        sections={sections}
        loading={loading}
        adminTemplates={adminTemplates}
        createSection={createSection}
        updateSection={updateSection}
        createMetric={createMetric}
        updateMetric={updateMetric}
        createRecord={createRecord}
        refresh={refresh}
        onDataUpdated={handleGenerateAIAnalysis}
        healthRecordTypeId={4}
      />
    </div>
  )
}