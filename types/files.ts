import { MessageAttachment } from './messages'

export interface FileUploadItem {
  id: string
  file: File
  name: string
  size: number
  type: string
  extension: string
  status: 'pending' | 'uploading' | 'uploaded' | 'failed' | 'cancelled'
  progress: number
  error?: string
  s3Data?: S3UploadData
  attachment?: MessageAttachment
}

export interface S3UploadData {
  bucket: string
  key: string
  url: string
  presignedUrl?: string
}

export interface FileMessageAttachment {
  id: number
  message_id: number
  file_name: string
  original_file_name: string
  file_type: string
  file_size: number
  file_extension: string
  s3_bucket: string
  s3_key: string
  s3_url: string
  uploaded_by: number
  created_at: string
  updated_at?: string
}

export interface FileUploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'uploaded' | 'failed' | 'cancelled'
  error?: string
}

export interface FileUploadOptions {
  maxFileSize: number // in bytes
  allowedTypes: string[]
  maxFiles: number
  onProgress?: (fileId: string, progress: number) => void
  onComplete?: (fileId: string, s3Data: S3UploadData) => void
  onError?: (fileId: string, error: string) => void
  onCancel?: (fileId: string) => void
}

export interface FileUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onSend: (files: FileUploadItem[], message: string) => void
  maxFiles?: number
  maxFileSize?: number
  allowedTypes?: string[]
  initialFiles?: FileUploadItem[]
}

export interface UploadProgressItemProps {
  file: FileUploadItem
  onCancel: (fileId: string) => void
  onRetry?: (fileId: string) => void
}

export interface FileMessageItemProps {
  attachments: FileMessageAttachment[]
  message: string
  isOwn: boolean
  createdAt: string
}

// File type icons mapping
export const FILE_TYPE_ICONS = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  txt: '📄',
  rtf: '📝',
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  gif: '🖼️',
  bmp: '🖼️',
  svg: '🖼️',
  mp4: '🎥',
  avi: '🎥',
  mov: '🎥',
  wmv: '🎥',
  mp3: '🎵',
  wav: '🎵',
  aac: '🎵',
  zip: '📦',
  rar: '📦',
  '7z': '📦',
  xlsx: '📊',
  xls: '📊',
  csv: '📊',
  pptx: '📊',
  ppt: '📊',
  default: '📎'
} as const

export type FileTypeIcon = keyof typeof FILE_TYPE_ICONS

// File size formatting utility
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// Get file type icon
export const getFileTypeIcon = (filename: string): string => {
  const extension = getFileExtension(filename)
  return FILE_TYPE_ICONS[extension as FileTypeIcon] || FILE_TYPE_ICONS.default
}

// Validate file type
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  const extension = getFileExtension(file.name)
  return allowedTypes.includes(extension) || allowedTypes.includes(file.type)
}

// Validate file size
export const isValidFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize
}
