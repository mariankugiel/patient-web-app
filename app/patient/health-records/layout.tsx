"use client"

import type React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname, useRouter } from "next/navigation"
import { Activity, Calendar, LineChart, Scale, Dumbbell, Heart, FileImage } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function HealthRecordsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()

  // Extract the current tab from the pathname
  const currentTab = pathname.split("/").pop() || "summary"

  const handleTabChange = (value: string) => {
    router.push(`/patient/health-records/${value}`)
  }

  return (
    <div className="container py-6">
      {/* Header with patient photo and salutation */}
      <header className="mb-6 flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-teal-500">
          <img src="/middle-aged-man-profile.png" alt="John's profile" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-2xl font-bold text-primary dark:text-teal-300">{t("greeting.morning")}, John!</p>
          <p className="text-muted-foreground">{t("health.controlRecords")}</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-max min-w-full h-auto flex flex-nowrap gap-1 p-1">
            <TabsTrigger value="summary" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>{t("health.summary")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{t("health.history")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span>{t("health.analysis")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="body-composition" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                <span>{t("health.body")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                <span>{t("health.lifestyle")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>{t("health.vitals")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="images" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                <span>{t("health.images")}</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Page Content */}
        {children}
      </Tabs>
    </div>
  )
}
