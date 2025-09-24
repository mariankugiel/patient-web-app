"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { updateAppointments, setCurrentStep, addCompletedStep } from "@/lib/features/onboarding/onboardingSlice"
import { AppointmentsStep } from "@/components/onboarding/steps/appointments-step"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { type Language, getTranslation } from "@/lib/translations"
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'

interface Appointment {
  id: string
  doctorName: string
  doctorEmail: string
  specialty: string
  date: string
  time: string
  location: string
  reason: string
  notes: string
}

export default function AppointmentsPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const appointments = useSelector((state: RootState) => state.onboarding.appointments)
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  
  const [language, setLanguage] = useState<Language>("en-US")
  const { skipOnboarding, isSkipping } = useOnboardingSkip()

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(6))
  }, [dispatch])

  const updateFormData = (data: any) => {
    dispatch(updateAppointments(data))
  }

  const saveProgress = async () => {
    // Data is automatically saved to Redux and localStorage via useOnboardingPersistence
    // No need for toast notifications during navigation
  }

  const handleNext = async () => {
    await saveProgress()
    dispatch(addCompletedStep(6))
    router.push('/onboarding/steps/7')
  }

  const handleBack = async () => {
    await saveProgress()
    router.push('/onboarding/steps/5')
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleStepClick = (stepId: number) => {
    if (completedSteps.has(stepId) || stepId <= 6) {
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
      stepTitle={getTranslation(language, "steps.appointments")}
    >
      <AppointmentsStep 
        formData={{ appointments }} 
        updateFormData={updateFormData} 
        language={language} 
      />
    </OnboardingLayout>
  )
}