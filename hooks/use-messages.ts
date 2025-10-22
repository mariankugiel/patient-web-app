import { useState, useEffect, useCallback, useMemo } from 'react'
import { messagesApiService } from '@/lib/api/messages-api'
import { useWebSocketContext } from '@/contexts/websocket-context'
import type { 
  Conversation, 
  Message, 
  MessageType, 
  MessageFilters,
  MessageSearchParams,
  MedicationReminderMessage,
  HealthPlanSupportMessage,
  AppointmentReminderMessage,
  LabResultsMessage
} from '@/types/messages'

interface UseMessagesReturn {
  // Data
  conversations: Conversation[]
  selectedConversation: Conversation | null
  messages: Message[]
  unreadCount: number
  unreadCountByType: Record<string, number>
  loading: boolean
  error: string | null

  // Actions
  selectConversation: (conversationId: string) => void
  sendMessage: (content: string, type?: MessageType) => Promise<void>
  markAsRead: (messageId?: string) => Promise<void>
  markConversationAsRead: (conversationId: string) => Promise<void>
  archiveConversation: (conversationId: string) => Promise<void>
  togglePin: (conversationId: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  searchMessages: (params: MessageSearchParams) => Promise<Message[]>
  refreshConversations: () => Promise<void>

  // Message type specific actions
  handleMedicationAction: (messageId: string, action: 'taken' | 'snooze') => Promise<void>
  handleAppointmentAction: (messageId: string, action: 'confirm' | 'reschedule' | 'cancel') => Promise<void>
  handleLabResultAction: (messageId: string, action: 'view' | 'schedule_followup') => Promise<void>

  // Filtering and search
  filterConversations: (filters: MessageFilters) => void
  clearFilters: () => void
  currentFilters: MessageFilters | null

  // Stats
  getMessageStats: () => Promise<any>
}

export function useMessages(): UseMessagesReturn {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadCountByType, setUnreadCountByType] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<MessageFilters | null>(null)

  const { isConnected, sendMessage: sendWebSocketMessage } = useWebSocketContext()

  // Load conversations on mount and when filters change
  const loadConversations = useCallback(async (filters?: MessageFilters) => {
    try {
      setLoading(true)
      setError(null)
      const response = await messagesApiService.getConversations(filters)
      setConversations(response.conversations)
      setUnreadCount(response.unreadCount) // ✅ Already included in response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load unread count by type
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await messagesApiService.getUnreadCount()
      setUnreadCount(response.count)
      setUnreadCountByType(response.byType)
    } catch (err) {
      console.error('Failed to load unread count:', err)
    }
  }, [])

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(true)
      const response = await messagesApiService.getConversationMessages(conversationId)
      setMessages(response.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [])

  // Select conversation
  const selectConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setSelectedConversation(conversation)
      loadMessages(conversationId)
      
