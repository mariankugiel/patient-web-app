"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Shield, Bell, Globe, User, Lock, Smartphone } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"
import { TimezoneSelector } from "@/components/ui/timezone-selector"

interface SettingsData {
  // Safety & Security
  twoFactorAuth: boolean
  passwordChangeRequired: boolean
  sessionTimeout: string
  
  // Notifications
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  appointmentReminders: boolean
  medicationReminders: boolean
  
  // Privacy
  dataSharing: boolean
  analyticsTracking: boolean
  marketingEmails: boolean
  
  // Language & Region
  language: string
  timezone: string
  dateFormat: string
}

interface SettingsStepProps {
  formData: { settings: SettingsData }
  updateFormData: (data: Partial<{ settings: SettingsData }>) => void
  language: Language
}


const dateFormats = [
  "MM/DD/YYYY",
  "DD/MM/YYYY", 
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "MM-DD-YYYY"
]

export function SettingsStep({ formData, updateFormData, language }: SettingsStepProps) {
  const t = getTranslation(language, "steps.settings")

  const updateSetting = (field: keyof FormData['settings'], value: any) => {
    updateFormData({
      settings: {
        ...formData.settings,
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Safety & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Safety & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Two-Factor Authentication
              </Label>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={formData.settings?.twoFactorAuth || false}
              onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
            />
          </div>

          {/* Password Change Required */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Require Password Change
              </Label>
              <p className="text-sm text-gray-600">
                Force password change on next login
              </p>
            </div>
            <Switch
              checked={formData.settings?.passwordChangeRequired || false}
              onCheckedChange={(checked) => updateSetting('passwordChangeRequired', checked)}
            />
          </div>

          {/* Session Timeout */}
          <div>
            <Label htmlFor="sessionTimeout">Session Timeout</Label>
            <Select
              value={formData.settings?.sessionTimeout || "30"}
              onValueChange={(value) => updateSetting('sessionTimeout', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeout duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-600">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={formData.settings?.emailNotifications || false}
              onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-gray-600">
                Receive notifications via SMS
              </p>
            </div>
            <Switch
              checked={formData.settings?.smsNotifications || false}
              onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Push Notifications</Label>
              <p className="text-sm text-gray-600">
                Receive push notifications on your device
              </p>
            </div>
            <Switch
              checked={formData.settings?.pushNotifications || false}
              onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
            />
          </div>

          {/* Appointment Reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Appointment Reminders</Label>
              <p className="text-sm text-gray-600">
                Get reminded about upcoming appointments
              </p>
            </div>
            <Switch
              checked={formData.settings?.appointmentReminders || false}
              onCheckedChange={(checked) => updateSetting('appointmentReminders', checked)}
            />
          </div>

          {/* Medication Reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Medication Reminders</Label>
              <p className="text-sm text-gray-600">
                Get reminded to take your medications
              </p>
            </div>
            <Switch
              checked={formData.settings?.medicationReminders || false}
              onCheckedChange={(checked) => updateSetting('medicationReminders', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Sharing */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Data Sharing</Label>
              <p className="text-sm text-gray-600">
                Allow sharing of anonymized data for research
              </p>
            </div>
            <Switch
              checked={formData.settings?.dataSharing || false}
              onCheckedChange={(checked) => updateSetting('dataSharing', checked)}
            />
          </div>

          {/* Analytics Tracking */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Analytics Tracking</Label>
              <p className="text-sm text-gray-600">
                Allow analytics tracking to improve the service
              </p>
            </div>
            <Switch
              checked={formData.settings?.analyticsTracking || false}
              onCheckedChange={(checked) => updateSetting('analyticsTracking', checked)}
            />
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-gray-600">
                Receive marketing emails and promotional content
              </p>
            </div>
            <Switch
              checked={formData.settings?.marketingEmails || false}
              onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language */}
          <div>
            <Label htmlFor="language">Language</Label>
            <Select
              value={formData.settings?.language || "en-US"}
              onValueChange={(value) => updateSetting('language', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es-ES">Spanish</SelectItem>
                <SelectItem value="fr-FR">French</SelectItem>
                <SelectItem value="de-DE">German</SelectItem>
                <SelectItem value="it-IT">Italian</SelectItem>
                <SelectItem value="pt-PT">Portuguese</SelectItem>
                <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                <SelectItem value="ja-JP">Japanese</SelectItem>
                <SelectItem value="ko-KR">Korean</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <TimezoneSelector
              value={formData.settings?.timezone || "UTC"}
              onValueChange={(value) => updateSetting('timezone', value)}
              placeholder="Select timezone"
            />
          </div>

          {/* Date Format */}
          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={formData.settings?.dateFormat || "MM/DD/YYYY"}
              onValueChange={(value) => updateSetting('dateFormat', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}