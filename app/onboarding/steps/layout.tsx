"use client"

export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function OnboardingStepsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <ProtectedRoute requireAuth={true} redirectTo="/onboarding">
        {children}
      </ProtectedRoute>
    </Suspense>
  )
}
