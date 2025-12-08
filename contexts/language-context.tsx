"use client"

import { createContext, useState, useEffect, useContext, useRef, type ReactNode } from "react"
import { translations as translationsData, getTranslation, type Language as TranslationLanguage } from "@/lib/translations"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

// Define available languages (map to translations.ts format)
export type Language = "en" | "es" | "pt"

// Map language codes to translations.ts format
const languageMap: Record<Language, TranslationLanguage> = {
  en: "en-US",
  es: "es-ES", 
  pt: "pt-PT"
}

// Define the context type
type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
})

// Helper function to get initial language
// Always return "en" for initial state to match server-side rendering
// The language will be updated from localStorage in useEffect after hydration
function getInitialLanguage(): Language {
  return "en"
}

// Create the provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Get user profile from Redux to check for language preference
  const profile = useSelector((state: RootState) => state.auth.profile)
  const user = useSelector((state: RootState) => state.auth.user)
  
  // Initialize with "en" to match server-side rendering
  // We'll update it from localStorage immediately after hydration
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)
  const [isHydrated, setIsHydrated] = useState(false)
  const hasInitializedLanguage = useRef(false)
  const isUpdatingLanguageRef = useRef(false)
  const lastProfileLanguage = useRef<Language | null>(null)
  const lastUserMetadataLanguage = useRef<Language | null>(null)
  
  // Wrapper for setLanguage that always saves to localStorage
  // This ensures user's manual language changes are always saved
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    // Always save to localStorage when user explicitly changes language
    if (typeof window !== 'undefined') {
      localStorage.setItem("language", newLanguage)
    }
  }

  // Mark as hydrated and immediately update language from localStorage
  useEffect(() => {
    setIsHydrated(true)
    
    // Immediately update language from localStorage after hydration
    // This ensures the correct language is set as soon as possible
    // Always update from localStorage to ensure consistency (even if it's "en")
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem("language") as Language
      if (storedLanguage && ["en", "es", "pt"].includes(storedLanguage)) {
        // Update language from localStorage (this will be handled by the main useEffect)
        // We just mark as hydrated here, the main useEffect will handle the language update
      }
    }
  }, [])

  // Load language from user profile when it becomes available
  // Only runs once after hydration, or when profile/user changes (but not when language state changes)
  useEffect(() => {
    // Only update language after hydration to prevent mismatch
    if (!isHydrated) return
    
    // Prevent infinite loops - don't run if we're already updating
    if (isUpdatingLanguageRef.current) return
    
    // Priority: 1. localStorage (most recent manual update), 2. Profile language, 3. User metadata language, 4. Default "en"
    const profileLanguage = profile?.language as Language
    const userMetadataLanguage = user?.user_metadata?.language as Language
    const localStorageLanguage = typeof window !== 'undefined' 
      ? (localStorage.getItem("language") as Language)
      : null
    
    // Determine the new language to use - prefer localStorage first (manual updates take precedence)
    const newLanguage = localStorageLanguage && ["en", "es", "pt"].includes(localStorageLanguage)
      ? localStorageLanguage
      : profileLanguage && ["en", "es", "pt"].includes(profileLanguage)
      ? profileLanguage
      : userMetadataLanguage && ["en", "es", "pt"].includes(userMetadataLanguage)
      ? userMetadataLanguage
      : null
    
    // Only update on initial load, or if profile/user language actually changed (not on every language state change)
    if (!hasInitializedLanguage.current) {
      // First initialization - set the language
      hasInitializedLanguage.current = true
      if (newLanguage && ["en", "es", "pt"].includes(newLanguage)) {
        lastProfileLanguage.current = profileLanguage || null
        lastUserMetadataLanguage.current = userMetadataLanguage || null
        isUpdatingLanguageRef.current = true
        // Use setLanguageState (not setLanguage) to avoid overwriting localStorage
        // Only save to localStorage if it's empty (first time setup)
        setLanguageState(newLanguage)
    if (typeof window !== 'undefined') {
          const currentStored = localStorage.getItem("language") as Language
          // Only update localStorage if it's empty (first time setup)
          // This preserves user's manual preference if they set it before profile loads
          if (!currentStored) {
            localStorage.setItem("language", newLanguage)
          }
        }
        // Reset the flag after a short delay
        setTimeout(() => {
          isUpdatingLanguageRef.current = false
        }, 100)
      }
    } else {
      // After initialization, only update if profile/user metadata language actually changed
      // Check if profile or user metadata language changed from what we last saw
      const profileLanguageChanged = profileLanguage && 
        ["en", "es", "pt"].includes(profileLanguage) && 
        profileLanguage !== lastProfileLanguage.current
      
      const userMetadataLanguageChanged = userMetadataLanguage && 
        ["en", "es", "pt"].includes(userMetadataLanguage) && 
        userMetadataLanguage !== lastUserMetadataLanguage.current
      
      // Only update if the source language (profile/user) actually changed
      // BUT: localStorage takes precedence - don't overwrite user's manual preference
      if ((profileLanguageChanged || userMetadataLanguageChanged) && !isUpdatingLanguageRef.current) {
        // Check localStorage first - if user has manually set a language, respect it
        const currentLocalStorageLanguage = typeof window !== 'undefined' 
          ? (localStorage.getItem("language") as Language)
          : null
        
        // Only update if localStorage doesn't have a value, or if it matches the profile language
        // This prevents overwriting user's manual language preference
        if (!currentLocalStorageLanguage || currentLocalStorageLanguage === profileLanguage || currentLocalStorageLanguage === userMetadataLanguage) {
          const sourceLanguage = profileLanguageChanged 
            ? profileLanguage 
            : userMetadataLanguageChanged 
            ? userMetadataLanguage 
            : null
          
          if (sourceLanguage) {
            // Update refs to track what we've seen
            lastProfileLanguage.current = profileLanguage || null
            lastUserMetadataLanguage.current = userMetadataLanguage || null
            
            isUpdatingLanguageRef.current = true
            // Use setLanguageState (not setLanguage) to avoid overwriting localStorage
            // Only save to localStorage if it's empty (first time setup)
            setLanguageState(sourceLanguage)
            if (typeof window !== 'undefined' && !currentLocalStorageLanguage) {
              localStorage.setItem("language", sourceLanguage)
      }
            // Reset the flag after a short delay
            setTimeout(() => {
              isUpdatingLanguageRef.current = false
            }, 100)
          }
        } else {
          // localStorage has a different value - user's manual preference takes precedence
          // Just update refs to track what we've seen, but don't change language
          if (profileLanguage) lastProfileLanguage.current = profileLanguage
          if (userMetadataLanguage) lastUserMetadataLanguage.current = userMetadataLanguage
        }
      } else {
        // Update refs even if we don't change language, to track what we've seen
        if (profileLanguage) lastProfileLanguage.current = profileLanguage
        if (userMetadataLanguage) lastUserMetadataLanguage.current = userMetadataLanguage
      }
    }
    // Remove 'language' from dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.language, user?.user_metadata?.language, isHydrated])

  // Note: We no longer need a separate useEffect to save to localStorage
  // because setLanguage wrapper now handles saving when user explicitly changes language
  // Internal state updates (from profile loading) use setLanguageState directly
  // which doesn't save to localStorage, preserving user's manual preference

  // Translation function using nested structure
  const t = (key: string): string => {
    const mappedLanguage = languageMap[language]
    return getTranslation(mappedLanguage, key)
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

// Custom hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
