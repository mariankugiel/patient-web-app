"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  Heart,
  Settings,
  Users,
  FileText,
  CalendarIcon as CalendarIconAlt,
  Plus,
  Trash2,
  Bell,
  X,
  Check,
  Globe,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { type Language, getTranslation } from "@/lib/translations"
import { WelcomePage } from "./welcome-page"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { updateUser } from "@/lib/features/auth/authSlice"
import { createClient } from "@/lib/supabase-client"

interface FormData {
  // Personal Information
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  height: string
  weight: string
  waistDiameter: string
  location: string
  country: string
  phone: string
  email: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string

  // Medical Condition
  currentHealthProblems: Array<{
    condition: string
    yearOfDiagnosis: string
    diagnosticProvider: string
    treatment: string
    comments: string
  }>
  medications: Array<{
    drugName: string
    purpose: string
    dosage: string
    frequency: string
    schedule: Array<{ time: string; days: string[] }>
    hasReminder: boolean
    reminderTime?: string
    reminderDays?: string[]
  }>
  pastMedicalConditions: Array<{
    condition: string
    yearOfDiagnosis: string
    yearResolved: string
    treatment: string
    comments: string
  }>
  pastSurgeries: Array<{
    surgeryType: string
    year: string
    location: string
    existingConditions: string
    comments: string
  }>

  // Family Conditions
  hasParents: boolean
  hasSiblings: boolean
  hasGrandparents: boolean
  hasKids: boolean
  numSiblings: number
  numChildren: number
  familyHistory: {
    parents: Array<{
      relation: string
      isAlive: boolean
      isHealthy: boolean
      diseases: Array<{ disease: string; ageAtDiagnosis: string }>
      causeOfDeath?: string
      ageAtDeath?: string
      chronicDiseases: Array<{ condition: string; ageAtDiagnosis: string; comments: string }>
    }>
    siblings: Array<{
      relation: string
      isAlive: boolean
      isHealthy: boolean
      diseases: Array<{ disease: string; ageAtDiagnosis: string }>
      causeOfDeath?: string
      ageAtDeath?: string
      chronicDiseases: Array<{ condition: string; ageAtDiagnosis: string; comments: string }>
    }>
    grandparents: Array<{
      relation: string
      isAlive: boolean
      isHealthy: boolean
      diseases: Array<{ disease: string; ageAtDiagnosis: string }>
      causeOfDeath?: string
      ageAtDeath?: string
      chronicDiseases: Array<{ condition: string; ageAtDiagnosis: string; comments: string }>
    }>
    kids: Array<{
      relation: string
      isAlive: boolean
      isHealthy: boolean
      diseases: Array<{ disease: string; ageAtDiagnosis: string }>
      causeOfDeath?: string
      ageAtDeath?: string
      chronicDiseases: Array<{ condition: string; ageAtDiagnosis: string; comments: string }>
    }>
    numberOfSiblings: number
    numberOfChildren: number
  }

  // Health Records
  labAnalysis: File | null
  medicalImages: Array<{ file: File; category: string; conclusion: string; status: string; date: Date | undefined }>

  // Health Plan
  wantsHealthGoals: boolean
  healthGoals: Array<{ goal: string; targetDate: Date | undefined }>

  healthTasks: Array<{
    name: string
    frequency: string
    weeklyDays?: string[]
    monthlyDays?: number[]
    comments: string
  }>

  // Appointments
  upcomingAppointments: Array<{
    doctorName: string
    specialty: string
    date: Date | undefined
    time: string
    location: string
    reason: string
    doctorEmail: string
  }>

  // Access Permissions
  allowAccess: boolean
  accessPermissions: Array<{ person: string; relationship: string; accessType: string; areas: string[] }>

