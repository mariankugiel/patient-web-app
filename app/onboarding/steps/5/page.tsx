"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { PermissionsStepOnboarding } from "@/components/onboarding/steps/permissions-step-onboarding"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'
import { useLanguage } from '@/contexts/language-context'

export default function PermissionsPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  const { t } = useLanguage()
  const { skipOnboarding, isSkipping } = useOnboardingSkip()

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(5))
  }, [dispatch])

  const [formData, setFormData] = useState({
    permissions: {
      contacts: []
    }
  })

  const updateFormData = (data: any) => {
    setFormData((prev) => ({
      ...prev,
      ...data
    }))
  }

  const saveProgress = async () => {
    // Permissions are saved automatically when contacts are added/removed
    // Could add API call here if needed
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

  const handleStepClick = (stepId: number) => {
    if (completedSteps.includes(stepId) || stepId <= 7) {
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
      totalSteps={7}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      onPrevious={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      isSkipping={isSkipping}
      showBackButton={true}
      stepTitle={t("steps.permissions")}
    >
      <PermissionsStepOnboarding 
        formData={formData} 
        updateFormData={updateFormData} 
      />
    </OnboardingLayout>
  )
}
