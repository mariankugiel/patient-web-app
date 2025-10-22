"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle, CheckCircle, Plus, Info } from 'lucide-react'
import { type Language } from "@/lib/translations"
import { CurrentConditionsDialog } from "@/components/health-records/current-conditions-dialog"
import { PastConditionsDialog } from "@/components/health-records/past-conditions-dialog"
import { PastSurgeriesDialog } from "@/components/health-records/past-surgeries-dialog"
import { MedicationsDialog } from '@/components/onboarding/dialogs/medications-dialog'
import { MedicalConditionApiService } from '@/lib/api/medical-condition-api'

interface MedicalConditionStepProps {
  language: Language
}

export function MedicalConditionStep({ language }: MedicalConditionStepProps) {
  // Local state for medical conditions data
  const [currentHealthProblems, setCurrentHealthProblems] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [pastMedicalConditions, setPastMedicalConditions] = useState<any[]>([])
  const [pastSurgeries, setPastSurgeries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to format dates (handles both date and datetime formats)
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified'

    try {
      // Handle both date (YYYY-MM-DD) and datetime (YYYY-MM-DDTHH:mm:ss) formats
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return dateString
    }
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Medical condition statuses
      'uncontrolled': { label: 'Uncontrolled', variant: 'destructive' as const },
      'controlled': { label: 'Controlled', variant: 'default' as const },
      'partiallyControlled': { label: 'Partially Controlled', variant: 'secondary' as const },
      'resolved': { label: 'Resolved', variant: 'outline' as const },
      // Surgery recovery statuses
      'full_recovery': { label: 'Full Recovery', variant: 'default' as const },
      'ongoing_treatment': { label: 'Ongoing Treatment', variant: 'secondary' as const },
      'no_recovery': { label: 'No Recovery', variant: 'destructive' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Dialog states
  const [showCurrentConditionsDialog, setShowCurrentConditionsDialog] = useState(false)
  const [showMedicationsDialog, setShowMedicationsDialog] = useState(false)
  const [showPastConditionsDialog, setShowPastConditionsDialog] = useState(false)
  const [showSurgeriesDialog, setShowSurgeriesDialog] = useState(false)

  // Selected entries for editing
  const [selectedCurrentCondition, setSelectedCurrentCondition] = useState<any>(null)
  const [selectedPastCondition, setSelectedPastCondition] = useState<any>(null)
  const [selectedSurgery, setSelectedSurgery] = useState<any>(null)
  const [selectedMedication, setSelectedMedication] = useState<any>(null)

  // Load all data on initial mount
  const loadData = async () => {
    console.log('loadData called - initial loading of all medical conditions data')
    try {
      setIsLoading(true)
      setError(null)

      // Load all data in parallel
      const [allConditions, surgeries, medicationsData] = await Promise.all([
        MedicalConditionApiService.getAllMedicalConditions(),
        MedicalConditionApiService.getPastSurgeries(),
        MedicalConditionApiService.getMedications()
      ])

      // Filter conditions by status
      const currentProblems = allConditions.filter(condition =>
        condition.status === 'uncontrolled' ||
        condition.status === 'controlled' ||
        condition.status === 'partiallyControlled'
      )
      const pastConditions = allConditions.filter(condition =>
        condition.status === 'resolved'
      )

      setCurrentHealthProblems(currentProblems)
      setPastMedicalConditions(pastConditions)
      setPastSurgeries(surgeries)
      setMedications(medicationsData)
    } catch (err) {
      console.error('Failed to load medical conditions:', err)
      setError('Failed to load medical conditions data')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh specific sections for better performance
  const refreshCurrentConditions = async () => {
    console.log('refreshCurrentConditions called')
    try {
      const allConditions = await MedicalConditionApiService.getAllMedicalConditions()
      const currentProblems = allConditions.filter(condition =>
        condition.status === 'uncontrolled' ||
        condition.status === 'controlled' ||
        condition.status === 'partiallyControlled'
      )
      setCurrentHealthProblems(currentProblems)
    } catch (err) {
      console.error('Failed to refresh current conditions:', err)
    }
  }

  const refreshPastConditions = async () => {
    console.log('refreshPastConditions called')
    try {
      const allConditions = await MedicalConditionApiService.getAllMedicalConditions()
      const pastConditions = allConditions.filter(condition =>
        condition.status === 'resolved'
      )
      setPastMedicalConditions(pastConditions)
    } catch (err) {
      console.error('Failed to refresh past conditions:', err)
    }
  }

  const refreshSurgeries = async () => {
    console.log('refreshSurgeries called')
    try {
      const surgeries = await MedicalConditionApiService.getPastSurgeries()
      setPastSurgeries(surgeries)
    } catch (err) {
      console.error('Failed to refresh surgeries:', err)
    }
  }

  const refreshMedications = async () => {
    console.log('refreshMedications called')
    try {
      const medicationsData = await MedicalConditionApiService.getMedications()
      setMedications(medicationsData)
    } catch (err) {
      console.error('Failed to refresh medications:', err)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Targeted update functions for better performance

  // Save handlers for dialogs
  const handleMedicationSave = (medication: any) => {
    console.log('Medication saved:', medication)
    setShowMedicationsDialog(false)
    setSelectedMedication(null)
    refreshMedications() // Refresh medications data
  }

  // ============================================================================
  // DIALOG HANDLERS
  // ============================================================================

  const openCurrentConditionsDialog = (condition?: any) => {
    setSelectedCurrentCondition(condition || null)
    setShowCurrentConditionsDialog(true)
  }

  const openMedicationsDialog = (medication?: any) => {
    setSelectedMedication(medication || null)
    setShowMedicationsDialog(true)
  }

  const openPastConditionsDialog = (condition?: any) => {
    setSelectedPastCondition(condition || null)
    setShowPastConditionsDialog(true)
  }

  const openSurgeriesDialog = (surgery?: any) => {
    setSelectedSurgery(surgery || null)
    setShowSurgeriesDialog(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medical conditions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Health Problems and Chronic Diseases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
              Current Medical Conditions
            <span className="text-sm font-normal text-gray-500">
                ({currentHealthProblems.length} entries)
            </span>
          </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCurrentConditionsDialog()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Health Problems */}
          {currentHealthProblems.map((problem) => (
            <div
              key={problem.id}
              onClick={() => openCurrentConditionsDialog(problem)}
              className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
            >
              <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50 group-hover:border-blue-300">
                <div className="flex items-start mb-3">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{problem.condition_name || problem.condition}</h4>
                    <Info className="w-4 h-4 text-blue-600" />
                </div>
                  <div className="ml-auto">
                    {getStatusBadge(problem.status)}
              </div>
                </div>
              
                <div className="space-y-3 text-sm">
                <div>
                    <span className="font-medium">Diagnosed Date:</span> {problem.diagnosed_date ? formatDate(problem.diagnosed_date) : 'Not specified'}
                </div>
                <div>
                    <span className="font-medium">Treatment Plan:</span> {problem.treatment_plan || problem.treatment || 'Not specified'}
                  </div>
                  {(problem.description || problem.comments) && (
                    <div>
                      <span className="font-medium">Description:</span> {problem.description || problem.comments}
                  </div>
                )}
              </div>
            </Card>
            </div>
          ))}

        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
              Medications
            <span className="text-sm font-normal text-gray-500">
                ({medications.length} entries)
            </span>
          </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={openMedicationsDialog}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Medications */}
          {medications.map((medication) => (
            <div
              key={medication.id}
              onClick={() => openMedicationsDialog(medication)}
              className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
            >
              <Card className="p-4 border-l-4 border-l-purple-500 bg-purple-50 group-hover:border-blue-300">
                <div className="flex items-start mb-3">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{medication.drugName || medication.drug_name}</h4>
                    <CheckCircle className="w-4 h-4 text-purple-600" />
              </div>
                </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Purpose:</span> {medication.purpose}
                </div>
                <div>
                  <span className="font-medium">Dosage:</span> {medication.dosage}
                </div>
                <div>
                  <span className="font-medium">Frequency:</span> {medication.frequency}
                </div>
                  {medication.has_reminder && (
                    <div>
                      <span className="font-medium">Reminder:</span> {medication.reminder_time} ({medication.reminder_days?.join(', ') || 'Daily'})
                  </div>
                )}
                </div>
              </Card>
              </div>
          ))}
        </CardContent>
      </Card>

      {/* Past Medical Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Past Medical Conditions
            <span className="text-sm font-normal text-gray-500">
                ({pastMedicalConditions.length} entries)
            </span>
          </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPastConditionsDialog()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Past Conditions */}
          {pastMedicalConditions.map((condition) => (
            <div
              key={condition.id}
              onClick={() => openPastConditionsDialog(condition)}
              className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
            >
              <Card className="p-4 border-l-4 border-l-green-500 bg-green-50 group-hover:border-blue-300">
                <div className="flex items-start mb-3">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{condition.condition_name || condition.condition}</h4>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                  <div className="ml-auto">
                    {getStatusBadge(condition.status || 'resolved')}
              </div>
                </div>
              
                <div className="space-y-3 text-sm">
                <div>
                    <span className="font-medium">Diagnosed Date:</span> {condition.diagnosed_date ? formatDate(condition.diagnosed_date) : 'Not specified'}
                </div>
                <div>
                    <span className="font-medium">Resolved Date:</span> {condition.resolved_date ? formatDate(condition.resolved_date) : 'Not specified'}
                </div>
                  <div>
                    <span className="font-medium">Treatment Plan:</span> {condition.treatment_plan || condition.treatment || 'Not specified'}
                  </div>
                  {(condition.description || condition.comments) && (
                    <div>
                      <span className="font-medium">Description:</span> {condition.description || condition.comments}
                  </div>
                )}
              </div>
            </Card>
            </div>
          ))}

        </CardContent>
      </Card>

      {/* Past Surgeries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Past Surgeries
            <span className="text-sm font-normal text-gray-500">
                ({pastSurgeries.length} entries)
            </span>
          </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openSurgeriesDialog()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Surgeries */}
          {pastSurgeries.map((surgery) => (
            <div
              key={surgery.id}
              onClick={() => openSurgeriesDialog(surgery)}
              className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
            >
              <Card className="p-4 border-l-4 border-l-gray-400 bg-gray-50 group-hover:border-blue-300">
                <div className="flex items-start mb-3">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{surgery.condition_name?.replace('Surgery: ', '') || 'Surgery'}</h4>
                    <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                  <div className="ml-auto">
                    {getStatusBadge(surgery.outcome || 'resolved')}
              </div>
                </div>
              
                <div className="space-y-3 text-sm">
                <div>
                    <span className="font-medium">Type:</span> Surgery
                </div>
                <div>
                    <span className="font-medium">Date:</span> {surgery.diagnosed_date ? formatDate(surgery.diagnosed_date) : 'Not specified'}
                </div>
                  <div>
                    <span className="font-medium">Treatment:</span> {surgery.treatment_plan || 'Not specified'}
                  </div>
                  {surgery.description && (
                    <div>
                      <span className="font-medium">Notes:</span> {surgery.description}
                  </div>
                )}
              </div>
            </Card>
            </div>
          ))}

        </CardContent>
      </Card>

      {/* Dialogs */}
      <CurrentConditionsDialog
        open={showCurrentConditionsDialog}
        onOpenChange={(open: boolean) => {
          setShowCurrentConditionsDialog(open)
          if (!open) {
            setSelectedCurrentCondition(null)
          }
        }}
        selectedCondition={selectedCurrentCondition}
        onRefresh={refreshCurrentConditions}
      />

      <MedicationsDialog
        isOpen={showMedicationsDialog}
        onClose={() => {
          setShowMedicationsDialog(false)
          setSelectedMedication(null)
        }}
        onSave={handleMedicationSave}
        editingMedication={selectedMedication}
      />

      <PastConditionsDialog
        open={showPastConditionsDialog}
        onOpenChange={(open: boolean) => {
          setShowPastConditionsDialog(open)
          if (!open) {
            setSelectedPastCondition(null)
          }
        }}
        selectedCondition={selectedPastCondition}
        onRefresh={refreshPastConditions}
      />

      <PastSurgeriesDialog
        open={showSurgeriesDialog}
        onOpenChange={(open: boolean) => {
          setShowSurgeriesDialog(open)
          if (!open) {
            setSelectedSurgery(null)
          }
        }}
        selectedSurgery={selectedSurgery}
        onRefresh={refreshSurgeries}
      />

    </div>
  )
}