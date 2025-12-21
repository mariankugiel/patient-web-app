"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  UserPlusIcon,
  FileTextIcon,
  ClipboardListIcon,
  PillIcon,
  CalendarIcon,
  MessageSquareIcon,
  UserIcon,
  FileIcon,
  Trash2Icon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RecipientAutocomplete, type Contact as MessageContact } from "@/components/messages/recipient-autocomplete"
import { messagesApiService } from "@/lib/api/messages-api"

type Contact = {
  id: string
  name: string
  email: string
  relationship: string
  type: string
  expires: string
  permissions: {
    medicalHistory: { view: boolean; download: boolean; edit: boolean }
    healthRecords: { view: boolean; download: boolean; edit: boolean }
    healthPlan: { view: boolean; download: boolean; edit: boolean }
    medications: { view: boolean; download: boolean; edit: boolean }
    appointments: { view: boolean; edit: boolean }
    messages: { view: boolean; edit: boolean }
  }
}

interface PermissionsStepOnboardingProps {
  formData: any
  updateFormData: (data: any) => void
}

export function PermissionsStepOnboarding({ formData, updateFormData }: PermissionsStepOnboardingProps) {
  const { t } = useLanguage()
  const [isGrantAccessDialogOpen, setIsGrantAccessDialogOpen] = useState(false)
  const [availableContacts, setAvailableContacts] = useState<MessageContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [selectedMessageContact, setSelectedMessageContact] = useState<MessageContact | null>(null)
  const [contactsSearchQuery, setContactsSearchQuery] = useState("")
  const [expiresDateError, setExpiresDateError] = useState("")

  const [contacts, setContacts] = useState<Contact[]>(formData?.permissions?.contacts || [])

  const [newContact, setNewContact] = useState({
    id: "",
    type: "",
    name: "",
    email: "",
    relationship: "",
    expires: "",
    permissions: {
      medicalHistory: { view: false, download: false, edit: false },
      healthRecords: { view: false, download: false, edit: false },
      healthPlan: { view: false, download: false, edit: false },
      medications: { view: false, download: false, edit: false },
      appointments: { view: false, edit: false },
      messages: { view: false, edit: false },
    },
  })

  const handleSearchContacts = async (query: string) => {
    setContactsSearchQuery(query)
    if (!query.trim()) {
      setAvailableContacts([])
      return
    }

    setLoadingContacts(true)
    try {
      const response = await messagesApiService.searchContacts(query, 0, 10)
      setAvailableContacts(response.contacts || [])
    } catch (error) {
      console.error("Error searching contacts:", error)
      setAvailableContacts([])
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleSelectMessageContact = (contact: MessageContact | null) => {
    setSelectedMessageContact(contact)
    if (contact) {
      setNewContact({
        ...newContact,
        name: contact.name || "",
        email: contact.email || "",
      })
    }
  }

  const handlePermissionChange = (category: string, action: string, checked: boolean) => {
    setNewContact({
      ...newContact,
      permissions: {
        ...newContact.permissions,
        [category]: {
          ...newContact.permissions[category as keyof typeof newContact.permissions],
          [action]: checked,
        },
      },
    })
  }

  const handleAddContact = () => {
    if (!newContact.name.trim()) {
      return
    }

    if (!newContact.expires) {
      setExpiresDateError(t("permissions.expiresRequired") || "Expiration date is required")
      return
    }

    const expiresDate = new Date(newContact.expires)
    if (expiresDate < new Date()) {
      setExpiresDateError(t("permissions.expiresMustBeFuture") || "Expiration date must be in the future")
      return
    }

    const contact: Contact = {
      id: `contact-${Date.now()}`,
      name: newContact.name,
      email: newContact.email,
      relationship: newContact.relationship,
      type: newContact.type,
      expires: newContact.expires,
      permissions: newContact.permissions,
    }

    const updatedContacts = [...contacts, contact]
    setContacts(updatedContacts)
    updateFormData({
      permissions: {
        contacts: updatedContacts,
      },
    })

    // Reset form
    setNewContact({
      id: "",
      type: "",
      name: "",
      email: "",
      relationship: "",
      expires: "",
      permissions: {
        medicalHistory: { view: false, download: false, edit: false },
        healthRecords: { view: false, download: false, edit: false },
        healthPlan: { view: false, download: false, edit: false },
        medications: { view: false, download: false, edit: false },
        appointments: { view: false, edit: false },
        messages: { view: false, edit: false },
      },
    })
    setSelectedMessageContact(null)
    setIsGrantAccessDialogOpen(false)
    setExpiresDateError("")
  }

  const handleRemoveContact = (contactId: string) => {
    const updatedContacts = contacts.filter((c) => c.id !== contactId)
    setContacts(updatedContacts)
    updateFormData({
      permissions: {
        contacts: updatedContacts,
      },
    })
  }

  const filteredContacts = contacts.filter((contact) => {
    if (!contactsSearchQuery) return true
    const query = contactsSearchQuery.toLowerCase()
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.relationship.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("permissions.peopleWithAccess")}</CardTitle>
          <CardDescription>{t("permissions.onboardingDesc") || "Grant access to healthcare providers or family members who need to view your health information."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                type="search"
                placeholder={t("permissions.searchContacts") || "Search contacts..."}
                value={contactsSearchQuery}
                onChange={(e) => setContactsSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={() => setIsGrantAccessDialogOpen(true)}>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              {t("permissions.grantNewAccess")}
            </Button>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <UserPlusIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{t("permissions.noAccessPermissionsYet") || "No Access Permissions Yet"}</h3>
                  <p className="text-muted-foreground max-w-md">
                    {t("permissions.onboardingEmptyState") || "You haven't granted access to anyone yet. Start by granting access to healthcare providers or family members who need to view your health information."}
                  </p>
                </div>
                <Button onClick={() => setIsGrantAccessDialogOpen(true)} className="mt-4">
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  {t("permissions.grantNewAccess")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {contact.email} {contact.relationship ? `• ${contact.relationship}` : ""}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {t("permissions.expires")}: {new Date(contact.expires).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{contact.type}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-medium mb-2">{t("permissions.permissionsLabel")}</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {Object.entries(contact.permissions).map(([category, perms]) => {
                          const categoryName = t(`permissions.${category}`) || category
                          const activePerms: string[] = []
                          if (perms.view) activePerms.push(t("permissions.view") || "View")
                          if (perms.download) activePerms.push(t("permissions.download") || "Download")
                          if (perms.edit) activePerms.push(t("permissions.edit") || "Edit")
                          if (activePerms.length === 0) return null
                          return (
                            <Badge key={category} variant="secondary" className="text-xs">
                              {categoryName}: {activePerms.join(", ")}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant Access Dialog */}
      <Dialog open={isGrantAccessDialogOpen} onOpenChange={setIsGrantAccessDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("permissions.addNewContact")}</DialogTitle>
            <DialogDescription>{t("permissions.addNewContactDesc")}</DialogDescription>
          </DialogHeader>

          {/* Contact Picker from Messages */}
          <div className="space-y-2 py-4 border-b">
            <Label>{t("permissions.selectFromContacts") || "Select from contacts"}</Label>
            <RecipientAutocomplete
              selectedRecipient={selectedMessageContact}
              onSelectRecipient={handleSelectMessageContact}
              onSearch={handleSearchContacts}
              contacts={availableContacts}
              loading={loadingContacts}
              placeholder={t("permissions.searchContacts") || "Search contacts from messages..."}
              hasMore={false}
              onLoadMore={() => {}}
              loadingMore={false}
            />
            <p className="text-xs text-muted-foreground">
              {t("permissions.selectContactOrTypeManually") || "Select a contact or type manually below"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-type">{t("permissions.contactType")}</Label>
              <Select value={newContact.type} onValueChange={(value) => setNewContact({ ...newContact, type: value })}>
                <SelectTrigger id="contact-type">
                  <SelectValue placeholder={t("permissions.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">{t("permissions.doctor")}</SelectItem>
                  <SelectItem value="hospital">{t("permissions.hospital")}</SelectItem>
                  <SelectItem value="family">{t("permissions.familyMember")}</SelectItem>
                  <SelectItem value="caregiver">{t("permissions.caregiver")}</SelectItem>
                  <SelectItem value="insurance">{t("permissions.insuranceProvider")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("profile.fullName")}</Label>
              <Input
                id="name"
                placeholder={t("permissions.enterFullName")}
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("profile.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("permissions.enterEmailAddress")}
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">{t("permissions.relationship")}</Label>
              <Input
                id="relationship"
                placeholder={t("permissions.relationshipPlaceholder")}
                value={newContact.relationship}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">
                {t("permissions.expires")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expires"
                type="date"
                required
                value={newContact.expires}
                onChange={(e) => {
                  setNewContact({ ...newContact, expires: e.target.value })
                  if (expiresDateError) {
                    setExpiresDateError("")
                  }
                }}
                className={expiresDateError ? "border-destructive" : ""}
                min={new Date().toISOString().split('T')[0]}
              />
              {expiresDateError && (
                <p className="text-sm text-destructive">{expiresDateError}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label>{t("permissions.permissionsLabel")}</Label>
            <p className="text-sm text-muted-foreground">{t("permissions.selectPermissionsDesc")}</p>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">{t("permissions.category")}</TableHead>
                    <TableHead className="text-center">
                      <div className="flex flex-col items-center">
                        <UserIcon className="h-4 w-4" />
                        <span className="text-xs">{t("permissions.view")}</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex flex-col items-center">
                        <FileIcon className="h-4 w-4" />
                        <span className="text-xs">{t("permissions.download")}</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex flex-col items-center">
                        <FileTextIcon className="h-4 w-4" />
                        <span className="text-xs">{t("permissions.edit")}</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileTextIcon className="h-4 w-4 mr-2" />
                        {t("permissions.medicalHistory")}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.medicalHistory.view}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("medicalHistory", "view", checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.medicalHistory.edit}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("medicalHistory", "edit", checked as boolean)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <ClipboardListIcon className="h-4 w-4 mr-2" />
                        {t("permissions.healthRecords")}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.healthRecords.view}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("healthRecords", "view", checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.healthRecords.download}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("healthRecords", "download", checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.healthRecords.edit}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("healthRecords", "edit", checked as boolean)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <ClipboardListIcon className="h-4 w-4 mr-2" />
                        {t("permissions.healthPlan")}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.healthPlan.view}
                        onCheckedChange={(checked) => handlePermissionChange("healthPlan", "view", checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.healthPlan.edit}
                        onCheckedChange={(checked) => handlePermissionChange("healthPlan", "edit", checked as boolean)}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <PillIcon className="h-4 w-4 mr-2" />
                        {t("permissions.medications")}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.medications.view}
                        onCheckedChange={(checked) => handlePermissionChange("medications", "view", checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.medications.download}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("medications", "download", checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.medications.edit}
                        onCheckedChange={(checked) => handlePermissionChange("medications", "edit", checked as boolean)}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {t("permissions.appointments")}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.appointments.view}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("appointments", "view", checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.appointments.edit}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("appointments", "edit", checked as boolean)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <MessageSquareIcon className="h-4 w-4 mr-2" />
                        {t("permissions.messages")}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.messages.view}
                        onCheckedChange={(checked) => handlePermissionChange("messages", "view", checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={newContact.permissions.messages.edit}
                        onCheckedChange={(checked) => handlePermissionChange("messages", "edit", checked as boolean)}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrantAccessDialogOpen(false)}>
              {t("action.cancel")}
            </Button>
            <Button onClick={handleAddContact} className="bg-primary hover:bg-primary/90">
              {t("permissions.addContact")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

