"use client"

import { createContext, useState, useEffect, useContext, type ReactNode } from "react"
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
function getInitialLanguage(): Language {
  // Always return "en" for initial state to match server-side rendering
  // The language will be updated from Redux/profile in useEffect after hydration
  return "en"
}

// Create the provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Get user profile from Redux to check for language preference
  const profile = useSelector((state: RootState) => state.auth.profile)
  const user = useSelector((state: RootState) => state.auth.user)
  
  // Initialize with default "en" to match server-side rendering
  // We'll update it from Redux state or localStorage in useEffect after hydration
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [isHydrated, setIsHydrated] = useState(false)

  // Mark as hydrated after first render
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load language from user profile when it becomes available
  useEffect(() => {
    // Only update language after hydration to prevent mismatch
    if (!isHydrated) return
    
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
    
    // Only update if the language actually changed to avoid unnecessary updates and infinite loops
    if (newLanguage && ["en", "es", "pt"].includes(newLanguage) && newLanguage !== language) {
      // Use a small delay to batch updates and prevent rapid re-renders
      const timeoutId = setTimeout(() => {
        setLanguage(newLanguage)
      }, 0)
      
      return () => clearTimeout(timeoutId)
    }
  }, [profile?.language, user?.user_metadata?.language, isHydrated, language])

  // Save language to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
    localStorage.setItem("language", language)
    }
  }, [language])

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
