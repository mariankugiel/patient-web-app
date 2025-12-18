import { AccessiblePatient } from '@/lib/api/auth-api'

export interface NavigationItem {
  href: string
  permissionKey?: keyof AccessiblePatient['permissions']
  alwaysShow?: boolean
}

/**
 * Get the first accessible page for a patient based on their permissions
 * Returns the first page that the current user has permission to access
 * Dashboard, Profile, and Permissions are NEVER returned for other patients - only for viewing own data
 */
export function getFirstAccessiblePage(
  patientPermissions: AccessiblePatient['permissions'] | null,
  isViewingOtherPatient: boolean
): string {
  // If not viewing another patient, default to health records (viewing own data)
  if (!isViewingOtherPatient || !patientPermissions) {
    return '/patient/health-records'
  }

  // Define navigation items in priority order (first accessible will be returned)
  // NOTE: Dashboard, Profile, and Permissions are NOT included - they're only for viewing own data
  const navigationItems: NavigationItem[] = [
    { 
      href: "/patient/health-records", 
      permissionKey: 'can_view_health_records' 
    },
    { 
      href: "/patient/health-plan", 
      permissionKey: 'can_view_health_plans' 
    },
    { 
      href: "/patient/medications", 
      permissionKey: 'can_view_medications' 
    },
    { 
      href: "/patient/messages", 
      permissionKey: 'can_view_messages' 
    },
    { 
      href: "/patient/appointments", 
      permissionKey: 'can_view_appointments' 
    },
  ]

  // Find the first accessible page
  for (const item of navigationItems) {
    // Check permission-based pages
    if (item.permissionKey && patientPermissions[item.permissionKey]) {
      return item.href
    }
  }

  // If no pages are accessible, return health-records as fallback (will show permission error)
  // Never return dashboard, profile, or permissions for other patients
  return '/patient/health-records'
}

/**
 * Check if a page is accessible for a patient
 * Dashboard, Profile, and Permissions are NEVER accessible when viewing another patient - only for viewing own data
 */
export function isPageAccessible(
  pathname: string,
  patientPermissions: AccessiblePatient['permissions'] | null,
  isViewingOtherPatient: boolean
): boolean {
  // If not viewing another patient, all pages are accessible (including dashboard, profile, permissions)
  if (!isViewingOtherPatient || !patientPermissions) {
    return true
  }

  // Profile and Permissions are NEVER accessible when viewing another patient
  if (pathname.includes('/patient/profile') || 
      pathname.includes('/patient/permissions')) {
    return false
  }

  // Check specific permissions
  if (pathname.includes('/patient/health-records')) {
    return patientPermissions.can_view_health_records === true
  }
  if (pathname.includes('/patient/health-plan')) {
    return patientPermissions.can_view_health_plans === true
  }
  if (pathname.includes('/patient/medications')) {
    return patientPermissions.can_view_medications === true
  }
  if (pathname.includes('/patient/messages')) {
    return patientPermissions.can_view_messages === true
  }
  if (pathname.includes('/patient/appointments')) {
    return patientPermissions.can_view_appointments === true
  }

  // Default to not accessible for unknown pages when viewing another patient
  return false
}

