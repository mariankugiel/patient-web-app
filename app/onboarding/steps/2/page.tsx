"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { updateUser } from '@/lib/features/auth/authSlice'
import { 
  setCurrentStep,
  addCompletedStep,
  validateMedicalConditions,
  addCurrentHealthProblem,
  addMedication,
  addPastMedicalCondition,
  addPastSurgery
} from '@/lib/features/onboarding/onboardingSlice'
import { AuthApiService } from '@/lib/api/auth-api'
import { MedicalConditionApiService } from '@/lib/api/medical-condition-api'
import { MedicalConditionStep } from '@/components/onboarding/steps/medical-condition-step'
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout'
import { type Language, getTranslation } from '@/lib/translations'
import { toast } from 'react-toastify'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, X } from 'lucide-react'
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'

export default function MedicalConditionPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const medicalConditions = useSelector((state: RootState) => state.onboarding.medicalConditions)
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  const { skipOnboarding, isSkipping } = useOnboardingSkip()
  
  const [language, setLanguage] = useState<Language>("en-US")
  const [showValidationSummary, setShowValidationSummary] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const hasLoadedData = useRef(false)

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(2))
  }, [dispatch])

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================


  const saveProgress = async (skipValidation = false) => {
    if (user) {
      try {
        // Check if there's any data to save
        const hasAnyData = medicalConditions.currentHealthProblems.length > 0 || 
                          medicalConditions.medications.length > 0 || 
                          medicalConditions.pastMedicalConditions.length > 0 || 
                          medicalConditions.pastSurgeries.length > 0

        if (hasAnyData) {
          // Save to dedicated medical condition tables
          const medicalData = {
            currentHealthProblems: medicalConditions.currentHealthProblems,
            medications: medicalConditions.medications,
            pastMedicalConditions: medicalConditions.pastMedicalConditions,
            pastSurgeries: medicalConditions.pastSurgeries,
          }

          // Save to backend medical condition tables
          await MedicalConditionApiService.saveAllMedicalData(medicalData)
        }

        // Also save to user profile for quick access (only if there's data)
        if (hasAnyData) {
          const profileData = {
            current_health_problems: medicalConditions.currentHealthProblems.map(p => p.condition),
            medications: medicalConditions.medications,
            past_medical_conditions: medicalConditions.pastMedicalConditions.map(c => c.condition),
            past_surgeries: medicalConditions.pastSurgeries.map(s => s.surgeryType),
          }

          await AuthApiService.updateProfile(profileData)
        }

        // Update Redux state (only if there's data)
        if (hasAnyData) {
          const profileData = {
            current_health_problems: medicalConditions.currentHealthProblems.map(p => p.condition),
            medications: medicalConditions.medications,
            past_medical_conditions: medicalConditions.pastMedicalConditions.map(c => c.condition),
            past_surgeries: medicalConditions.pastSurgeries.map(s => s.surgeryType),
          }
          
          dispatch(updateUser({
            user_metadata: {
              ...user.user_metadata,
              ...profileData,
            }
          }))
        }
        
      } catch (error) {
        console.error('Error saving progress:', error)
        if (!skipValidation) {
          toast.error("Failed to save medical information. Please try again.")
        }
        throw error // Re-throw for error handling in calling functions
      }
    }
  }

  const handleNext = async () => {
    // Validate all medical conditions
    dispatch(validateMedicalConditions())
    
    if (medicalConditions.errors.length > 0) {
      // Show validation summary
      setShowValidationSummary(true)
      
      // Show validation errors
      medicalConditions.errors.forEach(error => {
        toast.error(error)
      })
      
      // Scroll to top to show validation summary
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Medical history is optional - users can proceed without any entries

    try {
      await saveProgress()
      dispatch(addCompletedStep(2))
      toast.success("Medical information saved successfully!")
      router.push('/onboarding/steps/3')
    } catch (error) {
      console.error('Error saving progress:', error)
      toast.error("Failed to save medical information. Please try again.")
    }
  }

  const handleBack = async () => {
    try {
      // Save progress silently without validation (user can go back with incomplete data)
      await saveProgress(true) // skipValidation = true
      router.push('/onboarding/steps/1')
    } catch (error) {
      console.error('Error saving progress:', error)
      // Don't show error toast for back navigation - just navigate
      router.push('/onboarding/steps/1')
    }
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleStepClick = (stepId: number) => {
    if (stepId === 2) return // Already on step 2
    router.push(`/onboarding/steps/${stepId}`)
  }

  const handleSkip = async () => {
    // Check if there's any data to save
    const hasAnyData = medicalConditions.currentHealthProblems.length > 0 || 
                      medicalConditions.medications.length > 0 || 
                      medicalConditions.pastMedicalConditions.length > 0 || 
                      medicalConditions.pastSurgeries.length > 0

    if (hasAnyData) {
      // Validate any existing data before skipping
      dispatch(validateMedicalConditions())
      
      if (medicalConditions.errors.length > 0) {
        // Show validation errors but allow skipping
        toast.warning("Some medical information has validation errors, but you can still skip onboarding.")
        medicalConditions.errors.forEach(error => {
          toast.error(error)
        })
      }

      // Save any existing data before skipping
      try {
        await saveProgress(true) // skipValidation = true
      } catch (error) {
        console.error('Error saving data during skip:', error)
        toast.warning("Could not save medical data, but continuing with skip...")
      }
    }
    
    await skipOnboarding()
  }

  return (
    <OnboardingLayout
      currentStep={2}
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
      stepTitle={getTranslation(language, "steps.medicalCondition")}
    >
      {/* Validation Summary */}
      {showValidationSummary && (
        <div className="mb-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Please fix the following validation errors before proceeding:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {medicalConditions.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setShowValidationSummary(false)}
                  className="ml-4 text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}


      <MedicalConditionStep language={language} />
    </OnboardingLayout>
  )
}

