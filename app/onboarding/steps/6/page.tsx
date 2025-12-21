"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { IntegrationStep } from "@/components/onboarding/steps/integration-step"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'
import { toast } from "react-toastify"
import { useLanguage } from '@/contexts/language-context'

export default function IntegrationsPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  const { t } = useLanguage()
  const { skipOnboarding, isSkipping } = useOnboardingSkip()

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(6))
  }, [dispatch])

  const updateFormData = (field: string, value: any) => {
    // IntegrationStep handles its own state
  }

  const saveProgress = async () => {
    // Data is automatically saved via IntegrationStep
  }

  const handleNext = async () => {
    await saveProgress()
    dispatch(addCompletedStep(6))
    // Mark onboarding as completed after integrations
    toast.success(t("onboarding.messages.onboardingCompletedSuccess"))
    router.push('/patient/health-records/summary')
  }

  const handleBack = async () => {
    await saveProgress()
    router.push('/onboarding/steps/5')
  }

  const handleStepClick = (stepId: number) => {
    if (completedSteps.includes(stepId) || stepId <= 6) {
      router.push(`/onboarding/steps/${stepId}`)
    }
  }

  const handleSkip = async () => {
    await saveProgress()
    await skipOnboarding()
  }

  return (
    <OnboardingLayout
      currentStep={6}
      totalSteps={6}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      onPrevious={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      isSkipping={isSkipping}
      showBackButton={true}
      stepTitle={t("steps.integrations")}
    >
      <IntegrationStep 
        formData={{}} 
        updateFormData={updateFormData} 
      />
    </OnboardingLayout>
  )
}
