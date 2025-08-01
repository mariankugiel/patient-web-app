import type { Metadata } from "next"
import HealthPlanClientPage from "./health-plan-client-page"

export const metadata: Metadata = {
  title: "Plano de Saúde | Saluso",
  description: "Visualize e gerencie o seu plano de saúde personalizado",
}

export default function HealthPlanPage() {
  return <HealthPlanClientPage />
}
