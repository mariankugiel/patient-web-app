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

interface LocationDetails {
  display_name: string
  address: {
    city?: string
    state?: string
    country?: string
    country_code?: string
  }
  lat: string
  lon: string
}

interface FormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  height: string
  weight: string
  waistDiameter: string
  location: string
  locationDetails?: LocationDetails
  phone: string
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male",
    height: "",
    weight: "",
    waistDiameter: "",
    location: "",
    phone: "",
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
    console.log('Loading user data:', user)
    if (user?.user_metadata) {
      const metadata = user.user_metadata
      console.log('User metadata found:', metadata)
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
          phone: metadata.phone_number || "",
          emergencyContactName: metadata.emergency_contact_name || "",
          emergencyContactPhone: metadata.emergency_contact_phone || "",
          emergencyContactRelationship: metadata.emergency_contact_relationship || "",
        }))
    } else {
      console.log('No user data found')
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
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          waist_diameter: formData.waistDiameter,
          address: formData.location,
          country: formData.locationDetails?.address?.country || "",
          country_code: formData.locationDetails?.address?.country_code || "",
          city: formData.locationDetails?.address?.city || "",
          state: formData.locationDetails?.address?.state || "",
          latitude: formData.locationDetails?.lat || "",
          longitude: formData.locationDetails?.lon || "",
          phone_number: formData.phone,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          emergency_contact_relationship: formData.emergencyContactRelationship,
        }

        await AuthApiService.updateProfile(profileData)

        // Update Redux state
        dispatch(updateUser({
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
    if (isSubmitting) return // Prevent multiple submissions
    
    const errors = validateForm()
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    setIsSubmitting(true)
    setFieldErrors({})
    
    try {
      await saveProgress()
      dispatch(addCompletedStep(1))
      router.push('/onboarding/steps/2')
    } catch (error) {
      console.error('Error in handleNext:', error)
      toast.error("Failed to save progress. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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
      isLoading={isSubmitting}
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

