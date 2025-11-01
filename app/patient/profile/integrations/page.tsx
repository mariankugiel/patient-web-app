"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, Plus } from "lucide-react"

export default function IntegrationsTabPage() {
  const [settings, setSettings] = useState({ googleFit: true, fitbit: false, garmin: false })
  const [newIntegrationOpen, setNewIntegrationOpen] = useState(false)

  const toggle = (k: keyof typeof settings) => setSettings((p) => ({ ...p, [k]: !p[k] }))

  const save = () => {
    console.log("save integrations", settings)
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Wearable Integrations</h3>
          <Dialog open={newIntegrationOpen} onOpenChange={setNewIntegrationOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700"><Plus className="mr-2 h-4 w-4" />Add Integration</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Integration</DialogTitle>
                <DialogDescription>Connect your wearable device or health app</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Integration Partner</p>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select integration partner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apple-health">Apple Health</SelectItem>
                      <SelectItem value="google-fit">Google Fit</SelectItem>
                      <SelectItem value="fitbit">Fitbit</SelectItem>
                      <SelectItem value="garmin">Garmin</SelectItem>
                      <SelectItem value="withings">Withings</SelectItem>
                      <SelectItem value="oura">Oura Ring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewIntegrationOpen(false)}>Cancel</Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setNewIntegrationOpen(false)}>Connect</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm text-muted-foreground">Sync your health data from wearable devices and fitness apps</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <h4 className="font-medium text-sm">Google Fit</h4>
              <p className="text-xs text-muted-foreground">Android fitness data</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.googleFit} onCheckedChange={() => toggle("googleFit")} />
              {settings.googleFit && <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">Sync</Button>}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <h4 className="font-medium text-sm">Fitbit</h4>
              <p className="text-xs text-muted-foreground">Fitbit activity data</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.fitbit} onCheckedChange={() => toggle("fitbit")} />
              {settings.fitbit && <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">Sync</Button>}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <h4 className="font-medium text-sm">Garmin</h4>
              <p className="text-xs text-muted-foreground">Garmin devices</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.garmin} onCheckedChange={() => toggle("garmin")} />
              {settings.garmin && <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">Sync</Button>}
            </div>
          </div>
        </div>

        <Button className="bg-teal-600 hover:bg-teal-700" onClick={save}><Save className="mr-2 h-4 w-4" />Save Settings</Button>
      </CardContent>
    </Card>
  )
}


