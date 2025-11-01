import { FileUploadItem, S3UploadData, FileUploadOptions } from '@/types/files'
import { MessageAttachment } from '@/types/messages'
import apiClient from './axios-config'

class S3UploadService {
  private abortControllers: Map<string, AbortController> = new Map()

  // Upload file directly to S3 via backend
  async uploadFileDirect(
    file: FileUploadItem,
    userId: number,
    onProgress?: (fileId: string, progress: number) => void
  ): Promise<MessageAttachment> {
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file.file, file.name)

      // Upload file with progress tracking
      const response = await apiClient.post('/messages/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress?.(file.id, progress)
          }
        }
      })

      return response.data
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  // Upload file to S3 with progress tracking
  async uploadFile(
    file: FileUploadItem,
    userId: number,
    options: FileUploadOptions,
    onProgress?: (fileId: string, progress: number) => void,
    onComplete?: (fileId: string, s3Data: S3UploadData) => void,
    onError?: (fileId: string, error: string) => void
  ): Promise<FileUploadItem> {
    try {
      // Simulate progress for small files to make progress visible
      const fileSize = file.file.size
      const isSmallFile = fileSize < 100 * 1024 // Less than 100KB
      
      if (isSmallFile) {
        // For small files, simulate progress steps
        const steps = [10, 30, 50, 70, 90, 100]
        for (const progress of steps) {
          onProgress?.(file.id, progress)
          await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay between steps
        }
      }
      
      // Upload file directly to S3 via backend
      const attachment = await this.uploadFileDirect(file, userId, onProgress)
      
      // Convert MessageAttachment to S3UploadData format
      const s3Data: S3UploadData = {
        bucket: attachment.s3_bucket,
        key: attachment.s3_key,
        url: attachment.s3_url || ''
      }
      
      // Update file item with attachment and s3Data
      const updatedFile: FileUploadItem = {
        ...file,
        status: 'uploaded',
        s3Data,
        attachment
      }
      
      // Call completion callback
      onComplete?.(file.id, s3Data)
      
      return updatedFile
      
    } catch (error) {
      console.error('Error uploading file:', error)
      onError?.(file.id, error instanceof Error ? error.message : 'Upload failed')
      throw error
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: FileUploadItem[],
    userId: number,
    options: FileUploadOptions,
    onProgress?: (fileId: string, progress: number) => void,
    onComplete?: (fileId: string, s3Data: S3UploadData) => void,
    onError?: (fileId: string, error: string) => void
  ): Promise<FileUploadItem[]> {
    const uploadPromises = files.map(async file => {
      try {
        return await this.uploadFile(file, userId, options, onProgress, onComplete, onError)
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error)
        return {
          ...file,
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }
    })

    const results = await Promise.allSettled(uploadPromises)
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : files[0] // fallback
    )
  }

  // Cancel file upload
  cancelUpload(fileId: string): void {
    const abortController = this.abortControllers.get(fileId)
    if (abortController) {
      abortController.abort()
      this.abortControllers.delete(fileId)
    }
  }

  // Cancel all uploads
  cancelAllUploads(): void {
    this.abortControllers.forEach(controller => controller.abort())
    this.abortControllers.clear()
  }

  // Get download URL for file (using S3 URL from attachment)
  async getDownloadUrl(s3Url: string): Promise<string> {
    // The backend already provides a presigned URL, so we can return it directly
    return s3Url
  }
}

// Export singleton instance
export const s3UploadService = new S3UploadService()
