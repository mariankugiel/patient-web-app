"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Save } from "lucide-react"

export default function NotificationsTabPage() {
  const [accountSettings, setAccountSettings] = useState({
    appointmentHoursBefore: "24",
    medicationMinutesBefore: "15",
    tasksReminderTime: "09:00",
    emailAppointments: true,
    smsAppointments: false,
    whatsappAppointments: true,
    pushAppointments: true,
    emailMedications: true,
    smsMedications: false,
    whatsappMedications: false,
    pushMedications: true,
    emailTasks: false,
    smsTasks: false,
    whatsappTasks: true,
    pushTasks: false,
    emailNewsletter: false,
  })

  const handleToggle = (key: keyof typeof accountSettings) => setAccountSettings((prev) => ({ ...prev, [key]: !prev[key] }))

  const savePreferences = () => {
    console.log("saved notification prefs", accountSettings)
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground mb-6">Choose how you want to receive notifications for different events</p>

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-5 gap-4 pb-4 border-b">
                <div className="font-medium text-sm">Notification Type</div>
                <div className="font-medium text-sm text-center">Email</div>
                <div className="font-medium text-sm text-center">SMS</div>
                <div className="font-medium text-sm text-center">WhatsApp</div>
                <div className="font-medium text-sm text-center">Mobile App</div>
              </div>

              <div className="grid grid-cols-5 gap-4 py-4 border-b items-center hover:bg-muted/50 transition-colors">
                <div className="space-y-2">
                  <div className="font-medium text-sm">Appointment Reminders</div>
                  <p className="text-xs text-muted-foreground mb-2">Upcoming appointments</p>
                  <Select value={accountSettings.appointmentHoursBefore} onValueChange={(value) => setAccountSettings((p) => ({ ...p, appointmentHoursBefore: value }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour before</SelectItem>
                      <SelectItem value="2">2 hours before</SelectItem>
                      <SelectItem value="4">4 hours before</SelectItem>
                      <SelectItem value="12">12 hours before</SelectItem>
                      <SelectItem value="24">24 hours before</SelectItem>
                      <SelectItem value="48">48 hours before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center"><Switch checked={accountSettings.emailAppointments} onCheckedChange={() => handleToggle("emailAppointments")} /></div>
                <div className="flex justify-center"><Switch checked={accountSettings.smsAppointments} onCheckedChange={() => handleToggle("smsAppointments")} /></div>
                <div className="flex justify-center"><Switch checked={accountSettings.whatsappAppointments} onCheckedChange={() => handleToggle("whatsappAppointments")} /></div>
                <div className="flex justify-center"><Switch checked={accountSettings.pushAppointments} onCheckedChange={() => handleToggle("pushAppointments")} /></div>
              </div>

              <div className="grid grid-cols-5 gap-4 py-4 border-b items-center hover:bg-muted/50 transition-colors">
                <div className="space-y-2">
                  <div className="font-medium text-sm">Medication Reminders</div>
                  <p className="text-xs text-muted-foreground mb-2">Time to take medications</p>
                  <Select value={accountSettings.medicationMinutesBefore} onValueChange={(value) => setAccountSettings((p) => ({ ...p, medicationMinutesBefore: value }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">At medication time</SelectItem>
                      <SelectItem value="5">5 minutes before</SelectItem>
                      <SelectItem value="10">10 minutes before</SelectItem>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center"><Switch checked={accountSettings.emailMedications} onCheckedChange={() => handleToggle("emailMedications")} /></div>
                <div className="flex justify-center"><Switch checked={accountSettings.smsMedications} onCheckedChange={() => handleToggle("smsMedications")} /></div>
                <div className="flex justify-center"><Switch checked={accountSettings.whatsappMedications} onCheckedChange={() => handleToggle("whatsappMedications")} /></div>
                <div className="flex justify-center"><Switch checked={accountSettings.pushMedications} onCheckedChange={() => handleToggle("pushMedications")} /></div>
              </div>

              <div className="grid grid-cols-5 gap-4 py-4 border-b items-center hover:bg-muted/50 transition-colors">
                <div className="space-y-2">
                  <div className="font-medium text-sm">Tasks Reminders</div>
                  <p className="text-xs text-muted-foreground mb-2">Pending health tasks</p>
                  <Input type="time" value={accountSettings.tasksReminderTime} onChange={(e) => setAccountSettings((p) => ({ ...p, tasksReminderTime: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="flex justify-center"><Switch checked={accountSettings.emailTasks} onCheckedChange={() => handleToggle("emailTasks")} /></div>
                <div className="flex justify-center"><Switch checked={accountSettings.smsTasks} onCheckedChange={() => handleToggle("smsTasks")} /></div>
                <div className="flex justify-center"><Switch checked={accountSettings.whatsappTasks} onCheckedChange={() => handleToggle("whatsappTasks")} /></div>
                <div className="flex justify-center"><Switch checked={accountSettings.pushTasks} onCheckedChange={() => handleToggle("pushTasks")} /></div>
              </div>

              <div className="grid grid-cols-5 gap-4 py-4 items-center hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-sm">Newsletter</div>
                  <p className="text-xs text-muted-foreground">Health tips and updates</p>
                </div>
                <div className="flex justify-center"><Switch checked={accountSettings.emailNewsletter} onCheckedChange={() => handleToggle("emailNewsletter")} /></div>
                <div className="flex justify-center"><span className="text-xs text-muted-foreground">—</span></div>
                <div className="flex justify-center"><span className="text-xs text-muted-foreground">—</span></div>
                <div className="flex justify-center"><span className="text-xs text-muted-foreground">—</span></div>
              </div>
            </div>
          </div>
        </div>

        <Button className="bg-teal-600 hover:bg-teal-700" onClick={savePreferences}><Save className="mr-2 h-4 w-4" />Save Preferences</Button>
      </CardContent>
    </Card>
  )
}


