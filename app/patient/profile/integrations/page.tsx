"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, Plus, Activity } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { AuthApiService } from "@/lib/api/auth-api"
import { ThryveApiService } from "@/lib/api/thryve-api"
import { toast } from "react-toastify"
import { useLanguage } from "@/contexts/language-context"
import { useThryveRedirect } from "@/hooks/use-thryve-redirect"
import { getAllThryveDataSources, THRYVE_FIELD_TO_DATA_SOURCE_ID } from "@/lib/thryve-data-sources"

// Define all integration keys (Thryve only)
type IntegrationKey = 'fitbit' | 'garmin' | 'polar' | 'withings' | 'strava' | 'omron_connect' | 'suunto' | 'oura' | 'beurer' | 'huawei_health'

function IntegrationsTabContent() {
  const { t } = useLanguage()
  const user = useSelector((state: RootState) => state.auth.user)
  const [isLoading, setIsLoading] = useState(false)
  // Track which integration is connecting/disconnecting: { fieldName: 'connecting' | 'disconnecting' }
  const [connectionState, setConnectionState] = useState<Record<string, 'connecting' | 'disconnecting'>>({})
  
  // Initialize settings with all Thryve data sources
  const [settings, setSettings] = useState<Record<string, boolean>>({ 
    // Thryve integrations
    fitbit: false,
    garmin: false,
    polar: false,
    withings: false,
    strava: false,
    omron_connect: false,
    suunto: false,
    oura: false,
    beurer: false,
    huawei_health: false,
  })
  const [newIntegrationOpen, setNewIntegrationOpen] = useState(false)

  // Handle Thryve redirect callback
  useThryveRedirect()

  // Load integrations function
  const loadIntegrations = useCallback(async () => {
      if (!user?.id) return
      
      try {
        const integrationsData = await AuthApiService.getIntegrations()
        console.log("📦 Integrations data loaded:", integrationsData)
        
        if (integrationsData) {
          setSettings({
          // Thryve integrations
            fitbit: integrationsData.fitbit ?? false,
            garmin: integrationsData.garmin ?? false,
          polar: integrationsData.polar ?? false,
          withings: integrationsData.withings ?? false,
          strava: integrationsData.strava ?? false,
          omron_connect: integrationsData.omron_connect ?? false,
          suunto: integrationsData.suunto ?? false,
          oura: integrationsData.oura ?? false,
          beurer: integrationsData.beurer ?? false,
          huawei_health: integrationsData.huawei_health ?? false,
          })
        }
      } catch (error) {
        console.error("Error loading integrations:", error)
      }
  }, [user?.id])

  // Load integrations on mount
  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  // Listen for Thryve integration updates (from redirect hook)
  useEffect(() => {
    const handleIntegrationUpdate = (event: CustomEvent<{
      dataSourceId: string
      connected: boolean
      fieldName?: string
      updatedIntegrations?: any
    }>) => {
      console.log("🔄 Thryve integration updated:", event.detail)
      
      // Clear connection state since update is complete
      if (event.detail.fieldName) {
        setConnectionState((prev) => {
          const newState = { ...prev }
          delete newState[event.detail.fieldName!]
          return newState
        })
      }
      
      // If we have updated integrations data, use it directly to avoid another API call
      if (event.detail.updatedIntegrations && event.detail.fieldName) {
        setSettings((prev) => ({
          ...prev,
          [event.detail.fieldName!]: event.detail.connected
        }))
        console.log("✅ State updated directly from API response")
      } else {
        // Fallback: refresh from API if data not available
        console.log("⚠️ No updated data, refreshing from API...")
        loadIntegrations()
      }
    }

    window.addEventListener('thryve-integration-updated', handleIntegrationUpdate as EventListener)
    
    return () => {
      window.removeEventListener('thryve-integration-updated', handleIntegrationUpdate as EventListener)
    }
  }, [loadIntegrations])

  // Handle Thryve integration toggle
  const handleThryveToggle = async (integrationKey: string, checked: boolean) => {
    const dataSourceId = THRYVE_FIELD_TO_DATA_SOURCE_ID[integrationKey]
    
    if (!dataSourceId) {
      // Not a Thryve integration, use regular toggle
      setSettings((p) => ({ ...p, [integrationKey]: checked }))
      return
    }

    // Set connection state
    setConnectionState((prev) => ({
      ...prev,
      [integrationKey]: checked ? 'connecting' : 'disconnecting'
    }))
    
    try {
      // Build redirect URI - should point back to integrations page
      // Note: Thryve will append ?dataSource=X&connected=true/false automatically
      // So we only need to provide the base URL with dataSource parameter
      // Fix protocol for localhost (use http instead of https)
      let origin = window.location.origin
      if (origin.includes('localhost') && origin.startsWith('https://')) {
        origin = origin.replace('https://', 'http://')
      }
      // Only include dataSource - Thryve will add connected=true/false automatically
      const redirectUri = `${origin}/patient/profile/integrations?dataSource=${dataSourceId}`
      
      let connectionResponse
      if (checked) {
        // Connect: Get connection URL and redirect
        connectionResponse = await ThryveApiService.getConnectionUrl(dataSourceId, redirectUri)
        toast.info("Redirecting to connect your account...")
        // Redirect to Thryve connection page
        window.location.href = connectionResponse.url
      } else {
        // Disconnect: Get disconnection URL and redirect
        try {
        connectionResponse = await ThryveApiService.getDisconnectionUrl(dataSourceId, redirectUri)
          
          // Check if the response indicates the integration was already removed (no access token)
          if (connectionResponse.url && connectionResponse.url.includes('connected=false')) {
            // Integration was removed because there was no access token
            // Update local state and reload integrations
            setSettings((p) => ({ ...p, [integrationKey]: false }))
            await loadIntegrations()
            toast.success(`Integration removed successfully`)
            setConnectionState((prev) => {
              const newState = { ...prev }
              delete newState[integrationKey]
              return newState
            })
            return
          }
          
        toast.info("Redirecting to disconnect your account...")
        // Redirect to Thryve disconnection page
        window.location.href = connectionResponse.url
        } catch (error: any) {
          // Check if error is about missing access token
          if (error.message && error.message.includes("access token")) {
            // No access token means integration is not connected - just remove it locally
            setSettings((p) => ({ ...p, [integrationKey]: false }))
            await loadIntegrations()
            toast.success(`Integration removed successfully`)
            setConnectionState((prev) => {
              const newState = { ...prev }
              delete newState[integrationKey]
              return newState
            })
            return
          }
          throw error // Re-throw other errors
        }
      }
    } catch (error: any) {
      console.error(`Error ${checked ? 'connecting' : 'disconnecting'} ${integrationKey}:`, error)
      toast.error(error.message || `Failed to ${checked ? 'connect' : 'disconnect'} ${integrationKey}`)
      // Clear connection state on error
      setConnectionState((prev) => {
        const newState = { ...prev }
        delete newState[integrationKey]
        return newState
      })
    }
  }

  const toggle = (k: string) => {
    const checked = !settings[k]
    
    // Check if this is a Thryve integration
    if (THRYVE_FIELD_TO_DATA_SOURCE_ID[k]) {
      handleThryveToggle(k, checked)
    } else {
      // Regular toggle for non-Thryve integrations
      setSettings((p) => ({ ...p, [k]: checked }))
    }
  }

  const save = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to update your integrations.")
      return
    }
    
    setIsLoading(true)
    
    try {
      await AuthApiService.updateIntegrations({
        // Thryve integrations
        fitbit: settings.fitbit,
        garmin: settings.garmin,
        polar: settings.polar,
        withings: settings.withings,
        strava: settings.strava,
        omron_connect: settings.omron_connect,
        suunto: settings.suunto,
        oura: settings.oura,
        beurer: settings.beurer,
        huawei_health: settings.huawei_health,
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
                      <SelectItem value="fitbit">{t("profile.fitbit")}</SelectItem>
                      <SelectItem value="garmin">{t("profile.garmin")}</SelectItem>
                      <SelectItem value="polar">Polar</SelectItem>
                      <SelectItem value="withings">{t("profile.withings")}</SelectItem>
                      <SelectItem value="strava">Strava</SelectItem>
                      <SelectItem value="omron_connect">Omron Connect</SelectItem>
                      <SelectItem value="suunto">Suunto</SelectItem>
                      <SelectItem value="oura">{t("profile.ouraRing")}</SelectItem>
                      <SelectItem value="beurer">Beurer</SelectItem>
                      <SelectItem value="huawei_health">Huawei Health</SelectItem>
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
          {/* Thryve Integrations */}
          {getAllThryveDataSources().map((dataSource) => {
            const fieldName = dataSource.fieldName
            const isConnected = settings[fieldName] ?? false
            const connectionStatus = connectionState[fieldName] // 'connecting' | 'disconnecting' | undefined
            const isProcessing = !!connectionStatus
            const IconComponent = dataSource.icon || Activity
            
            return (
              <div key={fieldName} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  {dataSource.icon && (
                    <div className={`flex-shrink-0 ${dataSource.iconColor || 'text-gray-600'}`}>
                      <IconComponent className="h-6 w-6" />
            </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{dataSource.displayName}</h4>
                    <p className="text-xs text-muted-foreground">
                      {dataSource.description || `Sync your ${dataSource.displayName} data`}
                    </p>
            </div>
            </div>
            <div className="flex items-center gap-2">
                  <Switch 
                    checked={isConnected} 
                    onCheckedChange={() => toggle(fieldName)}
                    disabled={isProcessing}
                  />
                  {connectionStatus === 'connecting' && (
                    <span className="text-xs text-muted-foreground">{t("profile.connecting")}</span>
                  )}
                  {connectionStatus === 'disconnecting' && (
                    <span className="text-xs text-muted-foreground">{t("profile.disconnecting")}</span>
                  )}
                  {isConnected && !isProcessing && (
                    <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">{t("profile.sync")}</Button>
                  )}
            </div>
          </div>
            )
          })}
        </div>

        <Button className="bg-teal-600 hover:bg-teal-700" onClick={save} disabled={isLoading}><Save className="mr-2 h-4 w-4" />{isLoading ? t("profile.saving") : t("profile.saveSettings")}</Button>
      </CardContent>
    </Card>
  )
}

export default function IntegrationsTabPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IntegrationsTabContent />
    </Suspense>
  )
}


