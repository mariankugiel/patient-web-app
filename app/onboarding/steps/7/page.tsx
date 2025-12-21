"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { PaymentStepOnboarding } from "@/components/onboarding/steps/payment-step-onboarding"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'
import { toast } from "react-toastify"
import { useLanguage } from '@/contexts/language-context'

export default function PaymentPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  const { t } = useLanguage()
  const { skipOnboarding, isSkipping } = useOnboardingSkip()

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(7))
  }, [dispatch])

  const [formData, setFormData] = useState({
    payment: {
      planId: "basic",
      billingCycle: "monthly",
      acceptTerms: false,
    }
  })
  const [isFormValid, setIsFormValid] = useState(false)

  const updateFormData = (data: any) => {
    setFormData((prev) => ({
      ...prev,
      ...data
    }))
  }

  const saveProgress = async () => {
    // Payment data is saved automatically when form is updated
    // Could add API call here to save payment method if needed
  }

  const handleNext = async () => {
    // Check if terms are accepted
    if (!isFormValid) {
      toast.error(t("payment.acceptTermsRequired") || "You must accept the terms and conditions")
      return
    }
    
    await saveProgress()
    dispatch(addCompletedStep(7))
    // Mark onboarding as completed after payment
    toast.success(t("onboarding.messages.onboardingCompletedSuccess") || "Onboarding completed successfully!")
    router.push('/patient/health-records/summary')
  }

  const handleBack = async () => {
    await saveProgress()
    router.push('/onboarding/steps/6')
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
      currentStep={7}
      totalSteps={7}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      onPrevious={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      isSkipping={isSkipping}
      showBackButton={true}
      stepTitle={t("steps.payment") || "Payment & Subscription"}
    >
      <PaymentStepOnboarding 
        formData={formData} 
        updateFormData={updateFormData}
        onValidationChange={setIsFormValid}
      />
    </OnboardingLayout>
  )
}