  healthProfessionals: Array<{
    name: string
    specialty: string
    email: string
    permissions: {
      medicalHistory: { view: boolean; download: boolean; edit: boolean }
      healthRecords: { view: boolean; download: boolean; edit: boolean }
      healthPlan: { view: boolean; download: boolean; edit: boolean }
      medications: { view: boolean; download: boolean; edit: boolean }
      appointments: { view: boolean; download: boolean; edit: boolean }
      messages: { view: boolean; download: boolean; edit: boolean }
    }
  }>
  familyFriends: Array<{
    name: string
    relationship: string
    email: string
    permissions: {
      medicalHistory: { view: boolean; download: boolean; edit: boolean }
      healthRecords: { view: boolean; download: boolean; edit: boolean }
      healthPlan: { view: boolean; download: boolean; edit: boolean }
      medications: { view: boolean; download: boolean; edit: boolean }
      appointments: { view: boolean; download: boolean; edit: boolean }
      messages: { view: boolean; download: boolean; edit: boolean }
    }
  }>

  // Settings
  language: string
  notifications: {
    email: boolean
    sms: boolean
    appointmentReminders: boolean
    healthTips: boolean
    marketingEmails: boolean
  }
  twoFactorAuth: boolean
  shareWithAppointments: any
  appointmentAccessAreas: any[]
  emailNotifications: any
  smsNotifications: any
  appointmentReminders: any
  dataSharing: any
}

const getSteps = (language: Language) => [
  { id: 1, title: getTranslation(language, "steps.personalInfo"), icon: Users },
  { id: 2, title: getTranslation(language, "steps.medicalCondition"), icon: Heart },
  { id: 3, title: getTranslation(language, "steps.familyHistory"), icon: Users },
  { id: 4, title: getTranslation(language, "steps.healthRecords"), icon: FileText },
  { id: 5, title: getTranslation(language, "steps.healthPlan"), icon: CalendarIconAlt },
  { id: 6, title: getTranslation(language, "steps.appointments"), icon: CalendarIconAlt },
  { id: 7, title: getTranslation(language, "steps.permissions"), icon: Settings },
  { id: 8, title: getTranslation(language, "steps.settings"), icon: Settings },
]

