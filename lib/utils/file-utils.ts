import { FileUploadItem, FileUploadOptions, S3UploadData } from '@/types/files'

// Default file upload options
export const DEFAULT_FILE_OPTIONS: FileUploadOptions = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'pdf', 'doc', 'docx', 'txt', 'rtf',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg',
    'mp4', 'avi', 'mov', 'wmv',
    'mp3', 'wav', 'aac',
    'zip', 'rar', '7z',
    'xlsx', 'xls', 'csv',
    'pptx', 'ppt'
  ],
  maxFiles: 10
}

// Generate unique file ID
export const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Create file upload item from File object
export const createFileUploadItem = (file: File): FileUploadItem => {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  
  return {
    id: generateFileId(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    extension,
    status: 'pending',
    progress: 0
  }
}

// Validate files against options
export const validateFiles = (
  files: File[], 
  options: FileUploadOptions = DEFAULT_FILE_OPTIONS
): { valid: File[], invalid: { file: File, reason: string }[] } => {
  const valid: File[] = []
  const invalid: { file: File, reason: string }[] = []

  files.forEach(file => {
    // Check file count
    if (valid.length >= options.maxFiles) {
      invalid.push({ file, reason: `Maximum ${options.maxFiles} files allowed` })
      return
    }

    // Check file size
    if (!isValidFileSize(file, options.maxFileSize)) {
      invalid.push({ 
        file, 
        reason: `File size exceeds ${formatFileSize(options.maxFileSize)} limit` 
      })
      return
    }

    // Check file type
    if (!isValidFileType(file, options.allowedTypes)) {
      invalid.push({ 
        file, 
        reason: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}` 
      })
      return
    }

    valid.push(file)
  })

  return { valid, invalid }
}

// Check if file size is valid
const isValidFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize
}

// Check if file type is valid
const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  return allowedTypes.includes(extension) || allowedTypes.includes(file.type)
}

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Create S3 key for file upload
export const createS3Key = (file: FileUploadItem, userId: number): string => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substr(2, 9)
  return `messages/${userId}/${timestamp}_${randomString}_${file.name}`
}

// Generate presigned URL request data
export const createPresignedUrlRequest = (file: FileUploadItem, userId: number) => {
  return {
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    file_extension: file.extension,
    s3_key: createS3Key(file, userId)
  }
}

// Update file upload progress
export const updateFileProgress = (
  files: FileUploadItem[],
  fileId: string,
  progress: number,
  status?: FileUploadItem['status'],
  error?: string,
  s3Data?: S3UploadData
): FileUploadItem[] => {
  return files.map(file => {
    if (file.id === fileId) {
      return {
        ...file,
        progress,
        status: status || file.status,
        error,
        s3Data: s3Data || file.s3Data
      }
    }
    return file
  })
}

// Remove file from upload list
export const removeFileFromUpload = (
  files: FileUploadItem[],
  fileId: string
): FileUploadItem[] => {
  return files.filter(file => file.id !== fileId)
}

// Get files by status
export const getFilesByStatus = (
  files: FileUploadItem[],
  status: FileUploadItem['status']
): FileUploadItem[] => {
  return files.filter(file => file.status === status)
}

// Check if all files are uploaded
export const areAllFilesUploaded = (files: FileUploadItem[]): boolean => {
  return files.every(file => file.status === 'uploaded')
}

// Check if any files are uploading
export const areAnyFilesUploading = (files: FileUploadItem[]): boolean => {
  return files.some(file => file.status === 'uploading')
}

// Get total upload progress
export const getTotalUploadProgress = (files: FileUploadItem[]): number => {
  if (files.length === 0) return 0
  
  const totalProgress = files.reduce((sum, file) => sum + file.progress, 0)
  return Math.round(totalProgress / files.length)
}
