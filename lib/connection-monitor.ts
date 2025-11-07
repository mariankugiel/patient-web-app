/**
 * Connection Monitor
 * Tracks connection state and notifies when connection is restored after a failure
 */

import { toast } from 'react-toastify'

interface ConnectionState {
  isConnected: boolean
  wasDisconnected: boolean
  lastSuccessTime: number | null
  lastFailureTime: number | null
}

let connectionState: ConnectionState = {
  isConnected: true,
  wasDisconnected: false,
  lastSuccessTime: null,
  lastFailureTime: null
}

let reconnectionNotificationShown = false

/**
 * Record a successful API call (connection is working)
 */
export function recordConnectionSuccess() {
  const now = Date.now()
  const wasDisconnected = connectionState.wasDisconnected
  
  // Only show notification if we were previously disconnected
  if (wasDisconnected && !reconnectionNotificationShown && connectionState.lastFailureTime) {
    // Check if enough time has passed since last failure (at least 1 second)
    const timeSinceFailure = now - connectionState.lastFailureTime
    if (timeSinceFailure > 1000) {
      // Small delay to ensure connection is stable
      setTimeout(() => {
        // Double-check we're still connected and haven't shown notification yet
        if (connectionState.isConnected && !reconnectionNotificationShown) {
          toast.success("Connection restored. You're back online! 🟢", {
            position: 'top-right',
            autoClose: 3000,
          })
          reconnectionNotificationShown = true
          
          // Reset disconnection state after showing notification
          connectionState.wasDisconnected = false
          connectionState.lastFailureTime = null
        }
      }, 500)
    }
  }
  
  connectionState.isConnected = true
  connectionState.lastSuccessTime = now
  
  // Reset disconnection flag if we have multiple successful calls
  if (connectionState.isConnected && connectionState.lastSuccessTime && !wasDisconnected) {
    connectionState.lastFailureTime = null
  }
}

/**
 * Record a connection failure
 */
export function recordConnectionFailure() {
  const now = Date.now()
  
  // Only mark as disconnected if we had a successful connection before
  if (connectionState.isConnected || connectionState.lastSuccessTime !== null) {
    connectionState.wasDisconnected = true
    connectionState.isConnected = false
    connectionState.lastFailureTime = now
    reconnectionNotificationShown = false // Reset so we can show notification when reconnected
  }
}

/**
 * Check if connection is currently down
 */
export function isConnectionDown(): boolean {
  return !connectionState.isConnected
}

/**
 * Reset connection state (useful for testing or manual reset)
 */
export function resetConnectionState() {
  connectionState = {
    isConnected: true,
    wasDisconnected: false,
    lastSuccessTime: null,
    lastFailureTime: null
  }
  reconnectionNotificationShown = false
}

