"use client"

import { useState } from "react"
import { Bell, Filter } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"

interface GlobalHeaderProps {
  title?: string
  subtitle?: string
  showNotification?: boolean
  unreadCount?: number
  showFilters?: boolean
  onFilterClick?: () => void
  className?: string
}

export function GlobalHeader({
  title,
  subtitle,
  showNotification = true,
  unreadCount = 0,
  showFilters = false,
  onFilterClick,
  className = ""
}: GlobalHeaderProps) {
  const { t } = useLanguage()
  
  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t("greeting.morning")
    if (hour < 18) return t("greeting.afternoon")
    return t("greeting.evening")
  }

  // Sample user data - in real app, this would come from context/API
  const userName = "John Doe"
  const userAvatar = "/middle-aged-man-profile.png"
  const defaultSubtitle = t("messages.communicateWithTeam")

  return (
    <div className={`flex items-center justify-between p-6 bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {getGreeting()}, {userName}!
          </h1>
          <p className="text-muted-foreground">
            {subtitle || title || defaultSubtitle}
          </p>
        </div>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {showNotification && unreadCount > 0 && (
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-600" />
            <Badge variant="secondary" className="bg-teal-100 text-teal-800">
              {unreadCount} unread
            </Badge>
          </div>
        )}
        
        {showFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFilterClick}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}
      </div>
    </div>
  )
}