export function OnboardingSurvey() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)
  const [showWelcome, setShowWelcome] = useState(true)
  const [language, setLanguage] = useState<Language>("en-US")
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    height: "",
    weight: "",
    waistDiameter: "",
    location: "",
    country: "",
    phone: "",
    email: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    currentHealthProblems: [],
    medications: [],
    pastMedicalConditions: [],
    pastSurgeries: [],
    hasParents: false,
    hasSiblings: false,
    hasGrandparents: false,
    hasKids: false,
    numSiblings: 0,
    numChildren: 0,
    familyHistory: {
      parents: [
        {
          relation: "Mother",
          isAlive: true,
          isHealthy: true,
          diseases: [],
          chronicDiseases: [],
        },
        {
          relation: "Father",
          isAlive: true,
          isHealthy: true,
          diseases: [],
          chronicDiseases: [],
        },
      ],
      siblings: [],
      grandparents: [
        {
          relation: "Maternal Grandmother",
          isAlive: true,
          isHealthy: true,
          diseases: [],
          chronicDiseases: [],
        },
        {
          relation: "Maternal Grandfather",
          isAlive: true,
          isHealthy: true,
          diseases: [],
          chronicDiseases: [],
        },
        {
          relation: "Paternal Grandmother",
          isAlive: true,
          isHealthy: true,
          diseases: [],
          chronicDiseases: [],
        },
        {
          relation: "Paternal Grandfather",
          isAlive: true,
          isHealthy: true,
          diseases: [],
          chronicDiseases: [],
        },
      ],
      kids: [],
      numberOfSiblings: 0,
      numberOfChildren: 0,
    },
    labAnalysis: null,
    medicalImages: [],
    wantsHealthGoals: false,
    healthGoals: [],
    healthTasks: [],
    upcomingAppointments: [],
    allowAccess: false,
    accessPermissions: [],
    language: "en",
    notifications: {
      email: true,
      sms: false,
      appointmentReminders: true,
      healthTips: false,
      marketingEmails: false,
    },
    twoFactorAuth: false,
    healthProfessionals: [],
    shareWithAppointments: false,
    appointmentAccessAreas: [],
    emailNotifications: false,
    smsNotifications: false,
    appointmentReminders: false,
    dataSharing: false,
    familyFriends: [],
  })

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const markStepComplete = (stepId: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]))
  }

  const nextStep = () => {
    markStepComplete(currentStep)
    if (currentStep < getSteps(language).length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId)
  }

  const handleStartSurvey = () => {
    setShowWelcome(false)
  }

  const handleSkipSurvey = async () => {
    if (user) {
      try {
        const supabase = createClient()
        
        // Mark onboarding as skipped in Supabase
        const { error } = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            onboarding_completed: true, // Mark as completed (skipped)
            onboarding_skipped: true, // Flag to indicate it was skipped
            onboarding_skipped_at: new Date().toISOString(),
            is_new_user: false,
          }
        })

        if (error) {
          console.error('Error updating user metadata:', error)
        } else {
          // Update Redux state
          dispatch(updateUser({
            user_metadata: {
              ...user.user_metadata,
              onboarding_completed: true,
              onboarding_skipped: true,
              onboarding_skipped_at: new Date().toISOString(),
              is_new_user: false,
            }
          }))
        }
      } catch (error) {
        console.error('Error marking onboarding as skipped:', error)
        // Still update Redux state even if API call fails
        dispatch(updateUser({
          user_metadata: {
            ...user.user_metadata,
            onboarding_completed: true,
            onboarding_skipped: true,
            is_new_user: false,
          }
        }))
      }
    }
    
    router.push("/patient/dashboard")
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const addHealthProfessional = () => {
    const newProfessional = {
      name: "",
      specialty: "",
      email: "",
      permissions: {
        medicalHistory: { view: false, download: false, edit: false },
        healthRecords: { view: false, download: false, edit: false },
        healthPlan: { view: false, download: false, edit: false },
        medications: { view: false, download: false, edit: false },
        appointments: { view: false, download: false, edit: false },
        messages: { view: false, download: false, edit: false },
      },
    }
    updateFormData("healthProfessionals", [...formData.healthProfessionals, newProfessional])
  }

  const updateHealthProfessional = (index: number, field: string, value: any) => {
    const updatedProfessionals = [...formData.healthProfessionals]
    updatedProfessionals[index] = { ...updatedProfessionals[index], [field]: value }
    updateFormData("healthProfessionals", updatedProfessionals)
  }

  const addFamilyFriend = () => {
    const newFriend = {
      name: "",
      relationship: "",
      email: "",
      permissions: {
        medicalHistory: { view: false, download: false, edit: false },
        healthRecords: { view: false, download: false, edit: false },
        healthPlan: { view: false, download: false, edit: false },
        medications: { view: false, download: false, edit: false },
        appointments: { view: false, download: false, edit: false },
        messages: { view: false, download: false, edit: false },
      },
    }
    updateFormData("familyFriends", [...formData.familyFriends, newFriend])
  }

  const updateFamilyFriend = (index: number, field: string, value: any) => {
    const updatedFriends = [...formData.familyFriends]
    updatedFriends[index] = { ...updatedFriends[index], [field]: value }
    updateFormData("familyFriends", updatedFriends)
  }

  const markOnboardingCompleted = async () => {
    if (user) {
      try {
        const supabase = createClient()
        
        // Update user metadata to mark onboarding as completed
        const { error } = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            phone_number: formData.phone,
            date_of_birth: formData.dateOfBirth,
            address: formData.location,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            gender: formData.gender,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            is_new_user: false,
          }
        })

        if (error) {
          console.error('Error updating user metadata:', error)
        } else {
          // Update Redux state
          dispatch(updateUser({
            user_metadata: {
              ...user.user_metadata,
              full_name: `${formData.firstName} ${formData.lastName}`.trim(),
              phone_number: formData.phone,
              date_of_birth: formData.dateOfBirth,
              address: formData.location,
              emergency_contact_name: formData.emergencyContactName,
              emergency_contact_phone: formData.emergencyContactPhone,
              gender: formData.gender,
              onboarding_completed: true,
              onboarding_completed_at: new Date().toISOString(),
              is_new_user: false,
            }
          }))
        }
      } catch (error) {
        console.error('Error marking onboarding as completed:', error)
        // Still update Redux state even if API call fails
        dispatch(updateUser({
          user_metadata: {
            ...user.user_metadata,
            onboarding_completed: true,
            is_new_user: false,
          }
        }))
      }
    }
  }

  if (showWelcome) {
    return (
      <WelcomePage
        language={language}
        onLanguageChange={handleLanguageChange}
        onStart={handleStartSurvey}
        onSkip={handleSkipSurvey}
      />
    )
  }

  const steps = getSteps(language)
  const progress = (currentStep / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-card to-background">
      {/* Header */}
      <div className="text-white p-4" style={{ backgroundColor: "rgb(230, 247, 247)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/images/saluso-logo-horizontal.png" alt="Saluso" width={120} height={40} className="h-8 w-auto" />
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-teal-600" />
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40 bg-white text-teal-600 border-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">{getTranslation(language, "languages.en-US")}</SelectItem>
                <SelectItem value="es-ES">{getTranslation(language, "languages.es-ES")}</SelectItem>
                <SelectItem value="pt-PT">{getTranslation(language, "languages.pt-PT")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-teal-600">
            {getTranslation(language, "navigation.step")} {currentStep} {getTranslation(language, "navigation.of")}{" "}
            {steps.length}
          </div>
        </div>
      </div>

      <div className="bg-teal-700 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="w-full h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step) => {
              const Icon = step.icon
              const isCompleted = completedSteps.has(step.id)
              const isCurrent = step.id === currentStep
              const isAccessible = step.id <= currentStep || isCompleted

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center space-y-2 text-xs cursor-pointer transition-colors",
                    isAccessible ? "text-white hover:text-white/80" : "text-white/60",
                  )}
                  onClick={() => isAccessible && goToStep(step.id)}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                          ? "bg-white border-white text-teal-700"
                          : isAccessible
                            ? "border-white text-white"
                            : "border-white/60 text-white/60",
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-center text-balance leading-tight">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-balance">{steps[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <PersonalInformationStep formData={formData} updateFormData={updateFormData} language={language} />
            )}
            {currentStep === 2 && (
              <MedicalConditionStep formData={formData} updateFormData={updateFormData} language={language} />
            )}
            {currentStep === 3 && <FamilyHistoryStep formData={formData} updateFormData={updateFormData} />}
            {currentStep === 4 && (
              <HealthRecordsStep formData={formData} updateFormData={updateFormData} language={language} />
            )}
            {currentStep === 5 && <HealthPlanStep formData={formData} updateFormData={updateFormData} />}
            {currentStep === 6 && <AppointmentsStep formData={formData} updateFormData={updateFormData} />}
            {currentStep === 7 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    {getTranslation(language, "permissions.healthProfessionals")}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">
                      {getTranslation(language, "permissions.authorizedProfessionals")}
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addHealthProfessional}>
                      <Plus className="w-4 h-4 mr-2" />
                      {getTranslation(language, "permissions.addProfessional")}
                    </Button>
                  </div>

                  {formData.healthProfessionals.map((professional, index) => (
                    <Card key={index} className="mb-4 border-2 border-gray-300">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label>{getTranslation(language, "permissions.name")}</Label>
                            <Input
                              value={professional.name}
                              onChange={(e) => updateHealthProfessional(index, "name", e.target.value)}
                              placeholder={getTranslation(language, "permissions.namePlaceholder")}
                              className="border-2 border-gray-300"
                            />
                          </div>
                          <div>
                            <Label>{getTranslation(language, "permissions.specialty")}</Label>
                            <Input
                              value={professional.specialty}
                              onChange={(e) => updateHealthProfessional(index, "specialty", e.target.value)}
                              placeholder={getTranslation(language, "permissions.specialtyPlaceholder")}
                              className="border-2 border-gray-300"
                            />
                          </div>
                          <div>
                            <Label>{getTranslation(language, "permissions.email")}</Label>
                            <Input
                              value={professional.email}
                              onChange={(e) => updateHealthProfessional(index, "email", e.target.value)}
                              placeholder={getTranslation(language, "permissions.emailPlaceholder")}
                              className="border-2 border-gray-300"
                            />
                          </div>
                        </div>
                        {(() => {
                          const renderPermissionsTable = (person: any, updateFunction: Function, index: number) => {
                            const categories = [
                              { key: "medicalHistory", label: getTranslation(language, "permissions.medicalHistory") },
                              { key: "healthRecords", label: getTranslation(language, "permissions.healthRecords") },
                              { key: "healthPlan", label: getTranslation(language, "permissions.healthPlan") },
                              { key: "medications", label: getTranslation(language, "permissions.medications") },
                              { key: "appointments", label: getTranslation(language, "permissions.appointments") },
                              { key: "messages", label: getTranslation(language, "permissions.messages") },
                            ]

                            return (
                              <div className="mt-4">
                                <Label className="text-sm font-medium text-gray-600 mb-3 block">
                                  {getTranslation(language, "permissions.updateAccess")}
                                </Label>
                                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                                  <div className="grid grid-cols-4 bg-gray-50 border-b">
                                    <div className="p-3 font-medium">
                                      {getTranslation(language, "permissions.category")}
                                    </div>
                                    <div className="p-3 font-medium text-center">
                                      {getTranslation(language, "permissions.view")}
                                    </div>
                                    <div className="p-3 font-medium text-center">
                                      {getTranslation(language, "permissions.download")}
                                    </div>
                                    <div className="p-3 font-medium text-center">
                                      {getTranslation(language, "permissions.edit")}
                                    </div>
                                  </div>
                                  {categories.map((category) => (
                                    <div key={category.key} className="grid grid-cols-4 border-b last:border-b-0">
                                      <div className="p-3 flex items-center">
                                        <span>{category.label}</span>
                                      </div>
                                      <div className="p-3 flex justify-center">
                                        <Checkbox
                                          checked={person.permissions[category.key]?.view || false}
                                          onCheckedChange={(checked: boolean) =>
                                            updateFunction(index, `permissions.${category.key}.view`, checked)
                                          }
                                          className="border-2 border-gray-300"
                                        />
                                      </div>
                                      <div className="p-3 flex justify-center">
                                        {category.key === "appointments" || category.key === "messages" ? (
                                          <span className="text-gray-400">-</span>
                                        ) : (
                                          <Checkbox
                                            checked={person.permissions[category.key]?.download || false}
                                            onCheckedChange={(checked: boolean) =>
                                              updateFunction(index, `permissions.${category.key}.download`, checked)
                                            }
                                            className="border-2 border-gray-300"
                                          />
                                        )}
                                      </div>
                                      <div className="p-3 flex justify-center">
                                        <Checkbox
                                          checked={person.permissions[category.key]?.edit || false}
                                          onCheckedChange={(checked: boolean) =>
                                            updateFunction(index, `permissions.${category.key}.edit`, checked)
                                          }
                                          className="border-2 border-gray-300"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                          return renderPermissionsTable(professional, updateHealthProfessional, index)
                        })()}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">{getTranslation(language, "permissions.familyFriends")}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">
                      {getTranslation(language, "permissions.authorizedContacts")}
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFamilyFriend}>
                      <Plus className="w-4 h-4 mr-2" />
                      {getTranslation(language, "permissions.addContact")}
                    </Button>
                  </div>

                  {formData.familyFriends.map((contact, index) => (
                    <Card key={index} className="mb-4 border-2 border-gray-300">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={contact.name}
                              onChange={(e) => updateFamilyFriend(index, "name", e.target.value)}
                              placeholder="Full name"
                              className="border-2 border-gray-300"
                            />
                          </div>
                          <div>
                            <Label>Relationship</Label>
                            <Select
                              value={contact.relationship}
                              onValueChange={(value: string) => updateFamilyFriend(index, "relationship", value)}
                            >
                              <SelectTrigger className="border-2 border-gray-300">
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="spousePartner">
                                  {getTranslation(language, "options.spousePartner")}
                                </SelectItem>
                                <SelectItem value="parent">{getTranslation(language, "options.parent")}</SelectItem>
                                <SelectItem value="child">{getTranslation(language, "options.child")}</SelectItem>
                                <SelectItem value="sibling">{getTranslation(language, "options.sibling")}</SelectItem>
                                <SelectItem value="friend">{getTranslation(language, "options.friend")}</SelectItem>
                                <SelectItem value="other">{getTranslation(language, "options.other")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              value={contact.email}
                              onChange={(e) => updateFamilyFriend(index, "email", e.target.value)}
                              placeholder="email@example.com"
                              className="border-2 border-gray-300"
                            />
                          </div>
                        </div>
                        {(() => {
                          const renderPermissionsTable = (person: any, updateFunction: Function, index: number) => {
                            const categories = [
                              { key: "medicalHistory", label: getTranslation(language, "permissions.medicalHistory") },
                              { key: "healthRecords", label: getTranslation(language, "permissions.healthRecords") },
                              { key: "healthPlan", label: getTranslation(language, "permissions.healthPlan") },
                              { key: "medications", label: getTranslation(language, "permissions.medications") },
                              { key: "appointments", label: getTranslation(language, "permissions.appointments") },
                              { key: "messages", label: getTranslation(language, "permissions.messages") },
                            ]

                            return (
                              <div className="mt-4">
                                <Label className="text-sm font-medium text-gray-600 mb-3 block">
                                  {getTranslation(language, "permissions.updateAccess")}
                                </Label>
                                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                                  <div className="grid grid-cols-4 bg-gray-50 border-b">
                                    <div className="p-3 font-medium">Category</div>
                                    <div className="p-3 font-medium text-center">
                                      {getTranslation(language, "permissions.view")}
                                    </div>
                                    <div className="p-3 font-medium text-center">
                                      {getTranslation(language, "permissions.download")}
                                    </div>
                                    <div className="p-3 font-medium text-center">
                                      {getTranslation(language, "permissions.edit")}
                                    </div>
                                  </div>
                                  {categories.map((category) => (
                                    <div key={category.key} className="grid grid-cols-4 border-b last:border-b-0">
                                      <div className="p-3 flex items-center">
                                        <span>{category.label}</span>
                                      </div>
                                      <div className="p-3 flex justify-center">
                                        <Checkbox
                                          checked={person.permissions[category.key]?.view || false}
                                          onCheckedChange={(checked: boolean) =>
                                            updateFunction(index, `permissions.${category.key}.view`, checked)
                                          }
                                          className="border-2 border-gray-300"
                                        />
                                      </div>
                                      <div className="p-3 flex justify-center">
                                        {category.key === "appointments" || category.key === "messages" ? (
                                          <span className="text-gray-400">-</span>
                                        ) : (
                                          <Checkbox
                                            checked={person.permissions[category.key]?.download || false}
                                            onCheckedChange={(checked: boolean) =>
                                              updateFunction(index, `permissions.${category.key}.download`, checked)
                                            }
                                            className="border-2 border-gray-300"
                                          />
                                        )}
                                      </div>
                                      <div className="p-3 flex justify-center">
                                        <Checkbox
                                          checked={person.permissions[category.key]?.edit || false}
                                          onCheckedChange={(checked: boolean) =>
                                            updateFunction(index, `permissions.${category.key}.edit`, checked)
                                          }
                                          className="border-2 border-gray-300"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                          return renderPermissionsTable(contact, updateFamilyFriend, index)
                        })()}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {currentStep === 8 && <SettingsStep formData={formData} updateFormData={updateFormData} />}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            {getTranslation(language, "navigation.previous")}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => console.log("Save progress", formData)}>
              {getTranslation(language, "navigation.saveProgress")}
            </Button>
            <Button
              onClick={currentStep === steps.length ? async () => {
                console.log("Submit", formData)
                await markOnboardingCompleted()
                router.push("/patient/dashboard")
              } : nextStep}
              className="bg-primary hover:bg-primary/90"
            >
              {currentStep === steps.length
                ? getTranslation(language, "navigation.complete")
                : getTranslation(language, "navigation.continue")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step Components - I'll create these in separate files to keep the main component manageable
const PersonalInformationStep = ({
  formData,
  updateFormData,
  language,
}: { formData: FormData; updateFormData: (field: string, value: any) => void; language: Language }) => {
  return (
    <div className="space-y-6">
      {/* Personal Information Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">{getTranslation(language, "fields.firstName")} *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData("firstName", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterName")}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="lastName">{getTranslation(language, "fields.lastName")} *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData("lastName", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterName")}
            className="border-2 border-gray-300"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="dateOfBirth">{getTranslation(language, "fields.dateOfBirth")} *</Label>
        <Input
          type="date"
          id="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
          className="border-2 border-gray-300"
        />
      </div>

      <div>
        <Label htmlFor="gender">{getTranslation(language, "fields.gender")}</Label>
        <Select value={formData.gender} onValueChange={(value: string) => updateFormData("gender", value)}>
          <SelectTrigger className="border-2 border-gray-300">
            <SelectValue placeholder={getTranslation(language, "placeholders.selectGender")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">{getTranslation(language, "options.male")}</SelectItem>
            <SelectItem value="female">{getTranslation(language, "options.female")}</SelectItem>
            <SelectItem value="other">{getTranslation(language, "options.other")}</SelectItem>
            <SelectItem value="preferNotToSay">{getTranslation(language, "options.preferNotToSay")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="height">{getTranslation(language, "fields.height")}</Label>
          <Input
            id="height"
            value={formData.height}
            onChange={(e) => updateFormData("height", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterHeight")}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="weight">{getTranslation(language, "fields.weight")}</Label>
          <Input
            id="weight"
            value={formData.weight}
            onChange={(e) => updateFormData("weight", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterWeight")}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="waistDiameter">{getTranslation(language, "fields.waistDiameter")}</Label>
          <Input
            id="waistDiameter"
            value={formData.waistDiameter}
            onChange={(e) => updateFormData("waistDiameter", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterWaist")}
            className="border-2 border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">{getTranslation(language, "fields.location")}</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => updateFormData("location", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterLocation")}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="country">{getTranslation(language, "fields.country")}</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => updateFormData("country", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterCountry")}
            className="border-2 border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">{getTranslation(language, "fields.phone")} *</Label>
          <Input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterPhone")}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="email">{getTranslation(language, "fields.email")} *</Label>
          <Input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterEmail")}
            className="border-2 border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="emergencyContactName">{getTranslation(language, "fields.emergencyContactName")} *</Label>
          <Input
            id="emergencyContactName"
            value={formData.emergencyContactName}
            onChange={(e) => updateFormData("emergencyContactName", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterName")}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="emergencyContactPhone">{getTranslation(language, "fields.emergencyContactPhone")} *</Label>
          <Input
            id="emergencyContactPhone"
            value={formData.emergencyContactPhone}
            onChange={(e) => updateFormData("emergencyContactPhone", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterPhone")}
            className="border-2 border-gray-300"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="emergencyContactRelationship">{getTranslation(language, "fields.relationship")} *</Label>
        <Select
          value={formData.emergencyContactRelationship}
          onValueChange={(value: string) => updateFormData("emergencyContactRelationship", value)}
        >
          <SelectTrigger className="border-2 border-gray-300">
            <SelectValue placeholder={getTranslation(language, "placeholders.selectRelationship")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spousePartner">{getTranslation(language, "options.spousePartner")}</SelectItem>
            <SelectItem value="parent">{getTranslation(language, "options.parent")}</SelectItem>
            <SelectItem value="sibling">{getTranslation(language, "options.sibling")}</SelectItem>
            <SelectItem value="child">{getTranslation(language, "options.child")}</SelectItem>
            <SelectItem value="friend">{getTranslation(language, "options.friend")}</SelectItem>
            <SelectItem value="other">{getTranslation(language, "options.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Placeholder components for other steps - these would need to be fully implemented
const MedicalConditionStep = ({ formData, updateFormData, language }: any) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">Medical condition step - to be implemented</p>
  </div>
)

const FamilyHistoryStep = ({ formData, updateFormData }: any) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">Family history step - to be implemented</p>
  </div>
)

const HealthRecordsStep = ({ formData, updateFormData, language }: any) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">Health records step - to be implemented</p>
  </div>
)

const HealthPlanStep = ({ formData, updateFormData }: any) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">Health plan step - to be implemented</p>
  </div>
)

const AppointmentsStep = ({ formData, updateFormData }: any) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">Appointments step - to be implemented</p>
  </div>
)

const SettingsStep = ({ formData, updateFormData }: any) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">Settings step - to be implemented</p>
  </div>
)
