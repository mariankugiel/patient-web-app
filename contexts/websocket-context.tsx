"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { globalWebSocketManager } from '@/lib/websocket-manager'

interface WebSocketContextType {
  isConnected: boolean
  connectionId: string | null
  sendMessage: (message: any) => boolean
  notifications: any[]
  unreadCount: number
  markAsRead: (notificationId: number) => Promise<void>
  dismissNotification: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  // User status change handler
  onUserStatusChange?: (callback: (userId: number, status: 'online' | 'offline') => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children, userId }: { children: React.ReactNode, userId: number | null }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const websocketUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws'

  // Memoize callback functions to prevent infinite re-renders
  const markAsTaken = useCallback(async (medicationId: number) => {
    try {
      console.log('Marking medication as taken:', medicationId)
    } catch (error) {
      console.error('Failed to mark medication as taken:', error)
    }
  }, [])

  const snoozeReminder = useCallback(async (medicationId: number) => {
    try {
      console.log('Snoozing reminder for medication:', medicationId)
    } catch (error) {
      console.error('Failed to snooze reminder:', error)
    }
  }, [])

  const [userStatusCallbacks, setUserStatusCallbacks] = useState<Set<(userId: number, status: 'online' | 'offline') => void>>(new Set())

  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('📩 Received WebSocket message:', message)
    
    if (message.type === 'medication_reminder' || message.type === 'notification') {
      console.log('📩 Received notification:', message.data)
      
      // Add to notifications list
      setNotifications(prev => [message.data, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification (if permission granted)
      showBrowserNotification(message.data, markAsTaken, snoozeReminder)
      
      // Play notification sound
      playNotificationSound()
      
      // Update notification count
      updateNotificationCount()
    } else if (message.type === 'user_status_change') {
      console.log('👤 User status changed:', message.data)
      
      // Notify all registered callbacks
      userStatusCallbacks.forEach(callback => {
        callback(message.data.user_id, message.data.status)
      })
    } else if (message.type === 'new_message') {
      console.log('💬 Received new message:', message.data)
      
      // Show browser notification for new messages
      if (message.data && message.data.message) {
        // Use sender_id instead of sender.name since we simplified the message structure
        const senderId = message.data.message.sender_id
        showBrowserNotification({
          title: `New message from User ${senderId}`,
          message: message.data.message.content,
          type: 'message'
        }, markAsTaken, snoozeReminder)
        
        // Play notification sound
        playNotificationSound()
      }
    }
  }, [markAsTaken, snoozeReminder, userStatusCallbacks])

  const handleWebSocketConnect = useCallback(() => {
    console.log('✅ WebSocket connected for notifications')
    console.log('✅ WebSocket connection established with URL:', websocketUrl)
    console.log('✅ WebSocket token:', token ? 'Present' : 'Missing')
  }, [websocketUrl, token])

  const handleWebSocketDisconnect = useCallback(() => {
    console.log('🔌 WebSocket disconnected for notifications')
  }, [])


