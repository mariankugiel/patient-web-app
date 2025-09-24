"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { updateAccess, setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { AccessStep } from "@/components/onboarding/steps/access-step"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { type Language, getTranslation } from "@/lib/translations"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'

interface HealthProfessional {
  id: string
  name: string
  email: string
  specialty: string
  organization: string
  permissions: AccessPermission[]
}

interface FamilyFriend {
  id: string
  name: string
  email: string
  relationship: string
  permissions: AccessPermission[]
}

interface AccessPermission {
  area: string
  view: boolean
  download: boolean
  edit: boolean
}

export default function AccessPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const access = useSelector((state: RootState) => state.onboarding.access)
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  
  const [language, setLanguage] = useState<Language>("en-US")
  const { skipOnboarding, isSkipping } = useOnboardingSkip()

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(7))
  }, [dispatch])

  const updateFormData = (data: any) => {
    dispatch(updateAccess(data))
  }

  const saveProgress = async () => {
    // Data is automatically saved to Redux and localStorage via useOnboardingPersistence
    // No need for toast notifications during navigation
  }

  const handleNext = async () => {
    await saveProgress()
    dispatch(addCompletedStep(7))
    router.push('/onboarding/steps/8')
  }

  const handleBack = async () => {
    await saveProgress()
    router.push('/onboarding/steps/6')
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleStepClick = (stepId: number) => {
    if (completedSteps.has(stepId) || stepId <= 7) {
      router.push(`/onboarding/steps/${stepId}`)
    }
  }

  const handleSkip = async () => {
    await saveProgress()
    await skipOnboarding()
  }

  return (
    <OnboardingLayout
      currentStep={7}
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
      stepTitle={getTranslation(language, "steps.access")}
    >
      <AccessStep 
        formData={{ access }} 
        updateFormData={updateFormData} 
        language={language} 
      />
    </OnboardingLayout>
  )
}