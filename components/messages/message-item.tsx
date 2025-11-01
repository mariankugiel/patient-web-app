"use client"

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Pill,
  Calendar,
  FileText,
  Bell,
  Heart,
  Shield,
  Stethoscope,
  MessageSquare
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageAttachments } from './message-attachments'
import { FileMessageItem } from './file-message-item'
import type { Message, MessageType } from '@/types/messages'
import type { FileMessageAttachment } from '@/types/files'

interface MessageItemProps {
  message: Message
  isOwn: boolean
  onActionClick?: (messageId: string, action: string) => void
}

const getMessageTypeIcon = (type: MessageType) => {
  switch (type) {
    case 'medication_reminder':
      return <Pill className="h-4 w-4" />
    case 'appointment_reminder':
      return <Calendar className="h-4 w-4" />
    case 'lab_results':
      return <FileText className="h-4 w-4" />
    case 'health_plan_support':
      return <Shield className="h-4 w-4" />
    case 'doctor_message':
      return <Stethoscope className="h-4 w-4" />
    case 'system_announcement':
      return <Bell className="h-4 w-4" />
    case 'prescription_update':
      return <Pill className="h-4 w-4" />
    case 'insurance_update':
      return <Shield className="h-4 w-4" />
    default:
      return <MessageSquare className="h-4 w-4" />
  }
}

const getMessageTypeColor = (type: MessageType) => {
  switch (type) {
    case 'medication_reminder':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'appointment_reminder':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'lab_results':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'health_plan_support':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'doctor_message':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
    case 'system_announcement':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'prescription_update':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    case 'insurance_update':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500'
    case 'high':
      return 'bg-orange-500'
    case 'normal':
      return 'bg-blue-500'
    case 'low':
      return 'bg-gray-500'
    default:
      return 'bg-gray-500'
  }
}

export function MessageItem({ message, isOwn, onActionClick }: MessageItemProps) {
  const { participants } = useSelector((state: RootState) => state.messageParticipants)
  const isUnread = message.status === 'sent' || message.status === 'delivered'
  const hasAction = message.message_metadata?.actionRequired

  // Get sender info from participants
  const senderInfo = participants[message.sender_id]

  const handleActionClick = (action: string) => {
    if (onActionClick) {
      onActionClick(message.id, action)
    }
  }

  return (
    // Container: justify-end for sent messages (right), justify-start for received (left)
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* Message bubble: flex-row-reverse for sent (right), flex-row for received (left) */}
      <div className={`flex max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
        {/* Avatar for received messages with status indicator */}
        {!isOwn && senderInfo && (
          <div className="relative">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={senderInfo.avatar} alt={senderInfo.name || "Unknown"} />
              <AvatarFallback className="bg-blue-600 text-white">
                {senderInfo.initials || senderInfo.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {/* Status indicator - red X for unavailable, green dot for available */}
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${message.status === 'failed' ? 'bg-red-500' : 'bg-green-500'
              }`}>
              {message.status === 'failed' && (
                <div className="flex items-center justify-center w-full h-full">
                  <span className="text-white text-xs font-bold">×</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time display centered in the message content row */}
        <div className="w-full flex items-center justify-center mb-1 text-xs text-muted-foreground">
          <span>
            {message.created_at ?
              (() => {
                const date = new Date(message.created_at);
                if (isNaN(date.getTime())) return 'Unknown time';

                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const timeStr = date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });

                if (messageDate.getTime() === today.getTime()) {
                  return `Today ${timeStr}`;
                } else if (messageDate.getTime() === yesterday.getTime()) {
                  return `Yesterday ${timeStr}`;
                } else {
                  return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  }) + ` ${timeStr}`;
                }
              })() :
              'Unknown time'
            }
          </span>
        </div>

        {/* Message bubble with status icon on the right */}
        <div className={`flex items-end gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <div className="max-w-[50%] min-w-0">
            <Card className={`p-3 inline-block ${isOwn
                ? 'bg-teal-600 text-white'
                : hasAction
                  ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                  : 'bg-gray-100 dark:bg-gray-800'
              } ${isUnread && !isOwn ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>

              {/* Message content - single line for short messages, multi-line for long messages */}
              <div className="text-sm">{message.content}</div>

              {/* Message attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 min-w-0">
                  <MessageAttachments
                    attachments={message.attachments}
                    isOwn={isOwn}
                  />
                </div>
              )}

              {/* Action buttons for specific message types */}
              {hasAction && message.message_metadata && (
                <div className="flex gap-2 mt-3 flex-wrap min-w-0">
                  {message.message_type === 'medication_reminder' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick('taken')}
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark as Taken
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick('snooze')}
                        className="text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Snooze
                      </Button>
                    </>
                  )}

                  {message.message_type === 'appointment_reminder' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick('confirm')}
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick('reschedule')}
                        className="text-xs"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Reschedule
                      </Button>
                    </>
                  )}

                  {message.message_type === 'lab_results' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActionClick('view')}
                      className="text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View Results
                    </Button>
                  )}

                  {message.message_type === 'health_plan_support' && message.message_metadata?.actionUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(message.message_metadata?.actionUrl, '_blank')}
                      className="text-xs"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {message.message_metadata?.actionText || 'View Details'}
                    </Button>
                  )}
                </div>
              )}

              {/* Message metadata */}
              {message.message_metadata && (
                <div className="mt-2 text-xs opacity-75 min-w-0">
                  {message.message_metadata?.medicationId && (
                    <div className="truncate">Medication ID: {message.message_metadata.medicationId}</div>
                  )}
                  {message.message_metadata?.appointmentId && (
                    <div className="truncate">Appointment ID: {message.message_metadata.appointmentId}</div>
                  )}
                  {message.message_metadata?.labResultId && (
                    <div className="truncate">Lab Result ID: {message.message_metadata.labResultId}</div>
                  )}
                  {message.message_metadata?.prescriptionId && (
                    <div className="truncate">Prescription ID: {message.message_metadata.prescriptionId}</div>
                  )}
                  {message.message_metadata?.actionUrl && (
                    <div className="flex items-center gap-1 text-blue-600 truncate">
                      <AlertCircle className="h-3 w-3" />
                      Action Required
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Status icon on the right side of message box */}
          {isOwn && (
            <div className="flex items-center gap-1 mb-1">
              {/* WhatsApp-style check marks based on MessageStatus enum */}
              {message.status === 'read' && (
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                  <CheckCircle className="h-3 w-3 text-blue-500 -ml-1" />
                </div>
              )}
              {message.status === 'delivered' && (
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-gray-500" />
                  <CheckCircle className="h-3 w-3 text-gray-500 -ml-1" />
                </div>
              )}
              {message.status === 'sent' && <CheckCircle className="h-3 w-3 text-gray-400" />}
              {message.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