  // Connect to global WebSocket manager
  // IMPORTANT: WebSocket connection is ALWAYS for the logged-in user (via token from localStorage)
  // It does NOT change when switching to view another patient's data
  // The connection is stable and persistent across user switches
  useEffect(() => {
    console.log('🔌 WebSocket useEffect triggered')
    console.log('🔌 Token available:', !!token)
    console.log('🔌 WebSocket URL:', websocketUrl)
    console.log('🔌 UserId prop (for notifications only, not connection):', userId)
    console.log('🔌 NOTE: WebSocket connection uses token from localStorage (logged-in user), not userId prop')
    
    if (token && websocketUrl) {
      // Only connect if not already connected with the same token
      // This prevents reconnection when switching users (viewing another patient)
      const currentToken = globalWebSocketManager.currentToken
      const currentUrl = globalWebSocketManager.currentUrl
      const isAlreadyConnected = globalWebSocketManager.connected
      
      // If already connected with the same token and URL, keep the existing connection
      // This ensures WebSocket stays connected when switching users
      if (isAlreadyConnected && currentToken === token && currentUrl === websocketUrl) {
        console.log('🔌 WebSocket already connected with same token - keeping existing connection (correct when switching users)')
        // Don't reconnect - just ensure state is synced
        setIsConnected(true)
        setConnectionId(globalWebSocketManager.connectionIdValue)
      } else {
        console.log('🔌 Attempting WebSocket connection for logged-in user...')
        globalWebSocketManager.connect(websocketUrl, token)
      }
    } else {
      console.log('🔌 WebSocket connection skipped - missing token or URL')
    }

    // Set up event handlers
    const removeMessageHandler = globalWebSocketManager.addMessageHandler(handleWebSocketMessage)
    const removeConnectionHandler = globalWebSocketManager.addConnectionHandler(handleWebSocketConnect)
    const removeDisconnectHandler = globalWebSocketManager.addDisconnectHandler(handleWebSocketDisconnect)
    
    // Add error handler for authentication errors
    const handleWebSocketError = (error: Event) => {
      console.error('🔐 WebSocket authentication error:', error)
      // Check if it's an authentication error and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth/login'
      }
    }
    const removeErrorHandler = globalWebSocketManager.addErrorHandler(handleWebSocketError)

    // Update state from global manager
    setIsConnected(globalWebSocketManager.connected)
    setConnectionId(globalWebSocketManager.connectionIdValue)

    return () => {
      // IMPORTANT: Do NOT disconnect WebSocket when component unmounts or userId changes
      // Only remove event handlers - keep the connection alive
      removeMessageHandler()
      removeConnectionHandler()
      removeDisconnectHandler()
      removeErrorHandler()
    }
    // NOTE: Only depend on token and websocketUrl - NOT userId or patientId
    // This ensures WebSocket stays connected when switching users
  }, [token, websocketUrl]) // userId is intentionally NOT in dependencies - WebSocket is always for logged-in user

  // Update state when global manager state changes
  useEffect(() => {
    const updateState = () => {
      setIsConnected(globalWebSocketManager.connected)
      setConnectionId(globalWebSocketManager.connectionIdValue)
    }

    // Update immediately
    updateState()

    // Set up interval to sync state (in case we miss events)
    const interval = setInterval(updateState, 1000)

    return () => clearInterval(interval)
  }, [])

  const sendMessage = useCallback((message: any) => {
    return globalWebSocketManager.sendMessage(message)
  }, [])

  // Fetch initial notifications on mount
  // IMPORTANT: Notifications are always for the logged-in user (userId prop), not the switched patient
  // This ensures notifications are always relevant to the main user's account
  // The userId prop should always refer to the logged-in user's database ID
  useEffect(() => {
    if (!userId) {
      console.log('🔔 Notifications skipped - userId not available')
      return
    }

    console.log('🔔 Loading notifications for logged-in user (userId):', userId)
    console.log('🔔 NOTE: Notifications are always for logged-in user, not switched patient')

    // Load notification history from database
    import('@/lib/api/medication-reminders-api').then(({ notificationsApiService }) => {
      notificationsApiService.getNotifications()
        .then(data => {
          console.log('🔔 Loaded notification history for logged-in user:', data.length)
          setNotifications(data)
        })
        .catch(error => {
          // Silently fail - notifications are optional
          console.debug('🔔 Notifications not available:', error.message)
        })

      // Load unread count
      notificationsApiService.getUnreadCount()
        .then(data => setUnreadCount(data.count))
        .catch(error => {
          // Silently fail - notifications are optional
          console.debug('🔔 Unread count not available:', error.message)
        })
    })
    // NOTE: userId here refers to logged-in user, not switched patient
    // Only re-fetch notifications if the logged-in user ID changes (e.g., after logout/login)
    // NOT when switching to view another patient's data
  }, [userId]) // userId = logged-in user's ID, NOT the switched patient's ID

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const { notificationsApiService } = await import('@/lib/api/medication-reminders-api')
      await notificationsApiService.markAsRead(notificationId)
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const dismissNotification = useCallback(async (notificationId: number) => {
    try {
      const { notificationsApiService } = await import('@/lib/api/medication-reminders-api')
      await notificationsApiService.dismissNotification(notificationId)
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: 'dismissed' } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to dismiss notification:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const { notificationsApiService } = await import('@/lib/api/medication-reminders-api')
      await notificationsApiService.markAllAsRead()
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  const onUserStatusChange = useCallback((callback: (userId: number, status: 'online' | 'offline') => void) => {
    setUserStatusCallbacks(prev => new Set(prev).add(callback))
    
    // Return cleanup function
    return () => {
      setUserStatusCallbacks(prev => {
        const newSet = new Set(prev)
        newSet.delete(callback)
        return newSet
      })
    }
  }, [])

  const value = {
    isConnected,
    connectionId,
    sendMessage,
    notifications,
    unreadCount,
    markAsRead,
    dismissNotification,
    markAllAsRead,
    onUserStatusChange
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}

// Helper functions
function showBrowserNotification(
  notification: any, 
  markAsTakenCallback: (medicationId: number) => void,
  snoozeReminderCallback: (medicationId: number) => void
) {
  if (!("Notification" in window)) return
  
  if (Notification.permission === "granted") {
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag: `medication-${notification.medication_id}`,
      requireInteraction: true
      // Note: actions are not supported in all browsers
    })
    
    // Handle notification clicks
    browserNotification.onclick = () => {
      window.focus()
      browserNotification.close()
    }
    
    // Handle action button clicks
    browserNotification.addEventListener('click', (event: any) => {
      if (event.action === 'taken') {
        markAsTakenCallback(notification.medication_id)
        browserNotification.close()
      } else if (event.action === 'snooze') {
        snoozeReminderCallback(notification.medication_id)
        browserNotification.close()
      }
    })
    
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(notification.title, {
          body: notification.message
        })
      }
    })
  }
}

function playNotificationSound() {
  const audio = new Audio('/notification-sound.mp3')
  audio.volume = 0.5
  audio.play().catch(() => {
    // Ignore if autoplay is blocked
  })
}

function updateNotificationCount() {
  // Update notification bell badge count
  const event = new CustomEvent('notification-received')
  window.dispatchEvent(event)
}
