"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

/**
 * Client-side theme provider that applies theme from user profile
 * This component watches Redux state for theme changes and applies them to the document
 * Only applies theme when user is authenticated (after login)
 */
export function ThemeProviderClient() {
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const theme = user?.user_metadata?.theme as "light" | "dark" | undefined

  useEffect(() => {
    // Only apply theme if user is authenticated
    if (!isAuthenticated || !user) {
      // If not authenticated, ensure default light theme on login/signup pages
      document.documentElement.classList.remove("dark")
      return
    }

    // Get theme from user profile or fallback to localStorage
    let currentTheme = theme
    
    if (!currentTheme && typeof window !== 'undefined') {
      currentTheme = localStorage.getItem("theme") as "light" | "dark" | null || "light"
    }
    
    // Apply theme to document
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark")
      // Also save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem("theme", "dark")
      }
    } else {
      document.documentElement.classList.remove("dark")
      // Also save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem("theme", "light")
      }
    }
    
    console.log("🎨 Applied theme after login:", currentTheme)
  }, [theme, user, isAuthenticated])

  // Also apply theme on mount if user is already logged in
  useEffect(() => {
    // Only apply if authenticated
    if (isAuthenticated && user && theme) {
      if (theme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem("theme", theme)
      }
      console.log("🎨 Applied theme on mount from user profile:", theme)
    } else {
      // If not authenticated, ensure light theme on login/signup pages
      document.documentElement.classList.remove("dark")
    }
  }, [isAuthenticated]) // Only run when authentication status changes

  return null // This component doesn't render anything
}

