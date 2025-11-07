"use client"

import type React from "react"
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Activity, Calendar, LineChart, Scale, Dumbbell, Heart, FileImage } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { PermissionGuard } from "@/components/patient/permission-guard"

export default function HealthRecordsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PermissionGuard requiredPermission="can_view_health_records">
      <HealthRecordsLayoutContent>{children}</HealthRecordsLayoutContent>
    </PermissionGuard>
  )
}

function HealthRecordsLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')

  // Extract the current tab from the pathname
  const currentTab = pathname.split("/").pop() || "summary"

  const handleTabChange = (value: string) => {
    const targetUrl = patientId 
      ? `/patient/health-records/${value}?patientId=${patientId}`
      : `/patient/health-records/${value}`
    router.push(targetUrl)
  }

  return (
    <div className="py-6">
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
            <TabsTrigger value="exams" className="flex-1 py-2">
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
