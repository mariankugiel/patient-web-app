"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { AuthApiService } from "@/lib/api/auth-api"
import { FamilyHistoryStep } from "@/components/onboarding/steps/family-history-step"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { type Language, getTranslation } from "@/lib/translations"
import { toast } from "react-toastify"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'

interface FormData {
  familyHistory: Array<{
    relationship: string
    condition: string
    age: string
    notes: string
  }>
}

export default function FamilyHistoryPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  const { skipOnboarding, isSkipping } = useOnboardingSkip()
  const [language, setLanguage] = useState<Language>("en-US")
  const [formData, setFormData] = useState<FormData>({
    familyHistory: [],
  })

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(3))
  }, [dispatch])

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const saveProgress = async () => {
    if (user) {
      try {
        // Note: Family history from step 3 onboarding is saved to user profile
        // The actual family medical history tables are used from the Health Records page
        // This is intentional - onboarding collects basic info, detailed history is managed later
        const profileData = {
          family_history: formData.familyHistory,
        }
        await AuthApiService.updateProfile(profileData)
        toast.success("Progress saved!")
      } catch (error) {
        console.error('Error saving progress:', error)
        toast.error("Failed to save progress")
      }
    }
  }

  const handleNext = async () => {
    await saveProgress()
    dispatch(addCompletedStep(3))
    router.push('/onboarding/steps/4')
  }

  const handleBack = async () => {
    await saveProgress()
    router.push('/onboarding/steps/2')
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleStepClick = (stepId: number) => {
    if (stepId === 3) return // Already on step 3
    router.push(`/onboarding/steps/${stepId}`)
  }

  const handleSkip = async () => {
    await skipOnboarding()
  }

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={8}
      completedSteps={completedSteps}
      language={language}
      onLanguageChange={handleLanguageChange}
      onStepClick={handleStepClick}
      onPrevious={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      isSkipping={isSkipping}
      showBackButton={true}
      stepTitle={getTranslation(language, "steps.familyHistory")}
    >
      <FamilyHistoryStep 
        language={language}
      />
    </OnboardingLayout>
  )
}
