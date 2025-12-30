"use client"

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from "@/components/auth/protected-route"
import { WelcomePage } from "@/components/onboarding/welcome-page"
import { useOnboardingSkip } from "@/hooks/use-onboarding-skip"
import { useLanguage } from "@/contexts/language-context"
import { type Language as TranslationLanguage } from "@/lib/translations"

// Map context language to translation language format
const contextToTranslationMap: Record<"en" | "es" | "pt", TranslationLanguage> = {
  "en": "en-US",
  "es": "es-ES",
  "pt": "pt-PT"
}

// Map translation language to context language format
const translationToContextMap: Record<TranslationLanguage, "en" | "es" | "pt"> = {
  "en-US": "en",
  "es-ES": "es",
  "pt-PT": "pt"
}

export default function OnboardingPage() {
  const router = useRouter()
  const { skipOnboarding } = useOnboardingSkip()
  const { language: contextLanguage, setLanguage: setContextLanguage } = useLanguage()
  
  // Convert context language to translation format for display
  const displayLanguage = contextToTranslationMap[contextLanguage]

  const handleStart = () => {
    router.push('/onboarding/steps/1')
  }

  const handleSkip = async () => {
    await skipOnboarding()
  }

  // Handle language change - convert from translation format to context format
  const handleLanguageChange = (newLanguage: TranslationLanguage) => {
    const contextLang = translationToContextMap[newLanguage]
    if (contextLang) {
      setContextLanguage(contextLang)
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <ProtectedRoute requireAuth={true} redirectTo="/onboarding">
        <WelcomePage
          language={displayLanguage}
          onLanguageChange={handleLanguageChange}
          onStart={handleStart}
          onSkip={handleSkip}
        />
      </ProtectedRoute>
    </Suspense>
  )
}
