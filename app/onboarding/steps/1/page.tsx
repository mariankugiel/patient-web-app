"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { updateUser } from '@/lib/features/auth/authSlice'
import { setCurrentStep, addCompletedStep } from '@/lib/features/onboarding/onboardingSlice'
import { AuthApiService } from '@/lib/api/auth-api'
import { PersonalInformationStep } from '@/components/onboarding/steps/personal-information-step'
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout'
import { type Language, getTranslation } from '@/lib/translations'
import { toast } from 'react-toastify'
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'

interface FormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  height: string
  weight: string
  waistDiameter: string
  location: string
  country: string
  phone: string
  email: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

export default function PersonalInformationPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const completedSteps = useSelector((state: RootState) => state.onboarding.completedSteps)
  const { skipOnboarding, isSkipping } = useOnboardingSkip()
  const [language, setLanguage] = useState<Language>("en-US")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male",
    height: "",
    weight: "",
    waistDiameter: "",
    location: "",
    country: "",
    phone: "",
    email: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  })

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(1))
  }, [dispatch])

  // Load existing data if available
  useEffect(() => {
    if (user?.user_metadata) {
      const metadata = user.user_metadata
      setFormData(prev => ({
        ...prev,
        firstName: metadata.full_name?.split(' ')[0] || "",
        lastName: metadata.full_name?.split(' ').slice(1).join(' ') || "",
        dateOfBirth: metadata.date_of_birth || "",
        gender: metadata.gender || "male",
        height: metadata.height || "",
        weight: metadata.weight || "",
        waistDiameter: metadata.waist_diameter || "",
        location: metadata.address || "",
        country: metadata.country || "",
        phone: metadata.phone_number || "",
        email: user.email || "",
        emergencyContactName: metadata.emergency_contact_name || "",
        emergencyContactPhone: metadata.emergency_contact_phone || "",
        emergencyContactRelationship: metadata.emergency_contact_relationship || "",
      }))
    } else if (user?.email) {
      // If no metadata but user has email, at least fill the email field
      setFormData(prev => ({
        ...prev,
        email: user.email,
      }))
    }
  }, [user])

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation errors when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const saveProgress = async () => {
    if (user) {
      try {
        const profileData = {
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          waist_diameter: formData.waistDiameter,
          address: formData.location,
          country: formData.country,
          phone_number: formData.phone,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          emergency_contact_relationship: formData.emergencyContactRelationship,
        }

        await AuthApiService.updateProfile(profileData)

        // Update Redux state
        dispatch(updateUser({
          email: formData.email,
          user_metadata: {
            ...user.user_metadata,
            ...profileData,
          }
        }))
        
        toast.success("Personal information saved successfully!")
      } catch (error) {
        console.error('Error saving progress:', error)
        toast.error("Failed to save personal information. Please try again.")
      }
    }
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required"
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required"
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    if (!formData.dateOfBirth.trim()) {
      errors.dateOfBirth = "Date of birth is required"
    }
    if (!formData.gender.trim()) {
      errors.gender = "Gender is required"
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required"
    }
    if (!formData.emergencyContactName.trim()) {
      errors.emergencyContactName = "Emergency contact name is required"
    }
    if (!formData.emergencyContactPhone.trim()) {
      errors.emergencyContactPhone = "Emergency contact phone is required"
    }
    if (!formData.emergencyContactRelationship.trim()) {
      errors.emergencyContactRelationship = "Emergency contact relationship is required"
    }
    
    return errors
  }

  const handleNext = async () => {
    const errors = validateForm()
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    setFieldErrors({})
    await saveProgress()
    dispatch(addCompletedStep(1))
    router.push('/onboarding/steps/2')
  }

  const handleBack = () => {
    router.push('/onboarding')
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleStepClick = (stepId: number) => {
    if (stepId === 1) return // Already on step 1
    router.push(`/onboarding/steps/${stepId}`)
  }

  const handleSkip = async () => {
    await skipOnboarding()
  }

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={8}
      completedSteps={completedSteps}
      language={language}
      onLanguageChange={handleLanguageChange}
      onStepClick={handleStepClick}
      onPrevious={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      isSkipping={isSkipping}
      showBackButton={false}
      stepTitle={getTranslation(language, "steps.personalInfo")}
    >
      <PersonalInformationStep 
        formData={formData} 
        updateFormData={updateFormData} 
        language={language}
        fieldErrors={fieldErrors}
      />
    </OnboardingLayout>
  )
}

