"use client"

export const dynamic = "force-dynamic"

import { Suspense } from "react"
import HealthPlanClientPage from "./health-plan-client-page"

export default function HealthPlanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" />}>
      <HealthPlanClientPage />
    </Suspense>
  )
}
