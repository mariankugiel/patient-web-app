"use client"

import { useEffect } from 'react'
import { useSessionPersistence } from '@/hooks/use-session-persistence'

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  // This hook handles session persistence and restoration
  useSessionPersistence()

  return <>{children}</>
}

