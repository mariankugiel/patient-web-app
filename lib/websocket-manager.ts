/**
 * Global WebSocket Manager
 * Ensures only one WebSocket connection exists across the entire application
 */

interface WebSocketMessage {
  type: string
  data: any
  timestamp?: number
}

type MessageHandler = (message: WebSocketMessage) => void
type ConnectionHandler = () => void
type ErrorHandler = (error: Event) => void

class GlobalWebSocketManager {
  private ws: WebSocket | null = null
  private url: string = ''
  private token: string = ''
  private isConnected: boolean = false
  private connectionId: string | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectInterval: number = 5000
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageHandlers: Set<MessageHandler> = new Set()
  private connectionHandlers: Set<ConnectionHandler> = new Set()
  private disconnectHandlers: Set<ConnectionHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private isConnecting: boolean = false // Prevent multiple connection attempts

  private static instance: GlobalWebSocketManager | null = null

  static getInstance(): GlobalWebSocketManager {
    if (!GlobalWebSocketManager.instance) {
      GlobalWebSocketManager.instance = new GlobalWebSocketManager()
    }
    return GlobalWebSocketManager.instance
  }

  connect(url: string, token: string): void {
    console.log('🔌 Attempting to connect to WebSocket:', url)
    console.log('🔌 Token present:', token ? 'Yes' : 'No')
    
    // If already connecting, don't start another connection
    if (this.isConnecting) {
      console.log('🔌 WebSocket connection already in progress, skipping...')
      return
    }

    // If already connected to the same URL with the same token, don't reconnect
    if (this.ws?.readyState === WebSocket.OPEN && this.url === url && this.token === token) {
      console.log('🔌 WebSocket already connected to the same endpoint, skipping...')
      return
    }

    // If already connecting to the same endpoint, don't start another connection
    if (this.ws?.readyState === WebSocket.CONNECTING && this.url === url && this.token === token) {
      console.log('🔌 WebSocket already connecting to the same endpoint, skipping...')
      return
    }

    // If connecting to different endpoint, disconnect first
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('🔌 Disconnecting from previous WebSocket before connecting to new endpoint')
      this.disconnect()
    }

    this.url = url
    this.token = token
    this.isConnecting = true

    try {
      const websocketUrl = `${url}?token=${encodeURIComponent(token)}`
      console.log('🔌 Connecting to WebSocket:', websocketUrl)
      
      this.ws = new WebSocket(websocketUrl)

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected globally')
        this.isConnected = true
        this.isConnecting = false
        this.reconnectAttempts = 0
        
        // Notify all connection handlers
        this.connectionHandlers.forEach(handler => handler())
        
        // Start heartbeat
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          if (message.type === 'connection_established') {
            this.connectionId = message.data.connection_id
            console.log('🆔 Global Connection ID:', message.data.connection_id)
          } else if (message.type === 'pong') {
            console.log('🏓 Received pong')
          } else {
            // Notify all message handlers
            this.messageHandlers.forEach(handler => handler(message))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('❌ Global WebSocket error:', error)
        this.errorHandlers.forEach(handler => handler(error))
      }

      this.ws.onclose = (event) => {
        console.log('🔌 Global WebSocket closed:', event.code, event.reason)
        this.isConnected = false
        this.isConnecting = false
        this.connectionId = null
        
        // Check for authentication errors
        if (event.code === 1008 || event.code === 1002 || event.reason?.includes('unauthorized') || event.reason?.includes('expired')) {
          console.log('🔐 Authentication error detected, redirecting to login')
          // Clear token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/auth/login'
            return
          }
        }
        
        // Notify all disconnect handlers
        this.disconnectHandlers.forEach(handler => handler())
        
        // Stop heartbeat
        this.stopHeartbeat()
        
        // Attempt to reconnect
        this.attemptReconnect()
      }

    } catch (error) {
      console.error('Failed to create global WebSocket connection:', error)
      this.isConnecting = false
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    this.stopHeartbeat()
    this.isConnecting = false
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.isConnected = false
    this.connectionId = null
  }

  sendMessage(message: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
      return true
    }
    return false
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ 
          type: 'ping', 
          data: { timestamp: Date.now() } 
        })
      }
    }, 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`🔄 Will attempt to reconnect in ${this.reconnectInterval/1000} seconds... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++
        this.connect(this.url, this.token)
      }, this.reconnectInterval)
    } else {
      console.log('❌ Max reconnection attempts reached')
    }
  }

  // Event handlers
  addMessageHandler(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  addConnectionHandler(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  addDisconnectHandler(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler)
    return () => this.disconnectHandlers.delete(handler)
  }

  addErrorHandler(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  // Getters
  get connected(): boolean {
    return this.isConnected
  }

  get connectionIdValue(): string | null {
    return this.connectionId
  }

  get reconnectAttemptsCount(): number {
    return this.reconnectAttempts
  }
}

export const globalWebSocketManager = GlobalWebSocketManager.getInstance()
