"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-toastify'
import { medicalDocumentsApiService, MedicalDocument, MedicalDocumentUpdate } from '@/lib/api/medical-documents-api'
import apiClient from '@/lib/api/axios-config'
import { formatDateForInput } from '@/lib/date-utils'
import { Loader2, Upload, FileText, CheckCircle, XCircle, AlertTriangle, Edit, Trash2, Languages } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { DuplicateFileDialog } from '@/components/ui/duplicate-file-dialog'

// Function to format reference range display
const formatReferenceRangeDisplay = (result: any, t: (key: string) => string) => {
  // Check if we have parsed reference range data
  if (result.reference_range_parsed) {
    const { min, max } = result.reference_range_parsed
    
    // Both values present
    if (min !== null && min !== undefined && max !== null && max !== undefined) {
      return `${min} - ${max}`
    }
    // Only min value present (>= format)
    else if (min !== null && min !== undefined && (max === null || max === undefined)) {
      return `>=${min}`
    }
    // Only max value present (<= format)
    else if ((min === null || min === undefined) && max !== null && max !== undefined) {
      return `<=${max}`
    }
    // Neither value present
    else {
      return t("health.documents.notSpecified")
    }
  }
  
  // Fallback to original reference_range string
  if (result.reference_range) {
    return result.reference_range
  }
  
  return t("health.documents.notSpecified")
}

interface EditHealthRecordFormProps {
  result: any
  onSave: (updatedResult: any) => void
  onCancel: () => void
}

