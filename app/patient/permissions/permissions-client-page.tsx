"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { AuthApiService } from "@/lib/api/auth-api"
import { useToast } from "@/hooks/use-toast"
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
  Trash2Icon,
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
import { messagesApiService } from "@/lib/api/messages-api"
import { RecipientAutocomplete, type Contact as MessageContact } from "@/components/messages/recipient-autocomplete"
import { usePatientContext } from "@/hooks/use-patient-context"
import { AuthAPI } from "@/lib/api/auth-api"
import { useRouter } from "next/navigation"

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
  const { toast } = useToast()
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const { patientId, isViewingOtherPatient } = usePatientContext()
  const [isSaving, setIsSaving] = useState(false)
  const [currentPatientPermissions, setCurrentPatientPermissions] = useState<any>(null)
  
  // Redirect away from permissions page if viewing another patient
  useEffect(() => {
    if (isViewingOtherPatient && patientId) {
      console.log('🚫 Blocking permissions page access - redirecting away')
      router.replace(`/patient/health-records?patientId=${patientId}`)
    }
  }, [isViewingOtherPatient, patientId, router])
  
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

  // Helper function to convert formatted date to YYYY-MM-DD for date input
  const parseDateForInput = (dateStr: string): string => {
    if (!dateStr || dateStr === "Never") return ""
    try {
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }
    } catch (e) {
      // If parsing fails, return empty string
    }
    return ""
  }

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactFilter, setContactFilter] = useState<"all" | "professional" | "personal">("all")
  
  // Contact picker state for adding contacts from messages
  const [availableContacts, setAvailableContacts] = useState<MessageContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [selectedMessageContact, setSelectedMessageContact] = useState<MessageContact | null>(null)
  const [contactsOffset, setContactsOffset] = useState(0)
  const [hasMoreContacts, setHasMoreContacts] = useState(false)
  const [loadingMoreContacts, setLoadingMoreContacts] = useState(false)
  const [contactsSearchQuery, setContactsSearchQuery] = useState("")

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

  const handleToggle = async (key: keyof typeof permissions) => {
    const updatedPermissions = {
      ...permissions,
      [key]: !permissions[key],
    }
    setPermissions(updatedPermissions)
    
    // Auto-save to Supabase
    if (!user?.id) return
    
    try {
      await AuthApiService.updateDataSharing({
        share_health_data: updatedPermissions.shareHealthData,
        share_with_other_providers: updatedPermissions.shareWithProviders,
        share_with_researchers: updatedPermissions.shareWithResearchers,
        share_with_insurance: updatedPermissions.shareWithInsurance,
      })
      console.log("✅ Data sharing preferences saved")
    } catch (error) {
      console.error("Error saving data sharing preferences:", error)
    }
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

  // Load available contacts from messages
  const loadAvailableContacts = async (reset = false, searchQuery = "") => {
    try {
      const isInitialLoad = reset || contactsOffset === 0
      if (isInitialLoad) {
        setLoadingContacts(true)
        setContactsOffset(0)
      } else {
        setLoadingMoreContacts(true)
      }
      
      const offset = reset ? 0 : contactsOffset
      const contacts = await messagesApiService.getAvailableContacts({
        search: searchQuery || undefined,
        offset,
        limit: 20
      })
      
      // Check if there are more contacts to load
      const hasMore = contacts.length >= 20
      setHasMoreContacts(hasMore)
      
      if (isInitialLoad) {
        setAvailableContacts(contacts)
        setContactsOffset(contacts.length)
      } else {
        setAvailableContacts(prev => [...prev, ...contacts])
        setContactsOffset(prev => prev + contacts.length)
      }
    } catch (error) {
      console.error("Failed to load contacts:", error)
      if (reset || contactsOffset === 0) {
        setAvailableContacts([])
      }
      setHasMoreContacts(false)
    } finally {
      setLoadingContacts(false)
      setLoadingMoreContacts(false)
    }
  }

  // Load contacts when dialog opens
  useEffect(() => {
    if (isGrantAccessDialogOpen) {
      loadAvailableContacts(true)
    }
  }, [isGrantAccessDialogOpen])

  // Handle contact selection from messages
  const handleSelectMessageContact = (contact: MessageContact | null) => {
    setSelectedMessageContact(contact)
    if (contact) {
      // Auto-fill name and email from selected contact
      setNewContact({
        ...newContact,
        name: contact.name,
        email: contact.email || contact.id, // Use email if available, fallback to ID
      })
    }
  }

  // Handle search in contact picker
  const handleSearchContacts = (query: string) => {
    setContactsSearchQuery(query)
    loadAvailableContacts(true, query)
  }

  // Load more contacts (pagination)
  const handleLoadMoreContacts = () => {
    if (loadingMoreContacts || !hasMoreContacts) return
    loadAvailableContacts(false, contactsSearchQuery)
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
      expires: newContact.expires 
        ? new Date(newContact.expires).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Never",
      email: newContact.email,
      relationship: newContact.relationship,
      permissions: newContact.permissions,
    }

    const updatedData = [...sharedAccessData, newContactData]
    setSharedAccessData(updatedData)
    setIsGrantAccessDialogOpen(false)

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
    
    // Reset contact picker
    setSelectedMessageContact(null)
    setContactsSearchQuery("")
    
    // Auto-save after adding
    saveSharedAccess(updatedData)
  }

  const handleManageContact = (contact: Contact) => {
    setSelectedContact(contact)
    setIsManageDialogOpen(true)
  }

  const handleUpdateContact = async () => {
    if (!selectedContact) return

    // Format the expires date if it's in YYYY-MM-DD format
    let formattedContact = { ...selectedContact }
    if (formattedContact.expires && formattedContact.expires.match(/^\d{4}-\d{2}-\d{2}$/)) {
      formattedContact.expires = new Date(formattedContact.expires).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      })
    }

    // Update the contact in the sharedAccessData array
    const updatedData = sharedAccessData.map((contact) =>
      contact.id === formattedContact.id ? formattedContact : contact,
    )

    setSharedAccessData(updatedData)
    setIsManageDialogOpen(false)
    setSelectedContact(null)
    
    // Auto-save after updating
    await saveSharedAccess(updatedData)
    
    // Reload data from backend to ensure consistency
    const reloadedContacts = await loadAndTransformSharedAccess()
    if (reloadedContacts.length > 0 || updatedData.length === 0) {
      setSharedAccessData(reloadedContacts.length > 0 ? reloadedContacts : updatedData)
    }
    
    toast({
      title: t("permissions.contactUpdated") || "Contact Updated",
      description: t("permissions.contactUpdatedDesc") || "The contact permissions have been updated successfully.",
    })
  }

  const handleRevokePrompt = (contact: Contact) => {
    setSelectedContact(contact)
    setIsRevokeDialogOpen(true)
  }

  const handleRevokeAccess = () => {
    if (!selectedContact) return

    // Update the contact status to Revoked
    const updatedData = sharedAccessData.map((contact) =>
      contact.id === selectedContact.id ? { ...contact, status: "Revoked" as const } : contact,
    )

    setSharedAccessData(updatedData)
    setIsRevokeDialogOpen(false)
    setSelectedContact(null)
    saveSharedAccess(updatedData)
  }

  const handleDeletePrompt = (contact: Contact) => {
    setSelectedContact(contact)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteContact = () => {
    if (!selectedContact) return

    // Remove the contact completely from the list
    const updatedData = sharedAccessData.filter(
      (contact) => contact.id !== selectedContact.id
    )

    setSharedAccessData(updatedData)
    setIsDeleteDialogOpen(false)
    setSelectedContact(null)
    saveSharedAccess(updatedData)
    
    toast({
      title: t("permissions.contactDeleted") || "Contact Deleted",
      description: t("permissions.contactDeletedDesc") || "The contact has been permanently removed.",
    })
  }

  const saveSharedAccess = async (contacts: Contact[]) => {
    if (!user?.id) return
    
    setIsSaving(true)
    try {
      // Split contacts into professionals and personal
      const healthProfessionals = contacts.filter(c => c.type === "professional").map(c => ({
        id: c.id,
        permissions_contact_type: c.role || "",
        profile_fullname: c.name,
        profile_email: c.email,
        permissions_relationship: c.relationship,
        medical_history_view: c.permissions?.medicalHistory?.view,
        medical_history_download: c.permissions?.medicalHistory?.download,
        medical_history_edit: c.permissions?.medicalHistory?.edit,
        health_records_view: c.permissions?.healthRecords?.view,
        health_records_download: c.permissions?.healthRecords?.download,
        health_records_edit: c.permissions?.healthRecords?.edit,
        health_plan_view: c.permissions?.healthPlan?.view,
        health_plan_download: c.permissions?.healthPlan?.download,
        health_plan_edit: c.permissions?.healthPlan?.edit,
        medications_view: c.permissions?.medications?.view,
        medications_download: c.permissions?.medications?.download,
        medications_edit: c.permissions?.medications?.edit,
        appointments_view: c.permissions?.appointments?.view,
        appointments_edit: c.permissions?.appointments?.edit,
        messages_view: c.permissions?.messages?.view,
        messages_edit: c.permissions?.messages?.edit,
        accessLevel: c.accessLevel,
        status: c.status,
        lastAccessed: c.lastAccessed,
        expires: c.expires,
      }))
      
      const familyFriends = contacts.filter(c => c.type === "personal").map(c => ({
        id: c.id,
        permissions_contact_type: c.role || "",
        profile_fullname: c.name,
        profile_email: c.email,
        permissions_relationship: c.relationship,
        medical_history_view: c.permissions?.medicalHistory?.view,
        medical_history_download: c.permissions?.medicalHistory?.download,
        medical_history_edit: c.permissions?.medicalHistory?.edit,
        health_records_view: c.permissions?.healthRecords?.view,
        health_records_download: c.permissions?.healthRecords?.download,
        health_records_edit: c.permissions?.healthRecords?.edit,
        health_plan_view: c.permissions?.healthPlan?.view,
        health_plan_download: c.permissions?.healthPlan?.download,
        health_plan_edit: c.permissions?.healthPlan?.edit,
        medications_view: c.permissions?.medications?.view,
        medications_download: c.permissions?.medications?.download,
        medications_edit: c.permissions?.medications?.edit,
        appointments_view: c.permissions?.appointments?.view,
        appointments_edit: c.permissions?.appointments?.edit,
        messages_view: c.permissions?.messages?.view,
        messages_edit: c.permissions?.messages?.edit,
        accessLevel: c.accessLevel,
        status: c.status,
        lastAccessed: c.lastAccessed,
        expires: c.expires,
      }))
      
      await AuthApiService.updateSharedAccess({
        health_professionals: healthProfessionals,
        family_friends: familyFriends,
      })
      
      console.log("💾 Shared access saved")
    } catch (error) {
      console.error("Error saving shared access:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to transform backend contact data to Contact type
  const transformContactData = (contact: any, type: "professional" | "personal"): Contact => {
    return {
      id: contact.id,
      name: contact.profile_fullname || "",
      role: contact.permissions_contact_type || "",
      type: type,
      accessLevel: contact.accessLevel || "Limited",
      status: (contact.status || "Active") as "Active" | "Pending" | "Revoked",
      lastAccessed: contact.lastAccessed || "Never",
      expires: contact.expires || "",
      email: contact.profile_email,
      relationship: contact.permissions_relationship,
      permissions: {
        medicalHistory: {
          view: contact.medical_history_view || false,
          download: contact.medical_history_download || false,
          edit: contact.medical_history_edit || false,
        },
        healthRecords: {
          view: contact.health_records_view || false,
          download: contact.health_records_download || false,
          edit: contact.health_records_edit || false,
        },
        healthPlan: {
          view: contact.health_plan_view || false,
          download: contact.health_plan_download || false,
          edit: contact.health_plan_edit || false,
        },
        medications: {
          view: contact.medications_view || false,
          download: contact.medications_download || false,
          edit: contact.medications_edit || false,
        },
        appointments: {
          view: contact.appointments_view || false,
          edit: contact.appointments_edit || false,
        },
        messages: {
          view: contact.messages_view || false,
          edit: contact.messages_edit || false,
        },
      },
    }
  }

  // Helper function to load and transform shared access data
  const loadAndTransformSharedAccess = async () => {
    if (!user?.id) return []
    
    try {
      const sharedAccessData = await AuthApiService.getSharedAccess()
      if (!sharedAccessData) return []
      
      const allContacts: Contact[] = []
      
      // Add professionals
      if (sharedAccessData.health_professionals && sharedAccessData.health_professionals.length > 0) {
        sharedAccessData.health_professionals.forEach((contact: any) => {
          allContacts.push(transformContactData(contact, "professional"))
        })
      }
      
      // Add family/friends
      if (sharedAccessData.family_friends && sharedAccessData.family_friends.length > 0) {
        sharedAccessData.family_friends.forEach((contact: any) => {
          allContacts.push(transformContactData(contact, "personal"))
        })
      }
      
      return allContacts
    } catch (error) {
      console.error("Error loading shared access:", error)
      return []
    }
  }

  // Load shared access data from Supabase
  useEffect(() => {
    const loadSharedAccess = async () => {
      console.log("🔍 loadSharedAccess called, user:", user)
      if (!user?.id) {
        console.log("⏭️ Skipping shared access load - no user ID")
        return
      }
      
      const allContacts = await loadAndTransformSharedAccess()
      if (allContacts.length > 0) {
        setSharedAccessData(allContacts)
        console.log("✅ Loaded", allContacts.length, "contacts from Supabase")
      }
    }
    
    loadSharedAccess()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Load access logs on mount
  useEffect(() => {
    const loadAccessLogs = async () => {
      console.log("🔍 loadAccessLogs called, user:", user)
      if (!user?.id) {
        console.log("⏭️ Skipping access logs load - no user ID")
        return
      }
      
      try {
        const logsData = await AuthApiService.getAccessLogs()
        console.log("📦 Access logs loaded:", logsData)
        
        if (logsData && logsData.logs && logsData.logs.length > 0) {
          setAccessLogsData(logsData.logs)
          console.log("✅ Loaded", logsData.logs.length, "access logs from Supabase")
        }
      } catch (error) {
        console.error("Error loading access logs:", error)
      }
    }
    
    loadAccessLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Load data sharing preferences on mount
  useEffect(() => {
    const loadDataSharing = async () => {
      console.log("🔍 loadDataSharing called, user:", user)
      if (!user?.id) {
        console.log("⏭️ Skipping data sharing load - no user ID")
        return
      }
      
      try {
        const dataSharingData = await AuthApiService.getDataSharing()
        console.log("📦 Data sharing loaded:", dataSharingData)
        
        if (dataSharingData) {
          setPermissions({
            shareHealthData: dataSharingData.share_health_data ?? true,
            shareWithProviders: dataSharingData.share_with_other_providers ?? true,
            shareWithResearchers: dataSharingData.share_with_researchers ?? false,
            shareWithInsurance: dataSharingData.share_with_insurance ?? true,
            receiveNotifications: true,
            receiveMarketing: false,
            allowLocationTracking: false,
            allowDataAnalytics: true,
          })
          console.log("✅ Loaded data sharing preferences from Supabase")
        }
      } catch (error) {
        console.error("Error loading data sharing:", error)
      }
    }
    
    loadDataSharing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Load patient permissions when viewing another patient
  useEffect(() => {
    const loadPatientPermissions = async () => {
      if (!isViewingOtherPatient || !patientId) {
        setCurrentPatientPermissions(null)
        return
      }
      
      try {
        const response = await AuthAPI.getAccessiblePatients()
        const patient = response.accessible_patients?.find(p => p.patient_id === patientId)
        if (patient) {
          setCurrentPatientPermissions(patient.permissions)
        }
      } catch (error) {
        console.error('Failed to load patient permissions:', error)
      }
    }
    
    loadPatientPermissions()
  }, [isViewingOtherPatient, patientId])

  const [sharedAccessData, setSharedAccessData] = useState<Contact[]>([])
  const [accessLogsData, setAccessLogsData] = useState<Array<{ id: string; name: string; role: string; action: string; date: string; authorized: boolean }>>([])

  // Filter contacts based on status and type
  const filteredContacts = sharedAccessData.filter((contact) => {
    if (contactFilter !== "all" && contact.type !== contactFilter) {
      return false
    }
    return contact.status !== "Revoked"
  })

  const revokedContacts = sharedAccessData.filter((contact) => contact.status === "Revoked")

  const userName = user?.user_metadata?.full_name || "User"
  const firstName = userName.split(' ')[0] || "User"

  // Build the list of accessible sections based on permissions
  const accessibleSections: string[] = []
  if (currentPatientPermissions) {
    if (currentPatientPermissions.can_view_health_records) accessibleSections.push("Health Records")
    if (currentPatientPermissions.can_view_health_plans) accessibleSections.push("Health Plan")
    if (currentPatientPermissions.can_view_medications) accessibleSections.push("Medications")
    if (currentPatientPermissions.can_view_appointments) accessibleSections.push("Appointments")
    if (currentPatientPermissions.can_view_messages) accessibleSections.push("Messages")
  }

  // Replace all hardcoded text with t function calls in the return statement
  return (
    <div className="space-y-4 px-4">
      {/* Informational message when viewing another patient */}
      {isViewingOtherPatient && currentPatientPermissions && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Access Information</AlertTitle>
          <AlertDescription>
            {accessibleSections.length > 0 ? (
              <>
                You may have access to {accessibleSections.join(", ")}. 
                No one else has access to your profile or dashboard.
              </>
            ) : (
              "You have limited access to this patient's data. No one else has access to your profile or dashboard."
            )}
          </AlertDescription>
        </Alert>
      )}

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
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">{t("permissions.name") || "Name"}</TableHead>
                        <TableHead className="w-[150px]">{t("permissions.status") || "Status"}</TableHead>
                        <TableHead>{t("permissions.permissionsLabel") || "Permissions"}</TableHead>
                        <TableHead className="w-[200px] text-right">{t("permissions.actions") || "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts
                        .filter((contact) => contact.type === "professional")
                        .map((provider) => (
                          <TableRow key={provider.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{provider.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {provider.role} {provider.relationship ? `• ${provider.relationship}` : ""}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  provider.status === "Active"
                                    ? "default"
                                    : provider.status === "Pending"
                                      ? "outline"
                                      : "secondary"
                                }
                              >
                                {t(`permissions.statusOptions.${provider.status.toLowerCase()}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                {provider.permissions?.medicalHistory.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewMedicalHistory")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medicalHistory.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editMedicalHistory")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.download && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.downloadHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthPlan.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewHealthPlan")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthPlan.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editHealthPlan")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medications.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewMedications")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medications.download && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.downloadMedications")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medications.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editMedications")}</span>
                                  </div>
                                )}
                                {provider.permissions?.appointments.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewAppointments")}</span>
                                  </div>
                                )}
                                {provider.permissions?.appointments.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editAppointments")}</span>
                                  </div>
                                )}
                                {provider.permissions?.messages.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewMessages")}</span>
                                  </div>
                                )}
                                {provider.permissions?.messages.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editMessages")}</span>
                                  </div>
                                )}
                                {!provider.permissions?.medicalHistory.view && 
                                 !provider.permissions?.medicalHistory.edit &&
                                 !provider.permissions?.healthRecords.view && 
                                 !provider.permissions?.healthRecords.download &&
                                 !provider.permissions?.healthRecords.edit &&
                                 !provider.permissions?.healthPlan.view && 
                                 !provider.permissions?.healthPlan.edit &&
                                 !provider.permissions?.medications.view && 
                                 !provider.permissions?.medications.download &&
                                 !provider.permissions?.medications.edit &&
                                 !provider.permissions?.appointments.view && 
                                 !provider.permissions?.appointments.edit &&
                                 !provider.permissions?.messages.view && 
                                 !provider.permissions?.messages.edit && (
                                  <span className="text-muted-foreground text-sm">No permissions granted</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeletePrompt(provider)}
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
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
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">{t("permissions.name") || "Name"}</TableHead>
                        <TableHead className="w-[150px]">{t("permissions.status") || "Status"}</TableHead>
                        <TableHead>{t("permissions.permissionsLabel") || "Permissions"}</TableHead>
                        <TableHead className="w-[200px] text-right">{t("permissions.actions") || "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts
                        .filter((contact) => contact.type === "personal")
                        .map((provider) => (
                          <TableRow key={provider.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{provider.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {provider.role} {provider.relationship ? `• ${provider.relationship}` : ""}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  provider.status === "Active"
                                    ? "default"
                                    : provider.status === "Pending"
                                      ? "outline"
                                      : "secondary"
                                }
                              >
                                {t(`permissions.statusOptions.${provider.status.toLowerCase()}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                {provider.permissions?.medicalHistory.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewMedicalHistory")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medicalHistory.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editMedicalHistory")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.download && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.downloadHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthRecords.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editHealthRecords")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthPlan.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewHealthPlan")}</span>
                                  </div>
                                )}
                                {provider.permissions?.healthPlan.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editHealthPlan")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medications.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewMedications")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medications.download && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.downloadMedications")}</span>
                                  </div>
                                )}
                                {provider.permissions?.medications.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editMedications")}</span>
                                  </div>
                                )}
                                {provider.permissions?.appointments.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewAppointments")}</span>
                                  </div>
                                )}
                                {provider.permissions?.appointments.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editAppointments")}</span>
                                  </div>
                                )}
                                {provider.permissions?.messages.view && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.viewMessages")}</span>
                                  </div>
                                )}
                                {provider.permissions?.messages.edit && (
                                  <div className="flex items-center gap-1">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                    <span>{t("permissions.editMessages")}</span>
                                  </div>
                                )}
                                {!provider.permissions?.medicalHistory.view && 
                                 !provider.permissions?.medicalHistory.edit &&
                                 !provider.permissions?.healthRecords.view && 
                                 !provider.permissions?.healthRecords.download &&
                                 !provider.permissions?.healthRecords.edit &&
                                 !provider.permissions?.healthPlan.view && 
                                 !provider.permissions?.healthPlan.edit &&
                                 !provider.permissions?.medications.view && 
                                 !provider.permissions?.medications.download &&
                                 !provider.permissions?.medications.edit &&
                                 !provider.permissions?.appointments.view && 
                                 !provider.permissions?.appointments.edit &&
                                 !provider.permissions?.messages.view && 
                                 !provider.permissions?.messages.edit && (
                                  <span className="text-muted-foreground text-sm">No permissions granted</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeletePrompt(provider)}
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
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
                    <Badge variant="secondary">{t("permissions.statusOptions.revoked")}</Badge>
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
                              contact.id === provider.id ? { ...contact, status: "Active" as const } : contact,
                            )
                            setSharedAccessData(updatedData)
                            saveSharedAccess(updatedData)
                          }}
                        >
                          {t("permissions.restoreAccess")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeletePrompt(provider)}
                        >
                          <Trash2Icon className="h-4 w-4" />
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
            <p className="text-sm text-muted-foreground">{t("permissions.showingEntries")}</p>
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
              hasMore={hasMoreContacts}
              onLoadMore={handleLoadMoreContacts}
              loadingMore={loadingMoreContacts}
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
              <Label htmlFor="expires">{t("permissions.expires")}</Label>
              <Input
                id="expires"
                type="date"
                value={newContact.expires}
                onChange={(e) => setNewContact({ ...newContact, expires: e.target.value })}
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

      {/* Manage Access Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("permissions.manageAccess")}</DialogTitle>
            <DialogDescription>{t("permissions.updateAccessFor")}</DialogDescription>
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

                <div className="space-y-2">
                  <Label>{t("permissions.expires")}</Label>
                  <Input
                    type="date"
                    value={parseDateForInput(selectedContact.expires)}
                    onChange={(e) => setSelectedContact({ ...selectedContact, expires: e.target.value })}
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
                              <span className="text-muted-foreground">-</span>
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
                              <span className="text-muted-foreground">-</span>
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
              {t("permissions.revokeConfirmation")}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("permissions.deleteContact") || "Delete Contact"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedContact && (
                <>
                  {t("permissions.deleteContactDesc") || "Are you sure you want to permanently delete"} <strong>{selectedContact.name}</strong>?{" "}
                  {t("permissions.deleteContactWarning") || "This action cannot be undone and will remove all access permissions."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("action.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              {t("permissions.delete") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
