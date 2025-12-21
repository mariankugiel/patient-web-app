"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { FamilyHistoryStep } from "@/components/onboarding/steps/family-history-step"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'
import { useLanguage } from '@/contexts/language-context'

export default function FamilyHistoryPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  const { skipOnboarding, isSkipping } = useOnboardingSkip()
  const { t } = useLanguage()

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(3))
  }, [dispatch])

  const handleNext = async () => {
    // Family history is now saved directly to the backend API via the dialog
    // No need to save progress separately
    dispatch(addCompletedStep(3))
    router.push('/onboarding/steps/4')
  }

  const handleBack = async () => {
    router.push('/onboarding/steps/2')
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
      totalSteps={7}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      onPrevious={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      isSkipping={isSkipping}
      showBackButton={true}
      stepTitle={t("steps.familyHistory")}
    >
      <FamilyHistoryStep />
    </OnboardingLayout>
  )
}
