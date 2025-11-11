"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { clearOnboardingData } from "@/lib/features/onboarding/onboardingSlice"
import { updateUser } from "@/lib/features/auth/authSlice"
import { AuthApiService } from "@/lib/api/auth-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"
import { toast } from "react-toastify"

export default function OnboardingCompletePage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const [language, setLanguage] = useState<Language>("en-US")

  useEffect(() => {
    // Mark onboarding as completed in backend and Redux
    const markOnboardingCompleted = async () => {
      if (!user) return
      
      const profileData = {
        onboarding_completed: true,
        onboarding_skipped: false,
        onboarding_completed_at: new Date().toISOString(),
        is_new_user: false
      }
      
      try {
        // Update backend
        await AuthApiService.updateProfile(profileData)
        
        // Update Redux store
        dispatch(updateUser({
          user_metadata: {
            ...user.user_metadata,
            onboarding_completed: true,
            onboarding_skipped: false,
            onboarding_completed_at: profileData.onboarding_completed_at,
            is_new_user: false
          }
        }))
        
        toast.success("Onboarding completed successfully!")
      } catch (error: any) {
        console.error('Failed to mark onboarding as completed:', error)
        toast.error("Failed to save completion status. Please try again.")
      }
    }
    
    markOnboardingCompleted()
    
    // Clear onboarding data from localStorage and Redux
    dispatch(clearOnboardingData())
  }, [dispatch, user])

  const handleGoToDashboard = () => {
    router.push('/patient/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Onboarding Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">
            Congratulations! You've successfully completed your health profile setup. 
            Your information has been saved and you can now access all features of the platform.
          </p>
          
          <div className="space-y-2 text-sm text-gray-500">
            <p>✅ Personal information saved</p>
            <p>✅ Medical conditions recorded</p>
            <p>✅ Family history documented</p>
            <p>✅ Health records uploaded</p>
            <p>✅ Health plan created</p>
            <p>✅ Appointments scheduled</p>
            <p>✅ Access permissions set</p>
            <p>✅ Settings configured</p>
          </div>

          <Button 
            onClick={handleGoToDashboard}
            className="w-full"
            size="lg"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}