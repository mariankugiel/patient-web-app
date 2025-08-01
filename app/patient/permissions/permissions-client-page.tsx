"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  InfoIcon,
  UserIcon,
  ClockIcon,
  ShieldIcon,
  CheckIcon,
  XIcon,
  SearchIcon,
  FileTextIcon,
  ClipboardListIcon,
  CalendarIcon,
  MessageSquareIcon,
  PillIcon,
  FileIcon,
  UsersIcon,
  UserPlusIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Import the useLanguage hook at the top of the file, near other hooks
import { useLanguage } from "@/contexts/language-context"

type Contact = {
  id: string
  name: string
  role: string
  type: "professional" | "personal"
  accessLevel: string
  status: "Active" | "Pending" | "Revoked"
  lastAccessed: string
  expires: string
  email?: string
  relationship?: string
  permissions?: {
    medicalHistory: { view: boolean; download: boolean; edit: boolean }
    healthRecords: { view: boolean; download: boolean; edit: boolean }
    healthPlan: { view: boolean; download: boolean; edit: boolean }
    medications: { view: boolean; download: boolean; edit: boolean }
    appointments: { view: boolean; edit: boolean }
    messages: { view: boolean; edit: boolean }
  }
}

// Update the PermissionsClientPage function to use the useLanguage hook
export default function PermissionsClientPage() {
  // Add this line at the beginning of the function, with other useState declarations
  const { t } = useLanguage()

  const [permissions, setPermissions] = useState({
    shareHealthData: true,
    shareWithProviders: true,
    shareWithResearchers: false,
    shareWithInsurance: true,
    receiveNotifications: true,
    receiveMarketing: false,
    allowLocationTracking: false,
    allowDataAnalytics: true,
  })

  const [isGrantAccessDialogOpen, setIsGrantAccessDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactFilter, setContactFilter] = useState<"all" | "professional" | "personal">("all")

  const [newContact, setNewContact] = useState({
    id: "",
    type: "",
    name: "",
    email: "",
    relationship: "",
    permissions: {
      medicalHistory: { view: false, download: false, edit: false },
      healthRecords: { view: false, download: false, edit: false },
      healthPlan: { view: false, download: false, edit: false },
      medications: { view: false, download: false, edit: false },
      appointments: { view: false, edit: false },
      messages: { view: false, edit: false },
    },
  })

  const handleToggle = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handlePermissionChange = (category: string, action: string, checked: boolean) => {
    if (isManageDialogOpen && selectedContact) {
      setSelectedContact((prev) => {
        if (!prev || !prev.permissions) return prev
        return {
          ...prev,
          permissions: {
            ...prev.permissions,
            [category]: {
              ...prev.permissions[category as keyof typeof prev.permissions],
              [action]: checked,
            },
          },
        }
      })
    } else {
      setNewContact((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [category]: {
            ...prev.permissions[category as keyof typeof prev.permissions],
            [action]: checked,
          },
        },
      }))
    }
  }

  const handleAddContact = () => {
    // Here you would typically send the data to your backend
    console.log("Adding new contact:", newContact)

    // Add the contact to the sharedAccessData array
    const newId = `contact-${Date.now()}`
    const contactType = newContact.type === "doctor" || newContact.type === "hospital" ? "professional" : "personal"

    const newContactData: Contact = {
      id: newId,
      name: newContact.name,
      role:
        newContact.type === "doctor"
          ? "Doctor"
          : newContact.type === "hospital"
            ? "Healthcare Facility"
            : newContact.type === "family"
              ? "Family Member"
              : newContact.type === "caregiver"
                ? "Caregiver"
                : newContact.type === "insurance"
                  ? "Insurance Provider"
                  : "Contact",
      type: contactType,
      accessLevel: "Limited",
      status: "Active",
      lastAccessed: "Never",
      expires: "Dec 31, 2024",
      email: newContact.email,
      relationship: newContact.relationship,
      permissions: newContact.permissions,
    }

    setSharedAccessData([...sharedAccessData, newContactData])
    setIsGrantAccessDialogOpen(false)

    // Reset form
    setNewContact({
      id: "",
      type: "",
      name: "",
      email: "",
      relationship: "",
      permissions: {
        medicalHistory: { view: false, download: false, edit: false },
        healthRecords: { view: false, download: false, edit: false },
        healthPlan: { view: false, download: false, edit: false },
        medications: { view: false, download: false, edit: false },
        appointments: { view: false, edit: false },
        messages: { view: false, edit: false },
      },
    })
  }

  const handleManageContact = (contact: Contact) => {
    setSelectedContact(contact)
    setIsManageDialogOpen(true)
  }

  const handleUpdateContact = () => {
    if (!selectedContact) return

    // Update the contact in the sharedAccessData array
    const updatedData = sharedAccessData.map((contact) =>
      contact.id === selectedContact.id ? selectedContact : contact,
    )

    setSharedAccessData(updatedData)
    setIsManageDialogOpen(false)
    setSelectedContact(null)
  }

  const handleRevokePrompt = (contact: Contact) => {
    setSelectedContact(contact)
    setIsRevokeDialogOpen(true)
  }

  const handleRevokeAccess = () => {
    if (!selectedContact) return

    // Update the contact status to Revoked
    const updatedData = sharedAccessData.map((contact) =>
      contact.id === selectedContact.id ? { ...contact, status: "Revoked" } : contact,
    )

    setSharedAccessData(updatedData)
    setIsRevokeDialogOpen(false)
    setSelectedContact(null)
  }

  const [sharedAccessData, setSharedAccessData] = useState<Contact[]>([
    {
      id: "contact-1",
      name: "Dr. Sarah Johnson",
      role: "Cardiologist",
      type: "professional",
      accessLevel: "Full Access",
      status: "Active",
      lastAccessed: "Today, 10:30 AM",
      expires: "Dec 31, 2023",
      permissions: {
        medicalHistory: { view: true, download: true, edit: true },
        healthRecords: { view: true, download: true, edit: true },
        healthPlan: { view: true, download: true, edit: false },
        medications: { view: true, download: true, edit: true },
        appointments: { view: true, edit: true },
        messages: { view: true, edit: true },
      },
    },
    {
      id: "contact-2",
      name: "Dr. Michael Chen",
      role: "Primary Care",
      type: "professional",
      accessLevel: "Limited",
      status: "Active",
      lastAccessed: "Yesterday",
      expires: "Jan 15, 2024",
      permissions: {
        medicalHistory: { view: true, download: true, edit: false },
        healthRecords: { view: true, download: true, edit: false },
        healthPlan: { view: true, download: false, edit: false },
        medications: { view: true, download: true, edit: true },
        appointments: { view: true, edit: true },
        messages: { view: true, edit: true },
      },
    },
    {
      id: "contact-3",
      name: "Dr. Emily Rodriguez",
      role: "Endocrinologist",
      type: "professional",
      accessLevel: "Limited",
      status: "Pending",
      lastAccessed: "Never",
      expires: "Feb 28, 2024",
      permissions: {
        medicalHistory: { view: true, download: false, edit: false },
        healthRecords: { view: true, download: false, edit: false },
        healthPlan: { view: false, download: false, edit: false },
        medications: { view: true, download: false, edit: false },
        appointments: { view: true, edit: false },
        messages: { view: true, edit: false },
      },
    },
    {
      id: "contact-4",
      name: "Memorial Hospital",
      role: "Healthcare Facility",
      type: "professional",
      accessLevel: "Emergency Only",
      status: "Active",
      lastAccessed: "3 weeks ago",
      expires: "Dec 31, 2023",
      permissions: {
        medicalHistory: { view: true, download: true, edit: false },
        healthRecords: { view: true, download: true, edit: false },
        healthPlan: { view: false, download: false, edit: false },
        medications: { view: true, download: true, edit: false },
        appointments: { view: false, edit: false },
        messages: { view: false, edit: false },
      },
    },
    {
      id: "contact-5",
      name: "Maria Johnson",
      role: "Family Member",
      type: "personal",
      accessLevel: "Limited",
      status: "Active",
      lastAccessed: "2 days ago",
      expires: "Dec 31, 2024",
      relationship: "Spouse",
      permissions: {
        medicalHistory: { view: true, download: false, edit: false },
        healthRecords: { view: true, download: false, edit: false },
        healthPlan: { view: true, download: false, edit: false },
        medications: { view: true, download: false, edit: false },
        appointments: { view: true, edit: true },
        messages: { view: false, edit: false },
      },
    },
    {
      id: "contact-6",
      name: "Robert Smith",
      role: "Caregiver",
      type: "personal",
      accessLevel: "Limited",
      status: "Revoked",
      lastAccessed: "1 month ago",
      expires: "Expired",
      relationship: "Caregiver",
      permissions: {
        medicalHistory: { view: false, download: false, edit: false },
        healthRecords: { view: false, download: false, edit: false },
        healthPlan: { view: false, download: false, edit: false },
        medications: { view: false, download: false, edit: false },
        appointments: { view: false, edit: false },
        messages: { view: false, edit: false },
      },
    },
  ])

  const accessLogsData = [
    {
      name: "Dr. Sarah Johnson",
      role: "Cardiologist",
      action: "Viewed health records",
      date: "Today, 10:30 AM",
      authorized: true,
    },
    {
      name: "Dr. Michael Chen",
      role: "Primary Care",
      action: "Updated medication list",
      date: "Yesterday, 3:45 PM",
      authorized: true,
    },
    {
      name: "System",
      role: "Automated Process",
      action: "Security audit",
      date: "Oct 15, 2023, 2:00 AM",
      authorized: true,
    },
    {
      name: "Unknown User",
      role: "External",
      action: "Login attempt",
      date: "Oct 10, 2023, 11:23 PM",
      authorized: false,
    },
    {
      name: "Dr. Sarah Johnson",
      role: "Cardiologist",
      action: "Downloaded medical history",
      date: "Oct 5, 2023, 9:15 AM",
      authorized: true,
    },
  ]

  // Filter contacts based on status and type
  const filteredContacts = sharedAccessData.filter((contact) => {
    if (contactFilter !== "all" && contact.type !== contactFilter) {
      return false
    }
    return contact.status !== "Revoked"
  })

  const revokedContacts = sharedAccessData.filter((contact) => contact.status === "Revoked")

  // Replace all hardcoded text with t function calls in the return statement
  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src="/middle-aged-man-profile.png" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("greeting.morning")}, John</h1>
          <p className="text-muted-foreground">{t("permissions.manageDataSharing")}</p>
        </div>
      </div>

      <Tabs defaultValue="shared-access">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shared-access">
            <UserIcon className="h-4 w-4 mr-2" />
            {t("permissions.sharedAccess")}
          </TabsTrigger>
          <TabsTrigger value="revoked-access">
            <XIcon className="h-4 w-4 mr-2" />
            {t("permissions.revokedAccess")}
          </TabsTrigger>
          <TabsTrigger value="access-logs">
            <ClockIcon className="h-4 w-4 mr-2" />
            {t("permissions.accessLogs")}
          </TabsTrigger>
          <TabsTrigger value="data-sharing">
            <ShieldIcon className="h-4 w-4 mr-2" />
            {t("permissions.dataSharing")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shared-access" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t("permissions.peopleWithAccess")}</h2>
            <Button onClick={() => setIsGrantAccessDialogOpen(true)}>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              {t("permissions.grantNewAccess")}
            </Button>
          </div>

          <div className="flex justify-between mb-4">
            <div className="flex gap-2">
              <div className="relative w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder={t("permissions.search")} className="pl-8" />
              </div>
              <Select
                value={contactFilter}
                onValueChange={(value: "all" | "professional" | "personal") => setContactFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("permissions.filterByType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("permissions.allContacts")}</SelectItem>
                  <SelectItem value="professional">{t("permissions.healthProfessionals")}</SelectItem>
                  <SelectItem value="personal">{t("permissions.familyFriends")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Health Professionals Section */}
          {(contactFilter === "all" || contactFilter === "professional") &&
            filteredContacts.some((contact) => contact.type === "professional") && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">{t("permissions.healthProfessionals")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredContacts
                    .filter((contact) => contact.type === "professional")
                    .map((provider) => (
                      <Card key={provider.id} className="overflow-hidden">
                        <div className="bg-muted/30 px-4 py-2 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{provider.name}</h3>
                              <p className="text-sm text-muted-foreground">{provider.role}</p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              provider.status === "Active"
                                ? "default"
                                : provider.status === "Pending"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {t(`permissions.status.${provider.status.toLowerCase()}`)}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">{t("permissions.accessLevel")}</p>
                              <p className="font-medium">{provider.accessLevel}</p>
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground mb-1">{t("permissions.permissionsLabel")}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                {provider.permissions?.medicalHistory.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.viewMedicalHistory")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medicalHistory.download && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.downloadMedicalHistory")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.viewHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.download && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.downloadHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medications.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.viewMedications")}</span>
                                  </div>
                                )}
                                {provider.permissions?.appointments.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.viewAppointments")}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">{t("permissions.lastAccessed")}</p>
                                <p className="font-medium">{provider.lastAccessed}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">{t("permissions.expires")}</p>
                                <p className="font-medium">{provider.expires}</p>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" size="sm" onClick={() => handleManageContact(provider)}>
                                {t("permissions.manage")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRevokePrompt(provider)}
                              >
                                {t("permissions.revoke")}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

          {/* Family & Friends Section */}
          {(contactFilter === "all" || contactFilter === "personal") &&
            filteredContacts.some((contact) => contact.type === "personal") && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UsersIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">{t("permissions.familyFriends")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredContacts
                    .filter((contact) => contact.type === "personal")
                    .map((provider) => (
                      <Card key={provider.id} className="overflow-hidden">
                        <div className="bg-muted/30 px-4 py-2 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{provider.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {provider.role} {provider.relationship ? `• ${provider.relationship}` : ""}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              provider.status === "Active"
                                ? "default"
                                : provider.status === "Pending"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {t(`permissions.status.${provider.status.toLowerCase()}`)}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">{t("permissions.accessLevel")}</p>
                              <p className="font-medium">{provider.accessLevel}</p>
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground mb-1">{t("permissions.permissionsLabel")}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                {provider.permissions?.medicalHistory.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.viewMedicalHistory")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medicalHistory.download && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.downloadMedicalHistory")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.viewHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.download && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.downloadHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medications.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.viewMedications")}</span>
                                  </div>
                                )}
                                {provider.permissions?.appointments.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                    <span>{t("permissions.viewAppointments")}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">{t("permissions.lastAccessed")}</p>
                                <p className="font-medium">{provider.lastAccessed}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">{t("permissions.expires")}</p>
                                <p className="font-medium">{provider.expires}</p>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" size="sm" onClick={() => handleManageContact(provider)}>
                                {t("permissions.manage")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRevokePrompt(provider)}
                              >
                                {t("permissions.revoke")}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
        </TabsContent>

        <TabsContent value="revoked-access" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{t("permissions.revokedAccess")}</h2>
            <p className="text-muted-foreground">{t("permissions.revokedAccessDesc")}</p>
          </div>

          {revokedContacts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <XIcon className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-medium">{t("permissions.noRevokedAccess")}</h3>
                  <p className="text-muted-foreground">{t("permissions.noRevokedAccessDesc")}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {revokedContacts.map((provider) => (
                <Card key={provider.id} className="overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {provider.role} {provider.relationship ? `• ${provider.relationship}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{t("permissions.status.revoked")}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t("permissions.accessLevel")}</p>
                        <p className="font-medium">{provider.accessLevel}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t("permissions.lastAccessed")}</p>
                          <p className="font-medium">{provider.lastAccessed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("permissions.revokedOn")}</p>
                          <p className="font-medium">Oct 15, 2023</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Restore access
                            const updatedData = sharedAccessData.map((contact) =>
                              contact.id === provider.id ? { ...contact, status: "Active" } : contact,
                            )
                            setSharedAccessData(updatedData)
                          }}
                        >
                          {t("permissions.restoreAccess")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="access-logs" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{t("permissions.accessHistory")}</h2>
            <p className="text-muted-foreground">{t("permissions.accessHistoryDesc")}</p>
          </div>

          <div className="flex justify-between mb-4">
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder={t("permissions.searchAccessLogs")} className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                {t("permissions.exportLogs")}
              </Button>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("permissions.filterByTime")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("permissions.allTime")}</SelectItem>
                  <SelectItem value="today">{t("permissions.today")}</SelectItem>
                  <SelectItem value="week">{t("permissions.thisWeek")}</SelectItem>
                  <SelectItem value="month">{t("permissions.thisMonth")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">{t("permissions.user")}</th>
                    <th className="text-left p-4">{t("permissions.action")}</th>
                    <th className="text-left p-4">{t("permissions.dateTime")}</th>
                    <th className="text-left p-4">{t("permissions.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLogsData.map((log, index) => (
                    <tr key={index} className={index !== accessLogsData.length - 1 ? "border-b" : ""}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{log.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{log.name}</p>
                            <p className="text-sm text-muted-foreground">{log.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{log.action}</td>
                      <td className="p-4">{log.date}</td>
                      <td className="p-4">
                        {log.authorized ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckIcon className="h-3 w-3 mr-1" /> {t("permissions.authorized")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XIcon className="h-3 w-3 mr-1" /> {t("permissions.unauthorized")}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{t("permissions.showingEntries", { count: 5, total: 24 })}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                {t("permissions.previous")}
              </Button>
              <Button variant="outline" size="sm">
                {t("permissions.next")}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data-sharing" className="space-y-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>{t("permissions.important")}</AlertTitle>
            <AlertDescription>{t("permissions.dataSharingImportantDesc")}</AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>{t("permissions.healthDataSharing")}</CardTitle>
              <CardDescription>{t("permissions.healthDataSharingDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="share-health-data" className="flex flex-col space-y-1">
                  <span>{t("permissions.shareHealthData")}</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    {t("permissions.shareHealthDataDesc")}
                  </span>
                </Label>
                <Switch
                  id="share-health-data"
                  checked={permissions.shareHealthData}
                  onCheckedChange={() => handleToggle("shareHealthData")}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="share-with-providers" className="flex flex-col space-y-1">
                  <span>{t("permissions.shareWithOtherProviders")}</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    {t("permissions.shareWithOtherProvidersDesc")}
                  </span>
                </Label>
                <Switch
                  id="share-with-providers"
                  checked={permissions.shareWithProviders}
                  onCheckedChange={() => handleToggle("shareWithProviders")}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="share-with-researchers" className="flex flex-col space-y-1">
                  <span>{t("permissions.shareWithResearchers")}</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    {t("permissions.shareWithResearchersDesc")}
                  </span>
                </Label>
                <Switch
                  id="share-with-researchers"
                  checked={permissions.shareWithResearchers}
                  onCheckedChange={() => handleToggle("shareWithResearchers")}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="share-with-insurance" className="flex flex-col space-y-1">
                  <span>{t("permissions.shareWithInsurance")}</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    {t("permissions.shareWithInsuranceDesc")}
                  </span>
                </Label>
                <Switch
                  id="share-with-insurance"
                  checked={permissions.shareWithInsurance}
                  onCheckedChange={() => handleToggle("shareWithInsurance")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grant Access Dialog */}
      <Dialog open={isGrantAccessDialogOpen} onOpenChange={setIsGrantAccessDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("permissions.addNewContact")}</DialogTitle>
            <DialogDescription>{t("permissions.addNewContactDesc")}</DialogDescription>
          </DialogHeader>

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
                      <Checkbox
                        checked={newContact.permissions.medicalHistory.download}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("medicalHistory", "download", checked as boolean)
                        }
                      />
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
                      <Checkbox
                        checked={newContact.permissions.healthPlan.download}
                        onCheckedChange={(checked) =>
                          handlePermissionChange("healthPlan", "download", checked as boolean)
                        }
                      />
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

      {/* Manage Access Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("permissions.manageAccess")}</DialogTitle>
            <DialogDescription>{t("permissions.updateAccessFor", { name: selectedContact?.name })}</DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>{t("permissions.contactType")}</Label>
                  <p className="font-medium">{selectedContact.role}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t("profile.fullName")}</Label>
                  <p className="font-medium">{selectedContact.name}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t("profile.email")}</Label>
                  <Input
                    value={selectedContact.email || ""}
                    onChange={(e) => setSelectedContact({ ...selectedContact, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("permissions.relationship")}</Label>
                  <Input
                    value={selectedContact.relationship || ""}
                    onChange={(e) => setSelectedContact({ ...selectedContact, relationship: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>{t("permissions.permissionsLabel")}</Label>
                <p className="text-sm text-muted-foreground">{t("permissions.updatePermissionsDesc")}</p>

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
                      {selectedContact.permissions && (
                        <>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <FileTextIcon className="h-4 w-4 mr-2" />
                                {t("permissions.medicalHistory")}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.medicalHistory.view}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("medicalHistory", "view", checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.medicalHistory.download}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("medicalHistory", "download", checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.medicalHistory.edit}
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
                                checked={selectedContact.permissions.healthRecords.view}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("healthRecords", "view", checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.healthRecords.download}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("healthRecords", "download", checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.healthRecords.edit}
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
                                checked={selectedContact.permissions.healthPlan.view}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("healthPlan", "view", checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.healthPlan.download}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("healthPlan", "download", checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.healthPlan.edit}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("healthPlan", "edit", checked as boolean)
                                }
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
                                checked={selectedContact.permissions.medications.view}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("medications", "view", checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.medications.download}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("medications", "download", checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.medications.edit}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("medications", "edit", checked as boolean)
                                }
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
                                checked={selectedContact.permissions.appointments.view}
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
                                checked={selectedContact.permissions.appointments.edit}
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
                                checked={selectedContact.permissions.messages.view}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("messages", "view", checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-muted-foreground">-</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedContact.permissions.messages.edit}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange("messages", "edit", checked as boolean)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageDialogOpen(false)}>
              {t("action.cancel")}
            </Button>
            <Button onClick={handleUpdateContact} className="bg-primary hover:bg-primary/90">
              {t("permissions.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Confirmation Dialog */}
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("permissions.revokeAccess")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("permissions.revokeConfirmation", { name: selectedContact?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <AlertTriangleIcon className="h-4 w-4 mr-2" />
              {t("permissions.revokeAccess")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
