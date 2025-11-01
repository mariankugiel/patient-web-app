import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { messagesApiService } from '@/lib/api/messages-api'
import { useWebSocketContext } from '@/contexts/websocket-context'
import { globalWebSocketManager } from '@/lib/websocket-manager'
import { setConversationParticipants } from '@/lib/features/messages/messageParticipantsSlice'
import { 
  setConversations as setGlobalConversations, 
  setUnreadCount as setGlobalUnreadCount,
  addNewMessage as addGlobalNewMessage,
  markConversationAsRead as markGlobalConversationAsRead
} from '@/lib/features/messages/conversationsSlice'
import type { 
  Conversation, 
  Message, 
  MessageType, 
  MessageFilters,
  MessageSearchParams,
  MedicationReminderMessage,
  HealthPlanSupportMessage,
  AppointmentReminderMessage,
  LabResultsMessage,
  MessageAttachment
} from '@/types/messages'

interface UseMessagesReturn {
  // Data
  conversations: Conversation[]
  selectedConversation: Conversation | null
  messages: Message[]
  unreadCount: number
  unreadCountByType: Record<string, number>
  loading: boolean
  loadingConversations: boolean
  loadingMessages: boolean
  sendingMessage: boolean
  error: string | null
  currentUserId: number | null  // Add actual database user ID
  typingUsers: Set<number>  // Add typing users

