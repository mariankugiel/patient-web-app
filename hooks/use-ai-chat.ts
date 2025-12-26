import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { messagesApiService } from '@/lib/api/messages-api'
import type { AIChatMessage, AIChatRequest } from '@/types/messages'
import { RootState } from '@/lib/store'

const STORAGE_KEY_PREFIX = 'saluso-support-chat'

interface UseAIChatReturn {
  messages: AIChatMessage[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearHistory: () => void
}

function getStorageKey(userId: number | string | null): string {
  if (!userId) return `${STORAGE_KEY_PREFIX}-guest`
  return `${STORAGE_KEY_PREFIX}-${userId}`
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get user ID from auth state
  const user = useSelector((state: RootState) => state.auth.user)
  const userId = user?.id || user?.user_metadata?.id || null
  
  const storageKeyRef = useRef<string>(getStorageKey(userId))
  
  // Update storage key when user changes
  useEffect(() => {
    storageKeyRef.current = getStorageKey(userId)
    // Reload messages when user changes
    loadMessages()
  }, [userId])
  
  // Load messages from localStorage on mount
  const loadMessages = useCallback(() => {
    try {
      const key = storageKeyRef.current
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as AIChatMessage[]
        // Validate and set messages
        if (Array.isArray(parsed)) {
          setMessages(parsed)
        }
      }
    } catch (err) {
      console.error('Failed to load AI chat history:', err)
      setMessages([])
    }
  }, [])
  
  // Load messages on mount
  useEffect(() => {
    loadMessages()
  }, [loadMessages])
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      const key = storageKeyRef.current
      if (messages.length > 0) {
        localStorage.setItem(key, JSON.stringify(messages))
      } else {
        // Remove key if no messages
        localStorage.removeItem(key)
      }
    } catch (err) {
      console.error('Failed to save AI chat history:', err)
    }
  }, [messages])
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      setError('Message cannot be empty')
      return
    }
    
    setIsSending(true)
    setError(null)
    
    try {
      // Create user message
      const userMessage: AIChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString()
      }
      
      // Add user message immediately
      setMessages(prev => [...prev, userMessage])
      
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      // Add current user message to history
      conversationHistory.push({
        role: 'user',
        content: content.trim()
      })
      
      // Call AI chat API
      const request: AIChatRequest = {
        message: content.trim(),
        conversation_history: conversationHistory.slice(-20) // Last 20 messages
      }
      
      const response = await messagesApiService.sendAIChatMessage(request)
      
      // Create assistant message
      const assistantMessage: AIChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      }
      
      // Add assistant message
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (err: any) {
      console.error('Failed to send AI chat message:', err)
      setError(err?.response?.data?.detail || err?.message || 'Failed to send message. Please try again.')
      
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsSending(false)
    }
  }, [messages])
  
  const clearHistory = useCallback(() => {
    setMessages([])
    try {
      const key = storageKeyRef.current
      localStorage.removeItem(key)
    } catch (err) {
      console.error('Failed to clear AI chat history:', err)
    }
  }, [])
  
  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    clearHistory
  }
}

