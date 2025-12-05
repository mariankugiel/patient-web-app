"use client"

import * as z from "zod"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Plus, Save, Smartphone, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "react-toastify"
import { useLanguage } from "@/contexts/language-context"
import { countryCodes } from "@/lib/country-codes"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { AuthApiService } from "@/lib/api/auth-api"

type EmergencyContact = { id: number; name: string; relationship: string; countryCode: string; phone: string; email: string }

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

export default function EmergencyTabPage() {
  const { t } = useLanguage()
  const user = useSelector((state: RootState) => state.auth.user)
  const [isLoading, setIsLoading] = useState(false)

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [emergencyContactDialogOpen, setEmergencyContactDialogOpen] = useState(false)
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [mobileSyncDialogOpen, setMobileSyncDialogOpen] = useState(false)

  const emergencyContactForm = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: { name: "", relationship: "", countryCode: "+1", phone: "", email: "" },
  })

  const emergencyInfoForm = useForm<EmergencyInfoFormValues>({
    resolver: zodResolver(emergencyInfoSchema),
    defaultValues: {
      allergies: "",
      pregnancy: "",
      medications: "",
      healthProblems: "",
      organDonor: false,
    },
  })

  // Load emergency data on mount
  useEffect(() => {
    const loadEmergency = async () => {
      if (!user?.id) return
      
      try {
        const emergencyData = await AuthApiService.getEmergency()
        console.log("📦 Emergency data loaded:", emergencyData)
        
        // Load contacts
        if (emergencyData.contacts && emergencyData.contacts.length > 0) {
          const contactsWithIds = emergencyData.contacts.map((contact: any, index: number) => {
            // Parse phone number: if it starts with +, extract country code
            let countryCode = "+1"
            let phone = contact.phone || ""
            
            if (phone && phone.startsWith("+")) {
              // Try to extract country code (assumes 1-3 digits after +)
              const match = phone.match(/^\+(\d{1,3})/)
              if (match) {
                countryCode = `+${match[1]}`
                phone = phone.substring(countryCode.length)
              }
            }
            
            return {
              id: index + 1,
              name: contact.name,
              relationship: contact.relationship,
              countryCode: countryCode,
              phone: phone,
              email: contact.email,
            }
          })
          setEmergencyContacts(contactsWithIds)
        }
        
        // Load emergency info form
        emergencyInfoForm.reset({
          allergies: emergencyData.allergies || "",
          pregnancy: emergencyData.pregnancy_status || "",
          medications: emergencyData.medications || "",
          healthProblems: emergencyData.health_problems || "",
          organDonor: emergencyData.organ_donor || false,
        })
      } catch (error) {
        console.error("Error loading emergency data:", error)
      }
    }
    
    loadEmergency()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleAddContact = () => {
    setEditingContactId(null)
    emergencyContactForm.reset({ name: "", relationship: "", countryCode: "+1", phone: "", email: "" })
    setEmergencyContactDialogOpen(true)
  }

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContactId(contact.id)
    emergencyContactForm.reset({ name: contact.name, relationship: contact.relationship, countryCode: contact.countryCode, phone: contact.phone, email: contact.email })
    setEmergencyContactDialogOpen(true)
  }

  const handleRemoveContact = (id: number) => {
    const updatedContacts = emergencyContacts.filter((c) => c.id !== id)
    setEmergencyContacts(updatedContacts)
    // Auto-save after removal
    saveEmergency(updatedContacts)
  }

  const saveEmergency = async (contacts?: EmergencyContact[]) => {
    if (!user?.id) return
    
    const contactsToSave = contacts || emergencyContacts
    
    console.log("💾 Saving emergency contacts:", contactsToSave.length, contactsToSave)
    
    setIsLoading(true)
    try {
      await AuthApiService.updateEmergency({
        contacts: contactsToSave.map(c => ({
          name: c.name,
          relationship: c.relationship,
          phone: `${c.countryCode}${c.phone}`,
          email: c.email,
        })),
      })
      console.log("✅ Emergency contacts saved successfully")
      toast.success(t("profile.updateSuccessDesc") || "Your emergency contacts have been saved successfully.")
    } catch (error: any) {
      console.error("❌ Error saving emergency:", error)
      toast.error(error.message || "An unexpected error occurred while saving emergency contacts.")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitEmergencyContact = (data: EmergencyContactFormValues) => {
    let updatedContacts: EmergencyContact[]
    
    if (editingContactId) {
      updatedContacts = emergencyContacts.map((c) => (c.id === editingContactId ? { ...c, ...data, email: data.email || "" } : c))
      setEmergencyContacts(updatedContacts)
    } else {
      const newContact: EmergencyContact = { id: Math.max(...(emergencyContacts.length > 0 ? emergencyContacts.map((c) => c.id) : [0]), 0) + 1, ...data, email: data.email || "" }
      updatedContacts = [...emergencyContacts, newContact]
      setEmergencyContacts(updatedContacts)
    }
    setEmergencyContactDialogOpen(false)
    // Auto-save after add/edit with the updated contacts
    saveEmergency(updatedContacts)
  }

  const onSubmitEmergencyInfo = async (data: EmergencyInfoFormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to update your emergency information.")
      return
    }
    
    setIsLoading(true)
    
    try {
      await AuthApiService.updateEmergency({
        allergies: data.allergies || undefined,
        medications: data.medications || undefined,
        pregnancy_status: data.pregnancy || undefined,
        health_problems: data.healthProblems || undefined,
        organ_donor: data.organDonor,
      })
      
      console.log("💾 Emergency info saved")
      
      toast.success(t("profile.updateSuccessDesc") || "Your emergency information has been saved successfully.")
    } catch (error: any) {
      console.error("Error updating emergency info:", error)
      toast.error(error.message || "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMobileSync = (platform: "ios" | "android") => {
    toast.info(`Your emergency information is being synced to your ${platform === "ios" ? "iOS" : "Android"} device.`)
    setMobileSyncDialogOpen(false)
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-semibold">{t("profile.emergencyContacts")}</h3>
            <p className="text-xs text-muted-foreground">{t("profile.emergencyContactsDesc")}</p>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto h-9" onClick={handleAddContact}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            {t("profile.addContact")}
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
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted" onClick={() => handleEditContact(contact)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRemoveContact(contact.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{contact.countryCode} {contact.phone}</p>
                {contact.email && <p className="text-xs text-muted-foreground truncate">{contact.email}</p>}
              </div>
            </div>
          ))}
        </div>

        <Dialog open={emergencyContactDialogOpen} onOpenChange={setEmergencyContactDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingContactId ? t("profile.editEmergencyContact") : t("profile.addEmergencyContact")}</DialogTitle>
              <DialogDescription>
                {editingContactId ? t("profile.editContactDesc") : t("profile.addContactDesc")}
              </DialogDescription>
            </DialogHeader>
            <Form {...emergencyContactForm}>
              <form onSubmit={emergencyContactForm.handleSubmit(onSubmitEmergencyContact)} className="space-y-4">
                <FormField control={emergencyContactForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.contactName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("profile.placeholderFullName")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={emergencyContactForm.control} name="relationship" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.relationship")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("profile.selectRelationship")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Spouse/Partner">{t("profile.relationshipSpouse")}</SelectItem>
                        <SelectItem value="Parent">{t("profile.relationshipParent")}</SelectItem>
                        <SelectItem value="Sibling">{t("profile.relationshipSibling")}</SelectItem>
                        <SelectItem value="Child">{t("profile.relationshipChild")}</SelectItem>
                        <SelectItem value="Friend">{t("profile.relationshipFriend")}</SelectItem>
                        <SelectItem value="Other">{t("profile.relationshipOther")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div>
                  <Label>{t("profile.mobilePhone")}</Label>
                  <div className="flex gap-2 mt-2">
                    <FormField control={emergencyContactForm.control} name="countryCode" render={({ field }) => (
                      <FormItem className="w-40">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue>
                                {(() => {
                                  const selectedCountry = countryCodes.find((c) => c.code === field.value)
                                  return selectedCountry ? `${selectedCountry.flag} ${selectedCountry.code}` : "Code"
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
                    )} />
                    <FormField control={emergencyContactForm.control} name="phone" render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="tel" placeholder={t("profile.placeholderMobile")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <FormField control={emergencyContactForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.emailOptional")}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t("profile.placeholderEmail")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEmergencyContactDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                    {editingContactId ? t("profile.updateContact") : t("profile.addContact")}
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
              <h3 className="text-base font-semibold">{t("profile.emergencyMedicalInfo")}</h3>
              <p className="text-xs text-muted-foreground">{t("profile.emergencyMedicalInfoDesc")}</p>
            </div>
            <Dialog open={mobileSyncDialogOpen} onOpenChange={setMobileSyncDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto h-9 bg-transparent">
                  <Smartphone className="mr-2 h-3.5 w-3.5" />
                  {t("profile.syncToMobile")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("profile.syncToMobileDevice")}</DialogTitle>
                  <DialogDescription>{t("profile.syncToMobileDesc")}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <Button variant="outline" className="h-20 flex items-center justify-center bg-transparent" onClick={() => handleMobileSync("ios")}>
                    <span className="font-medium text-base">iOS</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex items-center justify-center bg-transparent" onClick={() => handleMobileSync("android")}>
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
                  <FormField control={emergencyInfoForm.control} name="allergies" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{t("profile.allergies")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("profile.placeholderAllergies")} className="resize-none text-sm" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={emergencyInfoForm.control} name="medications" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{t("profile.currentMedications")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("profile.placeholderMedications")} className="resize-none text-sm" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-3">
                  <FormField control={emergencyInfoForm.control} name="healthProblems" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{t("profile.healthProblems")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("profile.placeholderHealthProblems")} className="resize-none text-sm" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={emergencyInfoForm.control} name="pregnancy" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("profile.pregnancyStatus")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder={t("profile.selectStatus")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no">{t("profile.pregnancyNotPregnant")}</SelectItem>
                            <SelectItem value="yes">{t("profile.pregnancyPregnant")}</SelectItem>
                            <SelectItem value="unknown">{t("profile.pregnancyUnknown")}</SelectItem>
                            <SelectItem value="na">{t("profile.pregnancyNotApplicable")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={emergencyInfoForm.control} name="organDonor" render={({ field }) => (
                      <FormItem className="flex flex-col justify-end">
                        <FormLabel className="text-sm font-medium mb-2">{t("profile.organDonor")}</FormLabel>
                        <div className="flex items-center justify-between rounded-md border px-3 h-9">
                          <span className="text-sm">{t("profile.willingToDonate")}</span>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </div>
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 h-9">
                <Save className="mr-2 h-3.5 w-3.5" />
                {t("profile.saveEmergencyInfo")}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  )
}


