'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye, Edit, Calendar, MapPin, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { medicalImagesApiService, MedicalImageData } from '@/lib/api/medical-images-api'
import { EditExamDialog } from './edit-exam-dialog'
import { toast } from 'react-toastify'

interface MedicalImageListProps {
  onImageUploaded?: () => void
  refreshTrigger?: number
}

export function MedicalImageList({ onImageUploaded, refreshTrigger }: MedicalImageListProps) {
  const [images, setImages] = useState<MedicalImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<number | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<MedicalImageData | null>(null)

  useEffect(() => {
    fetchImages()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchImages()
    }
  }, [refreshTrigger])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await medicalImagesApiService.getMedicalImages(0, 100) // Get more images
      setImages(response.images || [])
    } catch (error) {
      console.error('Error fetching medical images:', error)
      toast.error('Failed to load medical images')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (imageId: number, filename: string) => {
    try {
      setViewing(imageId)
      const response = await medicalImagesApiService.getMedicalImageViewUrl(imageId)
      
      // Open file in new tab for viewing only
      window.open(response.download_url, '_blank')
      
      toast.success('Opening file in new tab')
    } catch (error) {
      console.error('Error viewing image:', error)
      toast.error('Failed to open image')
    } finally {
      setViewing(null)
    }
  }

  const handleEdit = (exam: MedicalImageData) => {
    setSelectedExam(exam)
    setEditDialogOpen(true)
  }

  const handleExamUpdated = (updatedExam: MedicalImageData) => {
    setImages(prev => prev.map(img => 
      img.id === updatedExam.id ? updatedExam : img
    ))
    setEditDialogOpen(false)
    setSelectedExam(null)
  }

  const handleExamDeleted = (examId: number) => {
    setImages(prev => prev.filter(img => img.id !== examId))
    setEditDialogOpen(false)
    setSelectedExam(null)
  }


  const getFindingsBadge = (findings: string) => {
    switch (findings) {
      case 'No Findings':
      case 'No_Findings':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            No Findings
          </Badge>
        )
      case 'Low Risk Findings':
      case 'Low_Risk_Findings':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Low Risk Findings
          </Badge>
        )
      case 'Relevant Findings':
      case 'Relevant_Findings':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Relevant Findings
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            {findings || 'Unknown'}
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Group images by image_type
  const groupedImages = images.reduce((acc, image) => {
    const type = image.image_type || 'Others'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(image)
    return acc
  }, {} as Record<string, MedicalImageData[]>)

  // Sort images within each group by date (newest first)
  Object.keys(groupedImages).forEach(type => {
    groupedImages[type].sort((a, b) => 
      new Date(b.image_date).getTime() - new Date(a.image_date).getTime()
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading medical images...</p>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Images</h3>
        <p className="text-gray-500 mb-6">Upload your first medical image document to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedImages).map(([imageType, typeImages]) => (
        <Card key={imageType} className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              {imageType}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {typeImages.map((image) => (
                <div
                  key={image.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                  onClick={() => handleEdit(image)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-green-600" />
                          {formatDate(image.image_date)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-green-600" />
                          {image.body_part}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-gray-500 truncate">
                          {image.original_filename}
                        </p>
                        {image.conclusions && (
                          <>
                            <span className="text-gray-400">•</span>
                            <p className="text-xs text-blue-600 truncate" title={image.conclusions}>
                              {image.conclusions}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getFindingsBadge(image.findings)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleView(image.id, image.original_filename)
                      }}
                      disabled={viewing === image.id}
                      className="h-8 px-3"
                    >
                      {viewing === image.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(image)
                      }}
                      className="h-8 px-3"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Exam Dialog */}
      <EditExamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onExamUpdated={handleExamUpdated}
        onExamDeleted={handleExamDeleted}
        exam={selectedExam}
      />
    </div>
  )
}