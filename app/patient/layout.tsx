import type React from "react"
import PatientSidebar from "@/components/patient/sidebar"
import { LanguageProvider } from "@/contexts/language-context"
import { WebSocketProvider } from "@/contexts/websocket-context"

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  // Get user ID from localStorage or context
  const userId = typeof window !== 'undefined' ? 1 : null // TODO: Get from auth context

  return (
    <LanguageProvider>
      <WebSocketProvider userId={userId}>
        <div className="flex min-h-screen flex-col md:flex-row">
          <PatientSidebar />
          <main className="flex-1 pt-16 md:ml-64 md:pt-0">{children}</main>
        </div>
      </WebSocketProvider>
    </LanguageProvider>
  )
}
