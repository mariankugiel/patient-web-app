"use client"

import React, { useState } from 'react'
import { Download, File, Image, Video, Music, Archive, FileText, Presentation, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileMessageItemProps, formatFileSize, getFileTypeIcon } from '@/types/files'

export function FileMessageItem({ attachments, message, isOwn, createdAt }: FileMessageItemProps) {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<number>>(new Set())

  const getFileIcon = (fileType: string, fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return <Image className="h-5 w-5" />
    }
    
    // Video files
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
      return <Video className="h-5 w-5" />
    }
    
    // Audio files
    if (['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(extension)) {
      return <Music className="h-5 w-5" />
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <Archive className="h-5 w-5" />
    }
    
    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return <FileText className="h-5 w-5" />
    }
    
    // Presentation files
    if (['ppt', 'pptx'].includes(extension)) {
      return <Presentation className="h-5 w-5" />
    }
    
    // Spreadsheet files
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return <Table className="h-5 w-5" />
    }
    
    return <File className="h-5 w-5" />
  }

  const handleDownload = async (attachment: any) => {
    try {
      setDownloadingFiles(prev => new Set(prev).add(attachment.id))
      
      // Create download link
      const link = document.createElement('a')
      link.href = attachment.s3_url
      link.download = attachment.original_file_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error downloading file:', error)
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(attachment.id)
        return newSet
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  return (
    <div className={`flex items-end gap-2 w-full max-w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Message bubble */}
      <div className={`max-w-[70%] min-w-0 p-3 rounded-lg ${
        isOwn 
          ? 'bg-blue-500 dark:bg-blue-600 text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
      }`}>
        
        {/* Files Section */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <File className={`h-4 w-4 ${isOwn ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
            <span className={`text-sm font-medium ${isOwn ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
              {attachments.length} file{attachments.length > 1 ? 's' : ''}
            </span>
          </div>
          
          {attachments.map((attachment) => (
            <Card key={attachment.id} className={`p-2 ${
              isOwn 
                ? 'bg-white/10 dark:bg-white/10 border-white/20 dark:border-white/20' 
                : 'bg-white/50 dark:bg-gray-600/50 border-gray-300/50 dark:border-gray-500/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {getFileTypeIcon(attachment.original_file_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isOwn ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {attachment.original_file_name}
                  </p>
                  <p className={`text-xs ${
                    isOwn ? 'opacity-75' : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  disabled={downloadingFiles.has(attachment.id)}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  {downloadingFiles.has(attachment.id) ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Message Content */}
        {message && (
          <div className="text-sm break-words overflow-wrap-anywhere hyphens-auto">
            {message}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-2 ${
          isOwn ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatTime(createdAt)}
        </div>
      </div>
    </div>
  )
}
