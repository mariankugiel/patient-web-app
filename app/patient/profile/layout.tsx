"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { usePathname, useRouter } from "next/navigation"
import { useMemo } from "react"
import { useLanguage } from "@/contexts/language-context"

export default function ProfileSectionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()

  const active = useMemo(() => {
    if (pathname.endsWith("/emergency")) return "emergency"
    if (pathname.endsWith("/security")) return "security"
    if (pathname.endsWith("/notifications")) return "notifications"
    if (pathname.endsWith("/integrations")) return "integrations"
    if (pathname.endsWith("/privacy")) return "privacy"
    return "profile"
  }, [pathname])

  const go = (tab: string) => {
    router.replace(`/patient/profile${tab === "profile" ? "" : `/${tab}`}`)
  }

  return (
    <Tabs value={active} className="w-full">
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0">
          <TabsTrigger value="profile" className="flex-1 sm:flex-none sm:min-w-[100px]" onClick={() => go("profile")}>
            {t("tabs.profile")}
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex-1 sm:flex-none sm:min-w-[140px]" onClick={() => go("emergency")}>
            {t("tabs.emergency")}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 sm:flex-none sm:min-w-[100px]" onClick={() => go("security")}>
            {t("tabs.security")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 sm:flex-none sm:min-w-[120px]" onClick={() => go("notifications")}>
            {t("tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex-1 sm:flex-none sm:min-w-[120px]" onClick={() => go("integrations")}>
            {t("tabs.integrations")}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex-1 sm:flex-none sm:min-w-[100px]" onClick={() => go("privacy")}>
            {t("tabs.privacy")}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value={active} className="space-y-4 mt-6">
        {children}
      </TabsContent>
    </Tabs>
  )
}


