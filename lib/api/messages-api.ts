import apiClient from './axios-config'
import type { 
  Conversation, 
  Message, 
  MessagesResponse, 
  SendMessageRequest, 
  SendMessageResponse,
  MessageFilters,
  MessageSearchParams,
  MedicationReminderMessage,
  HealthPlanSupportMessage,
  AppointmentReminderMessage,
  LabResultsMessage,
  MessageAttachment
} from '@/types/messages'

export class MessagesApiService {
  // Get all conversations with optional filtering
  async getConversations(filters?: MessageFilters): Promise<MessagesResponse> {
    try {
      console.log('📋 API: Getting conversations with filters:', filters)
      const params = new URLSearchParams()
      
      if (filters?.type?.length) {
        params.append('types', filters.type.join(','))
      }
      if (filters?.priority?.length) {
        params.append('priorities', filters.priority.join(','))
      }
      if (filters?.hasUnread) {
        params.append('hasUnread', 'true')
      }
      if (filters?.hasActionRequired) {
        params.append('hasActionRequired', 'true')
      }
      if (filters?.dateRange) {
        params.append('startDate', filters.dateRange.start)
        params.append('endDate', filters.dateRange.end)
      }

      // Use longer timeout for conversations endpoint (60 seconds)
      // as it may need to fetch multiple profiles from Supabase
      const response = await apiClient.get(`/messages/conversations?${params.toString()}`, {
        timeout: 60000
      })
      console.log('📋 API: Conversations response:', response.data)
      return response.data
    } catch (error) {
      console.error('📋 API: Failed to fetch conversations:', error)
      throw error
    }
  }

  // Get messages for a specific conversation
  async getConversationMessages(conversationId: string, page = 1, limit = 50): Promise<{ messages: Message[], hasMore: boolean }> {
    try {
      console.log('📥 API: Getting messages for conversation:', conversationId)
      const response = await apiClient.get(`/messages/conversations/${conversationId}/messages`, {
        params: { page, limit }
      })
      console.log('📥 API: Messages response:', response.data)
      return response.data
    } catch (error) {
      console.error('📥 API: Failed to fetch conversation messages:', error)
      throw error
    }
  }

  // Send a new message
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      console.log('📤 API: Sending message request:', request)
      const response = await apiClient.post('/messages/send', request)
      console.log('📤 API: Message sent successfully:', response.data)
      return response.data
    } catch (error) {
      console.error('📤 API: Failed to send message:', error)
      throw error
    }
  }

  // Upload file to S3 and return attachment data
  async uploadFile(file: File): Promise<MessageAttachment> {
    try {
      console.log('📎 API: Uploading file:', file.name)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Upload to S3 (you'll need to implement this endpoint)
      const response = await apiClient.post('/messages/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      console.log('📎 API: File uploaded successfully:', response.data)
      return response.data
    } catch (error) {
      console.error('📎 API: Failed to upload file:', error)
      throw error
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, messageIds?: string[]): Promise<void> {
    try {
      await apiClient.post(`/messages/conversations/${conversationId}/mark-read`, {
        messageIds
      })
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
      throw error
    }
  }

  // Mark a specific message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await apiClient.post(`/messages/${messageId}/mark-read`)
    } catch (error) {
      console.error('Failed to mark message as read:', error)
      throw error
    }
  }

  // Archive a conversation
  async archiveConversation(conversationId: string): Promise<void> {
    try {
      await apiClient.post(`/messages/conversations/${conversationId}/archive`)
    } catch (error) {
      console.error('Failed to archive conversation:', error)
      throw error
    }
  }

  // Pin/unpin a conversation
  async toggleConversationPin(conversationId: string, pinned: boolean): Promise<void> {
    try {
      await apiClient.post(`/messages/conversations/${conversationId}/pin`, { pinned })
    } catch (error) {
      console.error('Failed to toggle conversation pin:', error)
      throw error
    }
  }

  // Search messages
  async searchMessages(params: MessageSearchParams): Promise<{ messages: Message[], totalCount: number }> {
    try {
      const response = await apiClient.post('/messages/search', params)
      return response.data
    } catch (error) {
      console.error('Failed to search messages:', error)
      throw error
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<{ count: number, byType: Record<string, number> }> {
    try {
      const response = await apiClient.get('/messages/unread-count')
      return response.data
    } catch (error) {
      console.error('Failed to get unread count:', error)
      throw error
    }
  }

  // Handle medication reminder actions
  async handleMedicationReminderAction(messageId: string, action: 'taken' | 'snooze'): Promise<void> {
    try {
      await apiClient.post(`/messages/${messageId}/medication-action`, { action })
    } catch (error) {
      console.error('Failed to handle medication reminder action:', error)
      throw error
    }
  }

  // Handle appointment reminder actions
  async handleAppointmentReminderAction(messageId: string, action: 'confirm' | 'reschedule' | 'cancel'): Promise<void> {
    try {
      await apiClient.post(`/messages/${messageId}/appointment-action`, { action })
    } catch (error) {
      console.error('Failed to handle appointment reminder action:', error)
      throw error
    }
  }

  // Get message statistics
  async getMessageStats(): Promise<{
    totalMessages: number
    unreadMessages: number
    messagesByType: Record<string, number>
    messagesByPriority: Record<string, number>
    recentActivity: Array<{ date: string, count: number }>
  }> {
    try {
      const response = await apiClient.get('/messages/stats')
      return response.data
    } catch (error) {
      console.error('Failed to get message stats:', error)
      throw error
    }
  }

  // Create a new conversation
  async createConversation(recipientId: string, initialMessage?: string): Promise<Conversation> {
    try {
      const response = await apiClient.post('/messages/conversations', {
        recipientId,
        initialMessage
      })
      return response.data
    } catch (error) {
      console.error('Failed to create conversation:', error)
      throw error
    }
  }

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await apiClient.get(`/messages/conversations/${conversationId}`)
      return response.data
    } catch (error) {
      console.error('Failed to get conversation:', error)
      throw error
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiClient.delete(`/messages/${messageId}`)
    } catch (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
  }

  // Get available contacts for new messages with pagination
  async getAvailableContacts(params?: {
    search?: string
    offset?: number
    limit?: number
  }): Promise<Array<{
    id: string
    name: string
    firstName?: string
    lastName?: string
    role: string
    avatar?: string
    isOnline: boolean
    specialty?: string
  }>> {
    try {
      const response = await apiClient.get('/messages/contacts', { params })
      return response.data
    } catch (error) {
      console.error('Failed to get available contacts:', error)
      throw error
    }
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      console.log('🗑️ API: Deleting conversation:', conversationId)
      await apiClient.delete(`/messages/conversations/${conversationId}`)
      console.log('🗑️ API: Conversation deleted successfully')
    } catch (error) {
      console.error('🗑️ API: Failed to delete conversation:', error)
      throw error
    }
  }
}

export const messagesApiService = new MessagesApiService()
