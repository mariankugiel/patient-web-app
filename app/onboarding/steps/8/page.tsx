"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { updateUser } from "@/lib/features/auth/authSlice"
import { updateSettings, setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { AuthApiService } from "@/lib/api/auth-api"
import { SettingsStep } from "@/components/onboarding/steps/settings-step"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { type Language, getTranslation } from "@/lib/translations"
import { toast } from "react-toastify"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'

export default function SettingsPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const settings = useSelector((state: RootState) => state.onboarding.settings)
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  
  const [language, setLanguage] = useState<Language>("en-US")
  const { skipOnboarding, isSkipping } = useOnboardingSkip()

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(8))
  }, [dispatch])

  const updateFormData = (data: any) => {
    dispatch(updateSettings(data))
  }

  const saveProgress = async () => {
    // Data is automatically saved to Redux and localStorage via useOnboardingPersistence
    // No need for toast notifications during navigation
  }

  const handleNext = async () => {
    await saveProgress()
    dispatch(addCompletedStep(8))
    // Mark onboarding as completed
    if (user) {
      try {
        const profileData = {
          onboarding_completed: true
        }
        await AuthApiService.updateProfile(profileData)
        dispatch(updateUser({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            onboarding_completed: true
          }
        }))
        toast.success("Onboarding completed successfully!")
        router.push('/onboarding/steps/complete')
      } catch (error) {
        console.error('Error completing onboarding:', error)
        toast.error("Failed to complete onboarding")
      }
    }
  }

  const handleBack = async () => {
    await saveProgress()
    router.push('/onboarding/steps/7')
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleStepClick = (stepId: number) => {
    if (completedSteps.includes(stepId) || stepId <= 8) {
      router.push(`/onboarding/steps/${stepId}`)
    }
  }

  const handleSkip = async () => {
    await saveProgress()
    await skipOnboarding()
  }

  return (
    <OnboardingLayout
      currentStep={8}
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
      stepTitle={getTranslation(language, "steps.settings")}
    >
      <SettingsStep 
        formData={{ settings }} 
        updateFormData={updateFormData} 
        language={language} 
      />
    </OnboardingLayout>
  )
}