"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { AuthApiService } from "@/lib/api/auth-api"
import { toast } from "react-toastify"
import { useLanguage } from "@/contexts/language-context"

export default function PrivacyTabPage() {
  const { t } = useLanguage()
  const user = useSelector((state: RootState) => state.auth.user)
  const [isLoading, setIsLoading] = useState(false)
  
  const [settings, setSettings] = useState({ shareAnonymizedData: true, shareAnalytics: false })
  const [dataExportOpen, setDataExportOpen] = useState(false)

  // Load privacy settings on mount
  useEffect(() => {
    const loadPrivacy = async () => {
      if (!user?.id) return
      
      try {
        const privacyData = await AuthApiService.getPrivacy()
        console.log("📦 Privacy data loaded:", privacyData)
        
        if (privacyData) {
          setSettings({
            shareAnonymizedData: privacyData.share_anonymized_data ?? true,
            shareAnalytics: privacyData.share_analytics ?? false,
          })
        }
      } catch (error) {
        console.error("Error loading privacy settings:", error)
      }
    }
    
    loadPrivacy()
  }, [user?.id])

  const toggle = (k: keyof typeof settings) => setSettings((p) => ({ ...p, [k]: !p[k] }))

  const save = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to update your privacy settings.")
      return
    }
    
    setIsLoading(true)
    
    try {
      await AuthApiService.updatePrivacy({
        share_anonymized_data: settings.shareAnonymizedData,
        share_analytics: settings.shareAnalytics,
      })
      
      console.log("💾 Privacy settings saved")
      
      toast.success(t("preferences.savedSuccessfullyDesc") || "Your privacy settings have been saved successfully.")
    } catch (error: any) {
      console.error("Error saving privacy settings:", error)
      toast.error(error.message || "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDataExport = () => {
    console.log("request data export")
    setDataExportOpen(false)
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">{t("profile.privacyData")}</h3>
          <p className="text-sm text-muted-foreground">{t("profile.privacyDataDesc")}</p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-full bg-primary/10 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /><path d="M11 17v.01" /><path d="M7 14v.01" /></svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base">{t("profile.dataSharingPreferences")}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{t("profile.dataSharingPreferencesDesc")}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between rounded-md border bg-muted/30 p-4">
                <div className="flex-1 pr-4">
                  <h5 className="font-medium text-sm mb-1">{t("profile.shareAnonymizedData")}</h5>
                  <p className="text-xs text-muted-foreground">{t("profile.shareAnonymizedDataDesc")}</p>
                </div>
                <Switch checked={settings.shareAnonymizedData} onCheckedChange={() => toggle("shareAnonymizedData")} />
              </div>

              <div className="flex items-start justify-between rounded-md border bg-muted/30 p-4">
                <div className="flex-1 pr-4">
                  <h5 className="font-medium text-sm mb-1">{t("profile.shareUsageAnalytics")}</h5>
                  <p className="text-xs text-muted-foreground">{t("profile.shareUsageAnalyticsDesc")}</p>
                </div>
                <Switch checked={settings.shareAnalytics} onCheckedChange={() => toggle("shareAnalytics")} />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-base">{t("profile.dataExport")}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{t("profile.dataExportDesc")}</p>
            </div>
          </div>

          <div className="rounded-md bg-muted/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
              <div className="flex-1">
                <p className="text-sm">{t("profile.dataExportInfo")}</p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                  <li>{t("profile.dataExportIncludes")}</li>
                  <li>{t("profile.dataExportIncludes2")}</li>
                  <li>{t("profile.dataExportIncludes3")}</li>
                  <li>{t("profile.dataExportIncludes4")}</li>
                  <li>{t("profile.dataExportIncludes5")}</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">{t("profile.dataExportTimeline")}</p>
              </div>
            </div>

            <Dialog open={dataExportOpen} onOpenChange={setDataExportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto bg-transparent">{t("profile.requestDataExport")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("profile.requestDataExport")}</DialogTitle>
                  <DialogDescription>{t("profile.requestDataExportDesc")}</DialogDescription>
                </DialogHeader>
                <div className="rounded-md bg-muted p-4 my-4">
                  <p className="text-sm"><strong>{t("profile.emailAddress")}</strong> john.smith@email.com</p>
                  <p className="text-xs text-muted-foreground mt-2">{t("profile.exportEmailDesc")}</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDataExportOpen(false)}>Cancel</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleDataExport}>{t("profile.confirmRequest")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Button className="bg-teal-600 hover:bg-teal-700" onClick={save} disabled={isLoading}>{isLoading ? t("profile.saving") : t("profile.savePrivacySettings")}</Button>
      </CardContent>
    </Card>
  )
}


