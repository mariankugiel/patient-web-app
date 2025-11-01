"use client"

import type React from "react"
import { useSelector } from "react-redux"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PatientSidebar from "@/components/patient/sidebar"
import { LanguageProvider, useLanguage } from "@/contexts/language-context"
import { WebSocketProvider } from "@/contexts/websocket-context"
import { type RootState } from "@/lib/store"

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = useSelector((s: RootState) => s.auth.user)
  const { t } = useLanguage()
  const pathname = usePathname()

  const fullName = ((): string => {
    const name = user?.user_metadata?.full_name?.trim()
    return name && name.length > 0 ? name : "User"
  })()

  const initials = ((): string => {
    const parts = fullName.split(" ").filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  })()

  const userId = typeof window !== 'undefined' ? 1 : null // TODO: derive from auth

  const subtitle = ((): string => {
    if (pathname.includes("/patient/dashboard")) return t("dashboard.overview")
    if (pathname.includes("/patient/health-records")) return t("health.controlRecords")
    if (pathname.includes("/patient/health-plan")) return t("dashboard.healthPlanProgressDesc")
    if (pathname.includes("/patient/medications")) return t("medications.manageReminders")
    if (pathname.includes("/patient/messages")) return t("messages.subtitle") || "Messages"
    if (pathname.includes("/patient/appointments")) return t("appointments.subtitle") || "Your appointments"
    if (pathname.includes("/patient/permissions")) return t("permissions.subtitle") || "Permissions"
    if (pathname.includes("/patient/profile")) return t("profile.subtitle")
    return ""
  })()

  return (
    <LanguageProvider>
      <WebSocketProvider userId={userId}>
        <div className="flex min-h-screen flex-col md:flex-row">
          <PatientSidebar />
          <main className="flex-1 pt-16 md:ml-64 md:pt-0 flex flex-col min-h-0">
            <div className="container py-6">
              <div className="flex items-center space-x-4 pb-4 border-b">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src="" alt={fullName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-primary">{t("greeting.morning")}, {fullName}!</h1>
                  <p className="text-muted-foreground">{subtitle}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <div className="container py-6 h-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </WebSocketProvider>
    </LanguageProvider>
  )
}
