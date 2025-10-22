"use client"

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
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
import type { Message, MessageType } from '@/types/messages'

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
  const isUnread = message.status === 'sent' || message.status === 'delivered'
  const hasAction = message.metadata?.actionRequired && !message.metadata?.actionCompleted

  const handleActionClick = (action: string) => {
    if (onActionClick) {
      onActionClick(message.id, action)
    }
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
        {/* Avatar for received messages */}
        {!isOwn && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={message.sender?.avatar} alt={message.sender?.name || "Unknown"} />
            <AvatarFallback>{message.sender?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        )}

        {/* Message content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Message bubble */}
          <Card className={`p-3 ${
            isOwn 
              ? 'bg-teal-600 text-white' 
              : hasAction
                ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                : 'bg-gray-100 dark:bg-gray-800'
          } ${isUnread && !isOwn ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
            
            {/* Message header with type and priority */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {getMessageTypeIcon(message.type)}
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getMessageTypeColor(message.type)}`}
                >
                  {message.type?.replace('_', ' ') || 'General'}
                </Badge>
              </div>
              
              {message.priority !== 'normal' && (
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(message.priority)}`} />
              )}
            </div>

            {/* Message content */}
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>

            {/* Action buttons for specific message types */}
            {hasAction && message.metadata && (
              <div className="flex gap-2 mt-3">
                {message.type === 'medication_reminder' && (
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

                {message.type === 'appointment_reminder' && (
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

                {message.type === 'lab_results' && (
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

                {message.type === 'health_plan_support' && message.metadata?.actionUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(message.metadata?.actionUrl, '_blank')}
                    className="text-xs"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {message.metadata?.actionText || 'View Details'}
                  </Button>
                )}
              </div>
            )}

            {/* Message metadata */}
            {message.metadata && (
              <div className="mt-2 text-xs opacity-75">
                {message.metadata?.medicationName && (
                  <div>Medication: {message.metadata.medicationName}</div>
                )}
                {message.metadata?.dosage && (
                  <div>Dosage: {message.metadata.dosage}</div>
                )}
                {message.metadata?.scheduledTime && (
                  <div>Scheduled: {new Date(message.metadata.scheduledTime).toLocaleString()}</div>
                )}
                {message.metadata?.appointmentDate && (
                  <div>Appointment: {new Date(message.metadata.appointmentDate).toLocaleString()}</div>
                )}
                {message.metadata?.doctorName && (
                  <div>Doctor: {message.metadata.doctorName}</div>
                )}
                {message.metadata?.testName && (
                  <div>Test: {message.metadata.testName}</div>
                )}
                {message.metadata?.isAbnormal && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    Abnormal Results
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Message timestamp and status */}
          <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isOwn ? 'flex-row-reverse' : ''}`}>
            <span>
              {message.timestamp ? 
                (() => {
                  const date = new Date(message.timestamp);
                  return isNaN(date.getTime()) ? 'Unknown time' : 
                    formatDistanceToNow(date, { addSuffix: true });
                })() : 
                'Unknown time'
              }
            </span>
            
            {isOwn && (
              <div className="flex items-center gap-1">
                {message.status === 'read' && <CheckCircle className="h-3 w-3 text-blue-500" />}
                {message.status === 'delivered' && <CheckCircle className="h-3 w-3 text-gray-500" />}
                {message.status === 'sent' && <Clock className="h-3 w-3 text-gray-400" />}
                {message.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500" />}
              </div>
            )}

            {isUnread && !isOwn && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                Unread
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
