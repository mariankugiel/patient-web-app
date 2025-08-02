"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  FileText,
  Home,
  MessageSquare,
  LogOut,
  Pill,
  ClipboardList,
  ShieldCheck,
  UserCog,
  Menu,
} from "lucide-react"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { AddDropdown } from "@/components/add-dropdown"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { useLanguage } from "@/contexts/language-context"

export default function PatientSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  const navigation = [
    { name: t("nav.dashboard"), href: "/patient/dashboard", icon: Home },
    { name: t("nav.healthRecords"), href: "/patient/health-records", icon: FileText },
    { name: t("nav.healthPlan"), href: "/patient/health-plan", icon: ClipboardList },
    { name: t("nav.medications"), href: "/patient/medications", icon: Pill },
    { name: t("nav.messages"), href: "/patient/messages", icon: MessageSquare },
    { name: t("nav.appointments"), href: "/patient/appointments", icon: Calendar },
    { name: t("nav.permissions"), href: "/patient/permissions", icon: ShieldCheck },
    { name: t("nav.profileSettings"), href: "/patient/profile", icon: UserCog },
  ]

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-gray-950 md:hidden">
        <div className="flex items-center">
          <Logo size="sm" className="max-w-[150px]" />
        </div>
        <div className="flex items-center">
          <AddDropdown />
          <NotificationDropdown />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-6 p-4">
                  <div className="flex h-16 items-center justify-center">
                    <Logo size="md" className="max-w-[180px]" />
                  </div>
                  <nav className="space-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
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
                    })}
                  </nav>
                </div>
                <div className="p-4">
                  <Button variant="ghost" className="w-full justify-start text-red-600 dark:text-red-400">
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="ml-3">{t("nav.logout")}</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col justify-between border-r bg-white p-5 dark:bg-gray-950 md:flex">
        <div className="space-y-6">
          <div className="flex h-28 items-center justify-center mb-4">
            <Logo size="md" className="w-full max-w-[180px]" />
          </div>
          <div className="flex items-center justify-start mb-4 space-x-1">
            <AddDropdown />
            <NotificationDropdown />
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
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
            })}
          </nav>
        </div>
        <div>
          <Button variant="ghost" className="w-full justify-start text-red-600 dark:text-red-400">
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="ml-3">{t("nav.logout")}</span>
          </Button>
        </div>
      </div>
    </>
  )
}
