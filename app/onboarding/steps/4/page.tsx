"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { updateUser } from "@/lib/features/auth/authSlice"
import { updateHealthRecords, setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { AuthApiService } from "@/lib/api/auth-api"
import { HealthRecordsStep } from "@/components/onboarding/steps/health-records-step"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { type Language, getTranslation } from "@/lib/translations"
import { toast } from "react-toastify"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'

interface FormData {
  healthRecords: {
    labResults: Array<{
      id: string
      name: string
      date: string
      file: File | null
      fileName: string
    }>
    images: Array<{
      id: string
      category: string
      date: string
      files: File[]
      fileNames: string[]
      conclusion: string
      status: string
    }>
  }
}

export default function HealthRecordsPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const healthRecords = useSelector((state: RootState) => state.onboarding.healthRecords)
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  
  const [language, setLanguage] = useState<Language>("en-US")
  const { skipOnboarding, isSkipping } = useOnboardingSkip()

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(4))
  }, [dispatch])

  const updateFormData = (data: any) => {
    dispatch(updateHealthRecords(data))
  }

  const saveProgress = async () => {
    // Data is automatically saved to Redux and localStorage via useOnboardingPersistence
    // No need for toast notifications during navigation
  }

  const handleNext = async () => {
    await saveProgress()
    dispatch(addCompletedStep(4))
    router.push('/onboarding/steps/5')
  }

  const handleBack = async () => {
    await saveProgress()
    router.push('/onboarding/steps/3')
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleStepClick = (stepId: number) => {
    if (completedSteps.has(stepId) || stepId <= 4) {
      router.push(`/onboarding/steps/${stepId}`)
    }
  }

  const handleSkip = async () => {
    await skipOnboarding()
  }

  return (
    <OnboardingLayout
      currentStep={4}
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
      stepTitle={getTranslation(language, "steps.healthRecords")}
    >
      <div className="space-y-8">
      <HealthRecordsStep 
        formData={{ healthRecords }} 
        updateFormData={updateFormData} 
        language={language} 
      />
      </div>
    </OnboardingLayout>
  )
}
