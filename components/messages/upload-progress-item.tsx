"use client"

import React from 'react'
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { UploadProgressItemProps, formatFileSize, getFileTypeIcon } from '@/types/files'

export function UploadProgressItem({ file, onCancel, onRetry }: UploadProgressItemProps) {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
  }

  const getStatusText = () => {
    switch (file.status) {
      case 'uploading':
        return 'Uploading...'
      case 'uploaded':
        return 'Uploaded'
      case 'failed':
        return 'Failed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Pending...'
    }
  }

  const getStatusColor = () => {
    switch (file.status) {
      case 'uploading':
        return 'bg-blue-500'
      case 'uploaded':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      case 'cancelled':
        return 'bg-gray-500'
      default:
        return 'bg-blue-500'
    }
  }

  const canCancel = file.status === 'uploading' || file.status === 'pending'
  const canRetry = file.status === 'failed'

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
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
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(file.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {canRetry && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(file.id)}
                className="h-8 w-8 p-0"
              >
                <Loader2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar - Only show when actually uploading */}
        {file.status === 'uploading' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {getStatusText()}
              </span>
              <span className="text-xs text-muted-foreground">
                {file.progress}%
              </span>
            </div>
            
            <Progress 
              value={file.progress} 
              className="h-2"
            />
          </div>
        )}
        
        {/* Status Badge - Show for all statuses */}
        <div className="flex justify-center mt-2">
          <Badge 
            variant="outline" 
            className={`text-xs ${getStatusColor()} text-white border-0`}
          >
            {getStatusText()}
          </Badge>
        </div>

        {/* Error Message */}
        {file.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {file.error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
