"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LogOut, Plus, Save, X, Pencil, Smartphone, Lock, CheckCircle2, Circle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { LocationSearch } from "@/components/ui/location-search"
import { countryCodes } from "@/lib/country-codes"
import { TimezoneSelector } from "@/components/ui/timezone-selector"

const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  dob: z.string(),
  gender: z.string(),
  height: z.string(),
  bloodType: z.string(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  countryCode: z.string(),
  countryName: z.string().optional(),
  mobileNumber: z.string().min(5, {
    message: "Please enter a valid mobile number.",
  }),
  location: z.string().min(5, {
    message: "Location must be at least 5 characters.",
  }),
  timezone: z.string(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const defaultValues: Partial<ProfileFormValues> = {
  firstName: "John",
  lastName: "Smith",
  dob: "1985-04-12",
  gender: "male",
  height: "178",
  bloodType: "O+",
  email: "john.smith@email.com",
  countryCode: "+1",
  countryName: "United States",
  mobileNumber: "5551234567",
  location: "San Francisco, CA",
  timezone: "America/Los_Angeles",
}

type EmergencyContact = {
  id: number
  name: string
  relationship: string
  countryCode: string
  phone: string
  email: string
}

const emergencyContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  relationship: z.string().min(2, "Relationship must be at least 2 characters"),
  countryCode: z.string(),
  phone: z.string().min(5, "Phone number must be at least 5 digits"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
})

type EmergencyContactFormValues = z.infer<typeof emergencyContactSchema>

const emergencyInfoSchema = z.object({
  allergies: z.string(),
  pregnancy: z.string(),
  medications: z.string(),
  healthProblems: z.string(),
  organDonor: z.boolean(),
})

type EmergencyInfoFormValues = z.infer<typeof emergencyInfoSchema>

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

export default function ProfileClientPage() {
  const { t, language, setLanguage } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light")
  const { toast } = useToast()
  const [profileImage, setProfileImage] = useState("/middle-aged-man-profile.png")

  useEffect(() => {
    if (selectedTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [selectedTheme])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setSelectedTheme(savedTheme)
    }
  }, [])

  const [accountSettings, setAccountSettings] = useState({
    twoFactorAuth: true,
    emailAppointments: true,
    emailMedications: true,
    emailTasks: false,
    emailNewsletter: false,
    smsAppointments: false,
    smsMedications: false,
    smsTasks: false,
    whatsappAppointments: true,
    whatsappMedications: false,
    whatsappTasks: true,
    pushAppointments: true,
    pushMedications: true,
    pushTasks: false,
    appointmentHoursBefore: "24",
    medicationMinutesBefore: "15",
    tasksReminderTime: "09:00",
    googleFit: true,
    fitbit: false,
    garmin: false,
    shareAnonymizedData: true,
    shareAnalytics: false,
  })

  const [newIntegrationOpen, setNewIntegrationOpen] = useState(false)
  const [dataExportOpen, setDataExportOpen] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  })

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: 1,
      name: "Jane Smith",
      relationship: "Wife",
      countryCode: "+1",
      phone: "5559876543",
      email: "jane.smith@email.com",
    },
    {
      id: 2,
      name: "Robert Smith",
      relationship: "Brother",
      countryCode: "+1",
      phone: "5554567890",
      email: "robert.smith@email.com",
    },
  ])

  const [emergencyContactDialogOpen, setEmergencyContactDialogOpen] = useState(false)
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [mobileSyncDialogOpen, setMobileSyncDialogOpen] = useState(false)

  const emergencyContactForm = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      name: "",
      relationship: "",
      countryCode: "+1",
      phone: "",
      email: "",
    },
  })

  const emergencyInfoForm = useForm<EmergencyInfoFormValues>({
    resolver: zodResolver(emergencyInfoSchema),
    defaultValues: {
      allergies: "Penicillin, Peanuts",
      pregnancy: "no",
      medications: "Lisinopril 10mg daily, Metformin 500mg twice daily",
      healthProblems: "Type 2 Diabetes, Hypertension",
      organDonor: true,
    },
  })

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const [newPasswordValue, setNewPasswordValue] = useState("")

  const passwordChecks = {
    minLength: newPasswordValue.length >= 8,
    hasLowercase: /[a-z]/.test(newPasswordValue),
    hasUppercase: /[A-Z]/.test(newPasswordValue),
    hasNumber: /[0-9]/.test(newPasswordValue),
    hasSpecial: /[^a-zA-Z0-9]/.test(newPasswordValue),
    passwordsMatch: newPasswordValue === passwordForm.watch("confirmPassword") && newPasswordValue.length > 0,
  }

  const handleAddContact = () => {
    setEditingContactId(null)
    emergencyContactForm.reset({
      name: "",
      relationship: "",
      countryCode: "+1",
      phone: "",
      email: "",
    })
    setEmergencyContactDialogOpen(true)
  }

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContactId(contact.id)
    emergencyContactForm.reset({
      name: contact.name,
      relationship: contact.relationship,
      countryCode: contact.countryCode,
      phone: contact.phone,
      email: contact.email,
    })
    setEmergencyContactDialogOpen(true)
  }

  const handleRemoveContact = (id: number) => {
    setEmergencyContacts((prev) => prev.filter((contact) => contact.id !== id))
    toast({
      title: "Contact removed",
      description: "Emergency contact has been removed successfully.",
      duration: 3000,
  })
  }

  const onSubmitEmergencyContact = (data: EmergencyContactFormValues) => {
    if (editingContactId) {
      setEmergencyContacts((prev) =>
        prev.map((contact) =>
          contact.id === editingContactId ? { ...contact, ...data, email: data.email || "" } : contact,
        ),
      )
      toast({
        title: "Contact updated",
        description: "Emergency contact has been updated successfully.",
        duration: 3000,
      })
    } else {
      const newContact: EmergencyContact = {
        id: Math.max(...emergencyContacts.map((c) => c.id), 0) + 1,
        ...data,
        email: data.email || "",
      }
      setEmergencyContacts((prev) => [...prev, newContact])
      toast({
        title: "Contact added",
        description: "Emergency contact has been added successfully.",
        duration: 3000,
      })
    }
    setEmergencyContactDialogOpen(false)
  }

  const onSubmitEmergencyInfo = (data: EmergencyInfoFormValues) => {
    console.log(data)
    toast({
      title: "Emergency information updated",
      description: "Your emergency information has been saved successfully.",
      duration: 3000,
    })
  }

  const handleMobileSync = (platform: "ios" | "android") => {
    toast({
      title: "Syncing to mobile",
      description: `Your emergency information is being synced to your ${platform === "ios" ? "iOS" : "Android"} device.`,
      duration: 3000,
    })
    setMobileSyncDialogOpen(false)
  }

  function onSubmit(data: ProfileFormValues) {
    console.log(data)
    toast({
      title: t("profile.updateSuccess") || "Profile updated",
      description: t("profile.updateSuccessDesc") || "Your profile has been updated successfully.",
      duration: 3000,
    })
  }

  const handleToggle = (key: keyof typeof accountSettings) => {
    setAccountSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const savePreferences = () => {
    if (selectedLanguage !== language) {
      setLanguage(selectedLanguage as "en" | "es" | "pt")
    }

    localStorage.setItem("theme", selectedTheme)

    toast({
      title: t("preferences.savedSuccessfully") || "Preferences saved",
      description: t("preferences.savedSuccessfullyDesc") || "Your preferences have been saved successfully.",
      duration: 3000,
    })
  }

  const handleDataExport = () => {
    toast({
      title: "Data export requested",
      description: "You will receive an email with your data within 24 hours.",
      duration: 3000,
    })
    setDataExportOpen(false)
  }

  const onSubmitPasswordChange = (data: PasswordChangeFormValues) => {
    console.log("[v0] Password change data:", data)
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
      duration: 3000,
    })
    passwordForm.reset()
    setNewPasswordValue("")
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={profileImage || "/placeholder.svg"} alt="John Smith" />
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-primary">{t("greeting.morning")}, John!</h1>
          <p className="text-muted-foreground">{t("profile.manageProfile")}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0">
            <TabsTrigger value="profile" className="flex-1 sm:flex-none sm:min-w-[100px]">
              {t("tabs.profile")}
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex-1 sm:flex-none sm:min-w-[140px]">
              {t("tabs.emergency")}
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 sm:flex-none sm:min-w-[100px]">
              {t("tabs.security")}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 sm:flex-none sm:min-w-[120px]">
              {t("tabs.notifications")}
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex-1 sm:flex-none sm:min-w-[120px]">
              {t("tabs.integrations")}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex-1 sm:flex-none sm:min-w-[100px]">
              Privacy
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                          name="firstName"
                      render={({ field }) => (
                        <FormItem>
                              <FormLabel>First Name</FormLabel>
                          <FormControl>
                                <Input placeholder="Your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                          name="lastName"
                      render={({ field }) => (
                        <FormItem>
                              <FormLabel>Last Name</FormLabel>
                          <FormControl>
                                <Input placeholder="Your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                          name="dob"
                      render={({ field }) => (
                        <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                                <Input type="date" {...field} className="w-full" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                          name="gender"
                      render={({ field }) => (
                        <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                          </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                              <FormLabel>Height</FormLabel>
                          <FormControl>
                                <div className="relative">
                                  <Input type="number" placeholder="178" {...field} className="pr-10 w-full" />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    cm
                                  </span>
                                </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                          name="bloodType"
                      render={({ field }) => (
                        <FormItem>
                              <FormLabel>Blood Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                          </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                          name="email"
                        render={({ field }) => (
                          <FormItem>
                              <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <Label>Mobile Number</Label>
                          <div className="flex gap-2 mt-2">
                            <FormField
                              control={form.control}
                              name="countryCode"
                              render={({ field }) => (
                                <FormItem className="w-40">
                                  <Select
                                    onValueChange={(value) => {
                                      const [code, ...countryParts] = value.split("|")
                                      const country = countryParts.join("|")
                                      field.onChange(code)
                                      form.setValue("countryName", country)
                                    }}
                                    value={`${field.value}|${form.getValues("countryName") || ""}`}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue>
                                          {(() => {
                                            const selectedCountry = countryCodes.find(
                                              (c) =>
                                                c.code === field.value && c.country === form.getValues("countryName"),
                                            )
                                            return selectedCountry
                                              ? `${selectedCountry.flag} ${selectedCountry.code}`
                                              : "Code"
                                          })()}
                                        </SelectValue>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="max-h-[300px]">
                                      {countryCodes.map((country) => (
                                        <SelectItem
                                          key={`${country.code}-${country.country}`}
                                          value={`${country.code}|${country.country}`}
                                        >
                                          {country.flag} {country.code} {country.country}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="mobileNumber"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input type="tel" placeholder="555 123 4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                          </div>
                        </div>
                    </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                          name="location"
                        render={({ field }) => (
                          <FormItem>
                              <FormLabel>Location</FormLabel>
                            <FormControl>
                                <LocationSearch
                                  value={field.value}
                                  onChange={(location) => field.onChange(location)}
                                  placeholder="City, State/Country"
                              />
                            </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time Zone</FormLabel>
                              <FormControl>
                                <TimezoneSelector
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Select timezone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Preferences</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                          <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as "en" | "es" | "pt")}>
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
                            <Label htmlFor="theme">Theme</Label>
                            <Select value={selectedTheme} onValueChange={(value: any) => setSelectedTheme(value)}>
                              <SelectTrigger id="theme">
                                <SelectValue placeholder="Select theme" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700">
                    <Save className="mr-2 h-4 w-4" />
                    {t("profile.updateProfile")}
                  </Button>
                    </div>

                    <div className="lg:w-64 flex justify-center lg:justify-start">
                      <div className="sticky top-6">
                        <ProfilePictureUpload currentImage={profileImage} onImageChange={setProfileImage} />
                      </div>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                  <h3 className="text-base font-semibold">Emergency Contacts</h3>
                  <p className="text-xs text-muted-foreground">People to contact in case of emergency</p>
                    </div>
                <Button className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto h-9" onClick={handleAddContact}>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add Contact
                </Button>
                    </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="rounded-md border p-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{contact.name}</h4>
                        <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                    </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-muted"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                    </div>
                  </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        {contact.countryCode} {contact.phone}
                      </p>
                      {contact.email && <p className="text-xs text-muted-foreground truncate">{contact.email}</p>}
                </div>
                  </div>
                ))}
              </div>

              <Dialog open={emergencyContactDialogOpen} onOpenChange={setEmergencyContactDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingContactId ? "Edit Emergency Contact" : "Add Emergency Contact"}</DialogTitle>
                    <DialogDescription>
                      {editingContactId
                        ? "Update the emergency contact information."
                        : "Add a new emergency contact who can be reached in case of emergency."}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...emergencyContactForm}>
                    <form onSubmit={emergencyContactForm.handleSubmit(onSubmitEmergencyContact)} className="space-y-4">
                      <FormField
                        control={emergencyContactForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emergencyContactForm.control}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                              </FormControl>
                        <SelectContent>
                                <SelectItem value="Spouse/Partner">Spouse/Partner</SelectItem>
                                <SelectItem value="Parent">Parent</SelectItem>
                                <SelectItem value="Sibling">Sibling</SelectItem>
                                <SelectItem value="Child">Child</SelectItem>
                                <SelectItem value="Friend">Friend</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <Label>Mobile Phone</Label>
                        <div className="flex gap-2 mt-2">
                          <FormField
                            control={emergencyContactForm.control}
                            name="countryCode"
                            render={({ field }) => (
                              <FormItem className="w-40">
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue>
                                        {(() => {
                                          const selectedCountry = countryCodes.find((c) => c.code === field.value)
                                          return selectedCountry
                                            ? `${selectedCountry.flag} ${selectedCountry.code}`
                                            : "Code"
                                        })()}
                                      </SelectValue>
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-[300px]">
                                    {countryCodes.map((country) => (
                                      <SelectItem key={`${country.code}-${country.country}`} value={country.code}>
                                        {country.flag} {country.code} {country.country}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={emergencyContactForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input type="tel" placeholder="555 123 4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                    </div>
                    </div>

                      <FormField
                        control={emergencyContactForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEmergencyContactDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                          {editingContactId ? "Update Contact" : "Add Contact"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Emergency Medical Information</h3>
                    <p className="text-xs text-muted-foreground">Critical health information for emergency responders</p>
                  </div>
                  <Dialog open={mobileSyncDialogOpen} onOpenChange={setMobileSyncDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto h-9 bg-transparent">
                        <Smartphone className="mr-2 h-3.5 w-3.5" />
                        Sync to Mobile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sync to Mobile Device</DialogTitle>
                        <DialogDescription>Choose your mobile platform to sync your emergency information</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <Button
                          variant="outline"
                          className="h-20 flex items-center justify-center bg-transparent"
                          onClick={() => handleMobileSync("ios")}
                        >
                          <span className="font-medium text-base">iOS</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 flex items-center justify-center bg-transparent"
                          onClick={() => handleMobileSync("android")}
                        >
                          <span className="font-medium text-base">Android</span>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Form {...emergencyInfoForm}>
                  <form onSubmit={emergencyInfoForm.handleSubmit(onSubmitEmergencyInfo)} className="space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-3">
                        <FormField
                          control={emergencyInfoForm.control}
                          name="allergies"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Allergies</FormLabel>
                              <FormControl>
                    <Textarea
                                  placeholder="List any allergies (medications, food, etc.)"
                                  className="resize-none text-sm"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emergencyInfoForm.control}
                          name="medications"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Current Medications</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="List current medications and dosages"
                                  className="resize-none text-sm"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                    />
                  </div>

                      <div className="space-y-3">
                        <FormField
                          control={emergencyInfoForm.control}
                          name="healthProblems"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Health Problems</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="List chronic conditions or health issues"
                                  className="resize-none text-sm"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            control={emergencyInfoForm.control}
                            name="pregnancy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Pregnancy Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-sm">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="no">Not Pregnant</SelectItem>
                                    <SelectItem value="yes">Pregnant</SelectItem>
                                    <SelectItem value="unknown">Unknown</SelectItem>
                                    <SelectItem value="na">Not Applicable</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={emergencyInfoForm.control}
                            name="organDonor"
                            render={({ field }) => (
                              <FormItem className="flex flex-col justify-end">
                                <FormLabel className="text-sm font-medium mb-2">Organ Donor</FormLabel>
                                <div className="flex items-center justify-between rounded-md border px-3 h-9">
                                  <span className="text-sm">Willing to donate</span>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                </div>
              </div>

                    <Button type="submit" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 h-9">
                      <Save className="mr-2 h-3.5 w-3.5" />
                      Save Emergency Information
              </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
              </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text_base">Change Password</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Update your password to keep your account secure</p>
                </div>
                </div>

                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPasswordChange)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" className="h-9 text-sm" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">New Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                className="h-9 text-sm"
                                placeholder="••••••••"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e)
                                  setNewPasswordValue(e.target.value)
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" className="h-9 text-sm" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                </div>

                    {newPasswordValue.length > 0 && (
                      <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                        <p className="text-xs font-medium mb-2">Password Requirements:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.minLength ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={passwordChecks.minLength ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>
                              At least 8 characters
                            </span>
                </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.hasLowercase ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={passwordChecks.hasLowercase ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>
                              One lowercase letter
                            </span>
              </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.hasUppercase ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={passwordChecks.hasUppercase ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>
                              One uppercase letter
                            </span>
                  </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.hasNumber ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={passwordChecks.hasNumber ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>
                              One number
                            </span>
                  </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.hasSpecial ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={passwordChecks.hasSpecial ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>
                              One special character
                            </span>
                  </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordChecks.passwordsMatch ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={passwordChecks.passwordsMatch ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}>
                              Passwords match
                            </span>
                  </div>
                </div>
              </div>
                    )}

                    <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 text-xs">
                      Update Password
                    </Button>
                  </form>
                </Form>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <div className="flex gap-0.5">
                      <Lock className="h-4 w-4 text-primary" />
                      <Lock className="h-4 w-4 text-primary" />
                  </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">Two-Factor Authentication</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-background p-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                      <h4 className="font-medium text-sm">Authenticator App</h4>
                      <p className="text-xs text-muted-foreground">Use an app to generate verification codes</p>
                    </div>
                  </div>
                  <Switch
                    checked={accountSettings.twoFactorAuth}
                    onCheckedChange={() => handleToggle("twoFactorAuth")}
                  />
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <rect width="20" height="14" x="2" y="7" rx="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">Active Sessions</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage devices that are logged into your account</p>
                  </div>
                    </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="rounded-md bg-background p-2 flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground"
                        >
                          <rect width="20" height="14" x="2" y="3" rx="2" />
                          <line x1="8" x2="16" y1="21" y2="21" />
                          <line x1="12" x2="12" y1="17" y2="21" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">Chrome on Windows</h4>
                          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">IP: 192.168.1.1 • Active now</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled className="h-7 text-xs flex-shrink-0 ml-2 bg-transparent">
                      Current
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="rounded-md bg-muted p-2 flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground"
                        >
                          <rect width="7" height="13" x="6" y="4" rx="1" />
                          <path d="M10.5 1.5v2M13.5 1.5v2M8 4v16M16 7h2M16 11h2M16 15h2" />
                        </svg>
                </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">Safari on iPhone</h4>
                        <p className="text-xs text-muted-foreground truncate">IP: 192.168.1.2 • 2 days ago</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-shrink-0 ml-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 bg-transparent"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Revoke
                    </Button>
              </div>

                  <div className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="rounded-md bg-muted p-2 flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="4" />
                          <line x1="21.17" x2="12" y1="8" y2="8" />
                          <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
                          <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">Firefox on MacBook</h4>
                        <p className="text-xs text-muted-foreground truncate">IP: 192.168.1.5 • 5 days ago</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-shrink-0 ml-2 hover:bg-destructive/10 hover:text-destructive hover;border-destructive/20 bg-transparent"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Revoke
              </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
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
                        <Select
                          value={accountSettings.appointmentHoursBefore}
                          onValueChange={(value) =>
                            setAccountSettings((prev) => ({ ...prev, appointmentHoursBefore: value }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
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
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.emailAppointments}
                          onCheckedChange={() => handleToggle("emailAppointments")}
                    />
                  </div>
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.smsAppointments}
                          onCheckedChange={() => handleToggle("smsAppointments")}
                    />
                  </div>
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.whatsappAppointments}
                          onCheckedChange={() => handleToggle("whatsappAppointments")}
                    />
                  </div>
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.pushAppointments}
                          onCheckedChange={() => handleToggle("pushAppointments")}
                    />
                </div>
              </div>

                    <div className="grid grid-cols-5 gap-4 py-4 border-b items-center hover:bg-muted/50 transition-colors">
                      <div className="space-y-2">
                        <div className="font-medium text-sm">Medication Reminders</div>
                        <p className="text-xs text-muted-foreground mb-2">Time to take medications</p>
                        <Select
                          value={accountSettings.medicationMinutesBefore}
                          onValueChange={(value) =>
                            setAccountSettings((prev) => ({ ...prev, medicationMinutesBefore: value }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
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
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.emailMedications}
                          onCheckedChange={() => handleToggle("emailMedications")}
                    />
                  </div>
                      <div className="flex justify-center">
                        <Switch checked={accountSettings.smsMedications} onCheckedChange={() => handleToggle("smsMedications")} />
                    </div>
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.whatsappMedications}
                          onCheckedChange={() => handleToggle("whatsappMedications")}
                    />
                  </div>
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.pushMedications}
                          onCheckedChange={() => handleToggle("pushMedications")}
                    />
                </div>
              </div>

                    <div className="grid grid-cols-5 gap-4 py-4 border-b items-center hover:bg-muted/50 transition-colors">
                      <div className="space-y-2">
                        <div className="font-medium text-sm">Tasks Reminders</div>
                        <p className="text-xs text-muted-foreground mb-2">Pending health tasks</p>
                        <Input
                          type="time"
                          value={accountSettings.tasksReminderTime}
                          onChange={(e) =>
                            setAccountSettings((prev) => ({ ...prev, tasksReminderTime: e.target.value }))
                          }
                          className="h-8 text-xs"
                        />
                    </div>
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.emailTasks}
                          onCheckedChange={() => handleToggle("emailTasks")}
                    />
                  </div>
                      <div className="flex justify-center">
                        <Switch checked={accountSettings.smsTasks} onCheckedChange={() => handleToggle("smsTasks")} />
                    </div>
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.whatsappTasks}
                          onCheckedChange={() => handleToggle("whatsappTasks")}
                    />
                  </div>
                      <div className="flex justify-center">
                        <Switch checked={accountSettings.pushTasks} onCheckedChange={() => handleToggle("pushTasks")} />
                    </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 py-4 items-center hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium text-sm">Newsletter</div>
                        <p className="text-xs text-muted-foreground">Health tips and updates</p>
                      </div>
                      <div className="flex justify-center">
                    <Switch
                          checked={accountSettings.emailNewsletter}
                          onCheckedChange={() => handleToggle("emailNewsletter")}
                    />
                  </div>
                      <div className="flex justify-center">
                        <span className="text-xs text-muted-foreground">—</span>
                      </div>
                      <div className="flex justify-center">
                        <span className="text-xs text-muted-foreground">—</span>
                      </div>
                      <div className="flex justify-center">
                        <span className="text-xs text-muted-foreground">—</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="bg-teal-600 hover:bg-teal-700" onClick={savePreferences}>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Wearable Integrations</h3>
                <Dialog open={newIntegrationOpen} onOpenChange={setNewIntegrationOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Integration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Integration</DialogTitle>
                      <DialogDescription>Connect your wearable device or health app</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="integration-partner">Integration Partner</Label>
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
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewIntegrationOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setNewIntegrationOpen(false)}>
                        Connect
                      </Button>
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
                    <Switch checked={accountSettings.googleFit} onCheckedChange={() => handleToggle("googleFit")} />
                    {accountSettings.googleFit && (
                      <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">
                        Sync
                      </Button>
                    )}
                    </div>
                  </div>

                <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Fitbit</h4>
                    <p className="text-xs text-muted-foreground">Fitbit activity data</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={accountSettings.fitbit} onCheckedChange={() => handleToggle("fitbit")} />
                    {accountSettings.fitbit && (
                      <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">
                        Sync
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Garmin</h4>
                    <p className="text-xs text-muted-foreground">Garmin devices</p>
                    </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={accountSettings.garmin} onCheckedChange={() => handleToggle("garmin")} />
                    {accountSettings.garmin && (
                      <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">
                        Sync
                      </Button>
                    )}
                    </div>
                  </div>
                </div>

              <Button className="bg-teal-600 hover:bg-teal-700" onClick={savePreferences}>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Privacy & Data</h3>
                <p className="text-sm text-muted-foreground">Manage how your data is used and request copies of your information</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                        <path d="M8.5 8.5v.01" />
                        <path d="M16 15.5v.01" />
                        <path d="M12 12v.01" />
                        <path d="M11 17v.01" />
                        <path d="M7 14v.01" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-base">Data Sharing Preferences</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Control how your health data is used to improve our services</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between rounded-md border bg-muted/30 p-4">
                      <div className="flex-1 pr-4">
                        <h5 className="font-medium text-sm mb-1">Share Anonymized Data for Research</h5>
                        <p className="text-xs text-muted-foreground">Help advance medical research by sharing your anonymized health data with approved research institutions. Your personal information will never be shared.</p>
                      </div>
                      <Switch
                        checked={accountSettings.shareAnonymizedData}
                        onCheckedChange={() => handleToggle("shareAnonymizedData")}
                      />
                </div>

                    <div className="flex items-start justify-between rounded-md border bg-muted/30 p-4">
                      <div className="flex-1 pr-4">
                        <h5 className="font-medium text-sm mb-1">Share Usage Analytics</h5>
                        <p className="text-xs text-muted-foreground">Allow us to collect anonymized usage data to improve app performance and user experience. This includes feature usage, navigation patterns, and technical diagnostics.</p>
                      </div>
                      <Switch
                        checked={accountSettings.shareAnalytics}
                        onCheckedChange={() => handleToggle("shareAnalytics")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="rounded-full bg-primary/10 p-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      className="text-primary"
                      >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                    </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">Data Export</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Request a complete copy of your health data</p>
                    </div>
                </div>

                <div className="rounded-md bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      className="text-muted-foreground mt-0.5 flex-shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                      </svg>
                    <div className="flex-1">
                      <p className="text-sm">You can request a copy of all your health data stored in our system. This includes:</p>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                        <li>Personal profile information</li>
                        <li>Health records and medical history</li>
                        <li>Appointments and prescriptions</li>
                        <li>Wearable device data</li>
                        <li>Emergency contacts and medical information</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-3">Your data will be compiled and sent to your registered email address within 24 hours in a secure, downloadable format.</p>
                    </div>
                </div>

                  <Dialog open={dataExportOpen} onOpenChange={setDataExportOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                          className="mr-2"
                      >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                        Request Data Export
                    </Button>
                  </DialogTrigger>
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Data Export</DialogTitle>
                        <DialogDescription>We'll send you a copy of all your health data within 24 hours to your registered email address.</DialogDescription>
                    </DialogHeader>
                      <div className="rounded-md bg-muted p-4 my-4">
                        <p className="text-sm">
                          <strong>Email:</strong> john.smith@email.com
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">The export will be sent to this email address. Make sure you have access to it.</p>
                      </div>
                        <DialogFooter>
                        <Button variant="outline" onClick={() => setDataExportOpen(false)}>
                          Cancel
                          </Button>
                        <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleDataExport}>
                          Confirm Request
                          </Button>
                        </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              </div>

              <Button className="bg-teal-600 hover:bg-teal-700" onClick={savePreferences}>
                <Save className="mr-2 h-4 w-4" />
                Save Privacy Settings
              </Button>
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
