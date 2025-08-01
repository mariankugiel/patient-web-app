import type { Metadata } from "next"
import MedicationsClientPage from "./medications-client-page"

export const metadata: Metadata = {
  title: "Medicamentos | Saluso",
  description: "Gerencie os seus medicamentos e defina lembretes",
}

export default function MedicationsPage() {
  return <MedicationsClientPage />
}
