"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Upload } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"

interface HealthRecordsData {
  labResults: Array<{
    id: string
    name: string
    date: string
    file: File | null
    fileName: string
    extractedData?: string
  }>
  images: Array<{
    id: string
    category: string
    date: string
    files: File[]
    fileNames: string[]
    conclusion: string
    status: string
    extractedData?: string
  }>
}

interface HealthRecordsStepProps {
  formData: { healthRecords: HealthRecordsData }
  updateFormData: (data: Partial<HealthRecordsData>) => void
  language: Language
}

export function HealthRecordsStep({ formData, updateFormData, language }: HealthRecordsStepProps) {
  const t = getTranslation(language, "steps.healthRecords")

  // Add new entries
  const addLabResult = () => {
    const newLabResult = {
      id: `lab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      date: "",
      file: null,
      fileName: "",
      extractedData: ""
    }
    updateFormData({
      labResults: [...(formData.healthRecords?.labResults || []), newLabResult]
    })
  }

  const addImage = () => {
    const newImage = {
      id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: "",
      date: "",
      files: [],
      fileNames: [],
      conclusion: "",
      status: "",
      extractedData: ""
    }
    updateFormData({
      images: [...(formData.healthRecords?.images || []), newImage]
    })
  }

  const removeLabResult = (index: number) => {
    const updatedLabResults = [...(formData.healthRecords?.labResults || [])]
    updatedLabResults.splice(index, 1)
    updateFormData({
      labResults: updatedLabResults
    })
  }

  const removeImage = (index: number) => {
    const updatedImages = [...(formData.healthRecords?.images || [])]
    updatedImages.splice(index, 1)
    updateFormData({
      images: updatedImages
    })
  }

  // File upload handlers
  const handleLabFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const updatedLabResults = [...(formData.healthRecords?.labResults || [])]
      updatedLabResults[index] = {
        ...updatedLabResults[index],
        file,
        fileName: file.name,
        extractedData: `Sample extracted data from ${file.name}:\n\n• Test Type: Blood Test\n• Date: ${new Date().toLocaleDateString()}\n• Results: Normal range\n• Notes: No abnormalities detected\n\n[This is simulated data from PDFplumber service]`
      }
      updateFormData({
        labResults: updatedLabResults
      })
    }
  }

  const handleImageFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      const updatedImages = [...(formData.healthRecords?.images || [])]
      updatedImages[index] = {
        ...updatedImages[index],
        files: [...updatedImages[index].files, ...files],
        fileNames: [...updatedImages[index].fileNames, ...files.map(f => f.name)],
        extractedData: `Sample extracted data from medical images:\n\n• Image Type: ${files.map(f => f.name).join(', ')}\n• Date: ${new Date().toLocaleDateString()}\n• Findings: Normal anatomy\n• Recommendations: Follow-up in 6 months\n\n[This is simulated data from PDFplumber service]`
      }
      updateFormData({
        images: updatedImages
      })
    }
  }


  return (
    <div className="space-y-8">

      {/* Lab Results */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle className="text-lg">Lab Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.healthRecords?.labResults || []).map((labResult, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`labName-${index}`}>Test Name</Label>
                  <Input
                    id={`labName-${index}`}
                    value={labResult.name}
                    onChange={(e) => {
                      const updatedLabResults = [...(formData.healthRecords?.labResults || [])]
                      updatedLabResults[index] = { ...updatedLabResults[index], name: e.target.value }
                      updateFormData({
                        labResults: updatedLabResults
                      })
                    }}
                    placeholder="e.g., Blood Test, Urine Test"
                  />
                </div>
                <div>
                  <Label htmlFor={`labDate-${index}`}>Date</Label>
                  <Input
                    id={`labDate-${index}`}
                    type="date"
                    value={labResult.date}
                    onChange={(e) => {
                      const updatedLabResults = [...(formData.healthRecords?.labResults || [])]
                      updatedLabResults[index] = { ...updatedLabResults[index], date: e.target.value }
                      updateFormData({
                        labResults: updatedLabResults
                      })
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  id={`labFile-${index}`}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleLabFileUpload(index, e)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`labFile-${index}`)?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {labResult.fileName || "Upload File"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updatedLabResults = (formData.healthRecords?.labResults || []).filter((_, i) => i !== index)
                    updateFormData({
                      labResults: updatedLabResults
                    })
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Extracted Data Preview */}
              {labResult.extractedData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700">Extracted Data Preview</Label>
                  <div className="mt-2 p-3 bg-white border rounded text-sm text-gray-600 max-h-32 overflow-y-auto">
                    {labResult.extractedData}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addLabResult}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lab Result
          </Button>
        </CardContent>
      </Card>

      {/* Medical Images */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle className="text-lg">Medical Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.healthRecords?.images || []).map((image, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`imageCategory-${index}`}>Category</Label>
                  <Select
                    value={image.category}
                    onValueChange={(value) => {
                      const updatedImages = [...(formData.healthRecords?.images || [])]
                      updatedImages[index] = { ...updatedImages[index], category: value }
                      updateFormData({
                        images: updatedImages
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="x-ray">X-Ray</SelectItem>
                      <SelectItem value="ct-scan">CT Scan</SelectItem>
                      <SelectItem value="mri">MRI</SelectItem>
                      <SelectItem value="ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="mammogram">Mammogram</SelectItem>
                      <SelectItem value="endoscopy">Endoscopy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`imageDate-${index}`}>Date</Label>
                  <Input
                    id={`imageDate-${index}`}
                    type="date"
                    value={image.date}
                    onChange={(e) => {
                      const updatedImages = [...(formData.healthRecords?.images || [])]
                      updatedImages[index] = { ...updatedImages[index], date: e.target.value }
                      updateFormData({
                        images: updatedImages
                      })
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`imageConclusion-${index}`}>Conclusion of the Report</Label>
                  <Input
                    id={`imageConclusion-${index}`}
                    value={image.conclusion || ""}
                    onChange={(e) => {
                      const updatedImages = [...(formData.healthRecords?.images || [])]
                      updatedImages[index] = { ...updatedImages[index], conclusion: e.target.value }
                      updateFormData({
                        images: updatedImages
                      })
                    }}
                    placeholder="Enter conclusion of the report"
                  />
                </div>
                <div>
                  <Label htmlFor={`imageStatus-${index}`}>Status</Label>
                  <Select
                    value={image.status || ""}
                    onValueChange={(value) => {
                      const updatedImages = [...(formData.healthRecords?.images || [])]
                      updatedImages[index] = { ...updatedImages[index], status: value }
                      updateFormData({
                        images: updatedImages
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-findings">No findings</SelectItem>
                      <SelectItem value="low-risk-findings">Low risk findings</SelectItem>
                      <SelectItem value="relevant-findings">Relevant findings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  id={`imageFiles-${index}`}
                  accept=".jpg,.jpeg,.png,.dcm,.dicom"
                  multiple
                  onChange={(e) => handleImageFileUpload(index, e)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`imageFiles-${index}`)?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Images ({image.fileNames.length} files)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updatedImages = (formData.healthRecords?.images || []).filter((_, i) => i !== index)
                    updateFormData({
                      images: updatedImages
                    })
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {image.fileNames.length > 0 && (
                <div className="text-sm text-gray-600">
                  <strong>Uploaded files:</strong> {image.fileNames.join(", ")}
                </div>
              )}
              
              {/* Extracted Data Preview */}
              {image.extractedData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700">Extracted Data Preview</Label>
                  <div className="mt-2 p-3 bg-white border rounded text-sm text-gray-600 max-h-32 overflow-y-auto">
                    {image.extractedData}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addImage}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Medical Image
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
