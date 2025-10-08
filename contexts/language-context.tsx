"use client"

import { createContext, useState, useEffect, useContext, type ReactNode } from "react"
import { translations as translationsData, getTranslation, type Language as TranslationLanguage } from "@/lib/translations"

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

// Create the provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Try to get the saved language from localStorage, default to English
  const [language, setLanguage] = useState<Language>("en")

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["en", "es", "pt"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("language", language)
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
