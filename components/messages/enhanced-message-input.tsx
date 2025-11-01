"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Send, Mic, Paperclip, Smile, Image, FileText, 
  X, Play, Pause, Square, Upload, AlertCircle 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface EnhancedMessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onFileUpload: (files: FileList) => void
  onVoiceRecord: (audioBlob: Blob) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  maxLength?: number
}

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
  '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
  '😾', '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴',
  '👵', '👤', '👥', '🫂', '👪', '👨‍👩‍👧‍👦', '👨‍👨‍👧', '👩‍👩‍👧', '👨‍👧', '👩‍👧',
  '👨‍👧‍👦', '👩‍👧‍👦', '👨‍👨‍👧‍👦', '👩‍👩‍👧‍👦', '👨‍👨‍👦', '👩‍👩‍👦', '👨‍👦‍👦', '👩‍👦‍👦', '👨‍👧‍👧', '👩‍👧‍👧'
]

export function EnhancedMessageInput({
  value,
  onChange,
  onSend,
  onFileUpload,
  onVoiceRecord,
  placeholder = "Type a message...",
  disabled = false,
  loading = false,
  maxLength = 2000
}: EnhancedMessageInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend()
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileUpload = (files: FileList) => {
    // Call the parent's file upload handler directly
    onFileUpload(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        onVoiceRecord(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }


  return (
    <div 
      className={`relative border-t border-gray-200 bg-white p-4 ${isDragOver ? 'bg-blue-50 border-blue-300' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-700">
                Recording: {formatRecordingTime(recordingTime)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={stopRecording}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className="min-h-[44px] max-h-32 resize-none pr-12"
            rows={1}
          />
          
          {/* Character Count */}
          {maxLength && (
            <div className="absolute bottom-1 right-12 text-xs text-gray-400">
              {value.length}/{maxLength}
            </div>
          )}
          
          {/* Emoji Picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="p-2 hover:bg-gray-100 rounded text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFileSelect}
            disabled={disabled}
            className="h-10 w-10 p-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`h-10 w-10 p-0 ${isRecording ? 'text-red-600' : ''}`}
          >
            <Mic className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!value.trim() || disabled || loading}
            className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Drag and Drop Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-blue-600 font-medium">Drop files here to upload</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  )
}
