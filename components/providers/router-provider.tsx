"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { setRouterCallback, setLogoutCallback } from '@/lib/api/axios-config'
import { logout } from '@/lib/features/auth/authSlice'

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useDispatch()

  useEffect(() => {
    // Set up the router callback for axios interceptor
    setRouterCallback((path: string) => {
      router.push(path)
    })

    // Set up the logout callback to clear Redux state
    setLogoutCallback(() => {
      dispatch(logout())
    })

    // Cleanup on unmount
    return () => {
      setRouterCallback(() => {})
      setLogoutCallback(() => {})
    }
  }, [router, dispatch])

  return <>{children}</>
}

