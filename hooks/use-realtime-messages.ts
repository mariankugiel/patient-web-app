"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useMessages } from "./use-messages"
import type { Message, Conversation } from "@/types/messages"

interface TypingUser {
  userId: string
  userName: string
  conversationId: string
  timestamp: number
}

interface RealtimeMessageData {
  type: 'new_message' | 'message_updated' | 'message_deleted' | 'typing_start' | 'typing_stop' | 'user_online' | 'user_offline'
  data: any
  conversationId: string
  timestamp: string
}

export function useRealtimeMessages() {
  const { sendMessage: sendWebSocketMessage, isConnected } = useWebSocketContext()
  const {
    conversations,
    selectedConversation,
    messages,
    sendMessage: sendApiMessage,
    refreshConversations,
    refreshMessages
  } = useMessages()

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingTimeRef = useRef<number>(0)

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const messageData: RealtimeMessageData = JSON.parse(event.data)
      console.log('📨 WebSocket message received in useRealtimeMessages:', messageData)
      
      switch (messageData.type) {
        case 'new_message':
          console.log('📨 Processing new_message:', messageData.data)
          handleNewMessage(messageData.data)
          break
        case 'message_updated':
          handleMessageUpdated(messageData.data)
          break
        case 'message_deleted':
          handleMessageDeleted(messageData.data)
          break
        case 'typing_start':
          handleTypingStart(messageData.data)
          break
        case 'typing_stop':
          handleTypingStop(messageData.data)
          break
        case 'user_online':
          handleUserOnline(messageData.data)
          break
        case 'user_offline':
          handleUserOffline(messageData.data)
          break
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }, [])

  // Handle new message
  const handleNewMessage = useCallback((message: Message) => {
    console.log('🔄 handleNewMessage called with:', message)
    console.log('🔄 Current selectedConversation:', selectedConversation)
    console.log('🔄 Message conversation_id:', message.conversation_id)
    
    // Only add message if it's for the current conversation
    if (selectedConversation && message.conversation_id === selectedConversation.id) {
      console.log('🔄 Refreshing messages for current conversation')
      refreshMessages()
    }
    
    // Refresh conversations to update unread counts and last message
    console.log('🔄 Refreshing conversations')
    refreshConversations()
  }, [selectedConversation, refreshMessages, refreshConversations])

  // Handle message updated
  const handleMessageUpdated = useCallback((message: Message) => {
    if (selectedConversation && message.conversation_id === selectedConversation.id) {
      refreshMessages()
    }
  }, [selectedConversation, refreshMessages])

  // Handle message deleted
  const handleMessageDeleted = useCallback((messageId: string) => {
    if (selectedConversation) {
      refreshMessages()
    }
  }, [selectedConversation, refreshMessages])

  // Handle typing start
  const handleTypingStart = useCallback((data: { userId: string, userName: string, conversationId: string }) => {
    if (selectedConversation && data.conversationId === selectedConversation.id) {
      setTypingUsers(prev => {
        const existing = prev.find(u => u.userId === data.userId)
        if (existing) {
          return prev.map(u => 
            u.userId === data.userId 
              ? { ...u, timestamp: Date.now() }
              : u
          )
        }
        return [...prev, { ...data, timestamp: Date.now() }]
      })
    }
  }, [selectedConversation])

  // Handle typing stop
  const handleTypingStop = useCallback((data: { userId: string, conversationId: string }) => {
    if (selectedConversation && data.conversationId === selectedConversation.id) {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId))
    }
  }, [selectedConversation])

  // Handle user online
  const handleUserOnline = useCallback((data: { userId: string }) => {
    setOnlineUsers(prev => new Set([...prev, data.userId]))
  }, [])

  // Handle user offline
  const handleUserOffline = useCallback((data: { userId: string }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev)
      newSet.delete(data.userId)
      return newSet
    })
  }, [])

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!selectedConversation || !isConnected) return

    const messageType = isTyping ? 'typing_start' : 'typing_stop'
    const message = {
      type: messageType,
      data: {
        conversationId: selectedConversation.id,
        userId: 'current_user_id', // Replace with actual user ID
        userName: 'Current User' // Replace with actual user name
      }
    }

    sendWebSocketMessage(JSON.stringify(message))
  }, [selectedConversation, isConnected, sendWebSocketMessage])

  // Handle typing in input
  const handleTyping = useCallback(() => {
    const now = Date.now()
    
    // Only send typing start if not already typing and enough time has passed
    if (!isTyping && now - lastTypingTimeRef.current > 1000) {
      setIsTyping(true)
      sendTypingIndicator(true)
      lastTypingTimeRef.current = now
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        sendTypingIndicator(false)
      }
    }, 2000)
  }, [isTyping, sendTypingIndicator])

  // Send message with real-time updates
  const sendRealtimeMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!selectedConversation) return

    try {
      // Send via API
      const message = await sendApiMessage(content, attachments)
      
      // Send via WebSocket for real-time delivery
      const wsMessage = {
        type: 'new_message',
        data: message,
        conversationId: selectedConversation.id,
        timestamp: new Date().toISOString()
      }
      
      sendWebSocketMessage(JSON.stringify(wsMessage))
      
      return message
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }, [selectedConversation, sendApiMessage, sendWebSocketMessage])

  // Send voice message
  const sendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    if (!selectedConversation) return

    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' })
      
      // Send via API
      const message = await sendApiMessage('', [audioFile])
      
      // Send via WebSocket for real-time delivery
      const wsMessage = {
        type: 'new_message',
        data: message,
        conversationId: selectedConversation.id,
        timestamp: new Date().toISOString()
      }
      
      sendWebSocketMessage(JSON.stringify(wsMessage))
      
      return message
    } catch (error) {
      console.error('Failed to send voice message:', error)
      throw error
    }
  }, [selectedConversation, sendApiMessage, sendWebSocketMessage])

  // Send file attachments
  const sendFileMessage = useCallback(async (files: FileList) => {
    if (!selectedConversation) return

    try {
      const fileArray = Array.from(files)
      const message = await sendApiMessage('', fileArray)
      
      // Send via WebSocket for real-time delivery
      const wsMessage = {
        type: 'new_message',
        data: message,
        conversationId: selectedConversation.id,
        timestamp: new Date().toISOString()
      }
      
      sendWebSocketMessage(JSON.stringify(wsMessage))
      
      return message
    } catch (error) {
      console.error('Failed to send file message:', error)
      throw error
    }
  }, [selectedConversation, sendApiMessage, sendWebSocketMessage])

  // Clean up typing users that haven't typed in a while
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < 5000)
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTyping) {
        sendTypingIndicator(false)
      }
    }
  }, [isTyping, sendTypingIndicator])

  // Set up WebSocket message handler
  useEffect(() => {
    if (isConnected) {
      // Add event listener for WebSocket messages
      const ws = (window as any).websocket // Access WebSocket instance
      if (ws) {
        ws.addEventListener('message', handleWebSocketMessage)
        
        return () => {
          ws.removeEventListener('message', handleWebSocketMessage)
        }
      }
    }
  }, [isConnected, handleWebSocketMessage])

  return {
    // State
    typingUsers,
    onlineUsers,
    isTyping,
    isConnected,
    
    // Actions
    sendRealtimeMessage,
    sendVoiceMessage,
    sendFileMessage,
    handleTyping,
    
    // Computed
    typingUsersForCurrentConversation: typingUsers.filter(
      user => selectedConversation && user.conversationId === selectedConversation.id
    ),
    isUserOnline: (userId: string) => onlineUsers.has(userId)
  }
}
