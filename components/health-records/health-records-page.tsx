'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { TrendingUp, TrendingDown, Plus, Loader2 } from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"
import { HealthMetricsChart } from '@/components/patient/health-metrics-chart'
import { useHealthRecordsDashboard } from '@/hooks/use-health-records-dashboard'
import { NewSectionDialog } from './new-section-dialog'
import { NewMetricDialog } from './new-metric-dialog'
import { NewValueDialogWithSpecial } from './new-value-dialog'
import { 
  HealthRecordSection, 
  HealthRecordMetric, 
  HealthRecord,
  MetricWithData
} from './types'
import { formatMetricValue, formatReferenceRange, getStatusColor, getTrendColor } from '@/hooks/use-health-records'

interface HealthRecordsPageProps {
  healthRecordTypeId: number
  title: string
  description: string
}

export function HealthRecordsPage({ healthRecordTypeId, title, description }: HealthRecordsPageProps) {
  const { t } = useLanguage()
  const { dashboard, sections, loading, createSection, createMetric, createRecord, refresh } = useHealthRecordsDashboard(healthRecordTypeId)

  // Dialog states
  const [newSectionDialogOpen, setNewSectionDialogOpen] = useState(false)
  const [newMetricDialogOpen, setNewMetricDialogOpen] = useState(false)
  const [newValueDialogOpen, setNewValueDialogOpen] = useState(false)
  const [selectedSectionForMetric, setSelectedSectionForMetric] = useState<HealthRecordSection | null>(null)
  const [selectedSectionForValue, setSelectedSectionForValue] = useState<HealthRecordSection | null>(null)

  // Show sections that have data OR sections without data (newly created)
  const displaySections = sections.filter(section => {
    const hasData = section.metrics && section.metrics.some((metric: any) => 
      metric.data_points && metric.data_points.length > 0
    )
    
    // Always show sections with data
    if (hasData) {
      return true
    }
    
    // For sections without data, show them if they're user-created (not admin templates)
    // This handles newly created sections that don't have data yet
    return !section.is_default
  })
  
  // Admin templates for section creation dropdown (sections with is_default=true)
  const adminTemplates = sections.filter(section => section.is_default)

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

    // Format current value - use latest_value from backend
    const currentValue = metric.latest_value
      ? formatMetricValue(
          typeof metric.latest_value === 'object' && metric.latest_value !== null 
            ? metric.latest_value.value 
            : metric.latest_value, 
          metric.default_unit || metric.unit
        )
      : "N/A"

    // Format reference range
    const referenceRange = formatReferenceRange(
      metric.normal_range_min,
      metric.normal_range_max
    )

    // Format change
    const changeText = metric.change_from_previous
      ? `${metric.change_from_previous > 0 ? '+' : ''}${metric.change_from_previous.toFixed(1)} ${metric.default_unit || metric.unit || ''}`
      : "N/A"

    // Convert data points to chart format
    const chartData = (metric.data_points || []).map((dp: HealthRecord) => ({
      date: new Date(dp.recorded_at),
      value: typeof dp.value === 'object' && dp.value !== null ? dp.value.value : dp.value,
    }))
    

    return (
      <Card key={metric.id} className={`p-4 ${isAbnormal ? 'border-red-200 bg-red-50' : ''}`}>
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
            
            {chartData.length > 0 && (
              <div className="h-20">
                <HealthMetricsChart
                  data={chartData}
                  metricName={metric.display_name}
                  unit={metric.default_unit || metric.unit || ''}
                  showGrid={false}
                  showTooltip={true}
                  height={80}
                />
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

  const handleNewMetric = (section: HealthRecordSection) => {
    setSelectedSectionForMetric(section)
    setNewMetricDialogOpen(true)
  }

  const handleNewValue = (section: HealthRecordSection) => {
    setSelectedSectionForValue(section)
    setNewValueDialogOpen(true)
  }

  const handleSectionCreated = (section: HealthRecordSection) => {
    // Section is already added to state by the hook
  }

  const handleMetricCreated = (metric: HealthRecordMetric) => {
    // Metric is already added to state by the hook
  }

  const handleValueCreated = (record: HealthRecord) => {
    // Record is already added to state by the hook
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
        <Button onClick={handleNewSection} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Section
        </Button>
      </div>

      {/* Sections */}
      {displaySections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No sections yet</h3>
              <p className="text-gray-600 mb-4">Create your first section to start tracking your health data</p>
              <Button onClick={handleNewSection}>
                Create First Section
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {displaySections.map((section) => (
            <AccordionItem key={section.id} value={section.id.toString()}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{section.display_name}</span>
                    {section.description && (
                      <span className="text-sm text-gray-500">- {section.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNewValue(section)
                      }}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      New Value
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNewMetric(section)
                      }}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      New Metric
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {section.metrics && section.metrics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
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

      {/* Dialogs */}
      <NewSectionDialog
        open={newSectionDialogOpen}
        onOpenChange={setNewSectionDialogOpen}
        onSectionCreated={handleSectionCreated}
        healthRecordTypeId={healthRecordTypeId}
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
        availableMetrics={selectedSectionForValue?.metrics || []}
        createRecord={createRecord}
      />
    </div>
  )
}
