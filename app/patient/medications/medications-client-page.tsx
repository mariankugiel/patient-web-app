"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { medications as staticMedications } from "@/lib/data"
import { medicationsApiService, Medication } from "@/lib/api/medications-api"
import { Clock, Edit, FileText, Plus, Pill, Trash2, MessageSquare, Calendar, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/contexts/language-context"
import { MedicationReminderManager } from "@/components/medication-reminder-manager"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "react-toastify"
import { formatDate } from "@/lib/utils/date-formatter"

const daysOfWeek = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
]

export default function MedicationsClientPage() {
  const { t, language } = useLanguage()
  
  // State for dynamic data
  const [currentMeds, setCurrentMeds] = useState<Medication[]>([])
  const [previousMeds, setPreviousMeds] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingMedication, setSavingMedication] = useState(false)
  
  const [openReminderDialog, setOpenReminderDialog] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<number | null>(null)
  const [newReminder, setNewReminder] = useState({
    time: "08:00",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  })
  const [openPrescriptionDialog, setOpenPrescriptionDialog] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [openMessageDialog, setOpenMessageDialog] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [selectedMedicationForMessage, setSelectedMedicationForMessage] = useState<any>(null)
  const [openAddMedicationDialog, setOpenAddMedicationDialog] = useState(false)
  const getDefaultEndDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    purpose: "",
    prescribedBy: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: getDefaultEndDate(),
    instructions: "",
    prescription: {
      number: "",
      pharmacy: "",
      originalQuantity: "",
      refillsRemaining: "",
      lastFilled: new Date().toISOString().split("T")[0],
    },
  })

  const [openEditMedicationDialog, setOpenEditMedicationDialog] = useState(false)
  const [medicationToEdit, setMedicationToEdit] = useState<Medication | null>(null)
  const [savingEditMedication, setSavingEditMedication] = useState(false)
  
  // End medication state
  const [endingMedicationId, setEndingMedicationId] = useState<number | null>(null)
  const [openEndDialog, setOpenEndDialog] = useState(false)
  const [medicationToEnd, setMedicationToEnd] = useState<Medication | null>(null)
  const [endReason, setEndReason] = useState("")
  
  // Delete confirmation dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null)
  const [deletingMedication, setDeletingMedication] = useState(false)
  
  // Close confirmation dialog state
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [pendingDialogClose, setPendingDialogClose] = useState<'add' | 'edit' | null>(null)

  // Load medications on component mount
  useEffect(() => {
    loadMedications()
  }, [])

  const loadMedications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load current medications
      const current = await medicationsApiService.getMedications('current')
      setCurrentMeds(current)
      
      // Load previous medications
      const previous = await medicationsApiService.getMedications('previous')
      setPreviousMeds(previous)
      
    } catch (err) {
      console.error('Failed to load medications:', err)
      setError('Failed to load medications')
      // Fallback to empty data
      setCurrentMeds([])
      setPreviousMeds([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddReminder = () => {
    if (!selectedMedication) return

    setCurrentMeds((prevMeds) =>
      prevMeds.map((med) => {
        if (med.id === selectedMedication) {
          return {
            ...med,
            reminders: [
              ...(med.reminders || []),
              {
                id: `rem${Date.now()}`,
                time: newReminder.time,
                days: newReminder.days,
                enabled: true,
              },
            ],
          }
        }
        return med
      }),
    )

    setOpenReminderDialog(false)
    setNewReminder({
      time: "08:00",
      days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    })
  }

  const handleToggleReminder = (medId: number, reminderId: string) => {
    setCurrentMeds((prevMeds) =>
      prevMeds.map((med) => {
        if (med.id === medId) {
          return {
            ...med,
            reminders: (med.reminders || []).map((reminder) => {
              if (reminder.id === reminderId) {
                return { ...reminder, enabled: !reminder.enabled }
              }
              return reminder
            }),
          }
        }
        return med
      }),
    )
  }

  const handleDeleteReminder = (medId: number, reminderId: string) => {
    setCurrentMeds((prevMeds) =>
      prevMeds.map((med) => {
        if (med.id === medId) {
          return {
            ...med,
            reminders: (med.reminders || []).filter((reminder) => reminder.id !== reminderId),
          }
        }
        return med
      }),
    )
  }

  const handleDayToggle = (day: string) => {
    setNewReminder((prev) => {
      if (prev.days.includes(day)) {
        return { ...prev, days: prev.days.filter((d) => d !== day) }
      } else {
        return { ...prev, days: [...prev.days, day] }
      }
    })
  }

  const handleViewPrescription = (prescription: any) => {
    setSelectedPrescription(prescription)
    setOpenPrescriptionDialog(true)
  }

  const handleDownloadPrescription = () => {
    // In a real app, this would generate and download a PDF
    alert("Prescription PDF would be downloaded here")
    setOpenPrescriptionDialog(false)
  }

  const handleOpenMessageDialog = (medication: any) => {
    setSelectedMedicationForMessage(medication)
    setOpenMessageDialog(true)
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedMedicationForMessage) return

    // In a real app, this would send the message to the backend
    alert(`Message about ${selectedMedicationForMessage.name} sent to Dr. ${selectedMedicationForMessage.prescribedBy}`)
    setOpenMessageDialog(false)
    setMessageText("")
  }

  const handleAddMedication = async () => {
    // Validate required fields
    if (!newMedication.name) {
      toast.error("Please fill in medication name")
      return
    }
    if (!newMedication.dosage) {
      toast.error("Please fill in dosage")
      return
    }
    if (!newMedication.frequency) {
      toast.error("Please fill in frequency")
      return
    }
    if (!newMedication.startDate) {
      toast.error("Please fill in start date")
      return
    }
    if (!newMedication.endDate) {
      toast.error("Please fill in end date")
      return
    }
    
    // Validate end date is after start date
    const startDate = new Date(newMedication.startDate)
    const endDate = new Date(newMedication.endDate)
    if (endDate <= startDate) {
      toast.error("End date must be after start date")
      return
    }

    setSavingMedication(true)
    try {
      const medicationData = {
        medication_name: newMedication.name,
        medication_type: "prescription" as const,
        dosage: newMedication.dosage || undefined,
        frequency: newMedication.frequency || undefined,
        purpose: newMedication.purpose || undefined,
        instructions: newMedication.instructions || undefined,
        start_date: newMedication.startDate,
        end_date: newMedication.endDate || undefined,
        // Prescription information
        rx_number: newMedication.prescription.number || undefined,
        pharmacy: newMedication.prescription.pharmacy || undefined,
        original_quantity: newMedication.prescription.originalQuantity ? parseInt(newMedication.prescription.originalQuantity) : undefined,
        refills_remaining: newMedication.prescription.refillsRemaining ? parseInt(newMedication.prescription.refillsRemaining) : undefined,
        last_filled_date: newMedication.prescription.lastFilled || undefined,
      }

      const createdMedication = await medicationsApiService.createMedication(medicationData)
      
      // Add to current medications
      setCurrentMeds((prevMeds) => [...prevMeds, createdMedication])
      
      // Reset form
      const today = new Date().toISOString().split("T")[0]
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split("T")[0]
      
      setNewMedication({
        name: "",
        dosage: "",
        frequency: "",
        purpose: "",
        prescribedBy: "",
        startDate: today,
        endDate: tomorrowStr,
        instructions: "",
        prescription: {
          number: "",
          pharmacy: "",
          originalQuantity: "",
          refillsRemaining: "",
          lastFilled: today,
        },
      })
      setOpenAddMedicationDialog(false)
      toast.success('Medication added successfully!')
    } catch (err) {
      console.error('Failed to add medication:', err)
      toast.error('Failed to add medication. Please try again.')
    } finally {
      setSavingMedication(false)
    }
  }

  const handleOpenEndDialog = (medication: Medication) => {
    setMedicationToEnd(medication)
    setEndReason("")
    setOpenEndDialog(true)
  }

  const handleEndMedication = async () => {
    if (!medicationToEnd) return
    
    setEndingMedicationId(medicationToEnd.id)
    try {
      const result = await medicationsApiService.endMedication(medicationToEnd.id, endReason || undefined)
      
      // Remove from current medications
      setCurrentMeds((prevMeds) => prevMeds.filter((med) => med.id !== medicationToEnd.id))
      
      // Add to previous medications
      setPreviousMeds((prevMeds) => [
        result.medication,
        ...prevMeds,
      ])
      
      toast.success(`Medication ${medicationToEnd.medication_name} has been ended and moved to previous medications`)
      setOpenEndDialog(false)
      setMedicationToEnd(null)
      setEndReason("")
    } catch (err) {
      console.error('Failed to end medication:', err)
      toast.error('Failed to end medication. Please try again.')
    } finally {
      setEndingMedicationId(null)
    }
  }

  const handleDeleteMedication = (medId: number) => {
    const medication = currentMeds.find((med) => med.id === medId) || previousMeds.find((med) => med.id === medId)
    if (!medication) return

    // Open delete confirmation dialog
    setMedicationToDelete(medication)
    setOpenDeleteDialog(true)
  }

  const confirmDeleteMedication = async () => {
    if (!medicationToDelete) return

    setDeletingMedication(true)
    try {
      await medicationsApiService.deleteMedication(medicationToDelete.id)
      
      // Remove from current or previous list
      setCurrentMeds((prevMeds) => prevMeds.filter((med) => med.id !== medicationToDelete.id))
      setPreviousMeds((prevMeds) => prevMeds.filter((med) => med.id !== medicationToDelete.id))
      
      // Close dialog and reset state
      setOpenDeleteDialog(false)
      setMedicationToDelete(null)
      
      toast.success(`Medication ${medicationToDelete.medication_name} deleted successfully!`)
    } catch (err) {
      console.error('Failed to delete medication:', err)
      toast.error('Failed to delete medication. Please try again.')
    } finally {
      setDeletingMedication(false)
    }
  }

  const handleEditMedication = (medication: Medication) => {
    setMedicationToEdit({ ...medication })
    setOpenEditMedicationDialog(true)
  }

  const handleSaveEditedMedication = async () => {
    if (!medicationToEdit) return

    setSavingEditMedication(true)
    try {
      const updateData = {
        medication_name: medicationToEdit.medication_name,
        medication_type: medicationToEdit.medication_type,
        dosage: medicationToEdit.dosage || undefined,
        frequency: medicationToEdit.frequency || undefined,
        purpose: medicationToEdit.purpose || undefined,
        instructions: medicationToEdit.instructions || undefined,
        start_date: medicationToEdit.start_date?.split('T')[0],
        end_date: medicationToEdit.end_date?.split('T')[0] || undefined,
        // Prescription information
        rx_number: medicationToEdit.rx_number || undefined,
        pharmacy: medicationToEdit.pharmacy || undefined,
        original_quantity: medicationToEdit.original_quantity || undefined,
        refills_remaining: medicationToEdit.refills_remaining !== undefined ? medicationToEdit.refills_remaining : undefined,
        last_filled_date: medicationToEdit.last_filled_date?.split('T')[0] || undefined,
      }

      const updatedMedication = await medicationsApiService.updateMedication(
        medicationToEdit.id,
        updateData
      )

      setCurrentMeds((prevMeds) =>
        prevMeds.map((med) => (med.id === medicationToEdit.id ? updatedMedication : med))
      )
      setOpenEditMedicationDialog(false)
      setMedicationToEdit(null)
      toast.success('Medication updated successfully!')
    } catch (err) {
      console.error('Failed to update medication:', err)
      toast.error('Failed to update medication. Please try again.')
    } finally {
      setSavingEditMedication(false)
    }
  }

  // Check if add medication form has any data
  const hasAddFormData = () => {
    return !!(
      newMedication.name ||
      newMedication.dosage ||
      newMedication.frequency ||
      newMedication.purpose ||
      newMedication.prescribedBy ||
      newMedication.instructions ||
      newMedication.prescription.number ||
      newMedication.prescription.pharmacy ||
      newMedication.prescription.originalQuantity ||
      newMedication.prescription.refillsRemaining
    )
  }

  // Check if edit medication form has changes
  const hasEditFormChanges = () => {
    if (!medicationToEdit) return false
    // For edit, we assume any opened edit dialog has potential changes
    return true
  }

  // Handle add medication dialog close attempt
  const handleAddDialogClose = (open: boolean) => {
    if (!open && !savingMedication && hasAddFormData()) {
      // User is trying to close with unsaved data
      setPendingDialogClose('add')
      setShowCloseConfirmation(true)
    } else if (!open) {
      // No data or saving in progress, allow close
      setOpenAddMedicationDialog(false)
      resetAddForm()
    } else {
      // Opening dialog
      setOpenAddMedicationDialog(open)
    }
  }

  // Handle edit medication dialog close attempt
  const handleEditDialogClose = (open: boolean) => {
    if (!open && hasEditFormChanges()) {
      // User is trying to close with potential changes
      setPendingDialogClose('edit')
      setShowCloseConfirmation(true)
    } else if (!open) {
      // Allow close
      setOpenEditMedicationDialog(false)
      setMedicationToEdit(null)
    } else {
      // Opening dialog
      setOpenEditMedicationDialog(open)
    }
  }

  // Confirm close and discard changes
  const confirmCloseDialog = () => {
    if (pendingDialogClose === 'add') {
      setOpenAddMedicationDialog(false)
      resetAddForm()
    } else if (pendingDialogClose === 'edit') {
      setOpenEditMedicationDialog(false)
      setMedicationToEdit(null)
    }
    setPendingDialogClose(null)
  }

  // Cancel close and stay in dialog
  const cancelCloseDialog = () => {
    setPendingDialogClose(null)
  }

  // Reset add medication form
  const resetAddForm = () => {
    setNewMedication({
      name: "",
      dosage: "",
      frequency: "",
      purpose: "",
      prescribedBy: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      instructions: "",
      prescription: {
        number: "",
        pharmacy: "",
        originalQuantity: "",
        refillsRemaining: "",
        lastFilled: new Date().toISOString().split("T")[0],
      },
    })
  }

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src="/middle-aged-man-profile.png" alt="John Doe" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {language === "en" ? "Good morning, John!" : t("medications.greeting").replace("{name}", "John")}
            </h1>
            <p className="text-muted-foreground">
              {language === "en" ? "Manage your medications and reminders" : t("medications.manageReminders")}
            </p>
          </div>
        </div>
        <Dialog 
          open={openAddMedicationDialog} 
          onOpenChange={handleAddDialogClose}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {language === "en"
                ? "Add Medication"
                : language === "pt"
                  ? "Acrescentar medicamento"
                  : t("medications.addMedication")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{language === "en" ? "Add New Medication" : t("medications.addNewMedication")}</DialogTitle>
              <DialogDescription>
                {language === "en" ? "Enter the details of your new medication." : t("medications.enterDetails")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-6">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  {language === "en" ? "Name" : t("medications.name")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  className="col-span-3"
                  placeholder={language === "en" ? "Enter medication name" : t("medications.namePlaceholder")}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dosage" className="text-right">
                  {language === "en" ? "Dosage" : t("medications.dosage")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dosage"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  className="col-span-3"
                  placeholder={language === "en" ? "Enter dosage (e.g., 10mg)" : t("medications.dosagePlaceholder")}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">
                  {language === "en" ? "Frequency" : t("medications.frequency")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="frequency"
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  className="col-span-3"
                  placeholder={
                    language === "en" ? "Enter frequency (e.g., Once daily)" : t("medications.frequencyPlaceholder")
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purpose" className="text-right">
                  {language === "en" ? "Purpose" : t("medications.purpose")}
                </Label>
                <Input
                  id="purpose"
                  value={newMedication.purpose}
                  onChange={(e) => setNewMedication({ ...newMedication, purpose: e.target.value })}
                  className="col-span-3"
                  placeholder={language === "en" ? "What is this medication for?" : t("medications.purposePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prescribedBy" className="text-right">
                  {language === "en" ? "Prescribed By" : t("medications.prescribedBy")}
                </Label>
                <Input
                  id="prescribedBy"
                  value={newMedication.prescribedBy}
                  onChange={(e) => setNewMedication({ ...newMedication, prescribedBy: e.target.value })}
                  className="col-span-3"
                  placeholder={language === "en" ? "Doctor's name" : t("medications.prescribedByPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  {language === "en" ? "Start Date" : t("medications.startDate")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newMedication.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value
                    const newEndDateObj = new Date(newStartDate)
                    newEndDateObj.setDate(newEndDateObj.getDate() + 1)
                    const newEndDate = newEndDateObj.toISOString().split("T")[0]
                    setNewMedication({ 
                      ...newMedication, 
                      startDate: newStartDate,
                      endDate: newEndDate
                    })
                  }}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  {language === "en" ? "End Date" : t("medications.endDate")} <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3">
                  <Input
                    id="endDate"
                    type="date"
                    value={newMedication.endDate}
                    onChange={(e) => setNewMedication({ ...newMedication, endDate: e.target.value })}
                    className={
                      newMedication.startDate && newMedication.endDate && 
                      new Date(newMedication.endDate) <= new Date(newMedication.startDate)
                        ? "border-red-500"
                        : ""
                    }
                    required
                  />
                  {newMedication.startDate && newMedication.endDate && 
                   new Date(newMedication.endDate) <= new Date(newMedication.startDate) && (
                    <p className="text-xs text-red-500 mt-1">
                      {language === "en" ? "End date must be after start date" : "La fecha de finalización debe ser posterior a la fecha de inicio"}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="instructions" className="text-right">
                  {language === "en" ? "Instructions" : t("medications.instructions")}
                </Label>
                <Textarea
                  id="instructions"
                  value={newMedication.instructions}
                  onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                  className="col-span-3"
                  placeholder={language === "en" ? "Enter instructions" : t("medications.instructionsPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  {language === "en" ? "Prescription" : t("medications.prescription")}
                </Label>
                <div className="col-span-3 space-y-2 rounded-md border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="rxNumber" className="text-xs">
                        {t("medications.rxNumber")}
                      </Label>
                      <Input
                        id="rxNumber"
                        value={newMedication.prescription.number}
                        onChange={(e) =>
                          setNewMedication({
                            ...newMedication,
                            prescription: { ...newMedication.prescription, number: e.target.value },
                          })
                        }
                        className="mt-1 h-8"
                        placeholder={language === "en" ? "Prescription number" : t("medications.rxNumberPlaceholder")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pharmacy" className="text-xs">
                        {t("medications.pharmacy")}
                      </Label>
                      <Input
                        id="pharmacy"
                        value={newMedication.prescription.pharmacy}
                        onChange={(e) =>
                          setNewMedication({
                            ...newMedication,
                            prescription: { ...newMedication.prescription, pharmacy: e.target.value },
                          })
                        }
                        className="mt-1 h-8"
                        placeholder={language === "en" ? "Pharmacy name" : t("medications.pharmacyPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="quantity" className="text-xs">
                        {t("medications.quantity")}
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newMedication.prescription.originalQuantity}
                        onChange={(e) =>
                          setNewMedication({
                            ...newMedication,
                            prescription: { ...newMedication.prescription, originalQuantity: e.target.value },
                          })
                        }
                        className="mt-1 h-8"
                        placeholder={language === "en" ? "Original quantity" : t("medications.quantityPlaceholder")}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="refills" className="text-xs">
                        {t("medications.refillsRemaining")}
                      </Label>
                      <Input
                        id="refills"
                        type="number"
                        value={newMedication.prescription.refillsRemaining}
                        onChange={(e) =>
                          setNewMedication({
                            ...newMedication,
                            prescription: { ...newMedication.prescription, refillsRemaining: e.target.value },
                          })
                        }
                        className="mt-1 h-8"
                        placeholder={
                          language === "en" ? "Number of refills" : t("medications.refillsRemainingPlaceholder")
                        }
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastFilled" className="text-xs">
                      {t("medications.lastFilled")}
                    </Label>
                    <Input
                      id="lastFilled"
                      type="date"
                      value={newMedication.prescription.lastFilled}
                      onChange={(e) =>
                        setNewMedication({
                          ...newMedication,
                          prescription: { ...newMedication.prescription, lastFilled: e.target.value },
                        })
                      }
                      className="mt-1 h-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpenAddMedicationDialog(false)}
                disabled={savingMedication}
              >
                {language === "en" ? "Cancel" : t("action.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleAddMedication}
                disabled={
                  !newMedication.name || 
                  !newMedication.dosage || 
                  !newMedication.frequency || 
                  !newMedication.startDate ||
                  !newMedication.endDate ||
                  new Date(newMedication.endDate) <= new Date(newMedication.startDate) ||
                  savingMedication
                }
              >
                {savingMedication && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === "en" ? "Add Medication" : t("medications.addMedication")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="current">
            {language === "en" ? "Current Medications" : t("medications.currentMedications")}
          </TabsTrigger>
          <TabsTrigger value="previous">
            {language === "en" ? "Previous Medications" : t("medications.previousMedications")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {currentMeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Pill className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === "en" ? "No Current Medications" : t("medications.noCurrentMedications")}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {language === "en" 
                  ? "You don't have any active medications. Click the button above to add your first medication."
                  : t("medications.noCurrentMedicationsDesc")}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentMeds.map((medication) => (
              <Card key={medication.id} className="overflow-hidden">
                <CardHeader className="bg-teal-50 dark:bg-teal-900">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center">
                        <Pill className="mr-2 h-5 w-5 text-teal-600 dark:text-teal-400" />
                        {medication.medication_name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-base font-medium">
                        {medication.dosage} • {medication.frequency}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenMessageDialog(medication)}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditMedication(medication)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteMedication(medication.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Purpose */}
                    {medication.purpose && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {language === "en" ? "Purpose:" : t("medications.purpose") + ":"}
                        </span>
                        <span className="text-sm font-medium text-right">{medication.purpose}</span>
                      </div>
                    )}
                    
                    {/* Prescribed By */}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Prescribed By:" : t("medications.prescribedBy") + ":"}
                      </span>
                      <span className="text-sm font-medium">{language === "en" ? "Self" : t("medications.self")}</span>
                    </div>
                    
                    {/* Start Date */}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Start Date:" : t("medications.startDate") + ":"}
                      </span>
                      <span className="text-sm font-medium">{formatDate(medication.start_date)}</span>
                    </div>
                    
                    {/* End Date / End Now Button */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "End Date:" : t("medications.endDate") + ":"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => handleOpenEndDialog(medication)}
                        disabled={endingMedicationId === medication.id}
                      >
                        {endingMedicationId === medication.id ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            {language === "en" ? "Ending..." : t("medications.ending")}
                          </>
                        ) : (
                          <>
                            <Calendar className="mr-1 h-3 w-3" />
                            {language === "en" ? "End Now" : t("medications.endNow")}
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Refill Date */}
                    {medication.last_filled_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {language === "en" ? "Last Refill Date:" : t("medications.lastRefillDate") + ":"}
                        </span>
                        <span className="text-sm font-medium">{formatDate(medication.last_filled_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Prescription Information */}
                  {(medication.rx_number || medication.pharmacy || medication.original_quantity || medication.refills_remaining) && (
                    <div className="mt-4 rounded-md border p-3 bg-gray-50 dark:bg-gray-800">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
                        {language === "en" ? "Prescription Information" : t("medications.prescriptionInfo")}
                      </h4>
                      <div className="space-y-2 text-sm">
                        {medication.rx_number && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {language === "en" ? "Rx Number:" : t("medications.rxNumber") + ":"}
                            </span>
                            <span className="font-medium">{medication.rx_number}</span>
                          </div>
                        )}
                        {medication.pharmacy && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {language === "en" ? "Pharmacy:" : t("medications.pharmacy") + ":"}
                            </span>
                            <span className="font-medium">{medication.pharmacy}</span>
                          </div>
                        )}
                        {medication.original_quantity && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {language === "en" ? "Quantity:" : t("medications.quantity") + ":"}
                            </span>
                            <span className="font-medium">{medication.original_quantity}</span>
                          </div>
                        )}
                        {medication.refills_remaining !== undefined && medication.refills_remaining !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {language === "en" ? "Refills Remaining:" : t("medications.refillsRemaining") + ":"}
                            </span>
                            <span className="font-medium">{medication.refills_remaining}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {medication.instructions && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-50">
                        {language === "en" ? "Instructions" : t("medications.instructions")}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{medication.instructions}</p>
                    </div>
                  )}

                  {/* Reminders */}
                  <div className="mt-4">
                    <MedicationReminderManager
                      medicationId={medication.id}
                      medicationName={medication.medication_name}
                      onReminderChange={() => {
                        loadMedications()
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="previous">
          {previousMeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Pill className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === "en" ? "No Previous Medications" : t("medications.noPreviousMedications")}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {language === "en" 
                  ? "You don't have any previous medications. Medications you end will appear here."
                  : t("medications.noPreviousMedicationsDesc")}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {previousMeds.map((medication) => (
              <Card key={medication.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Pill className="mr-2 h-5 w-5 text-gray-500" />
                        {medication.medication_name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-base font-medium">
                        {medication.medication_type} • {medication.status}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenMessageDialog(medication)}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteMedication(medication.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Purpose */}
                    {medication.purpose && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {language === "en" ? "Purpose:" : t("medications.purpose") + ":"}
                        </span>
                        <span className="text-sm font-medium text-right">{medication.purpose}</span>
                      </div>
                    )}
                    
                    {/* Prescribed By */}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Prescribed By:" : t("medications.prescribedBy") + ":"}
                      </span>
                      <span className="text-sm font-medium">{language === "en" ? "Self" : t("medications.self")}</span>
                    </div>
                    
                    {/* Start Date */}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Start Date:" : t("medications.startDate") + ":"}
                      </span>
                      <span className="text-sm font-medium">{formatDate(medication.start_date)}</span>
                    </div>
                    
                    {/* End Date */}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "End Date:" : t("medications.endDate") + ":"}
                      </span>
                      <span className="text-sm font-medium">{formatDate(medication.end_date)}</span>
                    </div>
                    
                    {/* Reason Ended */}
                    {medication.reason_ended && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {language === "en" ? "Reason Ended:" : t("medications.reasonEnded") + ":"}
                        </span>
                        <span className="text-sm font-medium text-right">{medication.reason_ended}</span>
                      </div>
                    )}
                  </div>

                  {/* Prescription Information */}
                  {(medication.rx_number || medication.pharmacy || medication.original_quantity || medication.refills_remaining) && (
                    <div className="mt-4 rounded-md border p-3 bg-gray-50 dark:bg-gray-800">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
                        {language === "en" ? "Prescription Information" : t("medications.prescriptionInfo")}
                      </h4>
                      <div className="space-y-2 text-sm">
                        {medication.rx_number && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {language === "en" ? "Rx Number:" : t("medications.rxNumber") + ":"}
                            </span>
                            <span className="font-medium">{medication.rx_number}</span>
                          </div>
                        )}
                        {medication.pharmacy && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {language === "en" ? "Pharmacy:" : t("medications.pharmacy") + ":"}
                            </span>
                            <span className="font-medium">{medication.pharmacy}</span>
                          </div>
                        )}
                        {medication.original_quantity && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {language === "en" ? "Quantity:" : t("medications.quantity") + ":"}
                            </span>
                            <span className="font-medium">{medication.original_quantity}</span>
                          </div>
                        )}
                        {medication.refills_remaining !== undefined && medication.refills_remaining !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {language === "en" ? "Refills Remaining:" : t("medications.refillsRemaining") + ":"}
                            </span>
                            <span className="font-medium">{medication.refills_remaining}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={openReminderDialog} onOpenChange={setOpenReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "Add Medication Reminder" : t("medications.addMedicationReminder")}
            </DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Set a reminder to take your medication. You'll receive a notification at the specified time."
                : t("medications.reminderDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                {language === "en" ? "Time" : t("medications.time")}
              </Label>
              <Input
                id="time"
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">{language === "en" ? "Days" : t("medications.days")}</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={newReminder.days.includes(day.id)}
                      onCheckedChange={() => handleDayToggle(day.id)}
                    />
                    <Label htmlFor={day.id} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReminderDialog(false)}>
              {language === "en" ? "Cancel" : t("action.cancel")}
            </Button>
            <Button onClick={handleAddReminder}>
              {language === "en" ? "Save Reminder" : t("medications.saveReminder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openPrescriptionDialog} onOpenChange={setOpenPrescriptionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "Prescription Details" : t("medications.prescriptionDetails")}
            </DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "View and download your prescription information."
                : t("medications.prescriptionDescription")}
            </DialogDescription>
          </DialogHeader>

          {selectedPrescription && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-bold">Prescription #{selectedPrescription.number}</h3>
                  <p className="text-sm text-gray-500">{selectedPrescription.pharmacy}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">
                      {language === "en" ? "Date Prescribed:" : t("medications.datePrescribed") + ":"}
                    </span>
                    <span>{selectedPrescription.datePrescribed || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">
                      {language === "en" ? "Last Filled:" : t("medications.lastFilled") + ":"}
                    </span>
                    <span>{selectedPrescription.lastFilled}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">
                      {language === "en" ? "Original Quantity:" : t("medications.originalQuantity") + ":"}
                    </span>
                    <span>{selectedPrescription.originalQuantity}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">
                      {language === "en" ? "Refills Authorized:" : t("medications.refillsAuthorized") + ":"}
                    </span>
                    <span>{selectedPrescription.refillsAuthorized || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">
                      {language === "en" ? "Refills Remaining:" : t("medications.refillsRemaining") + ":"}
                    </span>
                    <span>{selectedPrescription.refillsRemaining || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {language === "en" ? "Prescriber:" : t("medications.prescriber") + ":"}
                    </span>
                    <span>{selectedPrescription.prescriber || "N/A"}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenPrescriptionDialog(false)}>
                  {language === "en" ? "Cancel" : t("action.cancel")}
                </Button>
                <Button onClick={handleDownloadPrescription}>
                  <FileText className="mr-2 h-4 w-4" />
                  {language === "en" ? "Download PDF" : t("medications.downloadPDF")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openMessageDialog} onOpenChange={setOpenMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "Message Doctor about Medication" : t("medications.messageDoctor")}
            </DialogTitle>
            <DialogDescription>
              {language === "en"
                ? `Send a message to your doctor about ${selectedMedicationForMessage?.name || ""}.`
                : t("medications.messageDescription").replace("{name}", selectedMedicationForMessage?.name || "")}
            </DialogDescription>
          </DialogHeader>

          {selectedMedicationForMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src="/placeholder.svg?height=40&width=40"
                    alt={selectedMedicationForMessage.prescribedBy}
                  />
                  <AvatarFallback>
                    {selectedMedicationForMessage.prescribedBy
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Dr. {selectedMedicationForMessage.prescribedBy}</p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="mr-1 inline-block h-3 w-3" />
                    {language === "en" ? "Typically responds within 24 hours" : t("medications.typicallyResponds")}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">
                  {language === "en" ? "Regarding:" : t("medications.regarding") + ":"}{" "}
                  {selectedMedicationForMessage.name} {selectedMedicationForMessage.dosage}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "en"
                    ? "Include any questions or concerns about this medication"
                    : t("medications.includeQuestions")}
                </p>
              </div>

              <Textarea
                placeholder={language === "en" ? "Type your message here..." : "Type your message here..."}
                className="min-h-[120px]"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenMessageDialog(false)}>
                  {language === "en" ? "Cancel" : t("action.cancel")}
                </Button>
                <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  {language === "en" ? "Send Message" : t("medications.sendMessage")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openEditMedicationDialog} onOpenChange={handleEditDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{language === "en" ? "Edit Medication" : t("medications.editMedication")}</DialogTitle>
            <DialogDescription>
              {language === "en" ? "Update the details of your medication." : t("medications.editDescription")}
            </DialogDescription>
          </DialogHeader>

          {medicationToEdit && (
            <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-6">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  {language === "en" ? "Name" : t("medications.name")}
                </Label>
                <Input
                  id="edit-name"
                  value={medicationToEdit.medication_name}
                  onChange={(e) => setMedicationToEdit({ ...medicationToEdit, medication_name: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-dosage" className="text-right">
                  {language === "en" ? "Dosage" : t("medications.dosage")}
                </Label>
                <Input
                  id="edit-dosage"
                  value={medicationToEdit.dosage}
                  onChange={(e) => setMedicationToEdit({ ...medicationToEdit, dosage: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-frequency" className="text-right">
                  {language === "en" ? "Frequency" : t("medications.frequency")}
                </Label>
                <Input
                  id="edit-frequency"
                  value={medicationToEdit.frequency}
                  onChange={(e) => setMedicationToEdit({ ...medicationToEdit, frequency: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-purpose" className="text-right">
                  {language === "en" ? "Purpose" : t("medications.purpose")}
                </Label>
                <Input
                  id="edit-purpose"
                  value={medicationToEdit.purpose}
                  onChange={(e) => setMedicationToEdit({ ...medicationToEdit, purpose: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-instructions" className="text-right">
                  {language === "en" ? "Instructions" : t("medications.instructions")}
                </Label>
                <Textarea
                  id="edit-instructions"
                  value={medicationToEdit.instructions}
                  onChange={(e) => setMedicationToEdit({ ...medicationToEdit, instructions: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-startDate" className="text-right">
                  {language === "en" ? "Start Date" : t("medications.startDate")}
                </Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={medicationToEdit.start_date?.split('T')[0] || ''}
                  onChange={(e) => setMedicationToEdit({ ...medicationToEdit, start_date: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-endDate" className="text-right">
                  {language === "en" ? "End Date" : t("medications.endDate")}
                </Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={medicationToEdit.end_date?.split('T')[0] || ''}
                  onChange={(e) => setMedicationToEdit({ ...medicationToEdit, end_date: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  {language === "en" ? "Prescription" : t("medications.prescription")}
                </Label>
                <div className="col-span-3 space-y-2 rounded-md border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="edit-rxNumber" className="text-xs">
                        {t("medications.rxNumber")}
                      </Label>
                      <Input
                        id="edit-rxNumber"
                        value={medicationToEdit.rx_number || ''}
                        onChange={(e) => setMedicationToEdit({ ...medicationToEdit, rx_number: e.target.value })}
                        className="mt-1 h-8"
                        placeholder={language === "en" ? "Prescription number" : t("medications.rxNumberPlaceholder")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-pharmacy" className="text-xs">
                        {t("medications.pharmacy")}
                      </Label>
                      <Input
                        id="edit-pharmacy"
                        value={medicationToEdit.pharmacy || ''}
                        onChange={(e) => setMedicationToEdit({ ...medicationToEdit, pharmacy: e.target.value })}
                        className="mt-1 h-8"
                        placeholder={language === "en" ? "Pharmacy name" : t("medications.pharmacyPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="edit-quantity" className="text-xs">
                        {t("medications.quantity")}
                      </Label>
                      <Input
                        id="edit-quantity"
                        type="number"
                        value={medicationToEdit.original_quantity || ''}
                        onChange={(e) => setMedicationToEdit({ ...medicationToEdit, original_quantity: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="mt-1 h-8"
                        placeholder={language === "en" ? "Original quantity" : t("medications.quantityPlaceholder")}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-refills" className="text-xs">
                        {t("medications.refillsRemaining")}
                      </Label>
                      <Input
                        id="edit-refills"
                        type="number"
                        value={medicationToEdit.refills_remaining !== undefined ? medicationToEdit.refills_remaining : ''}
                        onChange={(e) => setMedicationToEdit({ ...medicationToEdit, refills_remaining: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="mt-1 h-8"
                        placeholder={language === "en" ? "Number of refills" : t("medications.refillsRemainingPlaceholder")}
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-lastFilled" className="text-xs">
                      {t("medications.lastFilled")}
                    </Label>
                    <Input
                      id="edit-lastFilled"
                      type="date"
                      value={medicationToEdit.last_filled_date?.split('T')[0] || ''}
                      onChange={(e) => setMedicationToEdit({ ...medicationToEdit, last_filled_date: e.target.value })}
                      className="mt-1 h-8"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpenEditMedicationDialog(false)}
              disabled={savingEditMedication}
            >
              {language === "en" ? "Cancel" : t("action.cancel")}
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveEditedMedication}
              disabled={savingEditMedication}
            >
              {savingEditMedication ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "en" ? "Saving..." : t("action.saving")}
                </>
              ) : (
                language === "en" ? "Save Changes" : t("medications.saveChanges")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Medication Confirmation Dialog */}
      <Dialog open={openEndDialog} onOpenChange={(open) => {
        if (!open && !endingMedicationId) {
          setOpenEndDialog(false)
          setMedicationToEnd(null)
          setEndReason("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "End Medication" : t("medications.endMedication")}
            </DialogTitle>
            <DialogDescription>
              {language === "en" 
                ? `Are you sure you want to end "${medicationToEnd?.medication_name}"? You can optionally provide a reason.`
                : t("medications.endMedicationDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="end-reason">
              {language === "en" ? "Reason (Optional)" : t("medications.endReason")}
            </Label>
            <Textarea
              id="end-reason"
              value={endReason}
              onChange={(e) => setEndReason(e.target.value)}
              placeholder={language === "en" ? "e.g., Completed treatment, Side effects, Switched to alternative..." : t("medications.endReasonPlaceholder")}
              className="mt-2"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenEndDialog(false)
                setMedicationToEnd(null)
                setEndReason("")
              }}
              disabled={endingMedicationId !== null}
            >
              {language === "en" ? "Cancel" : t("action.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleEndMedication}
              disabled={endingMedicationId !== null}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {endingMedicationId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "en" ? "Ending..." : t("medications.ending")}
                </>
              ) : (
                language === "en" ? "End Medication" : t("medications.endMedication")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        onConfirm={confirmDeleteMedication}
        title="Delete Medication"
        itemName={medicationToDelete?.medication_name}
        loading={deletingMedication}
        variant="destructive"
      />

      {/* Close Confirmation Dialog */}
      <ConfirmDialog
        open={showCloseConfirmation}
        onOpenChange={setShowCloseConfirmation}
        onConfirm={confirmCloseDialog}
        onCancel={cancelCloseDialog}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to close? All changes will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="destructive"
      />
    </div>
  )
}
