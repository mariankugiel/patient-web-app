"use client"

import * as z from "zod"
import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { countryCodes } from "@/lib/country-codes"

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
  const { toast } = useToast()

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: 1, name: "Jane Smith", relationship: "Wife", countryCode: "+1", phone: "5559876543", email: "jane.smith@email.com" },
    { id: 2, name: "Robert Smith", relationship: "Brother", countryCode: "+1", phone: "5554567890", email: "robert.smith@email.com" },
  ])
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
      allergies: "Penicillin, Peanuts",
      pregnancy: "no",
      medications: "Lisinopril 10mg daily, Metformin 500mg twice daily",
      healthProblems: "Type 2 Diabetes, Hypertension",
      organDonor: true,
    },
  })

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
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id))
    toast({ title: "Contact removed", description: "Emergency contact has been removed successfully.", duration: 3000 })
  }

  const onSubmitEmergencyContact = (data: EmergencyContactFormValues) => {
    if (editingContactId) {
      setEmergencyContacts((prev) => prev.map((c) => (c.id === editingContactId ? { ...c, ...data, email: data.email || "" } : c)))
      toast({ title: "Contact updated", description: "Emergency contact has been updated successfully.", duration: 3000 })
    } else {
      const newContact: EmergencyContact = { id: Math.max(...emergencyContacts.map((c) => c.id), 0) + 1, ...data, email: data.email || "" }
      setEmergencyContacts((prev) => [...prev, newContact])
      toast({ title: "Contact added", description: "Emergency contact has been added successfully.", duration: 3000 })
    }
    setEmergencyContactDialogOpen(false)
  }

  const onSubmitEmergencyInfo = (data: EmergencyInfoFormValues) => {
    console.log(data)
    toast({ title: "Emergency information updated", description: "Your emergency information has been saved successfully.", duration: 3000 })
  }

  const handleMobileSync = (platform: "ios" | "android") => {
    toast({ title: "Syncing to mobile", description: `Your emergency information is being synced to your ${platform === "ios" ? "iOS" : "Android"} device.`, duration: 3000 })
    setMobileSyncDialogOpen(false)
  }

  return (
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
              <DialogTitle>{editingContactId ? "Edit Emergency Contact" : "Add Emergency Contact"}</DialogTitle>
              <DialogDescription>
                {editingContactId ? "Update the emergency contact information." : "Add a new emergency contact who can be reached in case of emergency."}
              </DialogDescription>
            </DialogHeader>
            <Form {...emergencyContactForm}>
              <form onSubmit={emergencyContactForm.handleSubmit(onSubmitEmergencyContact)} className="space-y-4">
                <FormField control={emergencyContactForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={emergencyContactForm.control} name="relationship" render={({ field }) => (
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
                )} />

                <div>
                  <Label>Mobile Phone</Label>
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
                          <Input type="tel" placeholder="555 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <FormField control={emergencyContactForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

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
                      <FormLabel className="text-sm font-medium">Allergies</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List any allergies (medications, food, etc.)" className="resize-none text-sm" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={emergencyInfoForm.control} name="medications" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Current Medications</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List current medications and dosages" className="resize-none text-sm" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-3">
                  <FormField control={emergencyInfoForm.control} name="healthProblems" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Health Problems</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List chronic conditions or health issues" className="resize-none text-sm" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={emergencyInfoForm.control} name="pregnancy" render={({ field }) => (
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
                    )} />

                    <FormField control={emergencyInfoForm.control} name="organDonor" render={({ field }) => (
                      <FormItem className="flex flex-col justify-end">
                        <FormLabel className="text-sm font-medium mb-2">Organ Donor</FormLabel>
                        <div className="flex items-center justify-between rounded-md border px-3 h-9">
                          <span className="text-sm">Willing to donate</span>
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
                Save Emergency Information
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  )
}


