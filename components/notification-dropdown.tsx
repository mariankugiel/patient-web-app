"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/contexts/language-context"

export function NotificationDropdown() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  // Base notifications with translation keys instead of translated content
  const [baseNotifications] = useState([
    {
      id: 1,
      titleKey: "notifications.new_message_title",
      descriptionKey: "notifications.new_message_description",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      titleKey: "notifications.appointment_reminder_title",
      descriptionKey: "notifications.appointment_reminder_description",
      time: "5 hours ago",
      read: false,
    },
    {
      id: 3,
      titleKey: "notifications.medication_reminder_title",
      descriptionKey: "notifications.medication_reminder_description",
      time: "1 day ago",
      read: true,
    },
  ])

  // Derived state for notifications with translated content
  const [notifications, setNotifications] = useState<
    Array<{
      id: number
      title: string
      description: string
      time: string
      read: boolean
    }>
  >([])

  // Update notifications when language changes
  useEffect(() => {
    const translatedNotifications = baseNotifications.map((notification) => ({
      id: notification.id,
      title: t(notification.titleKey),
      description: t(notification.descriptionKey),
      time: notification.time, // In a complete solution, time would also be translated
      read: notification.read,
    }))
    setNotifications(translatedNotifications)
  }, [t, baseNotifications])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">{t("notifications.title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-semibold">{t("notifications.title")}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              {t("notifications.markAllAsRead")}
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">{t("notifications.noNotifications")}</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex cursor-pointer flex-col items-start p-4 ${
                  notification.read ? "" : "bg-gray-50 dark:bg-gray-800"
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex w-full items-start gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="Avatar" />
                    <AvatarFallback>N</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{notification.title}</h4>
                      <span className="text-xs text-gray-500">{notification.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notification.description}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
