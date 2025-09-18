import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { loadOnboardingData, setLastSaved } from '@/lib/features/onboarding/onboardingSlice'

const STORAGE_KEY = 'onboarding-data'

export const useOnboardingPersistence = () => {
  const dispatch = useDispatch()
  const onboardingData = useSelector((state: RootState) => state.onboarding)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        // Convert Set back from array
        if (parsedData.completedSteps) {
          parsedData.completedSteps = new Set(parsedData.completedSteps)
        }
        dispatch(loadOnboardingData(parsedData))
        dispatch(setLastSaved(new Date().toISOString()))
      }
    } catch (error) {
      console.error('Error loading onboarding data from localStorage:', error)
    }
  }, [dispatch])

  // Save data to localStorage whenever onboarding data changes
  useEffect(() => {
    try {
      // Convert Set to array for JSON serialization
      const dataToSave = {
        ...onboardingData,
        completedSteps: Array.from(onboardingData.completedSteps)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      dispatch(setLastSaved(new Date().toISOString()))
    } catch (error) {
      console.error('Error saving onboarding data to localStorage:', error)
    }
  }, [
    onboardingData.personalInfo,
    onboardingData.medicalConditions,
    onboardingData.familyHistory,
    onboardingData.healthRecords,
    onboardingData.healthPlan,
    onboardingData.appointments,
    onboardingData.access,
    onboardingData.settings,
    onboardingData.currentStep,
    onboardingData.completedSteps,
    onboardingData.isSubmitting,
    dispatch
  ])

  const clearOnboardingData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing onboarding data from localStorage:', error)
    }
  }

  return {
    clearOnboardingData
  }
}
