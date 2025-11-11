import type { Metadata } from "next"
import AppointmentsClientPage from "./appointments-client-page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Consultas | Saluso",
  description: "Gerencie as suas consultas médicas",
}

export default function AppointmentsPage() {
  return <AppointmentsClientPage />
}
