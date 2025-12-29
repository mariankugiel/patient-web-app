"use client"

export const dynamic = "force-dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  AlertTriangle,
  ThumbsUp,
  Lightbulb,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useSwitchedPatient } from "@/contexts/patient-context"
import { HealthMetricsChart } from "@/components/patient/health-metrics-chart"
import { useRouter } from "next/navigation"
import { useSummaryData } from "@/hooks/use-summary-data"
import { useAIAnalysis } from "@/hooks/use-ai-analysis"
import { MetricWithData } from "@/lib/api/health-records-api"
import { formatMetricValue, formatReferenceRange, formatNumericValue } from "@/hooks/use-health-records"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useEffect, useRef } from "react"
import { AIAnalysisSection } from "@/components/health-records/ai-analysis-section"

export default function SummaryPage() {
  const { t } = useLanguage()
  const { patientToken, patientId } = useSwitchedPatient()
  const router = useRouter()
  const { user } = useSelector((state: RootState) => state.auth)
  const { summaryData, loading, error } = useSummaryData()
  
  // Fetch AI analysis for overall assessment (using type 6 for summary)
  const { 
    analysis: aiAnalysis, 
    loading: aiLoading, 
    error: aiError,
    generateAnalysis,
    checkForUpdates,
    clearAnalysis
  } = useAIAnalysis(6, patientId || null)
  
  // Track if we've attempted to fetch AI analysis to prevent infinite loops
  const aiAnalysisAttempted = useRef(false)
  
  // Reset the attempted flag and clear cached analysis when patientId or language changes
  const { language } = useLanguage()
  useEffect(() => {
    aiAnalysisAttempted.current = false
    // Clear cached analysis when language changes so it re-fetches in the new language
    clearAnalysis()
  }, [patientId, language, clearAnalysis])
  
  // Auto-load AI analysis when page loads or language changes
  useEffect(() => {
    if (!aiLoading && !aiAnalysisAttempted.current) {
      aiAnalysisAttempted.current = true
      generateAnalysis(false).catch((err) => {
        console.error('Failed to generate AI analysis:', err)
        // Don't reset the flag on error to prevent infinite retries
      })
    }
  }, [aiLoading, generateAnalysis, patientId, language])

  const renderTrendIcon = (trend?: string) => {
    if (trend === "improving") {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (trend === "declining") {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    } else {
      return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  // Get gender-specific reference range
  const getGenderSpecificReferenceRange = (metric: MetricWithData) => {
    if (!metric.reference_data) return 'Reference range not specified'
    
    const userGender = user?.user_metadata?.gender?.toLowerCase()
    const gender = userGender === 'female' ? 'female' : 'male'
    const genderData = metric.reference_data[gender]
    
    return formatReferenceRange(genderData?.min, genderData?.max)
  }

  // Format chart data from metric
  const formatChartData = (metric: MetricWithData) => {
    const dataPoints = metric.data_points || []
    if (dataPoints.length === 0) return []

    return dataPoints
      .filter((item: any) => {
        const dateValue = item.measure_start_time || item.recorded_at || item.created_at
        return dateValue != null && dateValue !== ''
      })
      .map((item: any) => {
        const dateValue = item.measure_start_time || item.recorded_at || item.created_at
        const date = dateValue ? new Date(dateValue) : new Date()
        
        if (isNaN(date.getTime())) {
          return null
        }
        
        const numericValue = Number(item.value) || 0
        
        return {
          date: date,
          value: numericValue,
          id: item.id || `${metric.id}-${Date.now()}`,
          originalValue: item.value,
        }
      })
      .filter(item => item !== null)
  }

  // Determine status from value and reference range
  const getStatusFromValue = (value: number, referenceRange: string): "normal" | "abnormal" | "critical" => {
    if (!referenceRange || referenceRange === 'Reference range not specified' || referenceRange === 'N/A') return "normal"
    
    const numericValue = Number(value) || 0
    
    if (referenceRange.includes(' - ')) {
      const [minStr, maxStr] = referenceRange.split(' - ')
      const min = parseFloat(minStr)
      const max = parseFloat(maxStr)
      if (!isNaN(min) && !isNaN(max)) {
        return (numericValue >= min && numericValue <= max) ? "normal" : "abnormal"
      }
    } else if (referenceRange.includes('≤')) {
      const threshold = parseFloat(referenceRange.replace('≤', '').trim())
      if (!isNaN(threshold)) {
        return numericValue <= threshold ? "normal" : "abnormal"
      }
    } else if (referenceRange.includes('≥')) {
      const threshold = parseFloat(referenceRange.replace('≥', '').trim())
      if (!isNaN(threshold)) {
        return numericValue >= threshold ? "normal" : "abnormal"
      }
    } else if (referenceRange.includes('<')) {
      const threshold = parseFloat(referenceRange.replace('<', '').trim())
      if (!isNaN(threshold)) {
        return numericValue < threshold ? "normal" : "abnormal"
      }
    } else if (referenceRange.includes('>')) {
      const threshold = parseFloat(referenceRange.replace('>', '').trim())
      if (!isNaN(threshold)) {
        return numericValue > threshold ? "normal" : "abnormal"
      }
    }
    
    return "normal"
  }

  // Render a metric card
  const renderMetricCard = (metric: MetricWithData) => {
    const latestValue = metric.latest_value
    const referenceRange = getGenderSpecificReferenceRange(metric)
    const status = metric.latest_status || (latestValue ? getStatusFromValue(Number(latestValue), referenceRange) : 'normal')
    const baseUnit = metric.default_unit || metric.unit || ''
    
    // Format value
    const currentValue = latestValue 
      ? formatNumericValue(Number(latestValue), baseUnit, metric.display_name) 
      : "N/A"
    
    const chartData = formatChartData(metric)
    const hasValidRange = referenceRange && 
      referenceRange !== 'Reference range not specified' && 
      referenceRange !== 'N/A' &&
      referenceRange.trim() !== ''

    // Determine which tab to navigate to based on health_record_type_id
    const getTabName = (typeId?: number) => {
      switch (typeId) {
        case 2: return "vitals"
        case 3: return "body-composition"
        case 4: return "lifestyle"
        case 1: return "analysis"
        default: return "analysis"
      }
    }

    return (
      <Card key={metric.id} className="overflow-hidden flex flex-col h-full">
        <CardHeader className="pb-2 flex-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{metric.display_name}</CardTitle>
            </div>
            {hasValidRange && (
            <Badge
                variant={status === "normal" ? "outline" : "secondary"}
                className={`${status === "normal" ? "text-green-600" : "text-red-600"} text-xs py-0 px-1 h-5`}
            >
                {status === "normal" ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Normal</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Abnormal</span>
                  </div>
                )}
            </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold whitespace-pre-line">{currentValue}</p>
              {baseUnit && <span className="text-xs text-muted-foreground font-normal">{baseUnit}</span>}
            </div>
            {metric.trend && metric.trend !== "unknown" && (
            <div className="flex items-center gap-1">
              {renderTrendIcon(metric.trend)}
            </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {t("health.reference")}: {referenceRange}
          </p>

          {chartData.length > 0 && (
            <div className="h-[120px] mt-2">
            <HealthMetricsChart
                data={chartData}
                metricName={metric.display_name}
              options={{
                fontSize: 10,
                tickCount: 5,
                roundValues: true,
                  userTimezone: (user as any)?.profile?.timezone || (user as any)?.user_metadata?.timezone || 'UTC',
                  unit: baseUnit,
              }}
            />
          </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 flex-none">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              const tokenQuery = patientToken ? `?patientToken=${encodeURIComponent(patientToken)}` : ""
              const tabName = getTabName(metric.health_record_type_id)
              const targetUrl = `/patient/health-records/${tabName}${tokenQuery}`
              router.push(targetUrl)
            }}
          >
            {t("health.viewDetails")} <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Calculate overall health score from summary data
  const calculateHealthScore = () => {
    if (!summaryData) return 0
    
    const allMetrics = [
      ...summaryData.wellness.recommended,
      ...summaryData.wellness.recent,
      ...summaryData.analysis.recommended,
      ...summaryData.analysis.recent
    ]
    
    // Remove duplicates by metric ID
    const uniqueMetrics = Array.from(
      new Map(allMetrics.map(m => [m.id, m])).values()
    )
    
    if (uniqueMetrics.length === 0) return 0
    
    const normalCount = uniqueMetrics.filter(
      (m) => m.latest_status === "normal"
    ).length
    
    return Math.round((normalCount / uniqueMetrics.length) * 100)
  }

  const healthScore = summaryData ? calculateHealthScore() : 0

  // Render a section with recommended and recent rows
  const renderSection = (
    title: string,
    description: string,
    recommended: MetricWithData[],
    recent: MetricWithData[]
  ) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Recommended Row */}
          {recommended.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">{t("health.recommendedForYou") || "Recommended for You"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommended.map((metric) => renderMetricCard(metric))}
              </div>
            </div>
          )}

          {/* Recent Row */}
          {recent.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">{t("health.recentlyUpdated") || "Recently Updated"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recent.map((metric) => renderMetricCard(metric))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {recommended.length === 0 && recent.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("health.noMetricsAvailable") || "No metrics available for this section."}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">{t('health.loadingHealthData') || 'Loading health data...'}</h3>
        <p className="text-gray-600">{t('health.pleaseWaitFetchingRecords') || 'Please wait while we fetch your records...'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('health.errorLoadingData') || 'Error loading data'}</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!summaryData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("health.noDataAvailable") || "No data available"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Assessment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{t("health.overallAssessment")}</CardTitle>
          <CardDescription>{t("health.overallAssessmentDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Health Score */}
            <div className="flex-shrink-0 md:w-48">
              <div className="flex flex-col items-center justify-center">
                <div className="relative h-36 w-36 flex items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <circle
                      className={`${
                        healthScore >= 80
                          ? "text-green-500"
                          : healthScore >= 60
                            ? "text-yellow-500"
                            : "text-red-500"
                      } stroke-current`}
                      strokeWidth="10"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray={`${healthScore * 2.51} 251`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{healthScore}</span>
                    <span className="text-sm text-muted-foreground">{t("health.healthScore")}</span>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="font-medium">
                    {healthScore >= 80
                      ? t("health.excellent")
                      : healthScore >= 60
                        ? t("health.good")
                        : t("health.needsImprovement")}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="flex-1 min-w-0">
              <AIAnalysisSection
                title={t("health.aiHealthAnalysis")}
                analysis={aiAnalysis}
                loading={aiLoading}
                error={aiError}
                onCheckForUpdates={checkForUpdates}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellness Section */}
      {renderSection(
        t("health.wellness") || "Wellness",
        t("health.wellnessDescription") || "Body, Vitals, and Lifestyle",
        summaryData.wellness.recommended,
        summaryData.wellness.recent
      )}

      {/* Analysis Section */}
      {renderSection(
        t("health.analysis") || "Analysis",
        t("health.analysisDescription") || "Health analysis and insights",
        summaryData.analysis.recommended,
        summaryData.analysis.recent
      )}
    </div>
  )
}
