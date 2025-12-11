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
    
    // IMPORTANT: If already connected with the same token, keep the existing connection
    // This is crucial when switching users (viewing another patient) - we want to keep
    // the WebSocket connection for the logged-in user, not reconnect
    if (this.ws?.readyState === WebSocket.OPEN && this.url === url && this.token === token) {
      console.log('🔌 WebSocket already connected with same token - keeping existing connection (this is correct when switching users)')
      return
    }

    // If already connecting, don't start another connection
    if (this.isConnecting) {
      console.log('🔌 WebSocket connection already in progress, skipping...')
      return
    }

    // If already connecting to the same endpoint, don't start another connection
    if (this.ws?.readyState === WebSocket.CONNECTING && this.url === url && this.token === token) {
      console.log('🔌 WebSocket already connecting to the same endpoint, skipping...')
      return
    }

    // Only disconnect if connecting to a DIFFERENT endpoint or with a DIFFERENT token
    // This allows the connection to persist when switching users (same token, same URL)
    if ((this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) && 
        (this.url !== url || this.token !== token)) {
      console.log('🔌 Disconnecting from previous WebSocket (different endpoint or token) before connecting to new endpoint')
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
        
        try {
          localStorage.setItem('ws_token', token)
          localStorage.setItem('ws_url', url)
        } catch (storageError) {
          console.warn('Unable to persist WebSocket token/url:', storageError)
        }
        
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
        // IMPORTANT: Only clear tokens if we're certain it's an auth error, not a connection issue
        // Don't clear tokens on connection errors (code 1006) or network issues
        const isAuthError = (event.code === 1008 || event.code === 1002) && 
                           (event.reason?.includes('unauthorized') || event.reason?.includes('expired') || event.reason?.includes('token'))
        
        if (isAuthError) {
          console.log('🔐 WebSocket authentication error detected:', event.code, event.reason)
          // Only clear token and redirect if it's a clear auth error
          // Don't clear on connection issues (1006) or other errors
          if (typeof window !== 'undefined') {
            console.log('🔐 Clearing tokens due to WebSocket auth error')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/auth/login'
            return
          }
        } else {
          console.log('🔌 WebSocket closed (not auth error):', event.code, event.reason)
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
    this.token = ''
    this.url = ''
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
    if (typeof window === 'undefined') {
      return
    }
    
    const storedToken = localStorage.getItem('access_token') || localStorage.getItem('ws_token')
    const storedUrl = localStorage.getItem('ws_url') || this.url
    
    if (!storedToken || !storedUrl) {
      console.log('❌ No token available for WebSocket reconnection, skipping reconnect')
      return
    }
    
    this.token = storedToken
    this.url = storedUrl
    
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

  // Get current token (for comparison purposes)
  get currentToken(): string {
    return this.token
  }

  // Get current URL (for comparison purposes)
  get currentUrl(): string {
    return this.url
  }
}

export const globalWebSocketManager = GlobalWebSocketManager.getInstance()
