import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Registos de Saúde | Saluso",
  description: "Visualize e gerencie os seus registos de saúde",
}

import HealthRecordsPage from "./health-records-client-page"

export default function Page() {
  return <HealthRecordsPage />
}
