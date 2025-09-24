"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ProfessionalPagination } from "@/components/ui/professional-pagination"
import { Edit, Trash2, Save, X, Calendar, Activity } from "lucide-react"
import { format } from "date-fns"
import { toast } from "react-toastify"
import { HealthRecordsApiService, HealthRecord } from "@/lib/api/health-records-api"
import { MetricValueEditor } from "./metric-value-editor"
import { EditMetricDialog } from "./edit-metric-dialog"
import { formatReferenceRange } from "@/hooks/use-health-records"
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

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
    reference_data?: any
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
  }) => Promise<void>
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
  updateMetric
}: MetricDetailDialogProps) {
  const { user } = useSelector((state: RootState) => state.auth)
  const [records, setRecords] = useState<EditableRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)
  const [editMetricDialogOpen, setEditMetricDialogOpen] = useState(false)

  // Helper function to get gender-specific reference range
  const getGenderSpecificReferenceRange = () => {
    if (!metric.reference_data) return 'Reference range not specified'
    
    const userGender = user?.user_metadata?.gender?.toLowerCase()
    const gender = userGender === 'female' ? 'female' : 'male'
    const genderData = metric.reference_data[gender]
    
    return formatReferenceRange(genderData?.min, genderData?.max)
  }

  // Helper function to calculate status based on value and reference range
  const calculateStatus = (value: any) => {
    if (!metric.reference_data) return 'normal'
    
    const userGender = user?.user_metadata?.gender?.toLowerCase()
    const gender = userGender === 'female' ? 'female' : 'male'
    const genderData = metric.reference_data[gender]
    
    if (genderData?.min !== undefined && genderData?.max !== undefined) {
      // Extract numeric value from the wrapped value
      const numericValue = typeof value === 'object' && value !== null ? value.value : value
      const numValue = parseFloat(numericValue)
      
      if (!isNaN(numValue)) {
        if (numValue < genderData.min || numValue > genderData.max) {
          return 'abnormal'
        }
      }
    }
    
    return 'normal'
  }

  useEffect(() => {
    if (open && dataPoints) {
      setRecords(dataPoints.map(dp => ({
        ...dp,
        isEditing: false,
        tempValue: typeof dp.value === 'object' ? JSON.stringify(dp.value) : String(dp.value),
        tempStatus: dp.status,
        tempDate: dp.recorded_at ? format(new Date(dp.recorded_at), 'yyyy-MM-dd') : ''
      })))
    }
  }, [open, dataPoints])

  const totalPages = Math.ceil(records.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = records.slice(startIndex, endIndex)

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
      let parsedValue = record.tempValue
      
      // The MetricValueEditor already handles the parsing, so we can use the value directly
      // Wrap the value in the expected dictionary format for the backend
      let wrappedValue: Record<string, any>
      if (typeof parsedValue === 'string' && parsedValue.trim() === '') {
        wrappedValue = { value: null }
      } else if (typeof parsedValue === 'object' && parsedValue !== null) {
        // For structured metrics (like blood pressure), use the object directly
        wrappedValue = parsedValue
      } else {
        // For simple metrics, wrap the value in a 'value' key
        wrappedValue = { value: parsedValue }
      }

      // Calculate status based on the new value and reference range
      const calculatedStatus = calculateStatus(wrappedValue)

      // Convert date string to datetime format (add time if not present)
      const recordedAt = record.tempDate.includes('T') 
        ? record.tempDate 
        : `${record.tempDate}T00:00:00`

      await HealthRecordsApiService.updateHealthRecord(recordId, {
        value: wrappedValue,
        status: calculatedStatus,
        recorded_at: recordedAt
      })

      setRecords(prev => prev.map(r => 
        r.id === recordId 
          ? { 
              ...r, 
              isEditing: false,
              value: wrappedValue,
              status: calculatedStatus,
              recorded_at: recordedAt
            }
          : r
      ))

      toast.success('Record updated successfully')
      onDataUpdated()
    } catch (error) {
      console.error('Error updating record:', error)
      toast.error('Failed to update record')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return

    setLoading(true)
    try {
      await HealthRecordsApiService.deleteHealthRecord(recordId)
      
      setRecords(prev => prev.filter(r => r.id !== recordId))
      toast.success('Record deleted successfully')
      onDataUpdated()
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('Failed to delete record')
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

  const formatValue = (value: any) => {
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
      toast.error('Edit functionality is not available')
      return
    }
    setEditMetricDialogOpen(true)
  }

  const handleMetricUpdated = (updatedMetric: any) => {
    onDataUpdated()
    setEditMetricDialogOpen(false)
  }

  const handleDeleteMetric = () => {
    if (onDeleteMetric) {
      onDeleteMetric()
    } else {
      console.log('Delete metric:', metric)
      toast.info('Metric deletion will be implemented')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {metric.display_name} - Detailed Records
              <Badge variant="outline" className="ml-2">
                {records.length} records
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditMetric()}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Metric
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteMetric()}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Metric
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Metric Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Unit</Label>
              <p className="text-sm">{metric.unit || metric.default_unit || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Data Type</Label>
              <p className="text-sm capitalize">{metric.data_type}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Reference Range</Label>
              <p className="text-sm">
                {getGenderSpecificReferenceRange()}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[150px]">Value</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Source</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
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
                      {record.isEditing ? (
                        <div className="min-w-[200px]">
                          <MetricValueEditor
                            metricName={metric.display_name}
                            dataType={metric.data_type}
                            currentValue={record.tempValue}
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
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {record.source || 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.isEditing ? (
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
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <ProfessionalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={records.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage)
              setCurrentPage(1) // Reset to first page when changing items per page
            }}
          />
        </div>
      </DialogContent>

      {/* Edit Metric Dialog */}
      <EditMetricDialog
        open={editMetricDialogOpen}
        onOpenChange={setEditMetricDialogOpen}
        onMetricUpdated={handleMetricUpdated}
        metric={metric}
        updateMetric={updateMetric || (() => Promise.resolve())}
      />
    </Dialog>
  )
}
