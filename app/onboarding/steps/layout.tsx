"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"

export default function OnboardingStepsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireAuth={true} redirectTo="/onboarding">
      {children}
    </ProtectedRoute>
  )
}
