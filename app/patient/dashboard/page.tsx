import type { Metadata } from "next"
import PatientDashboardClient from "./patient-dashboard-client"
import { DashboardGuard } from "./dashboard-guard"

export const metadata: Metadata = {
  title: "Painel | Saluso",
  description: "A sua saúde num relance",
}

export default function PatientDashboardPage() {
  return (
    <DashboardGuard>
      <PatientDashboardClient />
    </DashboardGuard>
  )
}