      // Mark conversation as read when selected
      if (conversation.unreadCount > 0) {
        markConversationAsRead(conversationId)
      }
    }
  }, [conversations, loadMessages])

  // Send message
  const sendMessage = useCallback(async (content: string, type: MessageType = 'general') => {
    if (!selectedConversation || !content.trim()) return

    try {
      const request = {
        conversationId: selectedConversation.id,
        recipientId: selectedConversation.contact?.id,
        content: content.trim(),
        type,
        priority: 'normal' as const
      }

      const response = await messagesApiService.sendMessage(request)
      
      // Update local state
      setMessages(prev => [...prev, response.message])
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: response.message, lastMessageTime: response.message.timestamp }
            : conv
        )
      )

      // Send WebSocket notification if connected
      if (isConnected) {
        sendWebSocketMessage({
          type: 'new_message',
          data: {
            conversationId: selectedConversation.id,
            message: response.message,
            timestamp: new Date().toISOString()
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }, [selectedConversation, isConnected, sendWebSocketMessage])

  // Mark message as read
  const markAsRead = useCallback(async (messageId?: string) => {
    if (!selectedConversation) return

    try {
      if (messageId) {
        await messagesApiService.markMessageAsRead(messageId)
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, status: 'read', readAt: new Date().toISOString() } : msg
          )
        )
        // Update unread count locally
        setUnreadCount(prev => Math.max(0, prev - 1))
      } else {
        await messagesApiService.markMessagesAsRead(selectedConversation.id)
        setMessages(prev => 
          prev.map(msg => ({ ...msg, status: 'read', readAt: new Date().toISOString() }))
        )
        // Update unread count locally
        setUnreadCount(prev => Math.max(0, prev - selectedConversation.unreadCount))
      }
    } catch (err) {
      console.error('Failed to mark message as read:', err)
    }
  }, [selectedConversation])

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      await messagesApiService.markMessagesAsRead(conversationId)
      
      // Find the conversation to get its unread count
      const conversation = conversations.find(c => c.id === conversationId)
      const unreadCountToSubtract = conversation?.unreadCount || 0
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      )
      
      // Update total unread count locally
      setUnreadCount(prev => Math.max(0, prev - unreadCountToSubtract))
    } catch (err) {
      console.error('Failed to mark conversation as read:', err)
    }
  }, [conversations])

  // Archive conversation
  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      await messagesApiService.archiveConversation(conversationId)
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, isArchived: true } : conv
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive conversation')
    }
  }, [])

  // Toggle pin
  const togglePin = useCallback(async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) return

      await messagesApiService.toggleConversationPin(conversationId, !conversation.isPinned)
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle pin')
    }
  }, [conversations])

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await messagesApiService.deleteMessage(messageId)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
    }
  }, [])

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await messagesApiService.deleteConversation(conversationId)
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      // If the deleted conversation was selected, clear the selection
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation')
    }
  }, [selectedConversation])

  // Search messages
  const searchMessages = useCallback(async (params: MessageSearchParams): Promise<Message[]> => {
    try {
      const response = await messagesApiService.searchMessages(params)
      return response.messages
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search messages')
      return []
    }
  }, [])

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    await loadConversations(currentFilters || undefined) // ✅ This already includes unread count
  }, [loadConversations, currentFilters])

  // Filter conversations
  const filterConversations = useCallback((filters: MessageFilters) => {
    setCurrentFilters(filters)
    loadConversations(filters)
  }, [loadConversations])

  // Clear filters
  const clearFilters = useCallback(() => {
    setCurrentFilters(null)
    loadConversations()
  }, [loadConversations])

  // Message type specific actions
  const handleMedicationAction = useCallback(async (messageId: string, action: 'taken' | 'snooze') => {
    try {
      await messagesApiService.handleMedicationReminderAction(messageId, action)
      // Update message metadata
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                metadata: { 
                  ...msg.metadata, 
                  actionCompleted: true, 
                  actionTaken: action 
                } 
              } 
            : msg
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to handle medication action')
    }
  }, [])

  const handleAppointmentAction = useCallback(async (messageId: string, action: 'confirm' | 'reschedule' | 'cancel') => {
    try {
      await messagesApiService.handleAppointmentReminderAction(messageId, action)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                metadata: { 
                  ...msg.metadata, 
                  actionCompleted: true, 
                  actionTaken: action 
                } 
              } 
            : msg
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to handle appointment action')
    }
  }, [])

  const handleLabResultAction = useCallback(async (messageId: string, action: 'view' | 'schedule_followup') => {
    try {
      // This would typically open a modal or navigate to lab results
      console.log('Lab result action:', action, 'for message:', messageId)
      // Update message as action taken
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                metadata: { 
                  ...msg.metadata, 
                  actionCompleted: true, 
                  actionTaken: action 
                } 
              } 
            : msg
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to handle lab result action')
    }
  }, [])

  // Get message stats
  const getMessageStats = useCallback(async () => {
    try {
      return await messagesApiService.getMessageStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get message stats')
      return null
    }
  }, [])

  // Load initial data
  useEffect(() => {
    loadConversations() // ✅ This already includes unread count
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Handle WebSocket messages
  useEffect(() => {
    if (isConnected) {
      // Listen for new messages via WebSocket
      const handleWebSocketMessage = (event: any) => {
        if (event.type === 'new_message') {
          const { conversationId, message } = event.data
          
          // Update conversations
          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversationId 
                ? { 
                    ...conv, 
                    lastMessage: message, 
                    lastMessageTime: message.timestamp,
                    unreadCount: conv.id === selectedConversation?.id ? conv.unreadCount : conv.unreadCount + 1
                  } 
                : conv
            )
          )

          // Update messages if this conversation is selected
          if (selectedConversation?.id === conversationId) {
            setMessages(prev => [...prev, message])
          } else {
            // Update unread count locally for other conversations
            setUnreadCount(prev => prev + 1)
          }
        }
      }

      // Register WebSocket message handler
      // This would be implemented based on your WebSocket context
      // sendWebSocketMessage({ type: 'subscribe', data: { channel: 'messages' } })
    }
  }, [isConnected, selectedConversation])

  return {
    // Data
    conversations,
    selectedConversation,
    messages,
    unreadCount,
    unreadCountByType,
    loading,
    error,

    // Actions
    selectConversation,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    archiveConversation,
    togglePin,
    deleteMessage,
    deleteConversation,
    searchMessages,
    refreshConversations,

    // Message type specific actions
    handleMedicationAction,
    handleAppointmentAction,
    handleLabResultAction,

    // Filtering and search
    filterConversations,
    clearFilters,
    currentFilters,

    // Stats
    getMessageStats
  }
}

