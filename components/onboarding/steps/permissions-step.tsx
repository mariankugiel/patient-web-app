"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Shield, Eye, Database, Bell, Users, FileText } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"

interface FormData {
  permissions: {
    dataSharing: {
      withProviders: boolean
      withFamily: boolean
      withResearch: boolean
      anonymized: boolean
    }
    notifications: {
      appointments: boolean
      medications: boolean
      healthAlerts: boolean
      generalUpdates: boolean
    }
    privacy: {
      profileVisibility: string
      dataRetention: string
      emergencyAccess: boolean
    }
  }
}

interface PermissionsStepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  language: Language
}

export function PermissionsStep({ formData, updateFormData, language }: PermissionsStepProps) {
  const t = getTranslation(language, "steps.permissions")

  const updateDataSharing = (field: string, value: boolean) => {
    updateFormData({
      permissions: {
        ...formData.permissions,
        dataSharing: {
          ...formData.permissions?.dataSharing,
          [field]: value,
        },
      },
    })
  }

  const updateNotifications = (field: string, value: boolean) => {
    updateFormData({
      permissions: {
        ...formData.permissions,
        notifications: {
          ...formData.permissions?.notifications,
          [field]: value,
        },
      },
    })
  }

  const updatePrivacy = (field: string, value: string | boolean) => {
    updateFormData({
      permissions: {
        ...formData.permissions,
        privacy: {
          ...formData.permissions?.privacy,
          [field]: value,
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {getTranslation(language, "steps.permissions")}
        </h3>
        <p className="text-gray-600">
          {getTranslation(language, "steps.permissionsDesc")}
        </p>
      </div>

      {/* Data Sharing */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Sharing Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shareWithProviders"
                checked={formData.permissions?.dataSharing?.withProviders || false}
                onCheckedChange={(checked) => updateDataSharing("withProviders", checked as boolean)}
              />
              <Label htmlFor="shareWithProviders" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Share data with healthcare providers
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="shareWithFamily"
                checked={formData.permissions?.dataSharing?.withFamily || false}
                onCheckedChange={(checked) => updateDataSharing("withFamily", checked as boolean)}
              />
              <Label htmlFor="shareWithFamily" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Share data with family members
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="shareWithResearch"
                checked={formData.permissions?.dataSharing?.withResearch || false}
                onCheckedChange={(checked) => updateDataSharing("withResearch", checked as boolean)}
              />
              <Label htmlFor="shareWithResearch" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Share anonymized data for research
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymizedData"
                checked={formData.permissions?.dataSharing?.anonymized || false}
                onCheckedChange={(checked) => updateDataSharing("anonymized", checked as boolean)}
              />
              <Label htmlFor="anonymizedData" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Allow anonymized data collection
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="appointmentNotifications"
                checked={formData.permissions?.notifications?.appointments || false}
                onCheckedChange={(checked) => updateNotifications("appointments", checked as boolean)}
              />
              <Label htmlFor="appointmentNotifications">
                Appointment reminders and updates
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="medicationNotifications"
                checked={formData.permissions?.notifications?.medications || false}
                onCheckedChange={(checked) => updateNotifications("medications", checked as boolean)}
              />
              <Label htmlFor="medicationNotifications">
                Medication reminders
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="healthAlerts"
                checked={formData.permissions?.notifications?.healthAlerts || false}
                onCheckedChange={(checked) => updateNotifications("healthAlerts", checked as boolean)}
              />
              <Label htmlFor="healthAlerts">
                Health alerts and warnings
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="generalUpdates"
                checked={formData.permissions?.notifications?.generalUpdates || false}
                onCheckedChange={(checked) => updateNotifications("generalUpdates", checked as boolean)}
              />
              <Label htmlFor="generalUpdates">
                General app updates and news
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium">Profile Visibility</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="profilePrivate"
                  name="profileVisibility"
                  value="private"
                  checked={formData.permissions?.privacy?.profileVisibility === "private"}
                  onChange={(e) => updatePrivacy("profileVisibility", e.target.value)}
                  className="w-4 h-4"
                />
                <Label htmlFor="profilePrivate">Private - Only visible to me</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="profileProviders"
                  name="profileVisibility"
                  value="providers"
                  checked={formData.permissions?.privacy?.profileVisibility === "providers"}
                  onChange={(e) => updatePrivacy("profileVisibility", e.target.value)}
                  className="w-4 h-4"
                />
                <Label htmlFor="profileProviders">Visible to healthcare providers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="profileFamily"
                  name="profileVisibility"
                  value="family"
                  checked={formData.permissions?.privacy?.profileVisibility === "family"}
                  onChange={(e) => updatePrivacy("profileVisibility", e.target.value)}
                  className="w-4 h-4"
                />
                <Label htmlFor="profileFamily">Visible to family members</Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Data Retention</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="retention1Year"
                  name="dataRetention"
                  value="1-year"
                  checked={formData.permissions?.privacy?.dataRetention === "1-year"}
                  onChange={(e) => updatePrivacy("dataRetention", e.target.value)}
                  className="w-4 h-4"
                />
                <Label htmlFor="retention1Year">1 year</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="retention3Years"
                  name="dataRetention"
                  value="3-years"
                  checked={formData.permissions?.privacy?.dataRetention === "3-years"}
                  onChange={(e) => updatePrivacy("dataRetention", e.target.value)}
                  className="w-4 h-4"
                />
                <Label htmlFor="retention3Years">3 years</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="retentionIndefinite"
                  name="dataRetention"
                  value="indefinite"
                  checked={formData.permissions?.privacy?.dataRetention === "indefinite"}
                  onChange={(e) => updatePrivacy("dataRetention", e.target.value)}
                  className="w-4 h-4"
                />
                <Label htmlFor="retentionIndefinite">Indefinite</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="emergencyAccess"
              checked={formData.permissions?.privacy?.emergencyAccess || false}
              onCheckedChange={(checked) => updatePrivacy("emergencyAccess", checked as boolean)}
            />
            <Label htmlFor="emergencyAccess">
              Allow emergency access to my health data
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
