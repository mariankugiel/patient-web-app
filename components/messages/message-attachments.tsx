"use client"

import { Download, File, Image, FileText, Archive, FileVideo, FileAudio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MessageAttachment } from "@/types/messages"

interface MessageAttachmentsProps {
  attachments: MessageAttachment[]
  isOwn: boolean
}

export function MessageAttachments({ attachments, isOwn }: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (fileType.startsWith('video/')) return <FileVideo className="h-4 w-4" />
    if (fileType.startsWith('audio/')) return <FileAudio className="h-4 w-4" />
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = (attachment: MessageAttachment) => {
    if (attachment.s3_url) {
      window.open(attachment.s3_url, '_blank')
    }
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <Card 
          key={attachment.id} 
          className={`p-3 max-w-xs ${
            isOwn 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getFileIcon(attachment.file_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.original_file_name}
                </p>
                <Badge variant="outline" className="text-xs">
                  {attachment.file_extension.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {formatFileSize(attachment.file_size)}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(attachment)}
                className="h-8 px-3"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
