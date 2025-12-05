"use client"

import { useEffect, useState, useMemo } from "react"
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
import { toast } from "react-toastify"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { LocationSearch } from "@/components/ui/location-search"
import { countryCodes } from "@/lib/country-codes"
import { timezones } from "@/lib/timezones"
import { Save } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/lib/store"
import { updateUser, fetchProfileSuccess, updateProfile } from "@/lib/features/auth/authSlice"
import { AuthApiService, AuthAPI } from "@/lib/api/auth-api"
import { getProfilePictureUrl } from "@/lib/profile-utils"
import { useSwitchedPatient } from "@/contexts/patient-context"
import { getFirstAccessiblePage } from "@/lib/utils/patient-navigation"
import { useRouter } from "next/navigation"

// Schema will be created inside component to access translations
const createProfileFormSchema = (t: (key: string) => string) => z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  dob: z.string(),
  gender: z.string(),
  height: z.string(),
  weight: z.string(),
  waistDiameter: z.string(),
  bloodType: z.string(),
  email: z.string().email({ message: t("common.pleaseEnterValidEmail") }),
  countryCode: z.string(),
  countryName: z.string().optional(),
  mobileNumber: z.string().min(5, { message: t("common.pleaseEnterValidMobile") }),
  location: z.string().min(5, { message: "Location must be at least 5 characters." }),
  timezone: z.string(),
})

type ProfileFormValues = z.infer<ReturnType<typeof createProfileFormSchema>>

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
  const { patientToken, isViewingOtherPatient, switchedPatientInfo } = useSwitchedPatient()
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const { user } = useSelector((state: RootState) => state.auth)
  const profileFormSchema = useMemo(() => createProfileFormSchema(t), [t])
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues })

  // Redirect away from profile page if viewing another patient
  // This must happen immediately, before any rendering
  useEffect(() => {
    if (isViewingOtherPatient && patientToken) {
      console.log('🚫 Blocking profile page access - redirecting away')
      // Use permissions from switched patient info to redirect to first accessible page
      const permissions = switchedPatientInfo?.permissions || null
      const accessiblePage = getFirstAccessiblePage(permissions, true)
      router.replace(`${accessiblePage}?patientToken=${encodeURIComponent(patientToken)}`)
    }
  }, [isViewingOtherPatient, patientToken, router, switchedPatientInfo])
  
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
  // Always fetch fresh profile data on this page
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
        // Update Redux with fresh profile data
        dispatch(fetchProfileSuccess(profileData))
        
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
            const avatarUrlFromProfile = profileData.avatar_url
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
          const errorMessage = error?.response?.data?.detail || error?.message || t("common.failedToLoadProfile")
          toast.error(errorMessage)
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
      toast.error(t("common.failedToLoadProfile") || "Failed to load profile")
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
      
      toast.success(t("profile.updateSuccessDesc") || "Your profile has been updated successfully.")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.message || t("common.failedToLoadProfile") || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!user?.id) {
      toast.error(t("common.failedToLoadProfile") || "Failed to load profile")
      return
    }

    try {
      // Prepare update data
      const updateData: any = {
        language: selectedLanguage,
        theme: selectedTheme,
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key]
        }
      })

      console.log("💾 Saving preferences to backend:", updateData)

      // Save via backend API
      await AuthApiService.updateProfile(updateData)

      // Update language context IMMEDIATELY before Redux updates
      // This ensures the UI updates right away
      if (selectedLanguage !== language) {
        setLanguage(selectedLanguage as "en" | "es" | "pt")
        // Also save to localStorage immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem("language", selectedLanguage)
        }
      }

      // Update Redux state with new profile data
      dispatch(updateProfile({
        language: selectedLanguage,
        theme: selectedTheme,
      }))

      // Also update user_metadata
      dispatch(updateUser({
        user_metadata: {
          ...user?.user_metadata,
          language: selectedLanguage,
          theme: selectedTheme,
        }
      }))

      // Save theme to localStorage
      localStorage.setItem("theme", selectedTheme)

      console.log("💾 Preferences saved successfully")

      toast.success(t("preferences.savedSuccessfullyDesc") || "Your preferences have been saved successfully.")
    } catch (error: any) {
      console.error("Error updating preferences:", error)
      toast.error(error.message || t("common.failedToLoadProfile") || "Failed to save preferences")
    }
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
                        <FormLabel>{t("profile.firstName")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("profile.placeholderFirstName")} {...field} disabled={isViewingOtherPatient} />
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
                        <FormLabel>{t("profile.lastName")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("profile.placeholderLastName")} {...field} disabled={isViewingOtherPatient} />
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
                        <FormLabel>{t("profile.weight")}</FormLabel>
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
                        <FormLabel>{t("profile.dateOfBirth")}</FormLabel>
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
                        <FormLabel>{t("profile.gender")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewingOtherPatient}>
                          <FormControl>
                            <SelectTrigger className="w-full" disabled={isViewingOtherPatient}>
                              <SelectValue placeholder={t("common.select")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">{t("profile.genderMale")}</SelectItem>
                            <SelectItem value="female">{t("profile.genderFemale")}</SelectItem>
                            <SelectItem value="other">{t("profile.genderOther")}</SelectItem>
                            <SelectItem value="prefer-not-to-say">{t("profile.genderPreferNotToSay")}</SelectItem>
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
                        <FormLabel>{t("profile.waistDiameter")}</FormLabel>
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
                        <FormLabel>{t("profile.bloodType")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewingOtherPatient}>
                          <FormControl>
                            <SelectTrigger className="w-full" disabled={isViewingOtherPatient}>
                              <SelectValue placeholder={t("common.select")} />
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
                        <FormLabel>{t("profile.email")}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder={t("profile.placeholderEmail")} {...field} disabled={isViewingOtherPatient} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label>{t("profile.mobileNumber")}</Label>
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
                              <Input type="tel" placeholder={t("profile.placeholderMobile")} {...field} disabled={isViewingOtherPatient} />
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
                        <FormLabel>{t("profile.location")}</FormLabel>
                        <FormControl>
                          <LocationSearch
                            value={field.value}
                            onChange={(location) => field.onChange(location)}
                            placeholder={t("profile.placeholderLocation")}
                            className={isViewingOtherPatient ? "pointer-events-none opacity-70" : undefined}
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
                        <FormLabel>{t("profile.timeZone")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewingOtherPatient}>
                          <FormControl>
                            <SelectTrigger disabled={isViewingOtherPatient}>
                              <SelectValue placeholder={t("common.selectTimezone")} />
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
                    <Label htmlFor="language">{t("profile.language")}</Label>
                    <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as "en" | "es" | "pt")} disabled={isViewingOtherPatient}>
                      <SelectTrigger id="language" disabled={isViewingOtherPatient}>
                        <SelectValue placeholder={t("common.selectLanguage")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t("profile.english")}</SelectItem>
                        <SelectItem value="es">{t("profile.español")}</SelectItem>
                        <SelectItem value="pt">{t("profile.portuguese")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">{t("profile.theme")}</Label>
                    <Select value={selectedTheme} onValueChange={(value: any) => setSelectedTheme(value)} disabled={isViewingOtherPatient}>
                      <SelectTrigger id="theme" disabled={isViewingOtherPatient}>
                        <SelectValue placeholder={t("common.selectTheme")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t("profile.light")}</SelectItem>
                        <SelectItem value="dark">{t("profile.dark")}</SelectItem>
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
