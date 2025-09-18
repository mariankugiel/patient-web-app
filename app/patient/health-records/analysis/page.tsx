'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  Brain,
  ThumbsUp,
  Lightbulb,
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronsUpDown,
  Check,
  Loader2,
  Upload,
  ArrowRight,
  Activity,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { HealthMetricsChart } from "@/components/patient/health-metrics-chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useAnalysisDashboard, formatMetricValue, formatReferenceRange, getStatusColor, getTrendColor } from "@/hooks/use-health-records"
import { useAIAnalysis } from "@/hooks/use-ai-analysis"
import { 
  HealthRecordsApiService, 
  MetricWithData, 
  HealthRecordSection,
  HealthRecord,
  HealthRecordMetric,
  SectionWithMetrics
} from "@/lib/api/health-records-api"
import { LabDocumentUpload } from "@/components/lab-document-upload"
import { toast } from "react-toastify"
import { NewSectionDialog } from "@/components/health-records/new-section-dialog"
import { NewMetricDialog } from "@/components/health-records/new-metric-dialog"
import { NewValueDialogWithSpecial } from "@/components/health-records/new-value-dialog"
import { MetricDetailDialog } from "@/components/health-records/metric-detail-dialog"
import { medicalDocumentsApiService, MedicalDocument } from "@/lib/api/medical-documents-api"

// Use HealthRecordSection as the base type for sections with metrics
type HealthRecordSectionWithMetrics = HealthRecordSection & {
  metrics?: MetricWithData[]
}

interface LabAnalysisResult {
  metric_name: string
  value: string
  unit: string
  reference_range: string
  status: 'normal' | 'abnormal' | 'critical'
  confidence: number
}

