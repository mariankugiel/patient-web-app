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
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { LocationSearch } from "@/components/ui/location-search"
import { countryCodes } from "@/lib/country-codes"
import { TimezoneSelector } from "@/components/ui/timezone-selector"
import { Save } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/lib/store"
import { updateUser } from "@/lib/features/auth/authSlice"
import { AuthApiService, AuthAPI } from "@/lib/api/auth-api"
import { getProfilePictureUrl } from "@/lib/profile-utils"
import { usePatientContext } from "@/hooks/use-patient-context"
import { useSwitchedPatient } from "@/contexts/patient-context"
import { getFirstAccessiblePage } from "@/lib/utils/patient-navigation"
import { useRouter } from "next/navigation"

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
  const dispatch = useDispatch()
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const { toast } = useToast()
  const { patientId, isViewingOtherPatient } = usePatientContext()
  const { switchedPatientInfo } = useSwitchedPatient()
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const { user } = useSelector((state: RootState) => state.auth)
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues })

  // Redirect away from profile page if viewing another patient
  // This must happen immediately, before any rendering
  useEffect(() => {
    if (isViewingOtherPatient && patientId) {
      console.log('🚫 Blocking profile page access - redirecting away')
      // Use permissions from switched patient info to redirect to first accessible page
      const permissions = switchedPatientInfo?.permissions || null
      const accessiblePage = getFirstAccessiblePage(permissions, true)
      router.replace(`${accessiblePage}?patientId=${patientId}`)
    }
  }, [isViewingOtherPatient, patientId, router, switchedPatientInfo])
  
  // Don't render anything if viewing another patient (redirect will happen)
  if (isViewingOtherPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Redirecting...</span>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (selectedTheme === "dark") document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [selectedTheme])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setSelectedTheme(savedTheme)
      console.log("🎨 Loaded theme from localStorage:", savedTheme)
    }
  }, [])

  // Load user profile data (only for current user, not when viewing another patient)
  useEffect(() => {
    const loadProfile = async () => {
      // Don't load profile if viewing another patient (should have been redirected)
      if (isViewingOtherPatient) {
        setIsProfileLoading(false)
        return
      }
      
      console.log("🔍 loadProfile called, user:", user)
      
      if (!user?.id) {
        console.log("⏭️ Skipping profile load - no user ID")
        setIsProfileLoading(false)
        return
      }
      
      setIsProfileLoading(true)
      try {
        console.log("📥 Calling AuthApiService.getProfile()...")
        const profileData = await AuthApiService.getProfile()
        console.log("📦 Profile data received:", profileData)
        
        // Always populate the form with data, even if some fields are null/empty
        if (profileData) {
          console.log("📦 Loading profile data from Supabase:", profileData)
          
          // Split full_name into first and last name if needed
          let firstName = ""
          let lastName = ""
          if (profileData.full_name) {
            const nameParts = profileData.full_name.split(' ')
            firstName = nameParts[0] || ""
            lastName = nameParts.slice(1).join(' ') || ""
          }
          
          // Find country name from country code
          const countryCode = profileData.phone_country_code || "+1"
          const matchingCountry = countryCodes.find(c => c.code === countryCode)
          const countryName = matchingCountry ? matchingCountry.country : ""
          
          // Populate form with existing data (using empty strings for null/undefined values)
          form.reset({
            firstName: firstName || "",
            lastName: lastName || "",
            dob: profileData.date_of_birth || "",
            gender: profileData.gender || "",
            height: profileData.height ? String(profileData.height) : "",
            weight: profileData.weight ? String(profileData.weight) : "",
            waistDiameter: profileData.waist_diameter ? String(profileData.waist_diameter) : "",
            bloodType: profileData.blood_type || "",
            email: profileData.email || user?.email || "",
            countryCode: countryCode,
            countryName: countryName,
            mobileNumber: profileData.phone_number || "",
            location: profileData.address || "",
            timezone: profileData.timezone || "America/Los_Angeles",
          })
          
          // Load theme and language from profile data
          if (profileData.theme) {
            setSelectedTheme(profileData.theme as "light" | "dark")
            console.log("🎨 Loaded theme from profile:", profileData.theme)
          }
          if (profileData.language) {
            setSelectedLanguage(profileData.language as "en" | "es" | "pt")
            console.log("🌐 Loaded language from profile:", profileData.language)
          }
          if (profileData.timezone) {
            console.log("🌍 Loaded timezone from profile:", profileData.timezone)
          }
          
          // Load profile picture from Supabase Storage
          try {
            // Use avatar from profile data if available
            const avatarUrlFromProfile = profileData.img_url || profileData.avatar_url
            let avatarUrl = avatarUrlFromProfile
            
            // If no avatar in profile data, try to get from storage
            if (!avatarUrl || !avatarUrl.startsWith('http')) {
              avatarUrl = await getProfilePictureUrl(user.id)
            }
            
            if (avatarUrl && avatarUrl.startsWith('http')) {
              // Add cache-busting timestamp to force reload
              const urlWithCacheBust = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
              setProfileImage(urlWithCacheBust)
              console.log("✅ Loaded profile picture:", urlWithCacheBust)
            } else {
              console.log("⚠️ Invalid avatar URL, using placeholder:", avatarUrl)
              setProfileImage("/placeholder-user.jpg")
            }
          } catch (error) {
            console.log("⚠️ Error loading profile picture, using placeholder:", error)
            setProfileImage("/placeholder-user.jpg")
          }
          
          console.log("✅ Profile form populated successfully")
        } else {
          console.log("⚠️ No profile data returned from API")
        }
      } catch (error: any) {
        // Check if this is a connection error (backend unavailable)
        const isConnectionError = error?.code === 'ECONNABORTED' || 
                                  error?.code === 'ERR_NETWORK' ||
                                  error?.code === 'ECONNRESET' ||
                                  error?.code === 'ECONNREFUSED' ||
                                  error?.message?.includes('Connection failed') ||
                                  error?.message?.includes('timeout') ||
                                  error?.message?.includes('connection closed')
        
        if (isConnectionError) {
          // Silently handle connection errors - don't show toast
          // The form will remain empty and user can try again later
          console.warn("⚠️ Backend unavailable - profile data not loaded")
        } else {
          // Only log and show toast for non-connection errors
          console.error("❌ Error loading profile:", error)
          const errorMessage = error?.response?.data?.detail || error?.message || "Failed to load profile"
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        setIsProfileLoading(false)
      }
    }
    
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function onSubmit(data: ProfileFormValues) {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Prepare update data matching the API schema
      const updateData: any = {
        email: data.email || undefined,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        date_of_birth: data.dob || undefined,
        gender: data.gender || undefined,
        height: data.height ? data.height : undefined,
        weight: data.weight ? data.weight : undefined,
        waist_diameter: data.waistDiameter ? data.waistDiameter : undefined,
        blood_type: data.bloodType || undefined,
        phone_country_code: data.countryCode || undefined,
        phone_number: data.mobileNumber || undefined,
        address: data.location || undefined,
        timezone: data.timezone || undefined,
        theme: selectedTheme || undefined,
        language: selectedLanguage || undefined,
      }
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key]
        }
      })
      
      console.log("💾 Saving profile data to Supabase:", updateData)
      
      // Save via backend API
      await AuthApiService.updateProfile(updateData)
      
      // Update language context if changed
      if (selectedLanguage !== language) setLanguage(selectedLanguage as "en" | "es" | "pt")
      
      // Update Redux state with new profile data (including theme)
      dispatch(updateUser({
        user_metadata: {
          ...user?.user_metadata,
          ...updateData
        }
      }))
      
      console.log("💾 Saved all profile data including preferences")
      
      toast({
        title: t("profile.updateSuccess") || "Profile updated",
        description: t("profile.updateSuccessDesc") || "Your profile has been updated successfully.",
        duration: 3000,
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while updating your profile.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
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
        {isViewingOtherPatient && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You are viewing another patient's profile. This is a read-only view.
            </p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-64 flex justify-center lg:justify-start order-first">
                <div className="sticky top-6">
                  {user?.id && !isViewingOtherPatient && (
                    <ProfilePictureUpload 
                      currentImage={profileImage || "/placeholder-user.jpg"} 
                      onImageChange={setProfileImage}
                      userId={user.id}
                    />
                  )}
                  {isViewingOtherPatient && (
                    <Avatar className="h-40 w-40">
                      <AvatarImage src={profileImage || "/placeholder-user.jpg"} />
                      <AvatarFallback className="text-2xl">
                        {form.getValues("firstName")?.[0]}{form.getValues("lastName")?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
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
                          <Input placeholder="Your first name" {...field} disabled={isViewingOtherPatient} />
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
                          <Input placeholder="Your last name" {...field} disabled={isViewingOtherPatient} />
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
                            <Input type="number" placeholder="178" {...field} className="pr-10 w-full" disabled={isViewingOtherPatient} />
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
                            <Input type="number" placeholder="80" {...field} className="pr-10 w-full" disabled={isViewingOtherPatient} />
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
                          <Input type="date" {...field} className="w-full" disabled={isViewingOtherPatient} />
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewingOtherPatient}>
                          <FormControl>
                            <SelectTrigger className="w-full" disabled={isViewingOtherPatient}>
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
                            <Input type="number" placeholder="90" {...field} className="pr-10 w-full" disabled={isViewingOtherPatient} />
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewingOtherPatient}>
                          <FormControl>
                            <SelectTrigger className="w-full" disabled={isViewingOtherPatient}>
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
                          <Input type="email" placeholder="your.email@example.com" {...field} disabled={isViewingOtherPatient} />
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
                              disabled={isViewingOtherPatient}
                            >
                              <FormControl>
                                <SelectTrigger disabled={isViewingOtherPatient}>
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
                              <Input type="tel" placeholder="555 123 4567" {...field} disabled={isViewingOtherPatient} />
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
                          <LocationSearch value={field.value} onChange={(location) => field.onChange(location)} placeholder="City, State/Country" disabled={isViewingOtherPatient} />
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
<<<<<<< HEAD
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewingOtherPatient}>
                          <FormControl>
                            <SelectTrigger disabled={isViewingOtherPatient}>
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
=======
                        <FormControl>
                          <TimezoneSelector
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select timezone"
                          />
                        </FormControl>
>>>>>>> 6b1b77db7f1e53555d3b061ddff801fd9c3437ff
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as "en" | "es" | "pt")} disabled={isViewingOtherPatient}>
                      <SelectTrigger id="language" disabled={isViewingOtherPatient}>
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
                    <Select value={selectedTheme} onValueChange={(value: any) => setSelectedTheme(value)} disabled={isViewingOtherPatient}>
                      <SelectTrigger id="theme" disabled={isViewingOtherPatient}>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!isViewingOtherPatient && (
                  <Button type="submit" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Saving..." : t("profile.updateProfile")}
                  </Button>
                )}
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
