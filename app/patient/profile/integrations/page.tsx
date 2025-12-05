"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, Plus } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { AuthApiService } from "@/lib/api/auth-api"
import { toast } from "react-toastify"
import { useLanguage } from "@/contexts/language-context"

export default function IntegrationsTabPage() {
  const { t } = useLanguage()
  const user = useSelector((state: RootState) => state.auth.user)
  const [isLoading, setIsLoading] = useState(false)
  
  const [settings, setSettings] = useState({ googleFit: true, fitbit: false, garmin: false })
  const [newIntegrationOpen, setNewIntegrationOpen] = useState(false)

  // Load integrations on mount
  useEffect(() => {
    const loadIntegrations = async () => {
      if (!user?.id) return
      
      try {
        const integrationsData = await AuthApiService.getIntegrations()
        console.log("📦 Integrations data loaded:", integrationsData)
        
        if (integrationsData) {
          setSettings({
            googleFit: integrationsData.google_fit ?? true,
            fitbit: integrationsData.fitbit ?? false,
            garmin: integrationsData.garmin ?? false,
          })
        }
      } catch (error) {
        console.error("Error loading integrations:", error)
      }
    }
    
    loadIntegrations()
  }, [user?.id])

  const toggle = (k: keyof typeof settings) => setSettings((p) => ({ ...p, [k]: !p[k] }))

  const save = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to update your integrations.")
      return
    }
    
    setIsLoading(true)
    
    try {
      await AuthApiService.updateIntegrations({
        google_fit: settings.googleFit,
        fitbit: settings.fitbit,
        garmin: settings.garmin,
      })
      
      console.log("💾 Integrations saved")
      
      toast.success(t("preferences.savedSuccessfullyDesc") || "Your integration settings have been saved successfully.")
    } catch (error: any) {
      console.error("Error saving integrations:", error)
      toast.error(error.message || "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{t("profile.wearableIntegrations")}</h3>
          <Dialog open={newIntegrationOpen} onOpenChange={setNewIntegrationOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700"><Plus className="mr-2 h-4 w-4" />{t("profile.addIntegration")}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("profile.addNewIntegration")}</DialogTitle>
                <DialogDescription>{t("profile.addNewIntegrationDesc")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("profile.integrationPartner")}</p>
                  <Select>
                    <SelectTrigger><SelectValue placeholder={t("profile.selectIntegrationPartner")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apple-health">{t("profile.appleHealth")}</SelectItem>
                      <SelectItem value="google-fit">{t("profile.googleFit")}</SelectItem>
                      <SelectItem value="fitbit">{t("profile.fitbit")}</SelectItem>
                      <SelectItem value="garmin">{t("profile.garmin")}</SelectItem>
                      <SelectItem value="withings">{t("profile.withings")}</SelectItem>
                      <SelectItem value="oura">{t("profile.ouraRing")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewIntegrationOpen(false)}>Cancel</Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setNewIntegrationOpen(false)}>{t("profile.connect")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm text-muted-foreground">{t("profile.syncDataDesc")}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{t("profile.googleFit")}</h4>
              <p className="text-xs text-muted-foreground">{t("profile.googleFitDesc")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.googleFit} onCheckedChange={() => toggle("googleFit")} />
              {settings.googleFit && <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">{t("profile.sync")}</Button>}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{t("profile.fitbit")}</h4>
              <p className="text-xs text-muted-foreground">{t("profile.fitbitDesc")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.fitbit} onCheckedChange={() => toggle("fitbit")} />
              {settings.fitbit && <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">{t("profile.sync")}</Button>}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{t("profile.garmin")}</h4>
              <p className="text-xs text-muted-foreground">{t("profile.garminDesc")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.garmin} onCheckedChange={() => toggle("garmin")} />
              {settings.garmin && <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">{t("profile.sync")}</Button>}
            </div>
          </div>
        </div>

        <Button className="bg-teal-600 hover:bg-teal-700" onClick={save} disabled={isLoading}><Save className="mr-2 h-4 w-4" />{isLoading ? t("profile.saving") : t("profile.saveSettings")}</Button>
      </CardContent>
    </Card>
  )
}


