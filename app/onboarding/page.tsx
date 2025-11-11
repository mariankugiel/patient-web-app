"use client"

export const dynamic = 'force-dynamic'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function OnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first step
    router.push('/onboarding/steps/1')
  }, [router])

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <ProtectedRoute requireAuth={true} redirectTo="/onboarding">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
        </div>
      </ProtectedRoute>
    </Suspense>
  )
}
