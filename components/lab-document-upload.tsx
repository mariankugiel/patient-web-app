'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { useLanguage } from '@/contexts/language-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import apiClient from '@/lib/api/axios-config'

interface LabAnalysisResult {
  metric_name: string
  value: string
  unit: string
  reference_range: string
  status: 'normal' | 'abnormal' | 'critical'
  confidence: number
  type_of_analysis: string
  date_of_value: string
}

interface LabDocumentUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAnalysisComplete: (results: LabAnalysisResult[]) => void
}

export function LabDocumentUpload({ open, onOpenChange, onAnalysisComplete }: LabDocumentUploadProps) {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<LabAnalysisResult[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmedResults, setConfirmedResults] = useState<LabAnalysisResult[]>([])
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set())
  const [editableResults, setEditableResults] = useState<LabAnalysisResult[]>([])
  const [originalLabData, setOriginalLabData] = useState<any[]>([])
  const [s3Url, setS3Url] = useState<string>('')
  
  // Original form fields
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0])
  const [docType, setDocType] = useState('')
  const [provider, setProvider] = useState('Lab Corp')
  const [isDragOver, setIsDragOver] = useState(false)

  // Function to determine status based on value and reference range
  const determineStatus = (value: string, referenceRange: string): 'normal' | 'abnormal' | 'critical' => {
    if (!referenceRange || !value) return 'normal'
    
    try {
      const numValue = parseFloat(value)
      if (isNaN(numValue)) return 'normal'
      
      // Parse reference range (e.g., "3.90 - 5.10" or "74 - 106")
      const rangeMatch = referenceRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/)
      if (!rangeMatch) return 'normal'
      
      const minValue = parseFloat(rangeMatch[1])
      const maxValue = parseFloat(rangeMatch[2])
      
      if (numValue < minValue || numValue > maxValue) {
        // Determine if it's critical or just abnormal based on how far outside the range
        const range = maxValue - minValue
        const deviation = Math.min(Math.abs(numValue - minValue), Math.abs(numValue - maxValue))
        
        if (deviation > range * 0.5) { // More than 50% outside range
          return 'critical'
        } else {
          return 'abnormal'
        }
      }
      
      return 'normal'
    } catch (error) {
      return 'normal'
    }
  }

  // Function to update a specific result
  const updateResult = (index: number, field: keyof LabAnalysisResult, value: string) => {
    const updated = [...editableResults]
    updated[index] = { ...updated[index], [field]: value }
    
    // Recalculate status if value or reference range changed
    if (field === 'value' || field === 'reference_range') {
      updated[index].status = determineStatus(
        field === 'value' ? value : updated[index].value,
        field === 'reference_range' ? value : updated[index].reference_range
      )
    }
    
    setEditableResults(updated)
  }

  // Function to start editing a specific row
  const startEditingRow = (index: number) => {
    setEditingRows(prev => new Set(prev).add(index))
    // Initialize editable results if not already done
    if (editableResults.length === 0) {
      setEditableResults([...analysisResults])
    }
  }

  // Function to cancel editing a specific row
  const cancelEditingRow = (index: number) => {
    setEditingRows(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
    // Reset the row to original values
    const updated = [...editableResults]
    updated[index] = { ...analysisResults[index] }
    setEditableResults(updated)
  }

  // Function to save changes for a specific row
  const saveRowChanges = (index: number) => {
    setEditingRows(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
    // Update the analysis results with the edited values
    const updated = [...analysisResults]
    updated[index] = { ...editableResults[index] }
    setAnalysisResults(updated)
  }

  // Function to delete a specific row
  const deleteRow = (index: number) => {
    const updated = [...analysisResults]
    updated.splice(index, 1)
    setAnalysisResults(updated)
    
    // Also update editable results if it exists
    if (editableResults.length > 0) {
      const updatedEditable = [...editableResults]
      updatedEditable.splice(index, 1)
      setEditableResults(updatedEditable)
    }
    
    // Remove from editing rows if it was being edited
    setEditingRows(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      // Adjust indices for rows after the deleted one
      const adjustedSet = new Set<number>()
      newSet.forEach(rowIndex => {
        if (rowIndex > index) {
          adjustedSet.add(rowIndex - 1)
        } else if (rowIndex < index) {
          adjustedSet.add(rowIndex)
        }
      })
      return adjustedSet
    })
  }


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File change triggered, files:', event.target.files)
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please select a PDF file')
        // Reset the input
        event.target.value = ''
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        // Reset the input
        event.target.value = ''
        return
      }
      setFile(selectedFile)
    }
  }

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setFile(null)
  }

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
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        toast.error('Please select a PDF file')
        return
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setFile(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    if (!docType) {
      toast.error('Please select a document type')
      return
    }

    if (!docDate) {
      toast.error('Please select a document date')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (description) {
        formData.append('description', description)
      }
      if (docDate) {
        formData.append('doc_date', docDate)
      }
      if (docType) {
        formData.append('doc_type', docType)
      }
      if (provider) {
        formData.append('provider', provider)
      }

      const response = await apiClient.post('/lab-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const result = response.data
      
      // Transform the backend response to our frontend format
      const transformedResults: LabAnalysisResult[] = result.lab_data.map((record: any) => {
        const value = record.value?.toString() || ''
        const referenceRange = record.reference || record.reference_range || ''
        const status = determineStatus(value, referenceRange)
        
        return {
          metric_name: record.metric_name || record.name,
          value: value,
          unit: record.unit || '',
          reference_range: referenceRange,
          status: status,
          confidence: record.confidence || 0.8,
          type_of_analysis: record.type_of_analysis || 'Unknown',
          date_of_value: record.date_of_value || new Date().toISOString().split('T')[0]
        }
      })

      // Store the original lab data for bulk processing
      setOriginalLabData(result.lab_data)
      
      // Store the S3 URL for later use in bulk processing
      setS3Url(result.s3_url || '')

      setAnalysisResults(transformedResults)
      setShowConfirmation(true)
      toast.success('Document analyzed successfully!')
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to analyze document')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmResults = async () => {
    try {
      setUploading(true)
      
      // Prepare data for bulk endpoint using current analysis results (which may have been edited)
      const bulkData = {
        records: analysisResults.map(result => ({
          lab_name: provider || 'Unknown Lab',
          type_of_analysis: result.type_of_analysis || 'General Lab Analysis',
          metric_name: result.metric_name,
          date_of_value: result.date_of_value || docDate, // Use extracted date first, fallback to user input
          value: result.value,
          unit: result.unit || '',
          reference: result.reference_range || ''
        })),
        file_name: file?.name || 'lab_document.pdf',
        description: description,
        s3_url: s3Url,
        lab_test_date: analysisResults[0]?.date_of_value || docDate, // Save lab test date
        lab_test_name: docType, // Save lab test type
        provider: provider // Save provider
      }

      // Call bulk endpoint to create health records
      const response = await apiClient.post('/lab-documents/bulk', bulkData)
      
      if (response.data.success) {
        setConfirmedResults(analysisResults)
        onAnalysisComplete(analysisResults)
        setShowConfirmation(false)
        setAnalysisResults([])
        setFile(null)
        setDescription('')
        onOpenChange(false)
        toast.success(`Successfully created ${response.data.created_records_count} health records!`)
      } else {
        toast.error('Failed to create health records')
      }
    } catch (error) {
      console.error('Error creating health records:', error)
      toast.error('Failed to create health records')
    } finally {
      setUploading(false)
    }
  }

  const handleRejectResults = () => {
    setShowConfirmation(false)
    setAnalysisResults([])
    toast.info('Analysis results rejected')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'abnormal':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>
      case 'abnormal':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Abnormal</Badge>
      case 'critical':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Critical</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <>
      {/* Upload Dialog */}
      <Dialog open={open && !showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Lab Document
            </DialogTitle>
            <DialogDescription>
              Upload a PDF lab report for automatic analysis and data extraction
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="docDate">{t("health.date")} <span className="text-red-500">*</span></Label>
              <Input
                id="docDate"
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="docType">{t("health.type")} <span className="text-red-500">*</span></Label>
              <Select value={docType} onValueChange={setDocType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
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
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="Healthcare provider name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="file">{t("health.file")}</Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragOver 
                    ? 'border-primary bg-primary/10' 
                    : file 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-sm text-primary">
                      <span className="font-medium">{file.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
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
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description for this lab report..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analysis Results Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={(open) => {
        if (!open) {
          // Show warning when trying to close without confirming/rejecting
          const confirmed = window.confirm(
            'Are you sure you want to close? You will lose the extracted lab data and need to upload and analyze again.'
          )
          if (confirmed) {
            setShowConfirmation(false)
            setAnalysisResults([])
            setFile(null)
            setDescription('')
            onOpenChange(false)
          }
        } else {
          setShowConfirmation(open)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Analysis Results
            </DialogTitle>
            <DialogDescription>
              Review the extracted lab values and confirm to add them to your health records
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {analysisResults.map((result, index) => {
              const isRowEditing = editingRows.has(index)
              const displayResult = isRowEditing ? editableResults[index] || result : result
              
              return (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isRowEditing ? (
                          <Input
                            value={displayResult.metric_name}
                            onChange={(e) => updateResult(index, 'metric_name', e.target.value)}
                            className="font-medium"
                          />
                        ) : (
                          <h4 className="font-medium">{displayResult.metric_name}</h4>
                        )}
                        {getStatusIcon(displayResult.status)}
                        {getStatusBadge(displayResult.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Value:</span>
                          {isRowEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                value={displayResult.value}
                                onChange={(e) => updateResult(index, 'value', e.target.value)}
                                className="w-20"
                              />
                              <Input
                                value={displayResult.unit}
                                onChange={(e) => updateResult(index, 'unit', e.target.value)}
                                className="w-16"
                                placeholder="Unit"
                              />
                            </div>
                          ) : (
                            <span className="ml-2 font-medium">
                              {displayResult.value} {displayResult.unit}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-600">Reference:</span>
                          {isRowEditing ? (
                            <Input
                              value={displayResult.reference_range}
                              onChange={(e) => updateResult(index, 'reference_range', e.target.value)}
                              className="mt-1"
                              placeholder="e.g., 3.90 - 5.10"
                            />
                          ) : (
                            <span className="ml-2">{displayResult.reference_range}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-gray-600">Section:</span>
                          <span className="ml-2 font-medium text-blue-600">
                            {displayResult.type_of_analysis}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <span className="ml-2 font-medium">
                            {(() => {
                              try {
                                // Handle DD-MM-YYYY format
                                if (displayResult.date_of_value.includes('-') && displayResult.date_of_value.split('-')[0].length === 2) {
                                  const [day, month, year] = displayResult.date_of_value.split('-')
                                  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString()
                                }
                                // Handle other formats
                                return new Date(displayResult.date_of_value).toLocaleDateString()
                              } catch (e) {
                                return displayResult.date_of_value
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-gray-600 text-sm">Confidence:</span>
                        <span className="ml-2 text-sm">
                          {Math.round(displayResult.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Action buttons for each row */}
                    <div className="flex items-center gap-2 ml-4">
                      {isRowEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelEditingRow(index)}
                            className="h-8 w-8 p-0"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveRowChanges(index)}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingRow(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteRow(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRejectResults}>
                Reject Results
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmResults} 
                disabled={uploading}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Records...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm & Add to Records
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
