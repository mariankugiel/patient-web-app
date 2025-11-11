import { Suspense } from "react"
import type { Metadata } from "next"
import MedicationsClientPage from "./medications-client-page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Medicamentos | Saluso",
  description: "Gerencie os seus medicamentos e defina lembretes",
}

export default function MedicationsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" />}>
      <MedicationsClientPage />
    </Suspense>
  )
}
