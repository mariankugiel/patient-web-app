"use client"

export const dynamic = 'force-dynamic'

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
import { useOnboardingAuth } from '@/hooks/use-onboarding-auth'

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
  phoneCountryCode: string
  phone: string
  emergencyContactName: string
  emergencyContactCountryCode: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

export default function PersonalInformationPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isReady } = useOnboardingAuth()
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
    phoneCountryCode: "+351", // Default to Portugal
    phone: "",
    emergencyContactName: "",
    emergencyContactCountryCode: "+351", // Default to Portugal
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  })

  // Set current step
  useEffect(() => {
    dispatch(setCurrentStep(1))
  }, [dispatch])

  // Load existing data if available
  useEffect(() => {
    if (isReady && user?.user_metadata) {
      console.log('Loading user data:', user)
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
          phoneCountryCode: metadata.phone_country_code || "+351",
          phone: metadata.phone_number || "",
          emergencyContactName: metadata.emergency_contact_name || "",
          emergencyContactCountryCode: metadata.emergency_contact_country_code || "+351",
          emergencyContactPhone: metadata.emergency_contact_phone || "",
          emergencyContactRelationship: metadata.emergency_contact_relationship || "",
        }))
    }
  }, [isReady, user])

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
        phone_country_code: formData.phoneCountryCode,
        phone_number: formData.phone,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_country_code: formData.emergencyContactCountryCode,
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
    if (!formData.location.trim()) {
      errors.location = "Location is required"
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
      toast.success("Personal information saved successfully!")
      router.push('/onboarding/steps/2')
    } catch (error) {
      console.error('Error in handleNext:', error)
      toast.error("Failed to save personal information. Please try again.")
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

