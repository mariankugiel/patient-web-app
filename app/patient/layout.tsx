import type React from "react"
import PatientSidebar from "@/components/patient/sidebar"
import { LanguageProvider } from "@/contexts/language-context"

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <PatientSidebar />
        <main className="flex-1 pt-16 md:ml-64 md:pt-0">{children}</main>
      </div>
    </LanguageProvider>
  )
}
