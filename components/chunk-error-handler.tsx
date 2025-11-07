"use client"

import { useEffect } from 'react'

/**
 * Handles chunk loading errors and retries loading failed chunks
 * This is a workaround for Next.js ChunkLoadError issues
 */
export function ChunkErrorHandler() {
  useEffect(() => {
    // Handle chunk loading errors
    const handleChunkError = (error: ErrorEvent) => {
      const errorMessage = error.message || error.error?.message || ''
      
      // Check if it's a chunk loading error
      if (
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Failed to fetch dynamically imported module')
      ) {
        console.warn('Chunk loading error detected, reloading page...', errorMessage)
        
        // Retry by reloading the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    // Handle unhandled promise rejections (chunk loading errors often appear here)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const errorMessage = error?.message || String(error) || ''
      
      // Check if it's a chunk loading error
      if (
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        error?.name === 'ChunkLoadError'
      ) {
        console.warn('Chunk loading error detected in promise rejection, reloading page...', errorMessage)
        event.preventDefault() // Prevent default error handling
        
        // Retry by reloading the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    // Add event listeners
    window.addEventListener('error', handleChunkError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleChunkError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null // This component doesn't render anything
}

