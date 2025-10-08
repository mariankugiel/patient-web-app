import { useEffect, useState, useCallback, useRef } from 'react'

interface WebSocketMessage {
  type: string
  data: any
  timestamp?: number
}

interface UseWebSocketOptions {
  url: string
  token: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket({
  url,
  token,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseWebSocketOptions) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef<boolean>(false) // Prevent duplicate connections

  const connect = useCallback(() => {
    // Prevent duplicate connections
    if (ws?.readyState === WebSocket.OPEN || isConnectingRef.current) {
      console.log('🔌 WebSocket already connected or connecting, skipping...')
      return
    }

    isConnectingRef.current = true

    try {
      const websocketUrl = `${url}?token=${encodeURIComponent(token)}`
      console.log('🔌 Connecting to WebSocket:', websocketUrl)
      
      const websocket = new WebSocket(websocketUrl)

      websocket.onopen = () => {
        console.log('✅ WebSocket connected')
        setIsConnected(true)
        setReconnectAttempts(0)
        isConnectingRef.current = false // Reset connecting flag
        onConnect?.()
        
        // Send heartbeat ping every 30 seconds to keep connection alive
        heartbeatIntervalRef.current = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ 
              type: 'ping', 
              data: { timestamp: Date.now() } 
            }))
          }
        }, 30000)
      }

      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          if (message.type === 'connection_established') {
            setConnectionId(message.data.connection_id)
            console.log('🆔 Connection ID:', message.data.connection_id)
          } else if (message.type === 'pong') {
            console.log('🏓 Received pong')
          } else {
            onMessage?.(message)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        onError?.(error)
      }

      websocket.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        setConnectionId(null)
        isConnectingRef.current = false // Reset connecting flag
        onDisconnect?.()
        
        // Clear heartbeat interval
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }
        
        // Attempt to reconnect
        setReconnectAttempts(prev => {
          if (prev < maxReconnectAttempts) {
            console.log(`🔄 Will attempt to reconnect in ${reconnectInterval/1000} seconds... (attempt ${prev + 1}/${maxReconnectAttempts})`)
            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, reconnectInterval)
            return prev + 1
          } else {
            console.log('❌ Max reconnection attempts reached')
            return prev
          }
        })
      }

      setWs(websocket)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      isConnectingRef.current = false // Reset connecting flag on error
    }
  }, [url, token, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts]) // Removed ws and reconnectAttempts to prevent circular dependencies

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    isConnectingRef.current = false // Reset connecting flag
    setWs(currentWs => {
      if (currentWs) {
        currentWs.close()
      }
      return null
    })
    setIsConnected(false)
    setConnectionId(null)
  }, []) // Remove ws dependency to prevent circular dependency

  const sendMessage = useCallback((message: any) => {
    // Use a ref to access the current WebSocket without causing dependency issues
    const currentWs = ws
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      currentWs.send(JSON.stringify(message))
      return true
    }
    return false
  }, [ws]) // Keep ws dependency but this should be stable now

  const sendPing = useCallback(() => {
    return sendMessage({ 
      type: 'ping', 
      data: { timestamp: Date.now() } 
    })
  }, [sendMessage])

  const getOnlineUsers = useCallback(() => {
    return sendMessage({ type: 'get_online_users' })
  }, [sendMessage])

  const getUserStatus = useCallback((userId: number) => {
    return sendMessage({ 
      type: 'get_user_status', 
      data: { user_id: userId } 
    })
  }, [sendMessage])

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (token && url) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [token, url]) // Remove connect and disconnect from dependencies

  return {
    isConnected,
    connectionId,
    reconnectAttempts,
    sendMessage,
    sendPing,
    getOnlineUsers,
    getUserStatus,
    connect,
    disconnect
  }
}

