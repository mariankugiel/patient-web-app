import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'react-toastify'
import { AuthApiService } from '@/lib/api/auth-api'

/**
 * Hook to handle Thryve redirect callback
 * Checks for dataSource and connected query parameters and updates Supabase
 * 
 * URL format: /patient/profile/integrations?dataSource=8&connected=true
 */
export function useThryveRedirect() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const processedRef = useRef<string | null>(null)

  useEffect(() => {
    const dataSource = searchParams.get('dataSource')
    const connected = searchParams.get('connected')

    // Only process if both parameters are present and not already processed
    if (dataSource && connected !== null) {
      const key = `${dataSource}-${connected}`
      if (processedRef.current !== key) {
        processedRef.current = key
        handleThryveRedirect(dataSource, connected === 'true')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleThryveRedirect = async (dataSourceId: string, connected: boolean) => {
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        toast.error('You must be logged in to update integrations.')
        return
      }

      // Map data source ID to field name
      const dataSourceFieldMap: Record<string, string> = {
        '1': 'fitbit',
        '2': 'garmin',
        '3': 'polar',
        '8': 'withings',
        '11': 'strava',
        '16': 'omron_connect',
        '17': 'suunto',
        '18': 'oura',
        '27': 'beurer',
        '38': 'huawei_health',
      }

      const fieldName = dataSourceFieldMap[dataSourceId]
      
      if (!fieldName) {
        console.warn(`Unknown data source ID: ${dataSourceId}`)
        toast.warning(`Unknown data source ID: ${dataSourceId}`)
        // Still update the generic connection status
      }

      // Get current integrations to preserve existing data
      let currentIntegrations
      try {
        currentIntegrations = await AuthApiService.getIntegrations()
      } catch (error) {
        console.error('Error getting current integrations:', error)
        currentIntegrations = {}
      }

      // Prepare update data
      const updateData: any = {}
      
      if (fieldName) {
        // Update specific data source field
        updateData[fieldName] = connected
      }

      // Also store connection status in a JSON field for tracking
      // This allows tracking multiple data sources
      const thryveConnections = (currentIntegrations as any).thryve_connections || {}
      thryveConnections[dataSourceId] = {
        connected,
        connected_at: connected ? new Date().toISOString() : null,
        disconnected_at: !connected ? new Date().toISOString() : null,
      }
      updateData.thryve_connections = thryveConnections

      // Update integrations via backend API (which updates Supabase)
      const updatedIntegrations = await AuthApiService.updateIntegrations(updateData)

      // Show success message
      const dataSourceName = getDataSourceName(dataSourceId)
      if (connected) {
        toast.success(`${dataSourceName} connected successfully!`)
      } else {
        toast.info(`${dataSourceName} disconnected.`)
      }

      // Clean up URL parameters after processing (without reload)
      // This will trigger a re-render but not a full page reload
      router.replace('/patient/profile/integrations')
      
      // Trigger a custom event to notify the page to update state
      // Pass the updated data to avoid another API call
      window.dispatchEvent(new CustomEvent('thryve-integration-updated', { 
        detail: { 
          dataSourceId, 
          connected, 
          fieldName,
          updatedIntegrations // Pass the updated data from the API response
        } 
      }))
      
    } catch (error: any) {
      console.error('Error handling Thryve redirect:', error)
      toast.error(error.message || 'Failed to update integration status.')
    }
  }

  const getDataSourceName = (dataSourceId: string): string => {
    const nameMap: Record<string, string> = {
      '1': 'Fitbit',
      '2': 'Garmin Connect',
      '3': 'Polar',
      '8': 'Withings',
      '11': 'Strava',
      '16': 'Omron Connect',
      '17': 'Suunto',
      '18': 'Oura',
      '27': 'Beurer',
      '38': 'Huawei Health',
    }
    return nameMap[dataSourceId] || `Data Source ${dataSourceId}`
  }
}

