/**
 * Thryve Data Source Configuration
 * Maps data source IDs to their display names and field names
 */

import { 
  Activity, 
  Watch, 
  Heart, 
  Zap, 
  Mountain, 
  Stethoscope, 
  Compass, 
  CircleDot, 
  Thermometer,
  Smartphone,
  LucideIcon
} from "lucide-react"

export interface ThryveDataSourceConfig {
  id: number
  fieldName: string
  displayName: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
}

export const THRYVE_DATA_SOURCES: Record<string, ThryveDataSourceConfig> = {
  fitbit: {
    id: 1,
    fieldName: 'fitbit',
    displayName: 'Fitbit',
    description: 'Sync your Fitbit activity and health data',
    icon: Activity,
    iconColor: 'text-pink-600'
  },
  garmin: {
    id: 2,
    fieldName: 'garmin',
    displayName: 'Garmin Connect',
    description: 'Sync your Garmin activity and health data',
    icon: Watch,
    iconColor: 'text-orange-600'
  },
  polar: {
    id: 3,
    fieldName: 'polar',
    displayName: 'Polar',
    description: 'Sync your Polar activity and health data',
    icon: Heart,
    iconColor: 'text-red-600'
  },
  withings: {
    id: 8,
    fieldName: 'withings',
    displayName: 'Withings',
    description: 'Sync your Withings health data',
    icon: Stethoscope,
    iconColor: 'text-blue-600'
  },
  strava: {
    id: 11,
    fieldName: 'strava',
    displayName: 'Strava',
    description: 'Sync your Strava activity data',
    icon: Mountain,
    iconColor: 'text-orange-500'
  },
  omron_connect: {
    id: 16,
    fieldName: 'omron_connect',
    displayName: 'Omron Connect',
    description: 'Sync your Omron health device data',
    icon: Heart,
    iconColor: 'text-red-500'
  },
  suunto: {
    id: 17,
    fieldName: 'suunto',
    displayName: 'Suunto',
    description: 'Sync your Suunto activity data',
    icon: Compass,
    iconColor: 'text-blue-500'
  },
  oura: {
    id: 18,
    fieldName: 'oura',
    displayName: 'Oura',
    description: 'Sync your Oura Ring health data',
    icon: CircleDot,
    iconColor: 'text-purple-600'
  },
  beurer: {
    id: 27,
    fieldName: 'beurer',
    displayName: 'Beurer',
    description: 'Sync your Beurer health device data',
    icon: Thermometer,
    iconColor: 'text-green-600'
  },
  huawei_health: {
    id: 38,
    fieldName: 'huawei_health',
    displayName: 'Huawei Health',
    description: 'Sync your Huawei Health data',
    icon: Smartphone,
    iconColor: 'text-red-500'
  }
}

// Icon mapping for non-Thryve integrations
export const NON_THRYVE_ICONS: Record<string, { icon: LucideIcon; iconColor: string }> = {
  googleFit: {
    icon: Activity,
    iconColor: 'text-blue-500'
  },
  appleHealth: {
    icon: Heart,
    iconColor: 'text-gray-600'
  }
}

// Map data source ID to field name (for reverse lookup)
export const THRYVE_DATA_SOURCE_ID_TO_FIELD: Record<number, string> = {
  1: 'fitbit',
  2: 'garmin',
  3: 'polar',
  8: 'withings',
  11: 'strava',
  16: 'omron_connect',
  17: 'suunto',
  18: 'oura',
  27: 'beurer',
  38: 'huawei_health'
}

// Map field name to data source ID
export const THRYVE_FIELD_TO_DATA_SOURCE_ID: Record<string, number> = {
  fitbit: 1,
  garmin: 2,
  polar: 3,
  withings: 8,
  strava: 11,
  omron_connect: 16,
  suunto: 17,
  oura: 18,
  beurer: 27,
  huawei_health: 38
}

// Get all Thryve data sources as an array
export const getAllThryveDataSources = (): ThryveDataSourceConfig[] => {
  return Object.values(THRYVE_DATA_SOURCES)
}

// Get data source config by field name
export const getDataSourceByField = (fieldName: string): ThryveDataSourceConfig | undefined => {
  return THRYVE_DATA_SOURCES[fieldName]
}

// Get data source config by ID
export const getDataSourceById = (id: number): ThryveDataSourceConfig | undefined => {
  const fieldName = THRYVE_DATA_SOURCE_ID_TO_FIELD[id]
  return fieldName ? THRYVE_DATA_SOURCES[fieldName] : undefined
}