function EditHealthRecordForm({ result, onSave, onCancel }: EditHealthRecordFormProps) {
  const { t } = useLanguage()
  
  // Use parsed reference range from backend or fallback to parsing
  const getInitialRange = () => {
    // Check if backend provided parsed reference range
    if (result.reference_range_parsed) {
      return {
        min: result.reference_range_parsed.min !== null && result.reference_range_parsed.min !== undefined 
          ? parseFloat(result.reference_range_parsed.min).toFixed(2) : '',
        max: result.reference_range_parsed.max !== null && result.reference_range_parsed.max !== undefined 
          ? parseFloat(result.reference_range_parsed.max).toFixed(2) : ''
      }
    }
    
    // Fallback to parsing the original reference range
    if (!result.reference_range) return { min: '', max: '' }
    if (result.reference_range.includes('-')) {
      const parts = result.reference_range.split('-')
      const minValue = parts[0]?.trim()
      const maxValue = parts[1]?.trim()
      
      // Format with proper precision
      const formatValue = (value: string) => {
        if (!value) return ''
        const num = parseFloat(value)
        return isNaN(num) ? value : num.toFixed(2)
      }
      
      return { 
        min: formatValue(minValue), 
        max: formatValue(maxValue) 
      }
    }
    return { min: '', max: '' }
  }
  
  const initialRange = getInitialRange()
  

  const formattedDate = formatDateForInput(result.date_of_value)
  console.log('Edit form - original date:', result.date_of_value, 'formatted date:', formattedDate) // Debug log

  const [editData, setEditData] = useState({
    metric_name: result.metric_name,
    value: result.value,
    unit: result.unit,
    reference_range_min: initialRange.min,
    reference_range_max: initialRange.max,
    date_of_value: formattedDate
  })

  const handleSave = () => {
    // Create updated reference_range_parsed object
    const reference_range_parsed = {
      min: editData.reference_range_min ? parseFloat(editData.reference_range_min) : null,
      max: editData.reference_range_max ? parseFloat(editData.reference_range_max) : null
    }
    
    // Create comprehensive reference range string for display
    let reference_range = ''
    
    if (editData.reference_range_min && editData.reference_range_max) {
      // Both values present - use range format
      reference_range = `${editData.reference_range_min} - ${editData.reference_range_max}`
    } else if (editData.reference_range_min && !editData.reference_range_max) {
      // Only min value present - use >= format
      reference_range = `>=${editData.reference_range_min}`
    } else if (!editData.reference_range_min && editData.reference_range_max) {
      // Only max value present - use <= format
      reference_range = `<=${editData.reference_range_max}`
    }
    // If both are empty, reference_range remains empty string
    
    onSave({
      ...result,
      ...editData,
      reference_range,
      reference_range_parsed
    })
  }

  return (
    <div className="space-y-4">
      {/* First row: Metric Name, Value, Unit */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <Label htmlFor="edit-metric-name" className="text-sm font-medium">{t("health.documents.metricName")}</Label>
          <Input
            id="edit-metric-name"
            value={editData.metric_name}
            onChange={(e) => setEditData(prev => ({ ...prev, metric_name: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div className="col-span-3">
          <Label htmlFor="edit-value" className="text-sm font-medium">{t("health.documents.value")}</Label>
          <Input
            id="edit-value"
            value={editData.value}
            onChange={(e) => setEditData(prev => ({ ...prev, value: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div className="col-span-3">
          <Label htmlFor="edit-unit" className="text-sm font-medium">{t("health.documents.unit")}</Label>
          <Input
            id="edit-unit"
            value={editData.unit}
            onChange={(e) => setEditData(prev => ({ ...prev, unit: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>
      
      {/* Second row: Date, Reference Range Min, Reference Range Max */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6">
          <Label htmlFor="edit-date" className="text-sm font-medium">{t("health.date")}</Label>
          <Input
            id="edit-date"
            type="date"
            value={editData.date_of_value}
            onChange={(e) => setEditData(prev => ({ ...prev, date_of_value: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div className="col-span-3">
          <Label htmlFor="edit-reference-min" className="text-sm font-medium">Min</Label>
          <Input
            id="edit-reference-min"
            value={editData.reference_range_min}
            onChange={(e) => setEditData(prev => ({ ...prev, reference_range_min: e.target.value }))}
            className="mt-1"
            placeholder="e.g., 3.5"
          />
        </div>
        <div className="col-span-3">
          <Label htmlFor="edit-reference-max" className="text-sm font-medium">Max</Label>
          <Input
            id="edit-reference-max"
            value={editData.reference_range_max}
            onChange={(e) => setEditData(prev => ({ ...prev, reference_range_max: e.target.value }))}
            className="mt-1"
            placeholder="e.g., 5.0"
          />
        </div>
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>
          {t("action.cancel")}
        </Button>
        <Button size="sm" onClick={handleSave}>
          {t("action.save")}
        </Button>
      </div>
    </div>
  )
}

interface LabDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'upload' | 'edit'
  document?: MedicalDocument | null
  onDocumentCreated?: (document: MedicalDocument) => void
  onDocumentUpdated?: (document: MedicalDocument) => void
  onAnalysisComplete?: (results: any[]) => void
}

export function LabDocumentDialog({
  open,
  onOpenChange,
  mode,
  document,
  onDocumentCreated,
  onDocumentUpdated,
  onAnalysisComplete
}: LabDocumentDialogProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showAnalysisResults, setShowAnalysisResults] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any[]>([])  // Original data (for database storage)
  const [editableResults, setEditableResults] = useState<any[]>([])  // Data shown in dialog (translated if available)
  const [originalLabData, setOriginalLabData] = useState<any[]>([])  // Store original lab_data from backend
  const [hasFormChanged, setHasFormChanged] = useState(false)
  const [rejectedResults, setRejectedResults] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [languageInfo, setLanguageInfo] = useState<{
    detected_language?: string
    user_language?: string
    translation_applied?: boolean
  } | null>(null)
  const [similarityInfo, setSimilarityInfo] = useState<{
    sections: Array<{
      name: string
      status: 'new' | 'exist' | 'similar'
      similarity_score: number | null
      existing_section_id: number | null
      existing_display_name: string | null
    }>
    metrics: Array<{
      metric_name: string
      section_name: string
      status: 'new' | 'exist' | 'similar'
      similarity_score: number | null
      existing_metric_id: number | null
      existing_display_name: string | null
    }>
  } | null>(null)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<{
    existingDocument: any
    fileName: string
    fileSize: number
  } | null>(null)
  const [pendingUpload, setPendingUpload] = useState<(() => void) | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    lab_test_date: '',
    lab_test_type: '',
    provider: 'Lab Corp',
    description: '',
    file_name: ''
  })
  const [initialFormData, setInitialFormData] = useState({
    lab_test_date: '',
    lab_test_type: '',
    provider: 'Lab Corp',
    description: '',
    file_name: ''
  })

  // Initialize form data only for edit mode when dialog opens
  useEffect(() => {
    if (open && mode === 'edit' && document) {
      console.log('Edit mode - document data:', document) // Debug log
      
      const newFormData = {
        lab_test_date: formatDateForInput(document.lab_test_date || ''),
        lab_test_type: document.lab_doc_type || '',
        provider: document.provider || '',
        description: document.description || '',
        file_name: document.file_name || ''
      }
      
      console.log('Edit mode - formatted form data:', newFormData) // Debug log
      setFormData(newFormData)
      setInitialFormData(newFormData)
    }
    // For upload mode, only initialize if form is empty (first open)
    else if (open && mode === 'upload' && !formData.lab_test_date) {
      const todayDate = new Date().toISOString().split('T')[0]
      const newFormData = {
        lab_test_date: todayDate,
        lab_test_type: '',
        provider: 'Lab Corp',
        description: '',
        file_name: ''
      }
      setFormData(newFormData)
      setInitialFormData(newFormData)
    }
    
    // Reset similarity info when dialog closes
    if (!open) {
      setSimilarityInfo(null)
    }
  }, [open, mode, document])

  // Track form changes
  useEffect(() => {
    if (mode === 'edit') {
      const hasChanged = Object.keys(formData).some(key => 
        formData[key as keyof typeof formData] !== initialFormData[key as keyof typeof initialFormData]
      ) || selectedFile !== null
      setHasFormChanged(hasChanged)
    }
  }, [formData, initialFormData, selectedFile, mode])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
        if (!formData.file_name) {
          setFormData(prev => ({ ...prev, file_name: file.name }))
        }
        // Auto-analyze and show results for both modes
        handleAnalyze(file)
      } else {
        toast.error('Please upload a PDF file')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
        if (!formData.file_name) {
          setFormData(prev => ({ ...prev, file_name: file.name }))
        }
        // Auto-analyze and show results for both modes
        handleAnalyze(file)
      } else {
        toast.error('Please upload a PDF file')
      }
    }
  }

  const checkSimilarity = async (results: any[]) => {
    try {
      if (!results || results.length === 0) {
        return
      }

      // Extract unique sections and metrics
      const uniqueSections = Array.from(
        new Set(results.map(r => r.type_of_analysis).filter(Boolean))
      ).map(name => ({ name }))

      const metrics = results.map(r => ({
        metric_name: r.metric_name,
        section_name: r.type_of_analysis || 'General Lab Analysis'
      }))

      const similarityRequest = {
        sections: uniqueSections,
        metrics: metrics,
        health_record_type_id: 1
      }

      const response = await apiClient.post(
        '/health-records/health-record-doc-lab/check-similarity',
        similarityRequest
      )

      if (response.data.success) {
        setSimilarityInfo({
          sections: response.data.sections || [],
          metrics: response.data.metrics || []
        })
      }
    } catch (error) {
      console.error('Failed to check similarity:', error)
      // Don't show error to user, just log it
    }
  }

  const getSimilarityTag = (metricName: string, sectionName: string) => {
    if (!similarityInfo) return null

    const metricInfo = similarityInfo.metrics.find(
      m => m.metric_name === metricName && m.section_name === sectionName
    )

    if (!metricInfo) return null

    const tagConfig = {
      exist: {
        label: 'EXIST',
        color: 'bg-green-100 text-green-800 border-green-300',
        tooltip: metricInfo.existing_display_name
          ? `Already exists: ${metricInfo.existing_display_name}`
          : 'Already exists'
      },
      similar: {
        label: 'SIMILAR',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        tooltip: metricInfo.existing_display_name
          ? `Similar to: ${metricInfo.existing_display_name} (${Math.round((metricInfo.similarity_score || 0) * 100)}% match)`
          : `Similar metric found (${Math.round((metricInfo.similarity_score || 0) * 100)}% match)`
      },
      new: {
        label: 'NEW',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        tooltip: 'New metric - will be created'
      }
    }

    const config = tagConfig[metricInfo.status] || tagConfig.new

    return (
      <Badge
        className={`${config.color} border font-medium text-xs px-2 py-0.5`}
        title={config.tooltip}
      >
        {config.label}
        {metricInfo.similarity_score && (
          <span className="ml-1 text-xs opacity-75">
            ({Math.round(metricInfo.similarity_score * 100)}%)
          </span>
        )}
      </Badge>
    )
  }

  const handleAnalyze = async (file: File) => {
    if (!file) return
    
    setAnalyzing(true)
    
    // Show notification that analysis is starting
    toast.info('Analyzing document... This may take a moment.', {
      autoClose: 3000
    })
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      if (formData.lab_test_date) {
        formDataToSend.append('doc_date', formData.lab_test_date)
      }
      if (formData.lab_test_type) {
        formDataToSend.append('doc_type', formData.lab_test_type)
      }
      if (formData.provider) {
        formDataToSend.append('provider', formData.provider)
      }

      const response = await apiClient.post('/health-records/health-record-doc-lab/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // If backend suggests OCR, automatically retry with OCR mode
      if (response.data.success && response.data.suggest_ocr) {
        toast.info('No data found with standard extraction. Trying OCR mode... Please wait.')
        
        // Retry with OCR mode (with extended timeout for OCR processing)
        const formDataOCR = new FormData()
        formDataOCR.append('file', file)
        formDataOCR.append('use_ocr', 'true')
        if (formData.lab_test_date) {
          formDataOCR.append('doc_date', formData.lab_test_date)
        }
        if (formData.lab_test_type) {
          formDataOCR.append('doc_type', formData.lab_test_type)
        }
        if (formData.provider) {
          formDataOCR.append('provider', formData.provider)
        }
        
        const ocrResponse = await apiClient.post('/health-records/health-record-doc-lab/upload', formDataOCR, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000  // 120 seconds (2 minutes) timeout for OCR processing
        })
        
        if (ocrResponse.data.success && ocrResponse.data.lab_data) {
          // Store language info
          setLanguageInfo({
            detected_language: ocrResponse.data.detected_language,
            user_language: ocrResponse.data.user_language,
            translation_applied: ocrResponse.data.translation_applied || false
          })
          
          // Store original data for database storage
          setOriginalLabData(ocrResponse.data.lab_data)
          
          // Use translated data if available for display, otherwise use original
          const dataToUse = ocrResponse.data.translated_data || ocrResponse.data.lab_data
          const extractedDate = dataToUse[0]?.date_of_value || ''
          
          const transformedResults = dataToUse.map((item: any) => ({
            metric_name: item.metric_name || item.name_of_analysis || item.name || 'Unknown Metric',
            value: item.value?.toString() || '',
            unit: item.unit || '',
            reference_range: item.reference || item.reference_range || '',
            reference_range_parsed: item.reference_range_parsed || null,
            status: 'normal',
            confidence: item.confidence || 0.8,
            type_of_analysis: item.type_of_analysis || 'General Lab Analysis',
            date_of_value: item.date_of_value || formData.lab_test_date
          }))
          
          let dateToSet = extractedDate || new Date().toISOString().split('T')[0]
          if (extractedDate && extractedDate.includes('-') && extractedDate.split('-')[0].length === 2) {
            const [day, month, year] = extractedDate.split('-')
            dateToSet = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }
          
          const formattedDate = formatDateForInput(dateToSet)
          setFormData(prev => ({
            ...prev,
            lab_test_date: formattedDate
          }))
          
          setAnalysisResults(transformedResults)
          setEditableResults(transformedResults)
          setShowAnalysisResults(true)
          
          // Check similarity after analysis
          await checkSimilarity(transformedResults)
          
          toast.success('Document analyzed with OCR successfully!')
        } else {
          toast.error('OCR extraction also failed to find data')
        }
        return
      }

      if (response.data.success && response.data.lab_data) {
        // Store language info
        setLanguageInfo({
          detected_language: response.data.detected_language,
          user_language: response.data.user_language,
          translation_applied: response.data.translation_applied || false
        })
        
        // Store original data for database storage
        setOriginalLabData(response.data.lab_data)
        
        // Use translated data if available for display, otherwise use original
        const dataToUse = response.data.translated_data || response.data.lab_data
        // Extract date from analysis results if available
        const extractedDate = dataToUse[0]?.date_of_value || ''
        
        const transformedResults = dataToUse.map((item: any) => ({
          metric_name: item.metric_name || item.name_of_analysis || item.name || 'Unknown Metric',
          value: item.value?.toString() || '',
          unit: item.unit || '',
          reference_range: item.reference || item.reference_range || '',
          reference_range_parsed: item.reference_range_parsed || null, // Include parsed reference range from backend
          status: 'normal', // Will be calculated
          confidence: item.confidence || 0.8,
          type_of_analysis: item.type_of_analysis || 'General Lab Analysis',
          date_of_value: item.date_of_value || formData.lab_test_date
        }))
        
        // Update form data with extracted date if available, otherwise use today's date
        let dateToSet = extractedDate || new Date().toISOString().split('T')[0]
        
        // If extracted date is in DD-MM-YYYY format, convert to YYYY-MM-DD
        if (extractedDate && extractedDate.includes('-') && extractedDate.split('-')[0].length === 2) {
          const [day, month, year] = extractedDate.split('-')
          dateToSet = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        
        const formattedDate = formatDateForInput(dateToSet)
        console.log('Analysis - extracted date:', extractedDate, 'date to set:', dateToSet, 'formatted:', formattedDate)
        setFormData(prev => ({
          ...prev,
          lab_test_date: formattedDate
        }))
        
        setAnalysisResults(transformedResults)
        setEditableResults(transformedResults)
        setShowAnalysisResults(true)
        
        // Check similarity after analysis
        await checkSimilarity(transformedResults)
        
        toast.success('Document analyzed successfully!')
      } else {
        toast.error('Failed to analyze document')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze document')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleConfirmResults = () => {
    setShowAnalysisResults(false)
    toast.success('Results confirmed. Click Upload to save to health records.')
  }

  const handleRejectResults = () => {
    setRejectedResults(true)
    setAnalysisResults([])
    setShowAnalysisResults(false)
    toast.info('Results rejected. Document will be saved without creating health records.')
  }

  const handleEditResult = (index: number) => {
    setEditingIndex(index)
  }

  const handleSaveEdit = (index: number, updatedResult: any) => {
    const newResults = [...editableResults]
    newResults[index] = updatedResult
    setEditableResults(newResults)
    setEditingIndex(null)
    toast.success('Health record entry updated')
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
  }

  // Helper function to reset form after successful upload
  const resetFormAfterSuccess = () => {
    const todayDate = new Date().toISOString().split('T')[0]
    setFormData({
      lab_test_date: todayDate,
      lab_test_type: '',
      provider: 'Lab Corp',
      description: '',
      file_name: ''
    })
    setInitialFormData({
      lab_test_date: todayDate,
      lab_test_type: '',
      provider: 'Lab Corp',
      description: '',
      file_name: ''
    })
    setSelectedFile(null)
    setAnalysisResults([])
    setEditableResults([])
    setOriginalLabData([])
    setShowAnalysisResults(false)
    setHasFormChanged(false)
    setRejectedResults(false)
    setEditingIndex(null)
    setLanguageInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (mode === 'edit' && !document) return

    setLoading(true)
    try {
      let result: MedicalDocument

      if (mode === 'upload') {
        // Upload mode - create new document
        if (!selectedFile) {
          toast.error('Please select a file to upload')
          setLoading(false)
          return
        }

        if (!formData.lab_test_type) {
          toast.error('Please select a document type')
          setLoading(false)
          return
        }

        setUploading(true)
        
        try {
          const uploadFormData = new FormData()
          uploadFormData.append('file', selectedFile)
          uploadFormData.append('description', formData.description || '')
          uploadFormData.append('doc_date', formData.lab_test_date || '')
          uploadFormData.append('doc_type', formData.lab_test_type || '')
          uploadFormData.append('provider', formData.provider || '')
          
          const response = await apiClient.post('/health-records/health-record-doc-lab/upload', uploadFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          
          const uploadResult = response.data
          
          // Check for duplicate file
          if (uploadResult.duplicate_found) {
            setDuplicateInfo({
              existingDocument: uploadResult.existing_document,
              fileName: selectedFile.name,
              fileSize: selectedFile.size
            })
            setPendingUpload(() => async () => {
              // Retry upload after user confirms - call handleSave again
              await handleSave()
            })
            setShowDuplicateDialog(true)
            setUploading(false)
            setLoading(false)
            return
          }
          
          const dateForBackend = formData.lab_test_date || new Date().toISOString().split('T')[0]
          let result: MedicalDocument | null = null
          
          // If we have analysis results and they weren't rejected, create health records via bulk endpoint
          // The bulk endpoint will create both the document and health records
          // Use translated data from editableResults (which contains translated values when translation is applied)
          if (editableResults.length > 0 && !rejectedResults) {
            // Map editableResults back to original data structure
            // editableResults contains translated data when translation is applied, so use that for storage
            const recordsToSend = editableResults.map((editedResult, index) => {
              // Use editedResult first (contains translated data), fall back to original if needed
              // This ensures translated values are saved when translation was applied
              const originalRecord = originalLabData[index] || {}
              return {
                lab_name: formData.provider || 'Unknown Lab',
                type_of_analysis: editedResult.type_of_analysis || originalRecord.type_of_analysis || 'General Lab Analysis',
                metric_name: editedResult.metric_name || originalRecord.metric_name,
                date_of_value: editedResult.date_of_value || dateForBackend,
                value: editedResult.value,  // Use edited value
                unit: editedResult.unit || originalRecord.unit || '',
                reference: editedResult.reference_range || originalRecord.reference || originalRecord.reference_range || ''
              }
            })
            
            const bulkData = {
              records: recordsToSend,
              file_name: selectedFile.name,
              description: formData.description,
              s3_url: uploadResult.s3_url,
              lab_test_date: dateForBackend, // Use the same formatted date
              provider: formData.provider,
              document_type: formData.lab_test_type, // Send document type here
              detected_language: languageInfo?.detected_language || 'en' // Pass detected language for proper source_language storage
            }

            const bulkResponse = await apiClient.post('/health-records/health-record-doc-lab/bulk', bulkData)
            
            if (bulkResponse.data.success) {
              const bulkResult = bulkResponse.data
              const newRecordsCount = bulkResult.created_records_count || bulkResult.created_records?.length || bulkResult.summary?.new_records || 0
              const updatedRecordsCount = bulkResult.updated_records?.length || bulkResult.summary?.updated_records || 0
              
              result = { 
                id: bulkResult.medical_document_id, 
                file_name: selectedFile.name,
                s3_url: uploadResult.s3_url,
                lab_test_date: dateForBackend,
                provider: formData.provider,
                description: formData.description,
                lab_doc_type: formData.lab_test_type,
                general_doc_type: 'lab_result'
              } as MedicalDocument
              
              if (newRecordsCount > 0 && updatedRecordsCount > 0) {
                toast.success(`Successfully created ${newRecordsCount} new health records and updated ${updatedRecordsCount} existing records!`)
              } else if (newRecordsCount > 0) {
                toast.success(`Successfully created ${newRecordsCount} new health records!`)
              } else if (updatedRecordsCount > 0) {
                toast.success(`Updated ${updatedRecordsCount} existing health records!`)
              } else {
                toast.info('No new records were created or updated.')
              }
            }
          } else {
            // If no analysis results or they were rejected, create document without health records
            const documentData = {
              health_record_type_id: 1,
              file_name: selectedFile.name,
              description: formData.description,
              s3_url: uploadResult.s3_url,
              lab_test_date: dateForBackend,
              provider: formData.provider,
              document_type: formData.lab_test_type,
              lab_doc_type: formData.lab_test_type,
              general_doc_type: "lab_result"
            }
            
            const documentResponse = await apiClient.post('/health-records/health-record-doc-lab', documentData)
            result = documentResponse.data
            toast.success('Document saved successfully without health records!')
          }

          if (result) {
            onDocumentCreated?.(result)
            onAnalysisComplete?.(analysisResults)
          }
          
        } catch (error) {
          console.error('Upload error:', error)
          toast.error('Failed to upload document')
          return
        } finally {
          setUploading(false)
          setLoading(false)
        }
        
      } else {
        // Edit mode - update existing document
        if (selectedFile) {
          // Replace file while preserving health records
          setUploading(true)
          
          try {
            // First, replace the file using the new endpoint
            const fileFormData = new FormData()
            fileFormData.append('file', selectedFile)
            
            const fileReplaceResponse = await apiClient.put(
              `/health-records/health-record-doc-lab/${document!.id}/replace-file`,
              fileFormData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              }
            )
            
            if (fileReplaceResponse.data.success) {
              // Then update the document metadata
              const updateData: MedicalDocumentUpdate = {
                lab_doc_type: formData.lab_test_type || undefined,
                lab_test_date: formData.lab_test_date || undefined,
                provider: formData.provider.trim() || '',
                description: formData.description.trim() || ''
                // file_name and s3_url are already updated by the file replacement endpoint
              }

              result = await medicalDocumentsApiService.updateMedicalDocument(
                document!.id,
                updateData
              )
              
              toast.success('File replaced successfully while preserving health records!')
            } else {
              throw new Error('File replacement failed')
            }
            
          } catch (error) {
            console.error('Error replacing file:', error)
            toast.error('Failed to replace file. Please try again.')
            setUploading(false)
            setLoading(false)
            return
          }
          
          setUploading(false)
        } else {
          // Update metadata only
          const updateData: MedicalDocumentUpdate = {
            lab_doc_type: formData.lab_test_type || undefined,
            lab_test_date: formData.lab_test_date || undefined,
            provider: formData.provider.trim() || '',
            description: formData.description.trim() || '',
            file_name: formData.file_name || undefined
          }

          result = await medicalDocumentsApiService.updateMedicalDocument(
            document!.id,
            updateData
          )
        }

        onDocumentUpdated?.(result)
        toast.success('Lab document updated successfully')
      }

      // Reset form after successful upload (not for edit mode)
      if (mode === 'upload') {
        resetFormAfterSuccess()
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving lab document:', error)
      toast.error(`Failed to ${mode} lab document`)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const handleContinueUpload = async () => {
    if (!selectedFile || !pendingUpload) return

    setLoading(true)
    setUploading(true)
    try {
      // Perform the upload again (user has confirmed to continue)
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('description', formData.description || '')
      uploadFormData.append('doc_date', formData.lab_test_date || '')
      uploadFormData.append('doc_type', formData.lab_test_type || '')
      uploadFormData.append('provider', formData.provider || '')
      
      const response = await apiClient.post('/health-records/health-record-doc-lab/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const uploadResult = response.data
      
      // If duplicate found again, show dialog again (shouldn't happen, but handle it)
      if (uploadResult.duplicate_found) {
        setShowDuplicateDialog(true)
        setUploading(false)
        setLoading(false)
        return
      }
      
      // Process the upload result normally
      const dateForBackend = formData.lab_test_date || new Date().toISOString().split('T')[0]
      let result: MedicalDocument | null = null
      
      if (editableResults.length > 0 && !rejectedResults) {
        // Use original lab_data (not translated) for database storage to preserve source language
        // Map editableResults back to original data structure
        const recordsToSend = editableResults.map((editedResult, index) => {
          // If we have original data, use it (preserves original language)
          // But use edited values if user made changes
          const originalRecord = originalLabData[index] || {}
          return {
            lab_name: formData.provider || 'Unknown Lab',
            type_of_analysis: originalRecord.type_of_analysis || editedResult.type_of_analysis || 'General Lab Analysis',
            metric_name: originalRecord.metric_name || editedResult.metric_name,
            date_of_value: editedResult.date_of_value || dateForBackend,
            value: editedResult.value,  // Use edited value
            unit: editedResult.unit || originalRecord.unit || '',
            reference: originalRecord.reference || originalRecord.reference_range || editedResult.reference_range || ''
          }
        })
        
        const bulkData = {
          records: recordsToSend,
          file_name: selectedFile.name,
          description: formData.description,
          s3_url: uploadResult.s3_url,
          lab_test_date: dateForBackend,
          provider: formData.provider,
          document_type: formData.lab_test_type,
          detected_language: languageInfo?.detected_language || 'en' // Pass detected language for proper source_language storage
        }

        const bulkResponse = await apiClient.post('/health-records/health-record-doc-lab/bulk', bulkData)
        
        if (bulkResponse.data.success) {
          const bulkResult = bulkResponse.data
          const newRecordsCount = bulkResult.created_records_count || bulkResult.created_records?.length || bulkResult.summary?.new_records || 0
          const updatedRecordsCount = bulkResult.updated_records?.length || bulkResult.summary?.updated_records || 0
          
          result = { 
            id: bulkResult.medical_document_id, 
            file_name: selectedFile.name,
            s3_url: uploadResult.s3_url,
            lab_test_date: dateForBackend,
            provider: formData.provider,
            description: formData.description,
            lab_doc_type: formData.lab_test_type,
            general_doc_type: 'lab_result'
          } as MedicalDocument
          
          if (newRecordsCount > 0 && updatedRecordsCount > 0) {
            toast.success(`Successfully created ${newRecordsCount} new health records and updated ${updatedRecordsCount} existing records!`)
          } else if (newRecordsCount > 0) {
            toast.success(`Successfully created ${newRecordsCount} new health records!`)
          } else if (updatedRecordsCount > 0) {
            toast.success(`Updated ${updatedRecordsCount} existing health records!`)
          } else {
            toast.info('No new records were created or updated.')
          }
        }
      } else {
        const documentData = {
          health_record_type_id: 1,
          file_name: selectedFile.name,
          description: formData.description,
          s3_url: uploadResult.s3_url,
          lab_test_date: dateForBackend,
          provider: formData.provider,
          document_type: formData.lab_test_type,
          lab_doc_type: formData.lab_test_type,
          general_doc_type: "lab_result"
        }
        
        const documentResponse = await apiClient.post('/health-records/health-record-doc-lab', documentData)
        result = documentResponse.data
        toast.success('Document saved successfully without health records!')
      }

      if (result) {
        onDocumentCreated?.(result)
        onAnalysisComplete?.(analysisResults)
      }

      resetFormAfterSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
      setLoading(false)
    }
  }

  const handleDuplicateCancel = () => {
    setShowDuplicateDialog(false)
    setDuplicateInfo(null)
    setPendingUpload(null)
  }

  const handleDuplicateContinue = () => {
    if (pendingUpload) {
      handleContinueUpload()
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const getTitle = () => {
    return mode === 'upload' ? 'Upload Lab Document' : 'Edit Lab Document'
  }

  const getDescription = () => {
    return mode === 'upload' 
      ? 'Upload a PDF lab report for automatic analysis and data extraction'
      : 'Update lab document information or replace the file'
  }

  const getButtonText = () => {
    if (uploading) return 'Uploading...'
    if (loading) return 'Saving...'
    if (analyzing) return 'Analyzing...'
    if (mode === 'upload' && analysisResults.length > 0) return 'Upload to Health Records'
    return mode === 'upload' ? 'Upload & Analyze' : 'Save Changes'
  }

  const isButtonDisabled = () => {
    if (loading || uploading || analyzing) return true
    if (!formData.lab_test_date || !formData.lab_test_type) return true
    if (mode === 'upload' && !selectedFile) return true
    if (mode === 'edit' && !hasFormChanged) return true
    return false
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="lab_test_date">{t("health.date")} <span className="text-red-500">*</span></Label>
            <Input
              id="lab_test_date"
              type="date"
              value={formData.lab_test_date}
              onChange={(e) => setFormData(prev => ({ ...prev, lab_test_date: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="lab_test_type">{t("health.type")} <span className="text-red-500">*</span></Label>
            <Select value={formData.lab_test_type} onValueChange={(value) => setFormData(prev => ({ ...prev, lab_test_type: value }))} required>
              <SelectTrigger>
                <SelectValue placeholder={t("health.documents.selectDocumentType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Complete Blood Count">{t("health.documents.completeBloodCount")}</SelectItem>
                <SelectItem value="Comprehensive Metabolic Panel">
                  {t("health.documents.comprehensiveMetabolicPanel")}
                </SelectItem>
                <SelectItem value="Lipid Panel">{t("health.documents.lipidPanel")}</SelectItem>
                <SelectItem value="Hemoglobin A1C">{t("health.documents.hemoglobinA1C")}</SelectItem>
                <SelectItem value="Other">{t("health.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="provider">{t("health.provider")}</Label>
            <Input
              id="provider"
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
              placeholder={t("health.documents.healthcareProviderName")}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="file">{mode === 'edit' ? 'Replace File (Optional)' : t("health.file")}</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragOver 
                  ? 'border-primary bg-primary/10' 
                  : selectedFile 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-sm text-primary">
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div className="text-xs text-primary">
                    Click to change file
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">PDF files only, max 10MB</div>
                  {mode === 'edit' && document?.file_name && (
                    <div className="text-xs text-gray-500">Current: {document.file_name}</div>
                  )}
                </div>
              )}
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">{t("health.description")} ({t("common.optional")})</Label>
            <Textarea
              id="description"
              placeholder={t("health.documents.addDescriptionPlaceholder")}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        {/* Show analysis results link for both modes */}
        {(analyzing || analysisResults.length > 0) && (
          <div className="text-center py-2">
            <button
              onClick={() => setShowAnalysisResults(true)}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
              disabled={analyzing}
            >
              {analyzing ? (
                'Analyzing document... (click to view progress)'
              ) : analysisResults.length > 0 ? (
                `View Extracted Results (${analysisResults.length} metrics found)`
              ) : (
                'View Analysis Results'
              )}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading || uploading || analyzing}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isButtonDisabled()}
            className="flex items-center gap-2"
          >
            {(loading || uploading || analyzing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getButtonText()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Analysis Results Dialog */}
    <Dialog open={showAnalysisResults} onOpenChange={(open) => {
        if (!open && !analyzing) {
          setShowAnalysisResults(false)
        } else if (open) {
          setShowAnalysisResults(true)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  {t("health.documents.analyzingDocument")}
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {t("health.documents.analysisResults")}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {analyzing ? (
                t("health.documents.analyzingDocumentPleaseWait")
              ) : (
                <>
                  <span>{t("health.documents.reviewExtractedValues")}</span>
                  {languageInfo?.translation_applied && (
                    <Badge variant="outline" className="min-w-[90px] justify-center ml-3 inline-flex">
                      <Languages className="h-3 w-3 mr-1" />
                      {languageInfo.detected_language?.toUpperCase()} → {languageInfo.user_language?.toUpperCase()}
                    </Badge>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {analyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">{t("health.documents.analyzingYourLabDocument")}</p>
                <p className="text-sm text-gray-500 mt-2">{t("health.documents.thisMayTakeAFewMoments")}</p>
              </div>
            ) : (
              editableResults.length > 0 ? (
                editableResults.map((result, index) => {
                  const isRowEditing = editingIndex === index
                  return (
                    <Card key={index} className="border border-gray-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <h4 className="font-semibold text-lg text-blue-800">
                                {result.metric_name}
                              </h4>
                              {/* Similarity Tag */}
                              {getSimilarityTag(result.metric_name, result.type_of_analysis)}
                              {result.status === 'abnormal' && (
                                <Badge variant="destructive" className="ml-2">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> {t("health.documents.abnormal")}
                                </Badge>
                              )}
                              {result.status === 'normal' && (
                                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" /> {t("health.documents.normal")}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-4 text-sm text-gray-700 mt-1">
                              <div>
                                <span className="font-medium">{t("health.value")}:</span> {result.value} {result.unit}
                              </div>
                              <div>
                                <span className="font-medium">{t("health.referenceRange")}:</span> {formatReferenceRangeDisplay(result, t)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditResult(index)}
                              disabled={isRowEditing}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title={t("common.edit")}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const newResults = editableResults.filter((_, i) => i !== index)
                                setEditableResults(newResults)
                                toast.success('Health record entry removed')
                              }}
                              disabled={isRowEditing}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title={t("common.delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                          <div>
                            <span className="text-gray-600">{t("health.section")}:</span>
                            <span className="ml-2 font-medium text-blue-600">
                              {result.type_of_analysis}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t("health.date")}:</span>
                            <span className="ml-2 font-medium">
                              {(() => {
                                try {
                                  if (result.date_of_value.includes('-') && result.date_of_value.split('-')[0].length === 2) {
                                    const [day, month, year] = result.date_of_value.split('-')
                                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString()
                                  }
                                  return new Date(result.date_of_value).toLocaleDateString()
                                } catch (e) {
                                  return result.date_of_value
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Inline Edit Form */}
                        {isRowEditing && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h5 className="font-medium text-blue-800 mb-3">Edit Health Record Entry</h5>
                            <EditHealthRecordForm
                              result={result}
                              onSave={(updatedResult) => handleSaveEdit(index, updatedResult)}
                              onCancel={handleCancelEdit}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  <p>{t("health.documents.noMetricsFound")}</p>
                  <p className="text-sm mt-2">{t("health.documents.pleaseReviewDocumentOrTryAgain")}</p>
                </div>
              )
            )}
          </div>

        <div className="flex-shrink-0 flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRejectResults}
              disabled={analyzing}
            >
              {t("health.documents.rejectResults")}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleConfirmResults}
              disabled={analyzing}
              className="flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t("common.analyzing")}...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {t("health.documents.confirmResults")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
      <DuplicateFileDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        onCancel={handleDuplicateCancel}
        onContinue={handleDuplicateContinue}
        existingDocument={duplicateInfo?.existingDocument || null}
        fileName={duplicateInfo?.fileName || ''}
        fileSize={duplicateInfo?.fileSize || 0}
      />
    </>
  )
}
