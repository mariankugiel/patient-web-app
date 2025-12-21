"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Save, Activity } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { AuthApiService } from "@/lib/api/auth-api"
import { ThryveApiService } from "@/lib/api/thryve-api"
import { toast } from "react-toastify"
import { useLanguage } from "@/contexts/language-context"
import { useThryveRedirect } from "@/hooks/use-thryve-redirect"
import { getAllThryveDataSources, THRYVE_FIELD_TO_DATA_SOURCE_ID } from "@/lib/thryve-data-sources"

interface IntegrationStepProps {
  formData: any
  updateFormData: (field: string, value: any) => void
}

export function IntegrationStep({ formData, updateFormData }: IntegrationStepProps) {
  const { t } = useLanguage()
  const user = useSelector((state: RootState) => state.auth.user)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionState, setConnectionState] = useState<Record<string, 'connecting' | 'disconnecting'>>({})
  
  // Initialize settings with all Thryve data sources
  const [settings, setSettings] = useState<Record<string, boolean>>({ 
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

  // Handle Thryve redirect callback
  useThryveRedirect()

  // Load integrations function
  const loadIntegrations = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const integrationsData = await AuthApiService.getIntegrations()
      
      if (integrationsData) {
        const newSettings = {
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
        }
        setSettings(newSettings)
        updateFormData('integrations', newSettings)
      }
    } catch (error) {
      console.error("Error loading integrations:", error)
    }
  }, [user?.id, updateFormData])

  // Load integrations on mount
  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  // Listen for Thryve integration updates
  useEffect(() => {
    const handleIntegrationUpdate = (event: CustomEvent<{
      dataSourceId: string
      connected: boolean
      fieldName?: string
      updatedIntegrations?: any
    }>) => {
      if (event.detail.fieldName) {
        setConnectionState((prev) => {
          const newState = { ...prev }
          delete newState[event.detail.fieldName!]
          return newState
        })
      }
      
      if (event.detail.updatedIntegrations && event.detail.fieldName) {
        setSettings((prev) => ({
          ...prev,
          [event.detail.fieldName!]: event.detail.connected
        }))
      } else {
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
      setSettings((p) => ({ ...p, [integrationKey]: checked }))
      return
    }

    setConnectionState((prev) => ({
      ...prev,
      [integrationKey]: checked ? 'connecting' : 'disconnecting'
    }))
    
    try {
      let origin = window.location.origin
      if (origin.includes('localhost') && origin.startsWith('https://')) {
        origin = origin.replace('https://', 'http://')
      }
      const redirectUri = `${origin}/onboarding/steps/6?dataSource=${dataSourceId}`
      
      let connectionResponse
      if (checked) {
        connectionResponse = await ThryveApiService.getConnectionUrl(dataSourceId, redirectUri)
        toast.info(t("onboarding.integrations.redirectingToConnect"))
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
            toast.success(t("onboarding.integrations.integrationRemovedSuccess"))
            setConnectionState((prev) => {
              const newState = { ...prev }
              delete newState[integrationKey]
              return newState
            })
            return
          }
          
          toast.info(t("onboarding.integrations.redirectingToDisconnect"))
          window.location.href = connectionResponse.url
        } catch (error: any) {
          // Check if error is about missing access token
          if (error.message && error.message.includes("access token")) {
            // No access token means integration is not connected - just remove it locally
            setSettings((p) => ({ ...p, [integrationKey]: false }))
            await loadIntegrations()
            toast.success(t("onboarding.integrations.integrationRemovedSuccess"))
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
      toast.error(error.message || (checked ? t("onboarding.integrations.failedToConnect") : t("onboarding.integrations.failedToDisconnect")))
      setConnectionState((prev) => {
        const newState = { ...prev }
        delete newState[integrationKey]
        return newState
      })
    }
  }

  const toggle = (k: string) => {
    const checked = !settings[k]
    
    if (THRYVE_FIELD_TO_DATA_SOURCE_ID[k]) {
      handleThryveToggle(k, checked)
    } else {
      setSettings((p) => ({ ...p, [k]: checked }))
    }
    
    // Update form data
    const newSettings = { ...settings, [k]: checked }
    updateFormData('integrations', newSettings)
  }

  const save = async () => {
    if (!user?.id) {
      toast.error(t("onboarding.integrations.mustBeLoggedIn"))
      return
    }
    
    setIsLoading(true)
    
    try {
      await AuthApiService.updateIntegrations({
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
      
      updateFormData('integrations', settings)
      toast.success(t("onboarding.integrations.settingsSavedSuccess"))
    } catch (error: any) {
      console.error("Error saving integrations:", error)
      toast.error(error.message || t("onboarding.integrations.unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("onboarding.integrations.wearableIntegrations")}</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("onboarding.integrations.syncDataDesc")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {getAllThryveDataSources().map((dataSource) => {
          const fieldName = dataSource.fieldName
          const isConnected = settings[fieldName] ?? false
          const connectionStatus = connectionState[fieldName]
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
                  <span className="text-xs text-muted-foreground">{t("onboarding.integrations.connecting")}</span>
                )}
                {connectionStatus === 'disconnecting' && (
                  <span className="text-xs text-muted-foreground">{t("onboarding.integrations.disconnecting")}</span>
                )}
                {isConnected && !isProcessing && (
                  <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">{t("onboarding.integrations.sync")}</Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