  // Actions
  selectConversation: (conversationId: string) => void
  sendMessage: (content: string, type?: MessageType, attachments?: MessageAttachment[]) => Promise<void>
  uploadFile: (file: File) => Promise<MessageAttachment>
  sendMessageWithFiles: (content: string, files: FileList, type?: MessageType) => Promise<void>
  markAsRead: (messageId?: string) => Promise<void>
  sendTypingIndicator: (isTyping: boolean) => void
  markConversationAsRead: (conversationId: string) => Promise<void>
  archiveConversation: (conversationId: string) => Promise<void>
  togglePin: (conversationId: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  searchMessages: (params: MessageSearchParams) => Promise<Message[]>
  refreshConversations: () => Promise<void>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>

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
  const dispatch = useDispatch()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadCountByType, setUnreadCountByType] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<MessageFilters | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)  // Store actual database user ID
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set())  // Track typing users
  const typingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map())  // Track typing timeouts per user

  const { isConnected, sendMessage: sendWebSocketMessage } = useWebSocketContext()

  // Handle WebSocket messages
  useEffect(() => {
    if (!isConnected) return

    const handleWebSocketMessage = (message: any) => {
      console.log('📨 WebSocket message received:', message)
      
      switch (message.type) {
        case 'new_message':
          // Handle new message from WebSocket
          if (message.data && message.data.message) {
            const newMessage = message.data.message
            console.log('📨 Processing new message:', newMessage)
            console.log('📨 Message attachments:', newMessage.attachments)
            console.log('📨 Message file_attachments:', newMessage.file_attachments)
            
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === newMessage.id)
              if (exists) {
                console.log('📨 Message already exists, skipping')
                return prev
              }
              console.log('📨 Adding new message to state')
              return [...prev, newMessage]
            })
            
            // Update conversations with new message
            setConversations(prev => 
              prev.map(conv => 
                conv.id === newMessage.conversation_id 
                  ? { 
                      ...conv, 
                      lastMessage: newMessage, 
                      lastMessageTime: newMessage.created_at,
                      unreadCount: conv.unreadCount + 1
                    }
                  : conv
              )
            )
            
            // Update global conversations state
            dispatch(addGlobalNewMessage({
              conversationId: newMessage.conversation_id,
              message: newMessage
            }))
          }
          break
          
        case 'typing_indicator':
          // Handle typing indicators
          if (message.data) {
            const { user_id, is_typing, conversation_id } = message.data
            console.log('🔤 Received typing indicator:', { user_id, is_typing, conversation_id })
            
            // Clear existing timeout for this user if any
            const existingTimeout = typingTimeoutsRef.current.get(user_id)
            if (existingTimeout) {
              clearTimeout(existingTimeout)
              typingTimeoutsRef.current.delete(user_id)
            }
            
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              if (is_typing) {
                newSet.add(user_id)
                console.log('🔤 Added user to typing set:', user_id)
                
                // Auto-clear typing indicator after 3 seconds if not explicitly stopped
                const timeout = setTimeout(() => {
                  setTypingUsers(prev => {
                    const updatedSet = new Set(prev)
                    updatedSet.delete(user_id)
                    console.log('🔤 Auto-removed user from typing set:', user_id)
                    return updatedSet
                  })
                  typingTimeoutsRef.current.delete(user_id)
                }, 3000)
                typingTimeoutsRef.current.set(user_id, timeout)
              } else {
                newSet.delete(user_id)
                console.log('🔤 Removed user from typing set:', user_id)
              }
              return newSet
            })
          }
          break
          
        case 'message_typing':
          // Handle conversation typing indicators
          if (message.data) {
            const { user_id, is_typing } = message.data
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              if (is_typing) {
                newSet.add(user_id)
              } else {
                newSet.delete(user_id)
              }
              return newSet
            })
          }
          break
      }
    }

    // Register WebSocket message handler with the global WebSocket manager
    const removeHandler = globalWebSocketManager.addMessageHandler(handleWebSocketMessage)
    
      return () => {
        removeHandler()
        // Clean up all typing timeouts
        typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
        typingTimeoutsRef.current.clear()
      }
  }, [isConnected])

  // Load conversations on mount and when filters change
  const loadConversations = useCallback(async (filters?: MessageFilters) => {
    try {
      console.log('📋 Loading conversations with filters:', filters)
      setLoadingConversations(true)
      setError(null)
      const response = await messagesApiService.getConversations(filters)
      console.log('📋 Conversations loaded:', response.conversations)
      console.log('📋 Conversations count:', response.conversations.length)
      console.log('📋 Current user ID from backend:', response.current_user_id)
      setConversations(response.conversations)
      setUnreadCount(response.unreadCount) // ✅ Already included in response
      setCurrentUserId(response.current_user_id) // ✅ Store actual database user ID
      
      // Update global conversations state
      dispatch(setGlobalConversations(response.conversations))
      dispatch(setGlobalUnreadCount(response.unreadCount))
    } catch (err) {
      console.error('📋 Failed to load conversations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setLoadingConversations(false)
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
      console.log('📥 Loading messages for conversation:', conversationId)
      setLoadingMessages(true)
      const response = await messagesApiService.getConversationMessages(conversationId)
      console.log('📥 Messages loaded:', response.messages)
      console.log('📥 Messages count:', response.messages.length)
      
      // Sort messages by creation date (oldest first)
      const sortedMessages = response.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setMessages(sortedMessages)
    } catch (err) {
      console.error('📥 Failed to load messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // Select conversation
  const selectConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setSelectedConversation(conversation)
      setLoadingMessages(true) // Set loading state when selecting conversation
      loadMessages(conversationId)
      
      // Store participants in Redux
      const participants = [
        {
          id: conversation.user_id,
          name: conversation.current_user_name || 'Unknown',
          role: conversation.current_user_role || 'PATIENT',
          avatar: conversation.current_user_avatar,
          initials: conversation.current_user_initials || 'U'
        },
        {
          id: conversation.contact_id,
          name: conversation.contact_name || 'Unknown',
          role: conversation.contact_role || 'PATIENT',
          avatar: conversation.contact_avatar,
          initials: conversation.contact_initials || 'U'
        }
      ]
      
      dispatch(setConversationParticipants({
        conversationId,
        participants
      }))
      
      // Mark conversation as read when selected
      if (conversation.unreadCount > 0) {
        markConversationAsRead(conversationId)
      }
    }
  }, [conversations, loadMessages, dispatch])

  // Send message via WebSocket
  const sendMessage = useCallback(async (content: string, type: MessageType = 'general', attachments?: MessageAttachment[]) => {
    if (!selectedConversation || (!content.trim() && (!attachments || attachments.length === 0)) || sendingMessage) return

    console.log('📤 Sending message via WebSocket:', { content, type, conversationId: selectedConversation.id, attachments })

    setSendingMessage(true)
    try {
      // Send message via WebSocket instead of HTTP API
      if (isConnected && sendWebSocketMessage) {
        const messageData = {
          type: 'send_message',
          data: {
            conversation_id: selectedConversation.id,
            target_user_id: selectedConversation.contact_id,
            message: content.trim(),
            message_type: type,
            priority: 'normal',
            attachments: attachments
          }
        }
        
        console.log('📤 WebSocket message data:', messageData)
        console.log('📤 Sending via WebSocket, attachments:', attachments)
        sendWebSocketMessage(messageData)
        
        // Add message to local state immediately for optimistic UI
        const newMessage: Message = {
          id: `temp_${Date.now()}`, // Temporary ID for optimistic UI
          conversation_id: selectedConversation.id,
          sender_id: currentUserId || 0,
          content: content.trim(),
          message_type: type,
          priority: 'normal',
          status: 'sent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_metadata: {},
          attachments: attachments || [],
          file_attachments: attachments || [] // Also add to file_attachments for compatibility
        }
        
        console.log('📤 Adding optimistic message to state:', newMessage)
        setMessages(prev => [...prev, newMessage])
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, lastMessage: newMessage, lastMessageTime: newMessage.created_at }
              : conv
          )
        )
        
        // Update global conversations state
        dispatch(addGlobalNewMessage({
          conversationId: selectedConversation.id,
          message: newMessage
        }))
      } else {
        console.log('📤 WebSocket not connected, falling back to HTTP API')
        // Fallback to HTTP API if WebSocket is not connected
        const response = await messagesApiService.sendMessage({
          conversation_id: selectedConversation.id,
          content: content.trim(),
          message_type: type,
          priority: 'normal',
          attachments: attachments
        })
        
        if (response.message) {
          const newMessage = response.message
          console.log('📤 Message sent via HTTP API:', newMessage)
          
          setMessages(prev => [...prev, newMessage])
          setConversations(prev => 
            prev.map(conv => 
              conv.id === selectedConversation.id 
                ? { ...conv, lastMessage: newMessage, lastMessageTime: newMessage.created_at }
                : conv
            )
          )
          
          // Update global conversations state
          dispatch(addGlobalNewMessage({
            conversationId: selectedConversation.id,
            message: newMessage
          }))
        } else {
          throw new Error('Failed to send message - no response data')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }, [selectedConversation, isConnected, sendWebSocketMessage, sendingMessage, currentUserId])

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!selectedConversation || !isConnected || !sendWebSocketMessage) return

    const typingData = {
      type: 'message_typing',
      data: {
        conversation_id: selectedConversation.id,
        is_typing: isTyping
      }
    }
    
    console.log('⌨️ Sending typing indicator:', typingData)
    sendWebSocketMessage(typingData)
  }, [selectedConversation, isConnected, sendWebSocketMessage])

  // Upload file and return attachment data
  const uploadFile = useCallback(async (file: File): Promise<MessageAttachment> => {
    try {
      console.log('📎 Uploading file:', file.name)
      const attachment = await messagesApiService.uploadFile(file)
      console.log('📎 File uploaded successfully:', attachment)
      return attachment
    } catch (error) {
      console.error('📎 Failed to upload file:', error)
      throw error
    }
  }, [])

  // Send message with files
  const sendMessageWithFiles = useCallback(async (content: string, files: FileList, type: MessageType = 'general') => {
    if (!selectedConversation || (!content.trim() && files.length === 0)) return

    try {
      // Upload files first
      const attachments: MessageAttachment[] = []
      if (files && files.length > 0) {
        for (const file of files) {
          const attachment = await uploadFile(file)
          attachments.push(attachment)
        }
      }

      // Send message with attachments
      await sendMessage(content, type, attachments.length > 0 ? attachments : undefined)
    } catch (error) {
      console.error('📤 Failed to send message with files:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message with files')
    }
  }, [selectedConversation, uploadFile, sendMessage])

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
      
      // Update global state
      dispatch(markGlobalConversationAsRead(conversationId))
    } catch (err) {
      console.error('Failed to mark conversation as read:', err)
    }
  }, [conversations, dispatch])

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
                message_metadata: { 
                  ...msg.message_metadata, 
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
                message_metadata: { 
                  ...msg.message_metadata, 
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
                message_metadata: { 
                  ...msg.message_metadata, 
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
    loadingConversations,
    loadingMessages,
    sendingMessage,
    error,
    currentUserId,  // Add actual database user ID
    typingUsers,  // Add typing users

    // Actions
    selectConversation,
    sendMessage,
    uploadFile,
    sendMessageWithFiles,
    markAsRead,
    sendTypingIndicator,
    markConversationAsRead,
    archiveConversation,
    togglePin,
    deleteMessage,
    deleteConversation,
    searchMessages,
    refreshConversations,
    setMessages,

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

