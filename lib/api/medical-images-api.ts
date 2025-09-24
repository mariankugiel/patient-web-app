import apiClient from './axios-config'

export interface MedicalImageData {
  id: number
  image_type: string
  body_part: string
  image_date: string
  findings: string
  conclusions: string
  interpretation: string
  original_filename: string
  file_size_bytes: number
  content_type: string
  s3_key: string
  doctor_name: string
  doctor_number: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ExtractedImageInfo {
  file: string
  date_of_exam: string
  exam_type: string
  body_area: string
  interpretation: string
  conclusions: string
  doctor_name: string
  doctor_number: string
  findings: string
}

export interface UploadResponse {
  success: boolean
  message: string
  extracted_info: ExtractedImageInfo
  s3_key: string
  filename: string
}

export interface SaveImageRequest {
  image_type: string
  body_part: string
  image_date: string
  interpretation: string
  conclusions: string
  doctor_name: string
  doctor_number: string
  original_filename: string
  file_size_bytes: number
  content_type: string
  s3_bucket?: string
  s3_key: string
  s3_url?: string
  file_id?: string
  findings?: string
}

export interface MedicalImagesResponse {
  images: MedicalImageData[]
  total: number
  skip: number
  limit: number
}

export interface DownloadResponse {
  download_url: string
  filename: string
}

class MedicalImagesApiService {
  async uploadMedicalImage(file: File): Promise<UploadResponse> {
    console.log('API Service: Starting upload for file:', file.name)
    const formData = new FormData()
    formData.append('file', file)

    console.log('API Service: Making request to /health-records/images/upload-pdf')
    const response = await apiClient.post(
      '/health-records/images/upload-pdf',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    console.log('API Service: Response received:', response.data)
    return response.data
  }

  async saveMedicalImage(imageData: SaveImageRequest): Promise<{ success: boolean; message: string; image_id: number }> {
    const response = await apiClient.post(
      '/health-records/images',
      imageData
    )

    // Backend returns HealthRecordImageResponse directly, so we need to wrap it
    return {
      success: true,
      message: 'Medical image saved successfully',
      image_id: response.data.id
    }
  }

  async getMedicalImages(skip: number = 0, limit: number = 10): Promise<MedicalImagesResponse> {
    const response = await apiClient.get(
      `/health-records/images?skip=${skip}&limit=${limit}`
    )

    return response.data
  }

  async getMedicalImageViewUrl(imageId: number): Promise<DownloadResponse> {
    const response = await apiClient.get(
      `/health-records/images/${imageId}/download`
    )

    return response.data
  }

  async updateMedicalImage(imageId: number, updateData: {
    image_type?: string
    body_part?: string
    findings?: string
    notes?: string
  }): Promise<MedicalImageData> {
    const response = await apiClient.put(
      `/health-records/images/${imageId}`,
      updateData
    )

    return response.data
  }

  async deleteMedicalImage(imageId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(
      `/health-records/images/${imageId}`
    )

    return response.data
  }
}

export const medicalImagesApiService = new MedicalImagesApiService()
