"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { updateUser } from "@/lib/features/auth/authSlice"
import { updateHealthPlan, setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { AuthApiService } from "@/lib/api/auth-api"
import { HealthPlanStep } from "@/components/onboarding/steps/health-plan-step"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { type Language, getTranslation } from "@/lib/translations"
import { toast } from "react-toastify"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'

interface HealthGoal {
  id: string
  name: string
  targetFigure: string
  deadline: string
  comments: string
}

interface HealthTask {
  id: string
  name: string
  frequency: string
  comments: string
}

interface FormData {
  healthPlan: {
    goals: HealthGoal[]
    tasks: HealthTask[]
  }
}

export default function HealthPlanPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const healthPlan = useSelector((state: RootState) => state.onboarding.healthPlan)
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  
  const [language, setLanguage] = useState<Language>("en-US")
  const { skipOnboarding, isSkipping } = useOnboardingSkip()

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(5))
  }, [dispatch])

  const updateFormData = (data: any) => {
    dispatch(updateHealthPlan(data))
  }

  const saveProgress = async () => {
    // Data is automatically saved to Redux and localStorage via useOnboardingPersistence
    // No need for toast notifications during navigation
  }

  const handleNext = async () => {
    await saveProgress()
    dispatch(addCompletedStep(5))
    router.push('/onboarding/steps/6')
  }

  const handleBack = async () => {
    await saveProgress()
    router.push('/onboarding/steps/4')
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleStepClick = (stepId: number) => {
    if (completedSteps.has(stepId) || stepId <= 5) {
      router.push(`/onboarding/steps/${stepId}`)
    }
  }

  const handleSkip = async () => {
    await saveProgress()
    await skipOnboarding()
  }

  return (
    <OnboardingLayout
      currentStep={5}
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
      stepTitle={getTranslation(language, "steps.healthPlan")}
    >
      <HealthPlanStep 
        formData={{ healthPlan }} 
        updateFormData={updateFormData} 
        language={language} 
      />
    </OnboardingLayout>
  )
}