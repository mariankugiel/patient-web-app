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

export default function SummaryPage() {
  const { t } = useLanguage()
  const { patientToken, patientId } = useSwitchedPatient()
  const router = useRouter()
  const { user } = useSelector((state: RootState) => state.auth)
  const { summaryData, loading, error } = useSummaryData()
  
  // Fetch AI analysis for overall assessment (using type 1 for general analysis)
  const { 
    analysis: aiAnalysis, 
    loading: aiLoading, 
    error: aiError,
    generateAnalysis 
  } = useAIAnalysis(1, patientId || null)
  
  // Track if we've attempted to fetch AI analysis to prevent infinite loops
  const aiAnalysisAttempted = useRef(false)
  
  // Reset the attempted flag when patientId changes
  useEffect(() => {
    aiAnalysisAttempted.current = false
  }, [patientId])
  
  // Auto-load AI analysis when page loads
  useEffect(() => {
    if (!aiLoading && !aiAnalysis && !aiAnalysisAttempted.current) {
      aiAnalysisAttempted.current = true
      generateAnalysis(false).catch((err) => {
        console.error('Failed to generate AI analysis:', err)
        // Don't reset the flag on error to prevent infinite retries
      })
    }
  }, [aiLoading, aiAnalysis, generateAnalysis, patientId])

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
          <div className="rounded-lg bg-muted/50 p-4 border border-muted">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-teal-600 mt-0.5" />
              <div className="space-y-3 flex-1">
                {/* Areas of Concern */}
                <div>
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {t("health.areasOfConcern")}:
                  </h4>
                  {aiLoading ? (
                    <p className="text-sm text-gray-500">{t("health.analyzingYourHealthData") || "Analyzing your health data..."}</p>
                  ) : aiError ? (
                    <p className="text-sm text-gray-500 italic">{t("health.unableToAnalyzeConcerns") || "Unable to analyze concerns at this time. Please try again later."}</p>
                  ) : !aiAnalysis ? (
                    <p className="text-sm text-gray-500 italic">{t("health.noAnalysisAvailableYet") || "No analysis available yet. AI analysis will appear here once generated."}</p>
                  ) : (aiAnalysis?.analysis?.areas_of_concern || []).length === 0 ? (
                    <p className="text-sm text-gray-500 italic">{t("health.noAreasOfConcernIdentified") || "No areas of concern identified in your current health data."}</p>
                  ) : (
                    <div className="space-y-1">
                      {(aiAnalysis?.analysis?.areas_of_concern || []).map((concern: string, index: number) => (
                        <p key={index} className="text-sm">
                          {typeof concern === 'string' ? concern : String(concern)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Positive Trends */}
                <div>
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    {t("health.positiveTrends")}:
                  </h4>
                  {aiLoading ? (
                    <p className="text-sm text-gray-500">{t("health.identifyingPositiveTrends") || "Identifying positive trends..."}</p>
                  ) : aiError ? (
                    <p className="text-sm text-gray-500 italic">{t("health.unableToIdentifyTrends") || "Unable to identify trends at this time. Please try again later."}</p>
                  ) : !aiAnalysis ? (
                    <p className="text-sm text-gray-500 italic">{t("health.noAnalysisAvailableYet") || "No analysis available yet. AI analysis will appear here once generated."}</p>
                  ) : (aiAnalysis?.analysis?.positive_trends || []).length === 0 ? (
                    <p className="text-sm text-gray-500 italic">{t("health.noPositiveTrendsIdentified") || "No positive trends identified in your current health data."}</p>
                  ) : (
                    <div className="space-y-1">
                      {(aiAnalysis?.analysis?.positive_trends || []).map((trend: string, index: number) => (
                        <p key={index} className="text-sm">
                          {typeof trend === 'string' ? trend : String(trend)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-blue-600">
                    <Lightbulb className="h-4 w-4" />
                    {t("health.recommendations")}:
                  </h4>
                  {aiLoading ? (
                    <p className="text-sm text-gray-500">{t("health.generatingPersonalizedRecommendations") || "Generating personalized recommendations..."}</p>
                  ) : aiError ? (
                    <p className="text-sm text-gray-500 italic">{t("health.unableToGenerateRecommendations") || "Unable to generate recommendations at this time. Please try again later."}</p>
                  ) : !aiAnalysis ? (
                    <p className="text-sm text-gray-500 italic">{t("health.noAnalysisAvailableYet") || "No analysis available yet. AI analysis will appear here once generated."}</p>
                  ) : (aiAnalysis?.analysis?.recommendations || []).length === 0 ? (
                    <p className="text-sm text-gray-500 italic">{t("health.noRecommendationsAvailable") || "No recommendations available for your current health data."}</p>
                  ) : (
                    <div className="space-y-1">
                      {(aiAnalysis?.analysis?.recommendations || []).map((recommendation: string, index: number) => (
                        <p key={index} className="text-sm">
                          {typeof recommendation === 'string' ? recommendation : String(recommendation)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
