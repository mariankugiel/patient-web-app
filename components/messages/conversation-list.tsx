"use client"

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Pin, 
  Archive, 
  MoreVertical, 
  MessageSquare, 
  Bell,
  Pill,
  Calendar,
  FileText,
  Shield,
  Stethoscope,
  AlertCircle
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Conversation, MessageType } from '@/types/messages'

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversationId: string | null
  typingUsers: Set<number>  // Add typing users
  onSelectConversation: (conversationId: string) => void
  onArchiveConversation: (conversationId: string) => void
  onTogglePin: (conversationId: string) => void
  onMarkAsRead: (conversationId: string) => void
}

const getMessageTypeIcon = (type: MessageType) => {
  switch (type) {
    case 'medication_reminder':
      return <Pill className="h-3 w-3" />
    case 'appointment_reminder':
      return <Calendar className="h-3 w-3" />
    case 'lab_results':
      return <FileText className="h-3 w-3" />
    case 'health_plan_support':
      return <Shield className="h-3 w-3" />
    case 'doctor_message':
      return <Stethoscope className="h-3 w-3" />
    case 'system_announcement':
      return <Bell className="h-3 w-3" />
    default:
      return <MessageSquare className="h-3 w-3" />
  }
}

const getMessageTypeColor = (type: MessageType) => {
  switch (type) {
    case 'medication_reminder':
      return 'text-blue-600'
    case 'appointment_reminder':
      return 'text-green-600'
    case 'lab_results':
      return 'text-purple-600'
    case 'health_plan_support':
      return 'text-orange-600'
    case 'doctor_message':
      return 'text-teal-600'
    case 'system_announcement':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

const getPriorityIndicator = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return <div className="w-2 h-2 bg-red-500 rounded-full" />
    case 'high':
      return <div className="w-2 h-2 bg-orange-500 rounded-full" />
    case 'normal':
      return <div className="w-2 h-2 bg-blue-500 rounded-full" />
    case 'low':
      return <div className="w-2 h-2 bg-gray-400 rounded-full" />
    default:
      return null
  }
}

