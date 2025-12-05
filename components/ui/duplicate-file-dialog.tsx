'use client'

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, FileText, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface ExistingDocument {
  id: number
  file_name: string
  file_size_bytes: number
  created_at?: string | null
}

interface DuplicateFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onContinue: () => void
  existingDocument: ExistingDocument | null
  fileName: string
  fileSize: number
}

export function DuplicateFileDialog({
  open,
  onOpenChange,
  onCancel,
  onContinue,
  existingDocument,
  fileName,
  fileSize
}: DuplicateFileDialogProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Unknown date'
    try {
      return format(new Date(dateString), 'PPp')
    } catch {
      return dateString
    }
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  const handleContinue = () => {
    onContinue()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                Duplicate File Detected
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left pt-2">
            A file with the same name and size already exists in your records.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">File to Upload</p>
                <p className="text-sm text-muted-foreground truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {formatFileSize(fileSize)}
                </p>
              </div>
            </div>

            {existingDocument && (
              <>
                <div className="border-t border-border pt-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Existing File</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {existingDocument.file_name}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-muted-foreground">
                          Size: {formatFileSize(existingDocument.file_size_bytes)}
                        </p>
                        {existingDocument.created_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(existingDocument.created_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>What would you like to do?</strong>
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
              <li><strong>Cancel:</strong> Stop the upload and keep the existing file</li>
              <li><strong>Continue:</strong> Proceed with uploading the new file</li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={handleCancel}>
              Cancel Upload
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleContinue}>
              Continue Upload
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

