"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, File, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileUploadItem, FileUploadDialogProps, formatFileSize, getFileTypeIcon } from '@/types/files'
import { createFileUploadItem, validateFiles, DEFAULT_FILE_OPTIONS } from '@/lib/utils/file-utils'

export function FileUploadDialog({
  isOpen,
  onClose,
  onSend,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedTypes = DEFAULT_FILE_OPTIONS.allowedTypes,
  initialFiles = []
}: FileUploadDialogProps) {
  const [files, setFiles] = useState<FileUploadItem[]>(initialFiles)
  const [message, setMessage] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setFiles(initialFiles)
      setMessage('')
      setValidationErrors([])
    } else {
      // Reset when dialog closes
      setFiles([])
      setMessage('')
      setValidationErrors([])
    }
  }, [isOpen, initialFiles])

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    const options = {
      maxFileSize,
      allowedTypes,
      maxFiles: maxFiles - files.length // Account for existing files
    }

    const { valid, invalid } = validateFiles(fileArray, options)
    
    // Add valid files
    const newFiles = valid.map(createFileUploadItem)
    setFiles(prev => [...prev, ...newFiles])
    
    // Set validation errors
    if (invalid.length > 0) {
      const errors = invalid.map(({ file, reason }) => `${file.name}: ${reason}`)
      setValidationErrors(errors)
    } else {
      setValidationErrors([])
    }
  }, [files.length, maxFiles, maxFileSize, allowedTypes])

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFileSelect(event.target.files)
      // Reset input
      event.target.value = ''
    }
  }

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    
    if (event.dataTransfer.files) {
      handleFileSelect(event.dataTransfer.files)
    }
  }

  // Remove file from list
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  // Handle send
  const handleSend = () => {
    if (files.length === 0) return
    
    onSend(files, message.trim())
    onClose()
  }

  // Handle cancel
  const handleCancel = () => {
    setFiles([])
    setMessage('')
    setValidationErrors([])
    onClose()
  }

  // Open file dialog
  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </DialogTitle>
          <DialogDescription>
            Select files to upload and add a message (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Attached Files ({files.length})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openFileDialog}
                  disabled={files.length >= maxFiles}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add More
                </Button>
              </div>
              
              {files.map((file) => (
                <Card key={file.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getFileTypeIcon(file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              {files.length === 0 ? 'Drop files here' : 'Drop more files here'}
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              or click to browse files
            </p>
            <Button
              variant="outline"
              onClick={openFileDialog}
              disabled={files.length >= maxFiles}
            >
              <File className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Max {maxFiles} files, {formatFileSize(maxFileSize)} each
            </p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {error}
                </Badge>
              ))}
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Message (optional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to go with these files..."
              className="min-h-[80px] resize-none"
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {message.length}/2000
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={files.length === 0}
          >
            Send {files.length > 0 && `(${files.length} files)`}
          </Button>
        </DialogFooter>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.map(type => `.${type}`).join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
}