export default function AnalysisPage() {
  const { t } = useLanguage()
  const { dashboard, sections, setSections, loading, createSection, createMetric, createRecord, refresh } = useAnalysisDashboard()
  const { analysis: aiAnalysis, loading: aiLoading, generateAnalysis, error: aiError } = useAIAnalysis()

  // Track if we've already attempted to load AI analysis
  const aiAnalysisAttempted = useRef(false)

  // Dialog states
  const [newSectionDialogOpen, setNewSectionDialogOpen] = useState(false)
  const [newMetricDialogOpen, setNewMetricDialogOpen] = useState(false)
  const [newValueDialogOpen, setNewValueDialogOpen] = useState(false)
  const [selectedSectionForMetric, setSelectedSectionForMetric] = useState<SectionWithMetrics | null>(null)
  const [metricDetailDialogOpen, setMetricDetailDialogOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<MetricWithData | null>(null)
  const [selectedSectionForValue, setSelectedSectionForValue] = useState<SectionWithMetrics | null>(null)
  const [labUploadOpen, setLabUploadOpen] = useState(false)

  // Medical documents state
  const [medicalDocuments, setMedicalDocuments] = useState<MedicalDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [allDocumentsOpen, setAllDocumentsOpen] = useState(false)
  const [allDocuments, setAllDocuments] = useState<MedicalDocument[]>([])
  const [allDocumentsLoading, setAllDocumentsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalDocuments, setTotalDocuments] = useState(0)

  // Show sections that have data OR sections without data (newly created)
  const displaySections = sections.filter(section => {
    const hasData = section.metrics && section.metrics.some((metric: any) => 
      metric.data_points && metric.data_points.length > 0
    )
    
    // Always show sections with data
    if (hasData) {
      return true
    }
    
    // For sections without data, show them if they have metrics OR if they are custom sections
    // This handles newly created sections that don't have data yet
    const hasMetrics = section.metrics && section.metrics.length > 0
    const isCustomSection = !section.is_default // Custom sections have is_default = false
    
    console.log(`Section "${section.display_name}": hasData=${hasData}, hasMetrics=${hasMetrics}, isCustomSection=${isCustomSection}, is_default=${section.is_default}`)
    
    return hasMetrics || isCustomSection
  })
  
  console.log('All sections:', sections.map(s => ({ name: s.display_name, is_default: s.is_default, metrics_count: s.metrics?.length || 0 })))
  console.log('Display sections:', displaySections.map(s => ({ name: s.display_name, is_default: s.is_default, metrics_count: s.metrics?.length || 0 })))

  // Generate AI Analysis based on current health data
  const generateAIAnalysis = () => {
    const concerns: string[] = []
    const positiveTrends: string[] = []
    const recommendations: string[] = []

    // Analyze each section and metric
    displaySections.forEach(section => {
      section.metrics?.forEach(metric => {
        if (metric.latest_status === 'abnormal' || metric.latest_status === 'critical') {
          concerns.push(`Your ${metric.display_name} is ${metric.latest_status} at ${formatMetricValue(metric.latest_value)} ${metric.unit}. Let's work on getting this back to a healthy range together.`)
        }
        
        if (metric.trend === 'improving') {
          positiveTrends.push(`Great news! Your ${metric.display_name} is trending in the right direction. Keep up the excellent work you're doing.`)
        }
        
        if (metric.latest_status === 'abnormal' || metric.latest_status === 'critical') {
          if (metric.name.toLowerCase().includes('cholesterol')) {
            recommendations.push('Try adding more heart-healthy foods like oats and fish to your diet, and aim for 30 minutes of daily exercise.')
          } else if (metric.name.toLowerCase().includes('blood pressure') || metric.name.toLowerCase().includes('bp')) {
            recommendations.push('Cut back on salty foods and try walking for 20-30 minutes most days to help lower your blood pressure naturally.')
          } else if (metric.name.toLowerCase().includes('glucose') || metric.name.toLowerCase().includes('sugar')) {
            recommendations.push('Focus on whole grains and limit sugary snacks. Regular meals and staying active can help balance your glucose levels.')
    } else {
            recommendations.push(`Let's discuss your ${metric.display_name} results with your doctor to create a personalized plan for improvement.`)
          }
        }
      })
    })

    // Ensure we have at least one item in each category
    if (concerns.length === 0) {
      concerns.push('Your health metrics look good overall! Keep monitoring regularly to maintain this positive trend.')
    }

    if (positiveTrends.length === 0) {
      positiveTrends.push('You\'re doing great with your health monitoring. Consistency is key to maintaining good health.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up your healthy habits! Regular checkups and staying active are your best tools for maintaining great health.')
    }

    return {
      concerns,
      positiveTrends,
      recommendations
    }
  }

  // Generate local analysis for fallback
  const localAnalysis = generateAIAnalysis()
  
  // Function to trigger AI analysis
  const handleGenerateAIAnalysis = useCallback(async () => {
    try {
      await generateAnalysis(1) // Analysis type ID
    } catch (error) {
      console.error('Failed to generate AI analysis:', error)
    }
  }, [generateAnalysis])

  // Auto-load AI analysis when page loads and sections are available
  useEffect(() => {
    if (sections && sections.length > 0 && !aiAnalysis && !aiLoading && !aiAnalysisAttempted.current) {
      console.log('Auto-loading AI analysis on page load...')
      aiAnalysisAttempted.current = true
      handleGenerateAIAnalysis()
    }
  }, [sections, aiAnalysis, aiLoading, handleGenerateAIAnalysis])
  
  // Admin templates for section creation dropdown
  const [adminTemplates, setAdminTemplates] = useState<HealthRecordSection[]>([])
  
  // Fetch admin templates
  useEffect(() => {
    const fetchAdminTemplates = async () => {
      try {
        const templates = await HealthRecordsApiService.getAdminSectionTemplates(1)
        setAdminTemplates(templates)
      } catch (error) {
        console.error('Failed to fetch admin templates:', error)
      }
    }
    
    fetchAdminTemplates()
  }, [])

  const renderTrendIcon = (status: string) => {
    if (status === "improving") {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (status === "declining" || status === "needs improvement") {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return null
  }

  const renderMetricBox = (metric: MetricWithData) => {
    const isAbnormal = metric.latest_status === "abnormal" || metric.latest_status === "critical"
    const trendIcon = renderTrendIcon(metric.trend || "stable")

    // Convert data points to chart format and sort by date
    const sortedDataPoints = (metric.data_points || []).sort((a, b) => 
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
    
    const chartData = sortedDataPoints.map((dp: HealthRecord) => {
      let value = dp.value
      
      // Handle JSON values (like cholesterol with multiple components)
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (parsed && typeof parsed === 'object') {
            // If it's an object with a 'value' property, use that
            value = parsed.value || parsed
          }
        } catch (e) {
          // If parsing fails, use the original value
          value = parseFloat(value) || 0
        }
      } else if (typeof value === 'object' && value !== null) {
        value = value.value || value
      }
      
      return {
        date: new Date(dp.recorded_at),
        value: typeof value === 'number' ? value : parseFloat(value) || 0,
      }
    })


    // Get the actual latest value from the sorted data points (last entry)
    const latestDataPoint = sortedDataPoints[sortedDataPoints.length - 1]
    const currentValue = latestDataPoint
      ? formatMetricValue(latestDataPoint.value, metric.default_unit || metric.unit)
      : "N/A"

    // Format reference range - try different sources
    let referenceRange = 'Reference range not specified'
    
    // First try normal_range_min/max (if available)
    if (metric.normal_range_min !== undefined || metric.normal_range_max !== undefined) {
      referenceRange = formatReferenceRange(metric.normal_range_min, metric.normal_range_max)
    } 
    // Then try threshold field (where new metrics store their ranges)
    else if (metric.threshold) {
      if (typeof metric.threshold === 'string') {
        referenceRange = metric.threshold
      } else if (typeof metric.threshold === 'object' && metric.threshold !== null) {
        // Handle object threshold with min/max
        if (metric.threshold.min !== undefined || metric.threshold.max !== undefined) {
          referenceRange = formatReferenceRange(metric.threshold.min, metric.threshold.max)
        }
      }
    }

    return (
      <Card 
        key={metric.id} 
        className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${isAbnormal ? 'border-red-200 bg-red-50' : ''}`}
        onClick={() => handleMetricClick(metric)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{metric.display_name}</h4>
              {trendIcon}
              <Badge
                variant="outline" 
                className={`text-xs ${getStatusColor(metric.latest_status || 'normal')}`}
              >
                {metric.latest_status || 'normal'}
              </Badge>
              </div>

            <div className="text-2xl font-bold mb-1">
              {currentValue}
                </div>
            
            <div className="text-xs text-gray-600 mb-2">
              {referenceRange}
                </div>
            
            {chartData.length > 0 ? (
              <div className="h-20">
                <HealthMetricsChart
                  data={chartData}
                  metricName={metric.display_name}
                  options={{ fontSize: 10, tickCount: 3, roundValues: true }}
                />
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-xs text-gray-500">
                No chart data available
                </div>
              )}
            </div>
          </div>
      </Card>
    )
  }

  const handleNewSection = () => {
    setNewSectionDialogOpen(true)
  }

  const handleNewMetric = (section: SectionWithMetrics) => {
    // Convert SectionWithMetrics to HealthRecordSection for the dialog
    const healthRecordSection: HealthRecordSection = {
      id: section.id,
      name: section.name,
      display_name: section.display_name,
      description: section.description,
      health_record_type_id: 1, // Analysis type
      is_default: false,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 1,
      metrics: section.metrics.map(metric => ({
        id: metric.id,
        section_id: section.id,
        name: metric.name,
        display_name: metric.display_name,
        description: metric.description,
        default_unit: metric.default_unit,
        unit: metric.unit,
        threshold: metric.threshold,
        normal_range_min: metric.normal_range_min,
        normal_range_max: metric.normal_range_max,
        data_type: 'number',
        is_default: false,
        created_at: new Date().toISOString(),
        created_by: 1
      }))
    }
    setSelectedSectionForMetric(healthRecordSection as any)
    setNewMetricDialogOpen(true)
  }

  const handleNewValue = (section: SectionWithMetrics) => {
    // Convert SectionWithMetrics to HealthRecordSection for the dialog
    const healthRecordSection: HealthRecordSection = {
      id: section.id,
      name: section.name,
      display_name: section.display_name,
      description: section.description,
      health_record_type_id: 1, // Analysis type
      is_default: false,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 1,
      metrics: section.metrics.map(metric => ({
        id: metric.id,
        section_id: section.id,
        name: metric.name,
        display_name: metric.display_name,
        description: metric.description,
        default_unit: metric.default_unit,
        unit: metric.unit,
        threshold: metric.threshold,
        normal_range_min: metric.normal_range_min,
        normal_range_max: metric.normal_range_max,
        data_type: 'number',
        is_default: false,
        created_at: new Date().toISOString(),
        created_by: 1
      }))
    }
    setSelectedSectionForValue(healthRecordSection as any)
    setNewValueDialogOpen(true)
  }

  const handleMetricClick = (metric: MetricWithData) => {
    setSelectedMetric(metric)
    setMetricDetailDialogOpen(true)
  }

  const handleSectionCreated = (section: HealthRecordSection) => {
    // Add the new section to the current sections state instead of full refresh
    setSections((prev: SectionWithMetrics[]) => {
      const exists = prev.some((s: SectionWithMetrics) => s.id === section.id)
      if (exists) {
        return prev
      }
      const newSection: SectionWithMetrics = {
        id: section.id,
        name: section.name,
        display_name: section.display_name,
        description: section.description,
        is_default: section.is_default,
        metrics: []
      }
      return [...prev, newSection]
    })
    toast.success('Section created successfully!')
  }

  const handleMetricCreated = (metric: HealthRecordMetric) => {
    // Add the new metric to the appropriate section
    setSections((prev: SectionWithMetrics[]) => prev.map((section: SectionWithMetrics) => {
      if (section.id === metric.section_id) {
        // Check if metric already exists to prevent duplicates
        const existingMetric = section.metrics?.find(m => m.id === metric.id)
        if (existingMetric) {
          return section
        }
        
        const newMetric: MetricWithData = {
          id: metric.id,
          name: metric.name,
          display_name: metric.display_name,
          unit: metric.unit,
          threshold: metric.threshold,
          data_points: [],
          latest_value: undefined,
          latest_status: 'normal',
          latest_recorded_at: undefined,
          total_records: 0,
          trend: 'unknown'
        }
        return {
          ...section,
          metrics: [...(section.metrics || []), newMetric]
        }
      }
      return section
    }))
    toast.success('Metric created successfully!')
  }

  const handleValueCreated = (record: HealthRecord) => {
    // Add the new value to the appropriate metric
    
    setSections((prev: SectionWithMetrics[]) => {
      return prev.map((section: SectionWithMetrics) => {
        // Only update the section that contains the metric
        if (section.metrics?.some(metric => metric.id === record.metric_id)) {
          return {
            ...section,
            metrics: section.metrics.map((metric: MetricWithData) => {
              if (metric.id === record.metric_id) {
                const newDataPoint: HealthRecord = {
                  id: record.id,
                  created_by: record.created_by,
                  section_id: record.section_id,
                  metric_id: record.metric_id,
                  value: record.value,
                  status: record.status,
                  source: record.source,
                  recorded_at: record.recorded_at,
                  device_id: record.device_id,
                  device_info: record.device_info,
                  created_at: new Date().toISOString()
                }
                return {
                  ...metric,
                  data_points: [...(metric.data_points || []), newDataPoint],
                  latest_value: record.value,
                  latest_status: (record.status as 'normal' | 'abnormal' | 'critical' | 'unknown') || 'normal',
                  latest_recorded_at: record.recorded_at,
                  total_records: (metric.total_records || 0) + 1
                }
              }
              return metric
            })
          }
        }
        return section
      })
    })
    
    toast.success('Value added successfully!')
    
    // Note: AI analysis will be refreshed automatically when user navigates or manually triggers it
    // Removing automatic refresh to prevent graph flashing
  }

  // Handle lab document analysis completion
  const handleLabAnalysisComplete = async (results: LabAnalysisResult[]) => {
    try {
      // Refresh the dashboard to show newly created sections, metrics, and health records
      await refresh()
      // Also refresh medical documents to show the newly uploaded document
      await fetchMedicalDocuments()
      
      // Refresh AI analysis with new lab data
      setTimeout(() => {
        handleGenerateAIAnalysis()
      }, 2000) // Longer delay for lab data processing
      
    } catch (error) {
      console.error('Failed to refresh dashboard after lab analysis:', error)
    }
  }

  // Fetch medical documents
  const fetchMedicalDocuments = async () => {
    try {
      setDocumentsLoading(true)
      console.log('Fetching medical documents with document_type: lab_result')
      const documents = await medicalDocumentsApiService.getMedicalDocuments(0, 2, 'lab_result')
      console.log('Fetched medical documents:', documents)
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
      console.log('Starting download for document:', documentId, fileName)
      const response = await medicalDocumentsApiService.downloadMedicalDocument(documentId)
      console.log('Download response:', response)
      const downloadUrl = response.download_url
      
      if (!downloadUrl) {
        throw new Error('No download URL received')
      }
      
      console.log('Download URL:', downloadUrl)
      
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
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg bg-muted/50 p-4 border border-muted">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div className="space-y-4">
                    {/* Areas of Concern */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        Areas of Concern:
                      </h4>
                      <div className="space-y-1">
                        {aiLoading ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
                            Analyzing your health data...
                    </div>
                        ) : aiError ? (
                          <p className="text-sm text-gray-500 italic">Unable to analyze concerns at this time. Please try again later.</p>
                        ) : !aiAnalysis ? (
                          <p className="text-sm text-gray-500 italic">No analysis available yet. AI analysis will appear here once generated.</p>
                        ) : (aiAnalysis?.analysis?.areas_of_concern || []).length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No areas of concern identified in your current health data.</p>
                        ) : (
                          (aiAnalysis?.analysis?.areas_of_concern || []).map((concern, index) => (
                            <p key={index} className="text-sm text-gray-700">
                              {typeof concern === 'string' ? concern : String(concern)}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Positive Trends */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        Positive Trends:
                      </h4>
                      <div className="space-y-1">
                        {aiLoading ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"></div>
                            Identifying positive trends...
                    </div>
                        ) : aiError ? (
                          <p className="text-sm text-gray-500 italic">Unable to identify trends at this time. Please try again later.</p>
                        ) : !aiAnalysis ? (
                          <p className="text-sm text-gray-500 italic">No analysis available yet. AI analysis will appear here once generated.</p>
                        ) : (aiAnalysis?.analysis?.positive_trends || []).length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No positive trends identified in your current health data.</p>
                        ) : (
                          (aiAnalysis?.analysis?.positive_trends || []).map((trend, index) => (
                            <p key={index} className="text-sm text-gray-700">
                              {typeof trend === 'string' ? trend : String(trend)}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Recommendations */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-600">
                        <Lightbulb className="h-4 w-4" />
                        Recommendations:
                      </h4>
                      <div className="space-y-1">
                        {aiLoading ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                            Generating personalized recommendations...
                    </div>
                        ) : aiError ? (
                          <p className="text-sm text-gray-500 italic">Unable to generate recommendations at this time. Please try again later.</p>
                        ) : !aiAnalysis ? (
                          <p className="text-sm text-gray-500 italic">No analysis available yet. AI analysis will appear here once generated.</p>
                        ) : (aiAnalysis?.analysis?.recommendations || []).length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No recommendations available for your current health data.</p>
                        ) : (
                          (aiAnalysis?.analysis?.recommendations || []).map((recommendation, index) => (
                            <p key={index} className="text-sm text-gray-700">
                              {typeof recommendation === 'string' ? recommendation : String(recommendation)}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Analysis Metadata */}
                    {aiAnalysis?.generated_at && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          AI Analysis generated on {new Date(aiAnalysis.generated_at).toLocaleString()}
                        </p>
                        {aiAnalysis.data_summary && (
                          <p className="text-xs text-gray-500">
                            Based on {aiAnalysis.data_summary.total_sections} sections, {aiAnalysis.data_summary.total_metrics} metrics, and {aiAnalysis.data_summary.total_data_points} data points
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

      {/* Main Analysis Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Analysis Overview
              </CardTitle>
              <CardDescription>
                Monitor your health metrics and track trends over time
              </CardDescription>
            </div>
            {displaySections.length > 0 && (
              <Button onClick={handleNewSection} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Section
            </Button>
                )}
              </div>
        </CardHeader>
        <CardContent>
          {/* Sections */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Loading your health data...</h3>
                <p className="text-gray-600">Please wait while we fetch your health records.</p>
            </div>
            </div>
          ) : displaySections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No sections yet</h3>
                <p className="text-gray-600 mb-4">Create your first section to start tracking your health data</p>
                <Button onClick={handleNewSection}>
                  Create First Section
              </Button>
      </div>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-4">
              {displaySections.map((section) => (
                <AccordionItem key={section.id} value={section.id.toString()} className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-left">{section.display_name}</h3>
                        {section.description && (
                          <span className="text-sm text-gray-500">- {section.description}</span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {section.metrics?.length || 0} metrics
                        </Badge>
      </div>
                      <div className="flex items-center gap-2">
                        <div
                  onClick={(e) => {
                    e.stopPropagation()
                            handleNewValue(section)
                          }}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          New Value
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNewMetric(section)
                          }}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          New Metric
                        </div>
                      </div>
              </div>
            </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {section.metrics && section.metrics.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {section.metrics.map((metric: MetricWithData) => renderMetricBox(metric))}
              </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No metrics in this section yet. Add your first metric to start tracking data.
                      </div>
                    )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NewSectionDialog
        open={newSectionDialogOpen}
        onOpenChange={setNewSectionDialogOpen}
        onSectionCreated={handleSectionCreated}
        healthRecordTypeId={1} // Analysis type ID
        availableTemplates={adminTemplates}
        createSection={createSection}
      />

      <NewMetricDialog
        open={newMetricDialogOpen}
        onOpenChange={setNewMetricDialogOpen}
        onMetricCreated={handleMetricCreated}
        sectionId={selectedSectionForMetric?.id || 0}
        sectionName={selectedSectionForMetric?.display_name || ''}
        createMetric={createMetric}
      />

      <NewValueDialogWithSpecial
        open={newValueDialogOpen}
        onOpenChange={setNewValueDialogOpen}
        onValueCreated={handleValueCreated}
        sectionId={selectedSectionForValue?.id || 0}
        sectionName={selectedSectionForValue?.display_name || ''}
        availableMetrics={(selectedSectionForValue?.metrics || []).map(metric => ({
          id: metric.id,
          section_id: selectedSectionForValue?.id || 0,
          name: metric.name,
          display_name: metric.display_name,
          description: metric.description,
          default_unit: metric.default_unit,
          unit: metric.unit,
          threshold: metric.threshold,
          normal_range_min: metric.normal_range_min,
          normal_range_max: metric.normal_range_max,
          data_type: 'number',
          is_default: false,
          created_at: new Date().toISOString(),
          created_by: 1
        }))}
        createRecord={createRecord}
      />

      {/* Lab Document Upload Dialog */}
      <LabDocumentUpload
        open={labUploadOpen}
        onOpenChange={setLabUploadOpen}
        onAnalysisComplete={handleLabAnalysisComplete}
      />

      {/* All Documents Dialog */}
      <Dialog open={allDocumentsOpen} onOpenChange={setAllDocumentsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
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
                Page {currentPage + 1}
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

      {/* Metric Detail Dialog */}
      {selectedMetric && (
        <MetricDetailDialog
          open={metricDetailDialogOpen}
          onOpenChange={setMetricDetailDialogOpen}
          metric={{
            id: selectedMetric.id,
            display_name: selectedMetric.display_name,
            unit: selectedMetric.unit || selectedMetric.default_unit || '',
            default_unit: selectedMetric.default_unit,
            threshold: selectedMetric.threshold ? JSON.stringify(selectedMetric.threshold) : undefined,
            data_type: selectedMetric.data_type || 'number'
          }}
          dataPoints={selectedMetric.data_points || []}
          onDataUpdated={() => {
            // Refresh the data when records are updated
            refresh()
          }}
        />
      )}
    </div>
  )
}