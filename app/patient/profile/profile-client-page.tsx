"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Check, LogOut, Plus, Save, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import { LocationSearch } from "@/components/ui/location-search"

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  dob: z.string(),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  height: z.string(),
  weight: z.string(),
  emergencyContact: z.string().min(5, {
    message: "Emergency contact must be at least 5 characters.",
  }),
  bio: z.string().max(500, {
    message: "Bio must not be longer than 500 characters.",
  }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const defaultValues: Partial<ProfileFormValues> = {
  name: "John Smith",
  email: "john.smith@example.com",
  phone: "(555) 123-4567",
  dob: "1985-04-12",
  address: "123 Main St, Anytown, CA 94123",
  height: "5'10\"",
  weight: "175 lbs",
  emergencyContact: "Jane Smith (Wife) - (555) 987-6543",
  bio: "I'm a software engineer with a history of hypertension. I exercise regularly and try to maintain a balanced diet.",
}

const dataRequestSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  requestType: z.enum(["data-export", "data-deletion", "account-deletion"]),
  reason: z.string().min(10, { message: "Please provide a reason for your request" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
})

export default function ProfileClientPage() {
  const { t, language, setLanguage } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const { toast } = useToast()
  const [locationDetails, setLocationDetails] = useState<any>(null)

  const [accountSettings, setAccountSettings] = useState({
    twoFactorAuth: true,
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    dataSharing: true,
    appleHealth: false,
    googleFit: true,
    withings: false,
    fitbit: false,
    garmin: false,
    oura: false,
  })

  const [textSize, setTextSize] = useState(100)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [newIntegrationOpen, setNewIntegrationOpen] = useState(false)
  const [dataRequestOpen, setDataRequestOpen] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  })

  const dataRequestForm = useForm({
    resolver: zodResolver(dataRequestSchema),
    defaultValues: {
      name: "John Smith",
      requestType: "data-export",
      reason: "",
      email: "john.smith@example.com",
    },
  })

  function onSubmit(data: ProfileFormValues) {
    console.log(data)
    // In a real app, you would update the user's profile here
  }

  function onDataRequestSubmit(data: any) {
    console.log(data)
    setDataRequestOpen(false)
    // In a real app, you would submit the data request here
  }

  const handleToggle = (key: keyof typeof accountSettings) => {
    setAccountSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const savePreferences = () => {
    // Update the language if it has changed
    if (selectedLanguage !== language) {
      setLanguage(selectedLanguage as "en" | "es" | "pt")
    }

    // In a real app, this would save to a database or API
    console.log("Saving preferences:", {
      language: selectedLanguage,
      textSize,
      reduceMotion,
      highContrast,
      timezone:
        document.getElementById("timezone")?.querySelector("[data-value]")?.getAttribute("data-value") ||
        "america-los_angeles",
      units: document.querySelector('input[name="units"]:checked')?.value || "imperial",
    })

    // Show success message using toast instead of alert
    toast({
      title: t("preferences.savedSuccessfully"),
      description: t("preferences.savedSuccessfullyDesc"),
      duration: 3000,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src="/middle-aged-man-profile.png" alt="John Smith" />
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">{t("greeting.morning")}, John!</h1>
          <p className="text-muted-foreground">{t("profile.manageProfile")}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full md:w-auto inline-flex">
            <TabsTrigger value="profile" className="min-w-[100px]">
              {t("tabs.profile")}
            </TabsTrigger>
            <TabsTrigger value="emergency" className="min-w-[100px]">
              {t("tabs.emergency")}
            </TabsTrigger>
            <TabsTrigger value="insurance" className="min-w-[100px]">
              {t("tabs.insurance")}
            </TabsTrigger>
            <TabsTrigger value="security" className="min-w-[100px]">
              {t("tabs.security")}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="min-w-[100px]">
              {t("tabs.notifications")}
            </TabsTrigger>
            <TabsTrigger value="integrations" className="min-w-[100px]">
              {t("tabs.integrations")}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="min-w-[100px]">
              {t("tabs.preferences")}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="min-w-[100px]">
              {t("tabs.privacy")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.fullName")}</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.email")}</FormLabel>
                          <FormControl>
                            <Input placeholder="Your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.phone")}</FormLabel>
                          <FormControl>
                            <Input placeholder="Your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.dob")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.height")}</FormLabel>
                          <FormControl>
                            <Input placeholder="Your height" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.weight")}</FormLabel>
                          <FormControl>
                            <Input placeholder="Your weight" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("profile.address")}</FormLabel>
                            <FormControl>
                              <LocationSearch
                                value={field.value}
                                onChange={(location, details) => {
                                  console.log("Profile onChange - location:", location, "current field value:", field.value)
                                  field.onChange(location)
                                  console.log("Field onChange called, new value should be:", location)
                                  if (details) {
                                    setLocationDetails(details)
                                  }
                                }}
                                placeholder="Search for your address..."
                                label=""
                                error={form.formState.errors.address?.message}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("profile.medicalNotes")}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief medical history, allergies, or other important information"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>{t("profile.medicalNotesDesc")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                    <Save className="mr-2 h-4 w-4" />
                    {t("profile.updateProfile")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t("emergency.contacts")}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-contact">{t("emergency.primaryContact")}</Label>
                      <Input id="primary-contact" defaultValue="Jane Smith (Wife)" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primary-phone">{t("emergency.phoneNumber")}</Label>
                      <Input id="primary-phone" defaultValue="(555) 987-6543" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary-contact">{t("emergency.secondaryContact")}</Label>
                      <Input id="secondary-contact" defaultValue="Robert Smith (Brother)" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary-phone">{t("emergency.phoneNumber")}</Label>
                      <Input id="secondary-phone" defaultValue="(555) 456-7890" />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("emergency.medicalInfo")}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="blood-type">{t("emergency.bloodType")}</Label>
                      <Select defaultValue="O+">
                        <SelectTrigger id="blood-type">
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allergies">{t("emergency.allergies")}</Label>
                      <Input id="allergies" defaultValue="Penicillin, Peanuts" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical-conditions">{t("emergency.medicalConditions")}</Label>
                    <Textarea
                      id="medical-conditions"
                      defaultValue="Hypertension, Type 2 Diabetes"
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              <Button className="bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                {t("emergency.saveInfo")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{t("insurance.primary")}</h3>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("insurance.addInsurance")}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insurance-provider">{t("insurance.provider")}</Label>
                  <Input id="insurance-provider" defaultValue="Blue Cross Blue Shield" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policy-number">{t("insurance.policyNumber")}</Label>
                  <Input id="policy-number" defaultValue="XYZ123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-number">{t("insurance.groupNumber")}</Label>
                  <Input id="group-number" defaultValue="GRP987654321" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-id">{t("insurance.memberId")}</Label>
                  <Input id="member-id" defaultValue="MEM123456789" />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("insurance.secondary")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="secondary-provider">{t("insurance.provider")}</Label>
                    <Input id="secondary-provider" placeholder="Secondary insurance provider" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-policy">{t("insurance.policyNumber")}</Label>
                    <Input id="secondary-policy" placeholder="Secondary policy number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-group">{t("insurance.groupNumber")}</Label>
                    <Input id="secondary-group" placeholder="Secondary group number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-member">{t("insurance.memberId")}</Label>
                    <Input id="secondary-member" placeholder="Secondary member ID" />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Input type="file" id="insurance-card" className="max-w-sm" accept="image/*" />
                <Button variant="outline">{t("insurance.uploadCard")}</Button>
              </div>

              <Button className="bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                {t("insurance.saveInfo")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t("security.password")}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t("security.currentPassword")}</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t("security.newPassword")}</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t("security.confirmPassword")}</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("security.twoFactor")}</h3>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">{t("security.authenticatorApp")}</h4>
                    <p className="text-sm text-muted-foreground">{t("security.authenticatorDesc")}</p>
                  </div>
                  <Switch
                    checked={accountSettings.twoFactorAuth}
                    onCheckedChange={() => handleToggle("twoFactorAuth")}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("security.loginSessions")}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <h4 className="font-medium">{t("security.currentSession")}</h4>
                      <p className="text-sm text-muted-foreground">Chrome on Windows • IP: 192.168.1.1 • Active now</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      {t("action.current")}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <h4 className="font-medium">{t("security.previousSession")}</h4>
                      <p className="text-sm text-muted-foreground">Safari on iPhone • IP: 192.168.1.2 • 2 days ago</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <X className="mr-2 h-4 w-4" />
                      {t("action.revoke")}
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                {t("security.saveSettings")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t("notifications.email")}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="appointment-email">{t("notifications.appointmentReminders")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.emailDesc")}</p>
                    </div>
                    <Switch
                      id="appointment-email"
                      checked={accountSettings.emailNotifications}
                      onCheckedChange={() => handleToggle("emailNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="medication-email">{t("notifications.medicationReminders")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.medicationDesc")}</p>
                    </div>
                    <Switch
                      id="medication-email"
                      checked={accountSettings.emailNotifications}
                      onCheckedChange={() => handleToggle("emailNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="results-email">{t("notifications.testResults")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.resultsDesc")}</p>
                    </div>
                    <Switch
                      id="results-email"
                      checked={accountSettings.emailNotifications}
                      onCheckedChange={() => handleToggle("emailNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="newsletter-email">{t("notifications.newsletter")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.newsletterDesc")}</p>
                    </div>
                    <Switch
                      id="newsletter-email"
                      checked={accountSettings.marketingEmails}
                      onCheckedChange={() => handleToggle("marketingEmails")}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("notifications.sms")}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="appointment-sms">{t("notifications.appointmentReminders")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.smsAppointmentDesc")}</p>
                    </div>
                    <Switch
                      id="appointment-sms"
                      checked={accountSettings.smsNotifications}
                      onCheckedChange={() => handleToggle("smsNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="medication-sms">{t("notifications.medicationReminders")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.smsMedicationDesc")}</p>
                    </div>
                    <Switch
                      id="medication-sms"
                      checked={accountSettings.smsNotifications}
                      onCheckedChange={() => handleToggle("smsNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="results-sms">{t("notifications.testResults")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.smsResultsDesc")}</p>
                    </div>
                    <Switch
                      id="results-sms"
                      checked={accountSettings.smsNotifications}
                      onCheckedChange={() => handleToggle("smsNotifications")}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("notifications.push")}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="appointment-push">{t("notifications.appointmentReminders")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.pushAppointmentDesc")}</p>
                    </div>
                    <Switch
                      id="appointment-push"
                      checked={accountSettings.smsNotifications}
                      onCheckedChange={() => handleToggle("smsNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="medication-push">{t("notifications.medicationReminders")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.pushMedicationDesc")}</p>
                    </div>
                    <Switch
                      id="medication-push"
                      checked={accountSettings.smsNotifications}
                      onCheckedChange={() => handleToggle("smsNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="results-push">{t("notifications.testResults")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifications.pushResultsDesc")}</p>
                    </div>
                    <Switch
                      id="results-push"
                      checked={accountSettings.smsNotifications}
                      onCheckedChange={() => handleToggle("smsNotifications")}
                    />
                  </div>
                </div>
              </div>

              <Button className="bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                {t("notifications.savePreferences")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t("integrations.healthFitness")}</h3>
                <Dialog open={newIntegrationOpen} onOpenChange={setNewIntegrationOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("integrations.newIntegration")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("integrations.addNew")}</DialogTitle>
                      <DialogDescription>{t("integrations.connectDesc")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="integration-partner">{t("integrations.partner")}</Label>
                        <Select>
                          <SelectTrigger id="integration-partner">
                            <SelectValue placeholder="Select integration partner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apple-health">Apple Health</SelectItem>
                            <SelectItem value="google-fit">Google Fit</SelectItem>
                            <SelectItem value="fitbit">Fitbit</SelectItem>
                            <SelectItem value="garmin">Garmin</SelectItem>
                            <SelectItem value="withings">Withings</SelectItem>
                            <SelectItem value="oura">Oura Ring</SelectItem>
                            <SelectItem value="samsung-health">Samsung Health</SelectItem>
                            <SelectItem value="strava">Strava</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="integration-email">{t("profile.email")}</Label>
                        <Input id="integration-email" type="email" placeholder="Enter your account email" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="integration-password">{t("security.password")}</Label>
                        <Input id="integration-password" type="password" placeholder="Enter your account password" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewIntegrationOpen(false)}>
                        {t("action.cancel")}
                      </Button>
                      <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setNewIntegrationOpen(false)}>
                        {t("action.connect")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <p className="text-sm text-muted-foreground">{t("integrations.syncDesc")}</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-red-500"
                      >
                        <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                        <path d="M10 2c1 .5 2 2 2 5" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">{t("integrations.appleHealth")}</h4>
                      <p className="text-sm text-muted-foreground">{t("integrations.appleHealthDesc")}</p>
                    </div>
                  </div>
                  <Switch checked={accountSettings.appleHealth} onCheckedChange={() => handleToggle("appleHealth")} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-blue-500"
                      >
                        <path d="M12 2L4 12l8 10 8-10-8-10z" fill="#4285F4" />
                        <path d="M12 2L4 12h16L12 2z" fill="#EA4335" />
                        <path d="M4 12l8 10 8-10H4z" fill="#FBBC04" />
                        <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" fill="#0F9D58" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">{t("integrations.googleFit")}</h4>
                      <p className="text-sm text-muted-foreground">{t("integrations.googleFitDesc")}</p>
                    </div>
                  </div>
                  <Switch checked={accountSettings.googleFit} onCheckedChange={() => handleToggle("googleFit")} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-teal-600"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                        <path d="M12 8v8" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">{t("integrations.withings")}</h4>
                      <p className="text-sm text-muted-foreground">{t("integrations.withingsDesc")}</p>
                    </div>
                  </div>
                  <Switch checked={accountSettings.withings} onCheckedChange={() => handleToggle("withings")} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-400"
                      >
                        <path d="M12 2v20" />
                        <path d="M2 12h20" />
                        <path d="M12 22a10 10 0 0 0 0-20" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">{t("integrations.fitbit")}</h4>
                      <p className="text-sm text-muted-foreground">{t("integrations.fitbitDesc")}</p>
                    </div>
                  </div>
                  <Switch checked={accountSettings.fitbit} onCheckedChange={() => handleToggle("fitbit")} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-600"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">{t("integrations.garmin")}</h4>
                      <p className="text-sm text-muted-foreground">{t("integrations.garminDesc")}</p>
                    </div>
                  </div>
                  <Switch checked={accountSettings.garmin} onCheckedChange={() => handleToggle("garmin")} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-800"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">{t("integrations.ouraRing")}</h4>
                      <p className="text-sm text-muted-foreground">{t("integrations.ouraRingDesc")}</p>
                    </div>
                  </div>
                  <Switch checked={accountSettings.oura} onCheckedChange={() => handleToggle("oura")} />
                </div>
              </div>

              <Button className="bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                {t("integrations.saveSettings")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t("preferences.theme")}</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="justify-start">
                    <span className="h-4 w-4 rounded-full bg-background border mr-2"></span>
                    {t("preferences.light")}
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <span className="h-4 w-4 rounded-full bg-slate-950 mr-2"></span>
                    {t("preferences.dark")}
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <span className="h-4 w-4 rounded-full bg-gradient-to-r from-slate-100 to-slate-950 mr-2"></span>
                    {t("preferences.system")}
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("preferences.accessibility")}</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="text-size">
                        {t("preferences.textSize")} ({textSize}%)
                      </Label>
                      <span className="text-sm text-muted-foreground">{textSize}%</span>
                    </div>
                    <Slider
                      id="text-size"
                      min={75}
                      max={150}
                      step={5}
                      value={[textSize]}
                      onValueChange={(value) => setTextSize(value[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>A</span>
                      <span style={{ fontSize: "1.2em" }}>A</span>
                      <span style={{ fontSize: "1.5em" }}>A</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reduce-motion">{t("preferences.reduceMotion")}</Label>
                      <p className="text-sm text-muted-foreground">{t("preferences.reduceMotionDesc")}</p>
                    </div>
                    <Switch id="reduce-motion" checked={reduceMotion} onCheckedChange={setReduceMotion} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast">{t("preferences.highContrast")}</Label>
                      <p className="text-sm text-muted-foreground">{t("preferences.highContrastDesc")}</p>
                    </div>
                    <Switch id="high-contrast" checked={highContrast} onCheckedChange={setHighContrast} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("preferences.language")}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">{t("preferences.language")}</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">{t("preferences.timezone")}</Label>
                    <Select defaultValue="america-los_angeles">
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="america-los_angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="america-denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="america-chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="america-new_york">Eastern Time (ET)</SelectItem>
                        <SelectItem value="europe-london">Greenwich Mean Time (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="units">{t("preferences.units")}</Label>
                    <RadioGroup defaultValue="imperial">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="imperial" id="imperial" />
                        <Label htmlFor="imperial">{t("preferences.imperial")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="metric" id="metric" />
                        <Label htmlFor="metric">{t("preferences.metric")}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <Button className="bg-teal-600 hover:bg-teal-700" onClick={savePreferences}>
                <Save className="mr-2 h-4 w-4" />
                {t("preferences.savePreferences")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t("privacy.settings")}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="data-sharing">{t("privacy.dataSharing")}</Label>
                      <p className="text-sm text-muted-foreground">{t("privacy.dataSharingDesc")}</p>
                    </div>
                    <Switch
                      id="data-sharing"
                      checked={accountSettings.dataSharing}
                      onCheckedChange={() => handleToggle("dataSharing")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="research-participation">{t("privacy.research")}</Label>
                      <p className="text-sm text-muted-foreground">{t("privacy.researchDesc")}</p>
                    </div>
                    <Switch id="research-participation" defaultChecked={false} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="analytics">{t("privacy.analytics")}</Label>
                      <p className="text-sm text-muted-foreground">{t("privacy.analyticsDesc")}</p>
                    </div>
                    <Switch id="analytics" defaultChecked />
                  </div>
                </div>
              </div>

              <Button className="bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                {t("privacy.saveSettings")}
              </Button>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("privacy.dataManagement")}</h3>
                <Dialog open={dataRequestOpen} onOpenChange={setDataRequestOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Check className="mr-2 h-4 w-4" />
                      {t("privacy.requestData")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{t("privacy.dataRequest")}</DialogTitle>
                      <DialogDescription>{t("privacy.dataRequestDesc")}</DialogDescription>
                    </DialogHeader>
                    <Form {...dataRequestForm}>
                      <form onSubmit={dataRequestForm.handleSubmit(onDataRequestSubmit)} className="space-y-4">
                        <FormField
                          control={dataRequestForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("profile.fullName")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dataRequestForm.control}
                          name="requestType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("privacy.requestType")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select request type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="data-export">{t("privacy.dataExport")}</SelectItem>
                                  <SelectItem value="data-deletion">{t("privacy.dataDeletion")}</SelectItem>
                                  <SelectItem value="account-deletion">{t("privacy.accountDeletion")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dataRequestForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("privacy.reason")}</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={t("privacy.reasonPlaceholder")}
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dataRequestForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("privacy.emailDownload")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>{t("privacy.emailDownloadDesc")}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDataRequestOpen(false)}>
                            {t("action.cancel")}
                          </Button>
                          <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                            {t("action.submit")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-white shadow-lg">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
