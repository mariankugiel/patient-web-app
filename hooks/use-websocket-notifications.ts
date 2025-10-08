import { useEffect, useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { notificationsApiService, type Notification } from '@/lib/api/medication-reminders-api'
import { useWebSocket } from './use-websocket'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export function useWebSocketNotifications(userId: number | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const websocketUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws'

  // Define callback functions first (before they're used in dependencies)
  const markAsTaken = useCallback(async (medicationId: number) => {
    try {
      // TODO: Implement mark as taken API call
      console.log('Marking medication as taken:', medicationId)
      
      toast({
        title: "✅ Medication marked as taken",
        description: "Great job staying on track!"
      })
    } catch (error) {
      console.error('Failed to mark medication as taken:', error)
    }
  }, [toast])

  const snoozeReminder = useCallback(async (medicationId: number) => {
    try {
      // TODO: Implement snooze API call
      console.log('Snoozing reminder for medication:', medicationId)
      
      toast({
        title: "⏰ Reminder snoozed",
        description: "We'll remind you again in 10 minutes"
      })
    } catch (error) {
      console.error('Failed to snooze reminder:', error)
    }
  }, [toast])

  // Memoize callback functions to prevent infinite re-renders
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('📩 Received WebSocket message:', message)
    
    if (message.type === 'medication_reminder' || message.type === 'notification') {
      console.log('📩 Received notification:', message.data)
      
      // Add to notifications list
      setNotifications(prev => [message.data, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show toast notification
      toast({
        title: message.data.title,
        description: message.data.message,
        duration: 10000, // 10 seconds
      })
      
      // Show browser notification (if permission granted)
      showBrowserNotification(message.data, markAsTaken, snoozeReminder)
      
      // Play notification sound
      playNotificationSound()
      
      // Update notification count
      updateNotificationCount()
    }
  }, [toast, markAsTaken, snoozeReminder])

  const handleWebSocketConnect = useCallback(() => {
    console.log('✅ WebSocket connected for notifications')
  }, [])

  const handleWebSocketDisconnect = useCallback(() => {
    console.log('🔌 WebSocket disconnected for notifications')
  }, [])

  const handleWebSocketError = useCallback((error: any) => {
    console.error('❌ WebSocket error:', error)
  }, [])

  // Use the new WebSocket hook
  const { isConnected, connectionId, sendMessage } = useWebSocket({
    url: websocketUrl,
    token: token || '',
    onMessage: handleWebSocketMessage,
    onConnect: handleWebSocketConnect,
    onDisconnect: handleWebSocketDisconnect,
    onError: handleWebSocketError
  })

  // Fetch initial notifications on mount
  useEffect(() => {
    if (!userId) return

    // Load notification history from database
    notificationsApiService.getNotifications()
      .then(data => {
        console.log('Loaded notification history:', data.length)
        setNotifications(data)
      })
      .catch(console.error)

    // Load unread count
    notificationsApiService.getUnreadCount()
      .then(data => setUnreadCount(data.count))
      .catch(console.error)
  }, [userId])

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
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
      await notificationsApiService.markAllAsRead()
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  return {
    isConnected,
    connectionId,
    notifications,
    unreadCount,
    markAsRead,
    dismissNotification,
    markAllAsRead,
    sendMessage
  }
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
