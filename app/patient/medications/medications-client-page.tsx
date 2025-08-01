"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState } from "react"
import { medications } from "@/lib/data"
import { Clock, Edit, FileText, Plus, Pill, Trash2, MessageSquare, Calendar, Send } from "lucide-react"
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
  // Add fallback empty arrays if medications or its properties are undefined
  const medicationsData = medications || { current: [], previous: [] }
  const [currentMeds, setCurrentMeds] = useState(medicationsData.current || [])
  const [previousMeds] = useState(medicationsData.previous || [])
  const [openReminderDialog, setOpenReminderDialog] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null)
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
  const [newMedication, setNewMedication] = useState({
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

  const [openEditMedicationDialog, setOpenEditMedicationDialog] = useState(false)
  const [medicationToEdit, setMedicationToEdit] = useState<any>(null)

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

  const handleToggleReminder = (medId: string, reminderId: string) => {
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

  const handleDeleteReminder = (medId: string, reminderId: string) => {
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

  const handleAddMedication = () => {
    const newMed = {
      id: `med${Date.now()}`,
      ...newMedication,
      reminders: [],
    }

    setCurrentMeds([...currentMeds, newMed])
    setOpenAddMedicationDialog(false)
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

  const handleEndMedication = (medId: string) => {
    // Move medication from current to previous
    const medToEnd = currentMeds.find((med) => med.id === medId)
    if (!medToEnd) return

    // In a real app, this would update the backend
    setCurrentMeds(currentMeds.filter((med) => med.id !== medId))

    // This would normally update the previousMeds state, but for this demo
    // we're just showing the alert
    alert(`Medication ${medToEnd.name} has been ended and moved to previous medications`)
  }

  const handleEditMedication = (medication: any) => {
    setMedicationToEdit({ ...medication })
    setOpenEditMedicationDialog(true)
  }

  const handleSaveEditedMedication = () => {
    if (!medicationToEdit) return

    setCurrentMeds((prevMeds) =>
      prevMeds.map((med) => {
        if (med.id === medicationToEdit.id) {
          return medicationToEdit
        }
        return med
      }),
    )

    setOpenEditMedicationDialog(false)
    setMedicationToEdit(null)
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
        <Dialog open={openAddMedicationDialog} onOpenChange={setOpenAddMedicationDialog}>
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
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === "en" ? "Add New Medication" : t("medications.addNewMedication")}</DialogTitle>
              <DialogDescription>
                {language === "en" ? "Enter the details of your new medication." : t("medications.enterDetails")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  {language === "en" ? "Name" : t("medications.name")}
                </Label>
                <Input
                  id="name"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  className="col-span-3"
                  placeholder={language === "en" ? "Enter medication name" : t("medications.namePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dosage" className="text-right">
                  {language === "en" ? "Dosage" : t("medications.dosage")}
                </Label>
                <Input
                  id="dosage"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  className="col-span-3"
                  placeholder={language === "en" ? "Enter dosage (e.g., 10mg)" : t("medications.dosagePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">
                  {language === "en" ? "Frequency" : t("medications.frequency")}
                </Label>
                <Input
                  id="frequency"
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  className="col-span-3"
                  placeholder={
                    language === "en" ? "Enter frequency (e.g., Once daily)" : t("medications.frequencyPlaceholder")
                  }
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
                  {language === "en" ? "Start Date" : t("medications.startDate")}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newMedication.startDate}
                  onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  {language === "en" ? "End Date" : t("medications.endDate")}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newMedication.endDate}
                  onChange={(e) => setNewMedication({ ...newMedication, endDate: e.target.value })}
                  className="col-span-3"
                />
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
                        value={newMedication.prescription.originalQuantity}
                        onChange={(e) =>
                          setNewMedication({
                            ...newMedication,
                            prescription: { ...newMedication.prescription, originalQuantity: e.target.value },
                          })
                        }
                        className="mt-1 h-8"
                        placeholder={language === "en" ? "Original quantity" : t("medications.quantityPlaceholder")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="refills" className="text-xs">
                        {t("medications.refillsRemaining")}
                      </Label>
                      <Input
                        id="refills"
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenAddMedicationDialog(false)}>
                {language === "en" ? "Cancel" : t("action.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleAddMedication}
                disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency}
              >
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentMeds.map((medication) => (
              <Card key={medication.id} className="overflow-hidden">
                <CardHeader className="bg-teal-50 dark:bg-teal-900">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Pill className="mr-2 h-5 w-5 text-teal-600 dark:text-teal-400" />
                        {medication.name}
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Purpose:" : t("medications.purpose") + ":"}
                      </span>
                      <span className="text-sm font-medium">{medication.purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Prescribed By:" : t("medications.prescribedBy") + ":"}
                      </span>
                      <span className="text-sm font-medium">{medication.prescribedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Start Date:" : t("medications.startDate") + ":"}
                      </span>
                      <span className="text-sm font-medium">{medication.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "End Date:" : t("medications.endDate") + ":"}
                      </span>
                      <span className="text-sm font-medium">
                        {medication.endDate || (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleEndMedication(medication.id)}
                          >
                            <Calendar className="mr-1 h-3 w-3" />
                            {language === "en" ? "End Now" : t("medications.endNow")}
                          </Button>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Refill Date:" : t("medications.refillDate") + ":"}
                      </span>
                      <span className="text-sm font-medium">{medication.refillDate}</span>
                    </div>
                  </div>

                  {medication.prescription && (
                    <div className="mb-4 mt-4 rounded-md border p-3 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          {language === "en" ? "Prescription Information" : t("medications.prescriptionInfo")}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleViewPrescription(medication.prescription)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          {language === "en" ? "View Rx" : t("medications.viewRx")}
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {language === "en" ? "Rx Number:" : t("medications.rxNumber") + ":"}
                          </span>
                          <span className="font-medium">{medication.prescription.number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {language === "en" ? "Pharmacy:" : t("medications.pharmacy") + ":"}
                          </span>
                          <span className="font-medium">{medication.prescription.pharmacy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {language === "en" ? "Quantity:" : t("medications.quantity") + ":"}
                          </span>
                          <span className="font-medium">{medication.prescription.originalQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {language === "en" ? "Refills Remaining:" : t("medications.refillsRemaining") + ":"}
                          </span>
                          <span className="font-medium">{medication.prescription.refillsRemaining}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {language === "en" ? "Last Filled:" : t("medications.lastFilled") + ":"}
                          </span>
                          <span className="font-medium">{medication.prescription.lastFilled}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-2 mt-4">
                    <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-50">
                      {language === "en" ? "Instructions" : t("medications.instructions")}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{medication.instructions}</p>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {language === "en" ? "Reminders" : t("medications.reminders")}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setSelectedMedication(medication.id)
                          setOpenReminderDialog(true)
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {language === "en" ? "Add" : t("medications.add")}
                      </Button>
                    </div>

                    {medication.reminders && medication.reminders.length > 0 ? (
                      <div className="space-y-2">
                        {medication.reminders.map((reminder) => (
                          <div
                            key={reminder.id}
                            className="flex items-center justify-between rounded-md border p-2 text-sm"
                          >
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-gray-500" />
                              <span>{reminder.time}</span>
                              <Badge variant="outline" className="ml-2 px-1 text-xs">
                                {reminder.days.length === 7
                                  ? language === "en"
                                    ? "Daily"
                                    : t("medications.daily")
                                  : reminder.days.map((day) => day.substring(0, 1).toUpperCase()).join(", ")}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={reminder.enabled}
                                onCheckedChange={() => handleToggleReminder(medication.id, reminder.id)}
                                size="sm"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeleteReminder(medication.id, reminder.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {language === "en" ? "No reminders set" : t("medications.noRemindersSet")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="previous">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {previousMeds.map((medication) => (
              <Card key={medication.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Pill className="mr-2 h-5 w-5 text-gray-500" />
                        {medication.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-base font-medium">
                        {medication.dosage} • {medication.frequency}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenMessageDialog(medication)}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Purpose:" : t("medications.purpose") + ":"}
                      </span>
                      <span className="text-sm font-medium">{medication.purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Prescribed By:" : t("medications.prescribedBy") + ":"}
                      </span>
                      <span className="text-sm font-medium">{medication.prescribedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Start Date:" : t("medications.startDate") + ":"}
                      </span>
                      <span className="text-sm font-medium">{medication.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "End Date:" : t("medications.endDate") + ":"}
                      </span>
                      <span className="text-sm font-medium">{medication.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Reason Ended:" : t("medications.reasonEnded") + ":"}
                      </span>
                      <span className="text-sm font-medium">{medication.reason}</span>
                    </div>
                  </div>

                  {medication.prescription && (
                    <div className="mb-4 rounded-md border p-3 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          {language === "en" ? "Prescription Information" : t("medications.prescriptionInfo")}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleViewPrescription(medication.prescription)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          {language === "en" ? "View Rx" : t("medications.viewRx")}
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {language === "en" ? "Rx Number:" : t("medications.rxNumber") + ":"}
                          </span>
                          <span className="font-medium">{medication.prescription.number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {language === "en" ? "Pharmacy:" : t("medications.pharmacy") + ":"}
                          </span>
                          <span className="font-medium">{medication.prescription.pharmacy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {language === "en" ? "Quantity:" : t("medications.quantity") + ":"}
                          </span>
                          <span className="font-medium">{medication.prescription.originalQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {language === "en" ? "Last Filled:" : t("medications.lastFilled") + ":"}
                          </span>
                          <span className="font-medium">{medication.prescription.lastFilled}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
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
                      .map((n) => n[0])
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

      <Dialog open={openEditMedicationDialog} onOpenChange={setOpenEditMedicationDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Edit Medication" : t("medications.editMedication")}</DialogTitle>
            <DialogDescription>
              {language === "en" ? "Update the details of your medication." : t("medications.editDescription")}
            </DialogDescription>
          </DialogHeader>

          {medicationToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  {language === "en" ? "Name" : t("medications.name")}
                </Label>
                <Input
                  id="edit-name"
                  value={medicationToEdit.name}
                  onChange={(e) => setMedicationToEdit({ ...medicationToEdit, name: e.target.value })}
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
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenEditMedicationDialog(false)}>
              {language === "en" ? "Cancel" : t("action.cancel")}
            </Button>
            <Button type="button" onClick={handleSaveEditedMedication}>
              {language === "en" ? "Save Changes" : t("medications.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
