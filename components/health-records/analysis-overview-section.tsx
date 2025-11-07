'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react'
import { HealthMetricsChart } from '@/components/patient/health-metrics-chart'
import { NewSectionDialog } from '@/components/health-records/new-section-dialog'
import { NewMetricDialog } from '@/components/health-records/new-metric-dialog'
import { NewValueDialogWithSpecial } from '@/components/health-records/new-value-dialog'
import { MetricDetailDialog } from '@/components/health-records/metric-detail-dialog'
import { EditSectionDialog } from '@/components/health-records/edit-section-dialog'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { HealthRecordsApiService } from '@/lib/api/health-records-api'
import { formatMetricValue, formatReferenceRange } from '@/hooks/use-health-records'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { SectionWithMetrics, HealthRecordMetric, HealthRecord, MetricWithData, HealthRecordSection } from './types'

interface AnalysisOverviewSectionProps {
  title: string
  description: string
  sections: SectionWithMetrics[]
  loading: boolean
  createSection: (sectionData: { name: string; display_name: string; description?: string; health_record_type_id: number; is_default?: boolean; section_template_id?: number }) => Promise<HealthRecordSection>
  updateSection: (sectionId: number, data: { display_name?: string; description?: string }) => Promise<HealthRecordSection>
  createMetric: (metricData: { name: string; display_name: string; description?: string; default_unit?: string; data_type: string; section_id: number }) => Promise<HealthRecordMetric>
  updateMetric?: (metricId: number, metricData: { name?: string; display_name?: string; description?: string; default_unit?: string; reference_data?: any }) => Promise<HealthRecordMetric>
  createRecord: (recordData: { section_id: number; metric_id: number; value: number; status?: string; recorded_at: string; notes?: string; source?: string }) => Promise<HealthRecord>
  refresh: () => void
  onDataUpdated?: () => void
  healthRecordTypeId: number
  patientId?: number | null
  isViewingOtherPatient?: boolean
}

