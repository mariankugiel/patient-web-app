"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ProfessionalPagination } from "@/components/ui/professional-pagination"
import { Edit, Trash2, Save, X, Calendar, Activity, Inbox } from "lucide-react"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { toast } from "react-toastify"
import { HealthRecordsApiService, HealthRecord, HealthRecordMetric } from "@/lib/api/health-records-api"
import { MetricValueEditor } from "./metric-value-editor"
import { EditMetricDialog } from "./edit-metric-dialog"
import { formatReferenceRange } from "@/hooks/use-health-records"
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useLanguage } from '@/contexts/language-context'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface MetricDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metric: {
    id: number
    name?: string
    display_name: string
    description?: string
    unit: string
    default_unit?: string
    reference_data?: Record<string, { min?: number; max?: number }>
    data_type: string
    is_default?: boolean
    created_at?: string
    updated_at?: string
    created_by?: number
    updated_by?: number
  }
  dataPoints: HealthRecord[]
  onDataUpdated: () => void
  onDeleteMetric?: () => void
  updateMetric?: (metricId: number, metricData: {
    name?: string
    display_name?: string
    description?: string
    default_unit?: string
    reference_data?: any
  }) => Promise<HealthRecordMetric>
  patientId?: number | null
  isReadOnly?: boolean
}

interface EditableRecord extends HealthRecord {
  isEditing?: boolean
  tempValue?: string
  tempStatus?: string
  tempDate?: string
}