export function ConversationList({
  conversations,
  selectedConversationId,
  typingUsers,
  onSelectConversation,
  onArchiveConversation,
  onTogglePin,
  onMarkAsRead
}: ConversationListProps) {
  const handleConversationClick = (conversationId: string) => {
    onSelectConversation(conversationId)
  }

  const handleArchive = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    onArchiveConversation(conversationId)
  }

  const handleTogglePin = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    onTogglePin(conversationId)
  }

  const handleMarkAsRead = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    onMarkAsRead(conversationId)
  }

  return (
    <div className="space-y-2 w-full max-w-full overflow-hidden">
      {conversations.map((conversation) => {
        const isSelected = selectedConversationId === conversation.id
        const hasUnread = conversation.unreadCount > 0
        const hasActionRequired = conversation.lastMessage?.message_metadata?.actionRequired
        const lastMessageType = conversation.lastMessage?.message_type || 'general'

        return (
          <Card
            key={conversation.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md w-full max-w-full overflow-hidden ${
              isSelected
                ? 'border-teal-600 bg-teal-50 dark:border-teal-400 dark:bg-teal-950'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            } ${
              hasUnread ? 'border-l-4 border-l-teal-600 dark:border-l-teal-400' : ''
            } ${
              hasActionRequired ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' : ''
            }`}
            onClick={() => handleConversationClick(conversation.id)}
          >
            <div className="p-3">
              <div className="flex items-start gap-3">
                {/* Avatar with online status */}
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={conversation.contact_avatar && conversation.contact_avatar.trim() !== "" ? conversation.contact_avatar : undefined}
                      alt={conversation.contact_name || "Unknown"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {conversation.contact_initials || 
                       (conversation.contact_name ? 
                         (conversation.contact_name.split(' ').length > 1 ? 
                           conversation.contact_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() :
                           conversation.contact_name.substring(0, 2).toUpperCase()
                         ) : 
                         "U"
                       )}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Online status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                    conversation.contact_id === 0 ? 'bg-gray-400' : 'bg-green-500'
                  }`} />
                </div>

                {/* Conversation content */}
                <div className="flex-1 min-w-0 overflow-hidden w-full">
                  <div className="flex items-center justify-between mb-1 w-full">
                    <div className="flex items-center gap-2 min-w-0 flex-1 w-full">
                      <h3 className={`font-medium truncate flex-1 ${
                        hasUnread ? 'font-semibold' : ''
                      }`}>
                        {conversation.contact_name || "Unknown"}
                      </h3>
                      
                      {/* Message type icon */}
                      {conversation.lastMessage && (
                        <div className={`${getMessageTypeColor(lastMessageType)}`}>
                          {getMessageTypeIcon(lastMessageType)}
                        </div>
                      )}

                      {/* Priority indicator */}
                      {conversation.lastMessage?.priority && conversation.lastMessage.priority !== 'normal' && (
                        getPriorityIndicator(conversation.lastMessage.priority)
                      )}

                      {/* Pinned indicator */}
                      {conversation.isPinned && (
                        <Pin className="h-3 w-3 text-yellow-600" />
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Unread count */}
                      {hasUnread && (
                        <Badge 
                          variant="secondary" 
                          className="bg-teal-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center"
                        >
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </Badge>
                      )}

                      {/* Action required indicator */}
                      {hasActionRequired && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Action Required" />
                      )}

                      {/* More options */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {hasUnread && (
                            <DropdownMenuItem onClick={(e) => handleMarkAsRead(e, conversation.id)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => handleTogglePin(e, conversation.id)}>
                            <Pin className="h-4 w-4 mr-2" />
                            {conversation.isPinned ? 'Unpin' : 'Pin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleArchive(e, conversation.id)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Contact role */}
                  <div className="text-xs text-muted-foreground mb-1">
                    {conversation.contact_role || "Unknown"}
                  </div>

                  {/* Last message preview or typing indicator */}
                  {typingUsers.has(conversation.contact_id) ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-1">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-teal-600 italic truncate">typing...</span>
                      </div>
                    </div>
                  ) : conversation.lastMessage ? (
                    <div className="flex items-center gap-2 min-w-0 w-full max-w-full overflow-hidden">
                      <p className={`text-sm flex-1 min-w-0 max-w-[150px] ${
                        hasUnread ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-muted-foreground'
                      }`}>
                        <span className="block truncate overflow-hidden text-ellipsis whitespace-nowrap">
                          {conversation.lastMessage.content.length > 15 
                            ? `${conversation.lastMessage.content.substring(0, 15)}...` 
                            : conversation.lastMessage.content
                          }
                        </span>
                      </p>
                      
                      {/* Message type badge for last message */}
                      {conversation.lastMessage?.message_type && conversation.lastMessage.message_type !== 'general' && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getMessageTypeColor(lastMessageType)} border-current`}
                        >
                          {conversation.lastMessage.message_type.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0 w-full">
                      <p className="text-sm text-muted-foreground italic">
                        No messages yet
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {conversation.lastMessage?.created_at ? 
                        (() => {
                          const date = new Date(conversation.lastMessage.created_at);
                          return isNaN(date.getTime()) ? 'Unknown time' : 
                            formatDistanceToNow(date, { addSuffix: true });
                        })() : 
                        conversation.lastMessageTime ? 
                          (() => {
                            const date = new Date(conversation.lastMessageTime);
                            return isNaN(date.getTime()) ? 'Unknown time' : 
                              formatDistanceToNow(date, { addSuffix: true });
                          })() : 
                          'No messages'
                      }
                    </span>
                    
                    {/* Tags */}
                    {conversation.tags && conversation.tags.length > 0 && (
                      <div className="flex gap-1">
                        {conversation.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {conversation.tags && conversation.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{conversation.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )
      })}

      {conversations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No conversations found</p>
        </div>
      )}
    </div>
  )
}
