"use client"

import { useEffect, useState } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LocationSearch } from "@/components/ui/location-search"
import { countryCodes } from "@/lib/country-codes"
import { timezones } from "@/lib/timezones"
import { Save } from "lucide-react"

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  dob: z.string(),
  gender: z.string(),
  height: z.string(),
  weight: z.string(),
  waistDiameter: z.string(),
  bloodType: z.string(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  countryCode: z.string(),
  countryName: z.string().optional(),
  mobileNumber: z.string().min(5, { message: "Please enter a valid mobile number." }),
  location: z.string().min(5, { message: "Location must be at least 5 characters." }),
  timezone: z.string(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const defaultValues: Partial<ProfileFormValues> = {
  firstName: "John",
  lastName: "Smith",
  dob: "1985-04-12",
  gender: "male",
  height: "178",
  weight: "80",
  waistDiameter: "90",
  bloodType: "O+",
  email: "john.smith@email.com",
  countryCode: "+1",
  countryName: "United States",
  mobileNumber: "5551234567",
  location: "San Francisco, CA",
  timezone: "America/Los_Angeles",
}

export default function ProfileTabPage() {
  const { t, language, setLanguage } = useLanguage()
  const { toast } = useToast()
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light")
  const [profileImage, setProfileImage] = useState<string | null>(null)

  useEffect(() => {
    if (selectedTheme === "dark") document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [selectedTheme])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setSelectedTheme(savedTheme)
  }, [])

  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues })

  function onSubmit(data: ProfileFormValues) {
    console.log(data)
    toast({
      title: t("profile.updateSuccess") || "Profile updated",
      description: t("profile.updateSuccessDesc") || "Your profile has been updated successfully.",
      duration: 3000,
    })
  }

  const savePreferences = () => {
    if (selectedLanguage !== language) setLanguage(selectedLanguage as "en" | "es" | "pt")
    localStorage.setItem("theme", selectedTheme)
    toast({
      title: t("preferences.savedSuccessfully") || "Preferences saved",
      description: t("preferences.savedSuccessfullyDesc") || "Your preferences have been saved successfully.",
      duration: 3000,
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-64 flex justify-center lg:justify-start order-first">
                <div className="sticky top-6">
                  <div className="relative">
                    <Avatar className="h-28 w-28 border">
                      {profileImage ? (<AvatarImage src={profileImage} alt="Profile" />) : null}
                      <AvatarFallback>
                        {(() => {
                          const f = form.watch("firstName") || ""
                          const l = form.watch("lastName") || ""
                          const initials = `${f[0] || ""}${l[0] || ""}`.toUpperCase() || "?"
                          return initials
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow ring-1 ring-black/5 flex items-center justify-center cursor-pointer"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => {
                            if (typeof reader.result === "string") setProfileImage(reader.result)
                          }
                          reader.readAsDataURL(file)
                        }}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-6 order-last">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="number" placeholder="178" {...field} className="pr-10 w-full" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">cm</span>
                          </div>
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
                        <FormLabel>Weight</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="number" placeholder="80" {...field} className="pr-10 w-full" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                          </div>
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
                    name="waistDiameter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waist Diameter</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="number" placeholder="90" {...field} className="pr-10 w-full" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">cm</span>
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
                                        (c) => c.code === field.value && c.country === form.getValues("countryName"),
                                      )
                                      return selectedCountry ? `${selectedCountry.flag} ${selectedCountry.code}` : "Code"
                                    })()}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                {countryCodes.map((country) => (
                                  <SelectItem key={`${country.code}-${country.country}`} value={`${country.code}|${country.country}`}>
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
                          <LocationSearch value={field.value} onChange={(location) => field.onChange(location)} placeholder="City, State/Country" />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

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

                <Button type="submit" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700">
                  <Save className="mr-2 h-4 w-4" />
                  {t("profile.updateProfile")}
                </Button>
              </div>

              
            </div>
          </form>
        </Form>

        <div className="sr-only">
          <Button onClick={savePreferences} aria-hidden>
            hidden-save-preferences
          </Button>
    </div>
      </CardContent>
    </Card>
  )
}