export function MetricDetailDialog({
  open,
  onOpenChange,
  metric,
  dataPoints,
  onDataUpdated,
  onDeleteMetric,
  updateMetric,
  patientId,
  isReadOnly = false
}: MetricDetailDialogProps) {
  const { t } = useLanguage()
  const { user, profile } = useSelector((state: RootState) => state.auth)
  const [records, setRecords] = useState<EditableRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)
  const [editMetricDialogOpen, setEditMetricDialogOpen] = useState(false)
  
  // Time period filter state
  type TimePeriod = 'daily' | 'weekly' | 'monthly' | '3months' | 'custom'
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('monthly') // Default to monthly
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null)
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null)
  const [customDateRangeOpen, setCustomDateRangeOpen] = useState(false)
  const [fetchingRecords, setFetchingRecords] = useState(false)

  // Get user timezone from profile, fallback to browser timezone
  const userTimezone = useMemo(() => {
    if (profile?.timezone) return profile.timezone
    if (user?.user_metadata?.timezone) return user.user_metadata.timezone
    // Fallback to browser timezone
    if (typeof window !== 'undefined') {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return 'UTC'
      }
    }
    return 'UTC'
  }, [user, profile])
  
  // Helper function to format timestamp with timezone
  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return null
    
    try {
      const date = new Date(timestamp)
      const dateStr = formatInTimeZone(date, userTimezone, 'MMM dd, yyyy')
      const timeStr = formatInTimeZone(date, userTimezone, 'HH:mm:ss')
      
      return (
        <div className="flex flex-col">
          <div className="text-sm">{dateStr}</div>
          <div className="text-xs text-muted-foreground">{timeStr}</div>
        </div>
      )
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return <span className="text-sm">N/A</span>
    }
  }
  
  // Helper function to normalize source name (Nokia -> Withings)
  const normalizeSourceName = (source: string | undefined): string => {
    if (!source) return t('health.dialogs.metricDetail.manual')
    if (source.toLowerCase() === 'nokia') return 'Withings'
    return source
  }

  // Helper function to get gender-specific reference range
  const getGenderSpecificReferenceRange = () => {
    if (!metric.reference_data) return t('health.dialogs.metricDetail.referenceRangeNotSpecified')
    
    const userGender = user?.user_metadata?.gender?.toLowerCase()
    const gender = userGender === 'female' ? 'female' : 'male'
    const genderData = metric.reference_data[gender]
    
    return formatReferenceRange(genderData?.min, genderData?.max)
  }

  // Helper function to calculate status based on value and reference range
  const calculateStatus = (value: number) => {
    if (!metric.reference_data) return 'normal'
    
    const userGender = user?.user_metadata?.gender?.toLowerCase()
    const gender = userGender === 'female' ? 'female' : 'male'
    const genderData = metric.reference_data[gender]
    
    if (genderData?.min !== undefined && genderData?.max !== undefined) {
      // Use the numeric value directly
      const numValue = Number(value)
      
      if (!isNaN(numValue)) {
        if (numValue < genderData.min || numValue > genderData.max) {
          return 'abnormal'
        }
      }
    }
    
    return 'normal'
  }

  // Calculate date range based on selected period
  const getDateRange = useMemo(() => {
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null
    
    switch (selectedPeriod) {
      case 'daily':
        startDate = startOfDay(now)
        endDate = endOfDay(now)
        break
      case 'weekly':
        startDate = startOfWeek(now, { weekStartsOn: 1 }) // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'monthly':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case '3months':
        startDate = startOfMonth(subMonths(now, 2))
        endDate = endOfMonth(now)
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = startOfDay(customStartDate)
          endDate = endOfDay(customEndDate)
        }
        break
    }
    
    return { startDate, endDate }
  }, [selectedPeriod, customStartDate, customEndDate])

  // Fetch records from backend when dialog opens or time period changes
  useEffect(() => {
    if (!open || !metric.id) return

    const fetchRecords = async () => {
      setFetchingRecords(true)
      try {
        const { startDate, endDate } = getDateRange
        
        // Format dates for API (ISO string format)
        // Only send dates if they are set (for custom period, both must be set)
        const startDateStr = startDate ? startDate.toISOString() : undefined
        const endDateStr = endDate ? endDate.toISOString() : undefined
        
        // For custom period, both dates must be set
        if (selectedPeriod === 'custom' && (!startDate || !endDate)) {
          // Don't fetch if custom dates not set
          setFetchingRecords(false)
          return
        }
        
        // Fetch records from backend with date filtering
        const fetchedRecords = await HealthRecordsApiService.getHealthRecords(
          metric.id,
          patientId || undefined,
          startDateStr,
          endDateStr
        )
        
        setRecords(fetchedRecords.map(dp => ({
          ...dp,
          isEditing: false,
          tempValue: typeof dp.value === 'object' ? JSON.stringify(dp.value) : String(dp.value),
          tempStatus: dp.status,
          tempDate: dp.recorded_at ? format(new Date(dp.recorded_at), 'yyyy-MM-dd') : ''
        })))
        
        // Reset to first page when data changes
        setCurrentPage(1)
      } catch (error) {
        console.error('Error fetching records:', error)
        toast.error('Failed to fetch records')
        // Fallback to original dataPoints if fetch fails
        if (dataPoints) {
      setRecords(dataPoints.map(dp => ({
        ...dp,
        isEditing: false,
        tempValue: typeof dp.value === 'object' ? JSON.stringify(dp.value) : String(dp.value),
        tempStatus: dp.status,
        tempDate: dp.recorded_at ? format(new Date(dp.recorded_at), 'yyyy-MM-dd') : ''
      })))
    }
      } finally {
        setFetchingRecords(false)
      }
    }

    fetchRecords()
  }, [open, metric.id, selectedPeriod, customStartDate, customEndDate, patientId])

  // Use records directly (no client-side filtering needed since we fetch filtered data)
  const filteredRecords = records

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = filteredRecords.slice(startIndex, endIndex)
  
  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedPeriod, customStartDate, customEndDate])

  const handleEdit = (recordId: number) => {
    setRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, isEditing: true }
        : { ...record, isEditing: false }
    ))
  }

  const handleCancelEdit = (recordId: number) => {
    setRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { 
            ...record, 
            isEditing: false,
            tempValue: typeof record.value === 'object' ? JSON.stringify(record.value) : String(record.value),
            tempStatus: record.status,
            tempDate: record.recorded_at ? format(new Date(record.recorded_at), 'yyyy-MM-dd') : ''
          }
        : record
    ))
  }

  const handleSave = async (recordId: number) => {
    const record = records.find(r => r.id === recordId)
    if (!record) return

    setLoading(true)
    try {
      const parsedValue = record.tempValue
      
      // The MetricValueEditor already handles the parsing, so we can use the value directly
      // Use the numeric value directly
      const numericValue = typeof parsedValue === 'number' ? parsedValue : Number(parsedValue)
      
      if (isNaN(numericValue)) {
        toast.error(t('health.dialogs.metricDetail.pleaseEnterValidNumber'))
        return
      }

      // Calculate status based on the new value and reference range
      const calculatedStatus = calculateStatus(numericValue)

      // Convert date string to datetime format (add time if not present)
      const recordedAt = record.tempDate?.includes('T') 
        ? record.tempDate 
        : `${record.tempDate || ''}T00:00:00`

      await HealthRecordsApiService.updateHealthRecord(recordId, {
        value: numericValue,
        status: calculatedStatus,
        recorded_at: recordedAt
      })

      setRecords(prev => prev.map(r => 
        r.id === recordId 
          ? { 
              ...r, 
              isEditing: false,
              value: numericValue,
              status: calculatedStatus,
              recorded_at: recordedAt
            } as EditableRecord
          : r
      ))

      toast.success(t('health.dialogs.metricDetail.recordUpdatedSuccess'))
      onDataUpdated()
    } catch (error) {
      console.error('Error updating record:', error)
      toast.error(t('health.dialogs.metricDetail.failedToUpdateRecord'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (recordId: number) => {
    if (!confirm(t('health.dialogs.metricDetail.deleteRecordConfirm'))) return

    setLoading(true)
    try {
      await HealthRecordsApiService.deleteHealthRecord(recordId)
      
      setRecords(prev => prev.filter(r => r.id !== recordId))
      toast.success(t('health.dialogs.metricDetail.recordDeletedSuccess'))
      onDataUpdated()
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error(t('health.dialogs.metricDetail.failedToDeleteRecord'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800'
      case 'abnormal': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatValue = (value: Record<string, unknown> | string | number) => {
    if (typeof value === 'object' && value !== null) {
      // Handle structured values like {"value": 88} or {"systolic": 120, "diastolic": 80}
      if (value.value !== undefined) {
        // Simple value object like {"value": 88}
        return String(value.value)
      } else if (value.systolic !== undefined && value.diastolic !== undefined) {
        // Blood pressure format
        return `${value.systolic}/${value.diastolic}`
      } else {
        // Fallback to JSON for other complex objects
        return JSON.stringify(value)
      }
    }
    return String(value)
  }

  const handleEditMetric = () => {
    if (!updateMetric) {
      toast.error(t('health.dialogs.metricDetail.editFunctionalityNotAvailable'))
      return
    }
    setEditMetricDialogOpen(true)
  }

  const handleMetricUpdated = () => {
    onDataUpdated()
    setEditMetricDialogOpen(false)
  }

  const handleDeleteMetric = () => {
    if (onDeleteMetric) {
      onDeleteMetric()
    } else {
      console.log('Delete metric:', metric)
      toast.info(t('health.dialogs.metricDetail.metricDeletionWillBeImplemented'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {metric.display_name} - {t('health.dialogs.metricDetail.title')}
              <Badge variant="outline" className="ml-2">
                {records.length} {t('health.dialogs.metricDetail.records')}
              </Badge>
            </DialogTitle>
            {/* Only show edit/delete buttons if not in read-only mode */}
            {!isReadOnly && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditMetric()}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  title={t('health.dialogs.metricDetail.editMetric')}
                  disabled={!updateMetric}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteMetric()}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title={t('health.dialogs.metricDetail.deleteMetric')}
                  disabled={!onDeleteMetric}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Time Period Filter */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-sm font-medium text-muted-foreground mr-2">Time Period:</Label>
              <Button
                variant={selectedPeriod === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('daily')}
                disabled={fetchingRecords}
              >
                Daily
              </Button>
              <Button
                variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('weekly')}
                disabled={fetchingRecords}
              >
                Weekly
              </Button>
              <Button
                variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('monthly')}
                disabled={fetchingRecords}
              >
                Monthly
              </Button>
              <Button
                variant={selectedPeriod === '3months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('3months')}
                disabled={fetchingRecords}
              >
                3 Months
              </Button>
              <Popover open={customDateRangeOpen} onOpenChange={setCustomDateRangeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedPeriod('custom')
                      setCustomDateRangeOpen(true)
                    }}
                    disabled={fetchingRecords}
                  >
                    Custom
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Start Date</Label>
                      <Input
                        type="date"
                        value={customStartDate ? format(customStartDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null
                          setCustomStartDate(date)
                          if (date && customEndDate && date > customEndDate) {
                            setCustomEndDate(null)
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">End Date</Label>
                      <Input
                        type="date"
                        value={customEndDate ? format(customEndDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null
                          setCustomEndDate(date)
                          if (date && customStartDate && date < customStartDate) {
                            toast.error('End date must be after start date')
                            return
                          }
                        }}
                        min={customStartDate ? format(customStartDate, 'yyyy-MM-dd') : undefined}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCustomStartDate(null)
                          setCustomEndDate(null)
                          setSelectedPeriod('monthly')
                          setCustomDateRangeOpen(false)
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (customStartDate && customEndDate) {
                            setCustomDateRangeOpen(false)
                          } else {
                            toast.error('Please select both start and end dates')
                          }
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {selectedPeriod === 'custom' && customStartDate && customEndDate && (
                <span className="text-sm text-muted-foreground ml-2">
                  {format(customStartDate, 'MMM dd, yyyy')} - {format(customEndDate, 'MMM dd, yyyy')}
                </span>
              )}
            </div>
          </div>

          {/* Metric Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('health.dialogs.metricDetail.unit')}</Label>
              <p className="text-sm">{metric.unit || metric.default_unit || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('health.dialogs.metricDetail.dataType')}</Label>
              <p className="text-sm capitalize">{metric.data_type}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('health.dialogs.metricDetail.referenceRange')}</Label>
              <p className="text-sm">
                {getGenderSpecificReferenceRange()}
              </p>
            </div>
          </div>

          {/* Loading indicator */}
          {fetchingRecords && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading records...</div>
            </div>
          )}

          {/* Empty state */}
          {!fetchingRecords && records.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/30">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground mb-2">
                {t('health.dialogs.metricDetail.noRecordsFound')}
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-md">
                {t('health.dialogs.metricDetail.noRecordsDescription')}
              </p>
            </div>
          )}

          {/* Table */}
          {!fetchingRecords && records.length > 0 && (
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">{t('health.dialogs.metricDetail.date')}</TableHead>
                  <TableHead className="w-[150px]">{t('health.dialogs.metricDetail.startTime')}</TableHead>
                  <TableHead className="w-[150px]">{t('health.dialogs.metricDetail.endTime')}</TableHead>
                  <TableHead className="w-[150px]">{t('health.dialogs.metricDetail.value')}</TableHead>
                  <TableHead className="w-[100px]">{t('health.dialogs.metricDetail.status')}</TableHead>
                  <TableHead className="w-[100px]">{t('health.dialogs.metricDetail.source')}</TableHead>
                  <TableHead className="w-[120px]">{t('health.dialogs.metricDetail.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {record.isEditing ? (
                        <Input
                          type="date"
                          value={record.tempDate}
                          onChange={(e) => setRecords(prev => prev.map(r => 
                            r.id === record.id ? { ...r, tempDate: e.target.value } : r
                          ))}
                          className="h-8"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {record.recorded_at ? format(new Date(record.recorded_at), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.start_timestamp ? formatTimestamp(record.start_timestamp) : <span className="text-sm text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {record.data_type !== 'daily' && record.end_timestamp ? formatTimestamp(record.end_timestamp) : <span className="text-sm text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {record.isEditing ? (
                        <div className="min-w-[200px]">
                          <MetricValueEditor
                            metricName={metric.display_name}
                            dataType={metric.data_type}
                            currentValue={record.tempValue || ''}
                            unit={metric.unit}
                            onValueChange={(value) => setRecords(prev => prev.map(r => 
                              r.id === record.id ? { ...r, tempValue: value } : r
                            ))}
                            disabled={loading}
                            showLabel={false}
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-sm">
                          {formatValue(record.value)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status || 'normal')}>
                        {record.status || 'normal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {normalizeSourceName(record.source)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.isEditing && !isReadOnly ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSave(record.id)}
                            disabled={loading}
                            className="h-7 w-7 p-0"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelEdit(record.id)}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        !isReadOnly && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(record.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(record.id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}

          {/* Pagination */}
          {!fetchingRecords && records.length > 0 && (
          <ProfessionalPagination
            currentPage={currentPage}
            totalPages={totalPages}
              totalItems={filteredRecords.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage)
              setCurrentPage(1) // Reset to first page when changing items per page
            }}
          />
          )}
        </div>
      </DialogContent>

      {/* Edit Metric Dialog */}
      <EditMetricDialog
        open={editMetricDialogOpen}
        onOpenChange={setEditMetricDialogOpen}
        onMetricUpdated={handleMetricUpdated}
        metric={{
          ...metric,
          section_id: 0, // This will be provided by the parent component
          name: metric.name || metric.display_name,
          is_default: metric.is_default || false,
          created_at: metric.created_at || new Date().toISOString(),
          created_by: metric.created_by || 0
        }}
        updateMetric={updateMetric || (() => Promise.resolve({} as HealthRecordMetric))}
      />
    </Dialog>
  )
}
