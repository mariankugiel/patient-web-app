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
import { toast } from 'react-toastify'
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip'
import { useOnboardingAuth } from '@/hooks/use-onboarding-auth'
import { useLanguage } from '@/contexts/language-context'

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
  const { t } = useLanguage()
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
          // Convert null/undefined to empty string for form display
          height: metadata.height != null ? String(metadata.height) : "",
          weight: metadata.weight != null ? String(metadata.weight) : "",
          waistDiameter: metadata.waist_diameter != null ? String(metadata.waist_diameter) : "",
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
      // Helper function to convert empty strings to null (to clear fields) or number for numeric fields
      const toNumberOrNull = (value: string | number | undefined): number | null | undefined => {
        if (value === undefined) return undefined // Don't send if never set
        if (value === null) return null // Explicitly clear
        // If it's already a number, return it
        if (typeof value === 'number') {
          return isNaN(value) ? null : value
        }
        // If it's a string, check if it's empty
        if (typeof value === 'string') {
          const trimmed = value.trim()
          if (trimmed === "") return null // Empty string means clear the field
          const num = parseFloat(trimmed)
          return isNaN(num) ? null : num
        }
        return null
      }

      // Helper function to convert empty strings to null (to clear fields) for string fields
      const toStringOrNull = (value: string | undefined | null): string | null | undefined => {
        if (value === undefined) return undefined // Don't send if never set
        if (value === null) return null // Explicitly clear
        if (typeof value === 'string') {
          const trimmed = value.trim()
          return trimmed !== "" ? trimmed : null // Empty string means clear the field
        }
        return null
      }

      // Get existing metadata to track which fields were previously set
      const existingMetadata = user.user_metadata || {}
      
      // Check if optional fields were previously set (to know if we need to clear them)
      const wasHeightSet = existingMetadata.height !== undefined && existingMetadata.height !== null && existingMetadata.height !== ""
      const wasWeightSet = existingMetadata.weight !== undefined && existingMetadata.weight !== null && existingMetadata.weight !== ""
      const wasWaistSet = existingMetadata.waist_diameter !== undefined && existingMetadata.waist_diameter !== null && existingMetadata.waist_diameter !== ""
      const wasAddressSet = existingMetadata.address !== undefined && existingMetadata.address !== null && existingMetadata.address !== ""
      const wasEmergencyNameSet = existingMetadata.emergency_contact_name !== undefined && existingMetadata.emergency_contact_name !== null && existingMetadata.emergency_contact_name !== ""
      const wasEmergencyPhoneSet = existingMetadata.emergency_contact_phone !== undefined && existingMetadata.emergency_contact_phone !== null && existingMetadata.emergency_contact_phone !== ""
      const wasEmergencyRelationshipSet = existingMetadata.emergency_contact_relationship !== undefined && existingMetadata.emergency_contact_relationship !== null && existingMetadata.emergency_contact_relationship !== ""
      
      const profileData: any = {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        date_of_birth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        phone_country_code: formData.phoneCountryCode || undefined,
        phone_number: formData.phone || undefined,
      }

      // Handle optional numeric fields - send null if was set but now empty, undefined if never set
      if (wasHeightSet && (!formData.height || (typeof formData.height === 'string' && formData.height.trim() === ""))) {
        profileData.height = null
      } else if (formData.height && typeof formData.height === 'string' && formData.height.trim() !== "") {
        const num = parseFloat(formData.height.trim())
        if (!isNaN(num)) profileData.height = num
      }

      if (wasWeightSet && (!formData.weight || (typeof formData.weight === 'string' && formData.weight.trim() === ""))) {
        profileData.weight = null
      } else if (formData.weight && typeof formData.weight === 'string' && formData.weight.trim() !== "") {
        const num = parseFloat(formData.weight.trim())
        if (!isNaN(num)) profileData.weight = num
      }

      if (wasWaistSet && (!formData.waistDiameter || (typeof formData.waistDiameter === 'string' && formData.waistDiameter.trim() === ""))) {
        profileData.waist_diameter = null
      } else if (formData.waistDiameter && typeof formData.waistDiameter === 'string' && formData.waistDiameter.trim() !== "") {
        const num = parseFloat(formData.waistDiameter.trim())
        if (!isNaN(num)) profileData.waist_diameter = num
      }

      // Handle optional string fields - send null if was set but now empty, undefined if never set
      if (wasAddressSet && (!formData.location || (typeof formData.location === 'string' && formData.location.trim() === ""))) {
        profileData.address = null
      } else if (formData.location && typeof formData.location === 'string' && formData.location.trim() !== "") {
        profileData.address = formData.location.trim()
      }

      if (wasEmergencyNameSet && (!formData.emergencyContactName || (typeof formData.emergencyContactName === 'string' && formData.emergencyContactName.trim() === ""))) {
        profileData.emergency_contact_name = null
      } else if (formData.emergencyContactName && typeof formData.emergencyContactName === 'string' && formData.emergencyContactName.trim() !== "") {
        profileData.emergency_contact_name = formData.emergencyContactName.trim()
      }

      if (wasEmergencyPhoneSet && (!formData.emergencyContactPhone || (typeof formData.emergencyContactPhone === 'string' && formData.emergencyContactPhone.trim() === ""))) {
        profileData.emergency_contact_phone = null
      } else if (formData.emergencyContactPhone && typeof formData.emergencyContactPhone === 'string' && formData.emergencyContactPhone.trim() !== "") {
        profileData.emergency_contact_phone = formData.emergencyContactPhone.trim()
      }

      if (wasEmergencyRelationshipSet && (!formData.emergencyContactRelationship || (typeof formData.emergencyContactRelationship === 'string' && formData.emergencyContactRelationship.trim() === ""))) {
        profileData.emergency_contact_relationship = null
      } else if (formData.emergencyContactRelationship && typeof formData.emergencyContactRelationship === 'string' && formData.emergencyContactRelationship.trim() !== "") {
        profileData.emergency_contact_relationship = formData.emergencyContactRelationship.trim()
      }

      // Handle location details
      if (formData.locationDetails) {
        if (formData.locationDetails.address?.country) {
          profileData.country = formData.locationDetails.address.country
        } else if (existingMetadata.country) {
          profileData.country = null
        }
        if (formData.locationDetails.address?.country_code) {
          profileData.country_code = formData.locationDetails.address.country_code
        } else if (existingMetadata.country_code) {
          profileData.country_code = null
        }
        if (formData.locationDetails.address?.city) {
          profileData.city = formData.locationDetails.address.city
        } else if (existingMetadata.city) {
          profileData.city = null
        }
        if (formData.locationDetails.address?.state) {
          profileData.state = formData.locationDetails.address.state
        } else if (existingMetadata.state) {
          profileData.state = null
        }
        if (formData.locationDetails.lat) {
          profileData.latitude = formData.locationDetails.lat
        } else if (existingMetadata.latitude) {
          profileData.latitude = null
        }
        if (formData.locationDetails.lon) {
          profileData.longitude = formData.locationDetails.lon
        } else if (existingMetadata.longitude) {
          profileData.longitude = null
        }
      } else if (formData.location && typeof formData.location === 'string' && formData.location.trim() === "" && wasAddressSet) {
        // Location was cleared, also clear location details
        if (existingMetadata.country) profileData.country = null
        if (existingMetadata.country_code) profileData.country_code = null
        if (existingMetadata.city) profileData.city = null
        if (existingMetadata.state) profileData.state = null
        if (existingMetadata.latitude) profileData.latitude = null
        if (existingMetadata.longitude) profileData.longitude = null
      }

      // Handle emergency contact country code
      if (formData.emergencyContactCountryCode) {
        profileData.emergency_contact_country_code = formData.emergencyContactCountryCode
      } else if (existingMetadata.emergency_contact_country_code) {
        profileData.emergency_contact_country_code = null
      }

      // Remove undefined values (but keep null values to clear fields)
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === undefined) {
          delete profileData[key]
        }
      })

      const updatedProfile = await AuthApiService.updateProfile(profileData)

      // Update Redux state with the response from the server (which includes null values)
      if (updatedProfile) {
        dispatch(updateUser({
          user_metadata: {
            ...user.user_metadata,
            ...updatedProfile,
          }
        }))
      } else {
        // Fallback: update with what we sent (including null values)
        dispatch(updateUser({
          user_metadata: {
            ...user.user_metadata,
            ...profileData,
          }
        }))
      }
    }
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    // Only validate mandatory fields (those with asterisks *)
    if (!formData.firstName.trim()) {
      errors.firstName = t("onboarding.validation.firstNameRequired")
    }
    if (!formData.lastName.trim()) {
      errors.lastName = t("onboarding.validation.lastNameRequired")
    }
    if (!formData.dateOfBirth.trim()) {
      errors.dateOfBirth = t("onboarding.validation.dateOfBirthRequired")
    }
    if (!formData.phone.trim()) {
      errors.phone = t("onboarding.validation.phoneRequired")
    }
    // Optional fields (no asterisks): gender, location, height, weight, waistDiameter, emergency contacts
    // These should not block progression
    
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
      toast.success(t("onboarding.messages.personalInfoSavedSuccess"))
      router.push('/onboarding/steps/2')
    } catch (error) {
      console.error('Error in handleNext:', error)
      toast.error(t("onboarding.messages.personalInfoSaveError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding')
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
      totalSteps={6}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      onPrevious={handleBack}
      onNext={handleNext}
      onSkip={handleSkip}
      isSkipping={isSkipping}
      isLoading={isSubmitting}
      showBackButton={false}
      stepTitle={t("steps.personalInfo")}
    >
      <PersonalInformationStep 
        formData={formData} 
        updateFormData={updateFormData} 
        fieldErrors={fieldErrors}
      />
    </OnboardingLayout>
  )
}