export function AnalysisOverviewSection({
  title,
  description,
  sections,
  loading,
  createSection,
  updateSection,
  createMetric,
  updateMetric,
  createRecord,
  refresh,
  onDataUpdated,
  healthRecordTypeId,
  patientId,
  isViewingOtherPatient
}: AnalysisOverviewSectionProps) {
  const { user } = useSelector((state: RootState) => state.auth)
  
  // Disable create/edit/delete actions when viewing another patient (read-only mode)
  const isReadOnly = isViewingOtherPatient === true
  
  // Dialog states
  const [newSectionDialogOpen, setNewSectionDialogOpen] = useState(false)
  const [newMetricDialogOpen, setNewMetricDialogOpen] = useState(false)
  const [newValueDialogOpen, setNewValueDialogOpen] = useState(false)
  const [selectedSectionForMetric, setSelectedSectionForMetric] = useState<SectionWithMetrics | null>(null)
  const [selectedSectionForValue, setSelectedSectionForValue] = useState<SectionWithMetrics | null>(null)
  const [metricDetailDialogOpen, setMetricDetailDialogOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<MetricWithData | null>(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{type: 'section' | 'metric', id: number, name: string} | null>(null)
  const [editSectionDialogOpen, setEditSectionDialogOpen] = useState(false)
  const [selectedSectionForEdit, setSelectedSectionForEdit] = useState<SectionWithMetrics | null>(null)
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([])

  // Filter sections to show only those with data or metrics
  const displaySections = sections.filter(section => {
    const hasMetrics = section.metrics && section.metrics.length > 0
    const isCustomSection = !section.is_default
    return hasMetrics || isCustomSection
  })

  // Handler functions
  const handleSectionCreated = useCallback((section: HealthRecordSection) => {
    toast.success('Section created successfully!')
    setNewSectionDialogOpen(false)
    // Keep the new section open in accordion
    setOpenAccordionItems(prev => [...prev, section.id.toString()])
    refresh()
  }, [refresh])

  const handleSectionUpdated = useCallback((section: SectionWithMetrics) => {
    toast.success('Section updated successfully!')
    setEditSectionDialogOpen(false)
    refresh()
  }, [refresh])

  const handleMetricCreated = useCallback((metric: HealthRecordMetric) => {
    toast.success('Metric created successfully!')
    setNewMetricDialogOpen(false)
    // Keep the section open where the metric was added
    if (selectedSectionForMetric) {
      setOpenAccordionItems(prev => [...prev, selectedSectionForMetric.id.toString()])
    }
    refresh()
  }, [refresh, selectedSectionForMetric])

  const handleValueCreated = useCallback((record: HealthRecord) => {
    setNewValueDialogOpen(false)
    // Keep the section open where the value was added
    if (selectedSectionForValue) {
      setOpenAccordionItems(prev => [...prev, selectedSectionForValue.id.toString()])
    }
    refresh()
    // Trigger data updated callback
    if (onDataUpdated) {
      setTimeout(() => {
        onDataUpdated()
      }, 1000)
    }
  }, [refresh, onDataUpdated, selectedSectionForValue])

  const handleMetricClick = useCallback((metric: MetricWithData) => {
    setSelectedMetric(metric)
    setMetricDetailDialogOpen(true)
  }, [])

  const handleEditSection = useCallback((section: SectionWithMetrics) => {
    setSelectedSectionForEdit(section)
    setEditSectionDialogOpen(true)
  }, [])

  const handleDeleteSection = useCallback((section: SectionWithMetrics) => {
    setDeleteTarget({ type: 'section', id: section.id, name: section.display_name })
    setDeleteConfirmationOpen(true)
  }, [])


  const handleDeleteMetric = useCallback((metric: MetricWithData) => {
    setDeleteTarget({ type: 'metric', id: metric.id, name: metric.display_name })
    setDeleteConfirmationOpen(true)
  }, [])

  // Memoize sections mapping to prevent unnecessary re-renders
  const memoizedSections = useMemo(() => {
    return sections.map(section => ({
      id: section.id,
      display_name: section.display_name,
      name: section.name,
      metrics: section.metrics.map(metric => ({
        id: metric.id,
        section_id: section.id,
        name: metric.name,
        display_name: metric.display_name,
        description: metric.description,
        default_unit: metric.default_unit,
        unit: metric.unit,
        reference_data: metric.reference_data,
        data_type: metric.data_type || 'number',
        is_default: metric.is_default || false,
        created_at: metric.created_at || new Date().toISOString(),
        created_by: metric.created_by || 0
      }))
    }))
  }, [sections])

  // Memoize availableMetrics mapping to prevent unnecessary re-renders
  const memoizedAvailableMetrics = useMemo(() => {
    return (selectedSectionForValue?.metrics || []).map((metric) => ({
      id: metric.id,
      section_id: selectedSectionForValue?.id || 0,
      name: metric.name,
      display_name: metric.display_name,
      description: metric.description,
      default_unit: metric.default_unit,
      unit: metric.unit,
      reference_data: metric.reference_data,
      data_type: 'number',
      is_default: false,
      created_at: new Date().toISOString(),
      created_by: 1
    }))
  }, [selectedSectionForValue])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'section') {
        // Delete section (this will cascade delete metrics and records)
        await HealthRecordsApiService.deleteSection(deleteTarget.id)
        toast.success('Section deleted successfully!')
      } else if (deleteTarget.type === 'metric') {
        // Delete metric (this will cascade delete records)
        await HealthRecordsApiService.deleteMetric(deleteTarget.id)
        toast.success('Metric deleted successfully!')
        
        // Close the metric detail dialog if it's open for the deleted metric
        if (selectedMetric && selectedMetric.id === deleteTarget.id) {
          setMetricDetailDialogOpen(false)
          setSelectedMetric(null)
        }
      }
      
      setDeleteConfirmationOpen(false)
      setDeleteTarget(null)
      refresh()
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error('Failed to delete. Please try again.')
    }
  }, [deleteTarget, refresh, selectedMetric])

  // Determine status based on reference range
  const getStatusFromValue = (value: number, referenceRange: string): "normal" | "abnormal" | "critical" => {
    if (!referenceRange || referenceRange === 'Reference range not specified' || referenceRange === 'N/A') return "normal"
    
    // Use the numeric value directly
    const numericValue = Number(value) || 0
    
    // Handle different reference range formats
    if (referenceRange.includes(' - ')) {
      // Range format: "10 - 20"
      const [minStr, maxStr] = referenceRange.split(' - ')
      const min = parseFloat(minStr)
      const max = parseFloat(maxStr)
      if (!isNaN(min) && !isNaN(max)) {
        return (numericValue >= min && numericValue <= max) ? "normal" : "abnormal"
      }
    } else if (referenceRange.includes('≤')) {
      // Less than or equal: "≤ 120"
      const threshold = parseFloat(referenceRange.replace('≤', '').trim())
      if (!isNaN(threshold)) {
        return numericValue <= threshold ? "normal" : "abnormal"
      }
    } else if (referenceRange.includes('≥')) {
      // Greater than or equal: "≥ 60"
      const threshold = parseFloat(referenceRange.replace('≥', '').trim())
      if (!isNaN(threshold)) {
        return numericValue >= threshold ? "normal" : "abnormal"
      }
    } else if (referenceRange.includes('<')) {
      // Less than: "< 120"
      const threshold = parseFloat(referenceRange.replace('<', '').trim())
      if (!isNaN(threshold)) {
        return numericValue < threshold ? "normal" : "abnormal"
      }
    } else if (referenceRange.includes('>')) {
      // Greater than: "> 60"
      const threshold = parseFloat(referenceRange.replace('>', '').trim())
      if (!isNaN(threshold)) {
        return numericValue > threshold ? "normal" : "abnormal"
      }
    }
    
    return "normal"
  }

  // Helper function to get gender-specific reference range
  const getGenderSpecificReferenceRange = (metric: MetricWithData) => {
    if (!metric.reference_data) return 'Reference range not specified'
    
    const userGender = user?.user_metadata?.gender?.toLowerCase()
    const gender = userGender === 'female' ? 'female' : 'male'
    const genderData = metric.reference_data[gender]
    
    return formatReferenceRange(genderData?.min, genderData?.max)
  }

  // Render metric box
  const renderMetricBox = (metric: MetricWithData) => {
    // Get the latest data point
    const latestDataPoint = metric.data_points && metric.data_points.length > 0 ? metric.data_points[metric.data_points.length - 1] : null
    const referenceRange = getGenderSpecificReferenceRange(metric)
    const calculatedStatus = latestDataPoint ? getStatusFromValue(latestDataPoint.value, referenceRange) : 'normal'
    
    const currentValue = latestDataPoint ? formatMetricValue(latestDataPoint.value) : "N/A"
    const unit = metric.default_unit || metric.unit

    // Prepare chart data
    const chartData = metric.data_points ? metric.data_points.map((item: HealthRecord, index: number) => ({
      date: new Date(item.recorded_at),
      value: Number(item.value) || 0,
      id: `${metric.id}-${index}`,
      originalValue: item.value
    })) : []

    return (
      <div key={metric.id} className="bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleMetricClick(metric)}>
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-sm">{metric.display_name}</h3>
          <Badge
            variant={calculatedStatus === "normal" ? "outline" : "secondary"}
            className={`${calculatedStatus === "normal" ? "text-green-600" : "text-red-600"} text-xs py-0 px-1 h-5`}
          >
            {calculatedStatus === "normal" ? (
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
        </div>
        <div className="mt-1">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold">{currentValue}</span>
            {unit && <span className="text-xs text-muted-foreground font-normal">{unit}</span>}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Reference range: {referenceRange}
          </p>

          {chartData.length > 0 && (
            <div className="h-[60px] mt-2">
              <HealthMetricsChart
                data={chartData}
                metricName={metric.display_name}
                options={{
                  fontSize: 8,
                  tickCount: 3,
                  roundValues: true,
                }}
              />
            </div>
          )}

          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {chartData.length} entries
              </Badge>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {title}
              </CardTitle>
              <CardDescription>
                {description}
              </CardDescription>
            </div>
            {/* Only show action buttons if not viewing another patient (read-only mode) */}
            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <Button onClick={() => setNewSectionDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Section
                </Button>
                <Button
                  onClick={() => {
                    // Open dialog without pre-selecting a section
                    setSelectedSectionForMetric(null)
                    setNewMetricDialogOpen(true)
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={displaySections.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  New Metric
                </Button>
                <Button 
                  onClick={() => {
                    // Find the first section to add a value to
                    const firstSection = displaySections[0]
                    if (firstSection) {
                      setSelectedSectionForValue(firstSection)
                      setNewValueDialogOpen(true)
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={displaySections.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  New Value
                </Button>
              </div>
            )}
            {isReadOnly && (
              <div className="text-sm text-muted-foreground">
                Viewing another patient's data (read-only)
              </div>
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
                {!isReadOnly ? (
                  <>
                    <p className="text-gray-600 mb-4">Create your first section to start tracking your health data</p>
                    <Button onClick={() => setNewSectionDialogOpen(true)}>
                      Create First Section
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-600">No health record data available for this patient.</p>
                )}
              </div>
            </div>
          ) : (
            <Accordion 
              type="multiple" 
              className="w-full space-y-4"
              value={openAccordionItems}
              onValueChange={setOpenAccordionItems}
            >
              {displaySections.map((section) => (
                <AccordionItem key={section.id} value={section.id.toString()} className="border rounded-lg">
                  <div className="flex items-center justify-between px-4 py-2">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-left">{section.display_name}</h3>
                        {section.description && (
                          <span className="text-sm text-gray-500">- {section.description}</span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {section.metrics?.length || 0} metrics
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    {/* Only show edit/delete buttons if not viewing another patient (read-only mode) */}
                    {!isReadOnly && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSection(section)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSection(section)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <AccordionContent className="px-4 pb-2">
                    {section.metrics && section.metrics.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {section.metrics.map((metric) => renderMetricBox(metric))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
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
        healthRecordTypeId={healthRecordTypeId}
        createSection={createSection}
      />

      <EditSectionDialog
        open={editSectionDialogOpen}
        onOpenChange={setEditSectionDialogOpen}
        section={selectedSectionForEdit}
        onSectionUpdated={handleSectionUpdated}
        updateSection={updateSection}
      />

      <NewMetricDialog
        open={newMetricDialogOpen}
        onOpenChange={setNewMetricDialogOpen}
        onMetricCreated={handleMetricCreated}
        sectionId={selectedSectionForMetric?.id || 0}
        sectionName={selectedSectionForMetric?.display_name || ''}
        sections={sections}
        healthRecordTypeId={healthRecordTypeId}
        createMetric={createMetric}
      />

      <NewValueDialogWithSpecial
        open={newValueDialogOpen}
        onOpenChange={setNewValueDialogOpen}
        onValueCreated={handleValueCreated}
        sectionId={selectedSectionForValue?.id || 0}
        sectionName={selectedSectionForValue?.display_name || ''}
        sections={memoizedSections}
        availableMetrics={memoizedAvailableMetrics}
        createRecord={createRecord}
      />

      {selectedMetric && (
        <MetricDetailDialog
          open={metricDetailDialogOpen}
          onOpenChange={setMetricDetailDialogOpen}
          metric={{
            ...selectedMetric,
            unit: selectedMetric.unit || selectedMetric.default_unit || 'N/A',
            data_type: selectedMetric.data_type || 'number'
          }}
          dataPoints={selectedMetric.data_points || []}
          onDataUpdated={() => {
            refresh()
            if (onDataUpdated) {
              setTimeout(() => {
                onDataUpdated()
              }, 1000)
            }
          }}
          onDeleteMetric={!isReadOnly ? () => handleDeleteMetric(selectedMetric) : undefined}
          updateMetric={!isReadOnly ? updateMetric : undefined}
          patientId={patientId}
          isReadOnly={isReadOnly}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.type || 'item'}`}
        description={`Are you sure you want to delete this ${deleteTarget?.type || 'item'}? This action cannot be undone.`}
        itemName={deleteTarget?.name || ''}
      />
    </>
  )
}
