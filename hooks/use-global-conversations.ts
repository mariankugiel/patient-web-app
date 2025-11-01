"use client"

import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

export function useGlobalConversations() {
  // Use optional chaining to safely access the store
  const conversations = useSelector((state: RootState) => state?.conversations?.conversations ?? [])
  const unreadCount = useSelector((state: RootState) => state?.conversations?.unreadCount ?? 0)
  const isLoading = useSelector((state: RootState) => state?.conversations?.isLoading ?? false)
  const error = useSelector((state: RootState) => state?.conversations?.error ?? null)

  return {
    conversations,
    unreadCount,
    isLoading,
    error
  }
}