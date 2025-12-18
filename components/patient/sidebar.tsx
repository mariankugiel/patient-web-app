"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  FileText,
  Home,
  MessageSquare,
  Pill,
  ClipboardList,
  ShieldCheck,
  UserCog,
  Menu,
} from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import { AddDropdown } from "@/components/add-dropdown"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { useLanguage } from "@/contexts/language-context"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store"
import { logout } from "@/lib/features/auth/authSlice"
import { useRouter } from "next/navigation"
import { UserMenuDropdown } from "./user-menu-dropdown"
import { AuthAPI, AccessiblePatient } from "@/lib/api/auth-api"
import { useSwitchedPatient } from "@/contexts/patient-context"

interface NavigationItem {
  name: string
  href: string
  icon: any
  permissionKey?: keyof AccessiblePatient['permissions']
  alwaysShow?: boolean
}

export default function PatientSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const {
    patientId,
    patientToken,
    isViewingOtherPatient,
    accessiblePatients,
    switchedPatientInfo,
    isLoading: loadingPermissions,
  } = useSwitchedPatient()
  
  // Get permissions for the currently viewed patient from switched patient info
  const currentPatientPermissions = useMemo(() => {
    if (!isViewingOtherPatient || !switchedPatientInfo) return null
    return switchedPatientInfo.permissions
  }, [switchedPatientInfo, isViewingOtherPatient])
  
  // Helper function to build href with patientId if present
  const buildHref = (baseHref: string) => {
    if (patientToken) {
      return `${baseHref}?patientToken=${encodeURIComponent(patientToken)}`
    }
    return baseHref
  }

  const handleLogout = () => {
    dispatch(logout())
    router.push('/')
  }

  // Filter navigation items based on permissions when viewing another patient
  const navigation = useMemo(() => {
    // Define all navigation items with permission mappings
    const allNavigationItems: NavigationItem[] = [
      { 
        name: t("nav.healthRecords"), 
        href: "/patient/health-records", 
        icon: FileText,
        permissionKey: 'can_view_health_records'
      },
      { 
        name: t("nav.healthPlan"), 
        href: "/patient/health-plan", 
        icon: ClipboardList,
        permissionKey: 'can_view_health_plans'
      },
      { 
        name: t("nav.medications"), 
        href: "/patient/medications", 
        icon: Pill,
        permissionKey: 'can_view_medications'
      },
      { 
        name: t("nav.messages"), 
        href: "/patient/messages", 
        icon: MessageSquare,
        permissionKey: 'can_view_messages'
      },
      { 
        name: t("nav.appointments"), 
        href: "/patient/appointments", 
        icon: Calendar,
        permissionKey: 'can_view_appointments'
      },
      { 
        name: t("nav.permissions"), 
        href: "/patient/permissions", 
        icon: ShieldCheck
        // Only show for current user, not when viewing another patient
      },
      { 
        name: t("nav.profileSettings"), 
        href: "/patient/profile", 
        icon: UserCog
        // Only show for current user, not when viewing another patient
      },
    ]
    
    if (!isViewingOtherPatient || !currentPatientPermissions) {
      // Not viewing another patient, show all items
      return allNavigationItems
    }
    
    // Filter based on permissions when viewing another patient
    return allNavigationItems.filter(item => {
      // Profile and Permissions: NEVER show when viewing another patient (only for own data)
      if (item.href === '/patient/profile' || 
          item.href === '/patient/permissions') {
        return false
      }
      
      // Check permission for the item
      if (item.permissionKey) {
        return currentPatientPermissions[item.permissionKey] === true
      }
      
      return false
    })
  }, [isViewingOtherPatient, currentPatientPermissions, t])

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-gray-950 md:hidden">
        <div className="flex items-center">
          <Logo size="sm" className="max-w-[150px]" />
        </div>
              <div className="flex items-center">
                <AddDropdown />
                <NotificationBell userId={1} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-6 p-4 overflow-y-auto">
                  <div className="flex h-16 items-center justify-center">
                    <Logo size="md" className="max-w-[180px]" />
                  </div>
                  <nav className="space-y-1">
                    {loadingPermissions && isViewingOtherPatient ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      navigation.map((item) => {
                        // Check if pathname matches (ignore query params for active state)
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        const hrefWithPatientId = buildHref(item.href)
                        return (
                          <Link key={item.href} href={hrefWithPatientId} onClick={() => setOpen(false)}>
                            <Button
                              variant={isActive ? "default" : "ghost"}
                              className={`w-full justify-start ${
                                isActive
                                  ? "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:hover:bg-teal-800"
                                  : ""
                              }`}
                            >
                              <item.icon className="h-5 w-5 shrink-0" />
                              <span className="ml-3">{item.name}</span>
                            </Button>
                          </Link>
                        )
                      })
                    )}
                  </nav>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <UserMenuDropdown onLogout={handleLogout} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col justify-between border-r bg-white p-5 dark:bg-gray-950 md:flex">
        <div className="space-y-6 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex h-28 items-center justify-center mb-4 shrink-0">
            <Logo size="md" className="w-full max-w-[180px]" />
          </div>
          <div className="flex items-center justify-start mb-4 space-x-1 shrink-0">
            <AddDropdown />
            <NotificationBell userId={1} />
          </div>
          <nav className="space-y-1 shrink-0">
            {loadingPermissions && isViewingOtherPatient ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              navigation.map((item) => {
                // Check if pathname matches (ignore query params for active state)
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const hrefWithPatientId = buildHref(item.href)
                return (
                  <Link key={item.href} href={hrefWithPatientId}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        isActive
                          ? "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:hover:bg-teal-800"
                          : ""
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="ml-3">{item.name}</span>
                    </Button>
                  </Link>
                )
              })
            )}
          </nav>
        </div>
        
        {/* User menu dropdown with accessible patients and logout */}
        <div className="shrink-0 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UserMenuDropdown onLogout={handleLogout} />
        </div>
      </div>
    </>
  )
}
