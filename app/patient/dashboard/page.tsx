import { Suspense } from "react"
import type { Metadata } from "next"
import PatientDashboardClient from "./patient-dashboard-client"
import { DashboardGuard } from "./dashboard-guard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Painel | Saluso",
  description: "A sua saúde num relance",
}

export default function PatientDashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" />}>
      <DashboardGuard>
        <PatientDashboardClient />
      </DashboardGuard>
    </Suspense>
  )
}
