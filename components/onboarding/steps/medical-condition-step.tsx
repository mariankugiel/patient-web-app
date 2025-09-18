"use client"

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { 
  addCurrentHealthProblem, 
  updateCurrentHealthProblem, 
  removeCurrentHealthProblem,
  validateCurrentHealthProblem,
  addMedication,
  updateMedication,
  removeMedication,
  validateMedication,
  addPastMedicalCondition,
  updatePastMedicalCondition,
  removePastMedicalCondition,
  validatePastMedicalCondition,
  addPastSurgery,
  updatePastSurgery,
  removePastSurgery,
  validatePastSurgery
} from '@/lib/features/onboarding/onboardingSlice'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Clock, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { type Language, getTranslation } from "@/lib/translations"
import { toast } from 'react-toastify'

interface MedicalConditionStepProps {
  language: Language
}

const commonHealthProblems = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Arthritis",
  "Depression",
  "Anxiety",
  "High Cholesterol",
  "Thyroid Problems",
  "Migraine",
  "Back Pain",
  "Chronic Fatigue Syndrome",
  "Fibromyalgia",
  "Crohn's Disease",
  "Ulcerative Colitis",
  "Other"
]

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function MedicalConditionStep({ language }: MedicalConditionStepProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { medicalConditions } = useSelector((state: RootState) => state.onboarding)

  // Form visibility states
  const [showHealthProblemForm, setShowHealthProblemForm] = useState(false)
  const [showMedicationForm, setShowMedicationForm] = useState(false)
  const [showPastConditionForm, setShowPastConditionForm] = useState(false)
  const [showSurgeryForm, setShowSurgeryForm] = useState(false)

  // Form states for new entries
  const [newHealthProblem, setNewHealthProblem] = useState({
    condition: "",
    yearOfDiagnosis: "",
    diagnosticProvider: "",
    treatment: "",
    comments: ""
  })

  const [newMedication, setNewMedication] = useState({
    drugName: "",
    purpose: "",
    dosage: "",
    frequency: "",
    schedule: [] as Array<{ id: string; time: string; days: string[] }>,
    hasReminder: false,
    reminderTime: "",
    reminderDays: [] as string[]
  })

  const [newPastCondition, setNewPastCondition] = useState({
    condition: "",
    yearOfDiagnosis: "",
    yearResolved: "",
    treatment: "",
    comments: ""
  })

  const [newSurgery, setNewSurgery] = useState({
    surgeryType: "",
    year: "",
    location: "",
    existingConditions: "",
    comments: ""
  })

  // ============================================================================
  // HEALTH PROBLEMS
  // ============================================================================

  const addHealthProblem = () => {
    if (!newHealthProblem.condition.trim()) {
      toast.error("Condition name is required")
      return
    }

    dispatch(addCurrentHealthProblem(newHealthProblem))
    dispatch(validateCurrentHealthProblem(`health-problem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`))
    
    setNewHealthProblem({
      condition: "",
      yearOfDiagnosis: "",
      diagnosticProvider: "",
      treatment: "",
      comments: ""
    })
    
    setShowHealthProblemForm(false)
    toast.success("Health problem added successfully!")
  }

  const removeHealthProblem = (id: string) => {
    dispatch(removeCurrentHealthProblem(id))
    toast.success("Health problem removed")
  }

  // ============================================================================
  // MEDICATIONS
  // ============================================================================

  const addMedicationEntry = () => {
    if (!newMedication.drugName.trim()) {
      toast.error("Drug name is required")
      return
    }

    dispatch(addMedication(newMedication))
    dispatch(validateMedication(`medication-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`))
    
    setNewMedication({
      drugName: "",
      purpose: "",
      dosage: "",
      frequency: "",
      schedule: [] as Array<{ id: string; time: string; days: string[] }>,
      hasReminder: false,
      reminderTime: "",
      reminderDays: []
    })
    
    setShowMedicationForm(false)
    toast.success("Medication added successfully!")
  }

  const removeMedicationEntry = (id: string) => {
    dispatch(removeMedication(id))
    toast.success("Medication removed")
  }

  const addScheduleEntry = () => {
    setNewMedication(prev => ({
      ...prev,
      schedule: [...prev.schedule, { 
        id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        time: "", 
        days: [] 
      }]
    }))
  }

  const removeScheduleEntry = (index: number) => {
    setNewMedication(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }))
  }

  const updateScheduleEntry = (index: number, field: string, value: any) => {
    setNewMedication(prev => ({
      ...prev,
      schedule: prev.schedule.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  const toggleDay = (day: string) => {
    setNewMedication(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day]
    }))
  }

  // ============================================================================
  // PAST MEDICAL CONDITIONS
  // ============================================================================

  const addPastCondition = () => {
    if (!newPastCondition.condition.trim()) {
      toast.error("Condition name is required")
      return
    }

    dispatch(addPastMedicalCondition(newPastCondition))
    dispatch(validatePastMedicalCondition(`past-condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`))
    
    setNewPastCondition({
      condition: "",
      yearOfDiagnosis: "",
      yearResolved: "",
      treatment: "",
      comments: ""
    })
    
    setShowPastConditionForm(false)
    toast.success("Past medical condition added successfully!")
  }

  const removePastCondition = (id: string) => {
    dispatch(removePastMedicalCondition(id))
    toast.success("Past medical condition removed")
  }

  // ============================================================================
  // PAST SURGERIES
  // ============================================================================

  const addSurgery = () => {
    if (!newSurgery.surgeryType.trim()) {
      toast.error("Type of surgery is required")
      return
    }

    dispatch(addPastSurgery(newSurgery))
    dispatch(validatePastSurgery(`past-surgery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`))
    
    setNewSurgery({
      surgeryType: "",
      year: "",
      location: "",
      existingConditions: "",
      comments: ""
    })
    
    setShowSurgeryForm(false)
    toast.success("Past surgery added successfully!")
  }

  const removeSurgery = (id: string) => {
    dispatch(removePastSurgery(id))
    toast.success("Past surgery removed")
  }

  return (
    <div className="space-y-8">
      {/* Current Health Problems and Chronic Diseases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Current Health Problems and Chronic Diseases
            <span className="text-sm font-normal text-gray-500">
              ({medicalConditions.currentHealthProblems.length} entries)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Health Problems */}
          {medicalConditions.currentHealthProblems.map((problem) => (
            <Card key={problem.id} className={`p-4 border-l-4 ${problem.isValid ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{problem.condition}</h4>
                  {problem.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeHealthProblem(problem.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {problem.errors.length > 0 && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <ul className="text-sm text-red-600">
                    {problem.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Year of Diagnosis:</span> {problem.yearOfDiagnosis}
                </div>
                <div>
                  <span className="font-medium">Diagnostic Provider:</span> {problem.diagnosticProvider}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Treatment:</span> {problem.treatment}
                </div>
                {problem.comments && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Comments:</span> {problem.comments}
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Add New Health Problem */}
          {!showHealthProblemForm ? (
            <Card className="p-4 border-dashed">
              <Button 
                onClick={() => setShowHealthProblemForm(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Health Problem
              </Button>
            </Card>
          ) : (
            <Card className="p-4 border-dashed">
              <h4 className="font-medium mb-4">Add New Health Problem</h4>
              <div className="space-y-4">
              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select value={newHealthProblem.condition} onValueChange={(value) => setNewHealthProblem(prev => ({ ...prev, condition: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select or type condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonHealthProblems.map((condition) => (
                      <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yearOfDiagnosis">Year of Diagnosis</Label>
                  <Input
                    id="yearOfDiagnosis"
                    type="number"
                    value={newHealthProblem.yearOfDiagnosis}
                    onChange={(e) => setNewHealthProblem(prev => ({ ...prev, yearOfDiagnosis: e.target.value }))}
                    placeholder="e.g., 2020"
                  />
                </div>
                <div>
                  <Label htmlFor="diagnosticProvider">Who Made the Diagnostic</Label>
                  <Input
                    id="diagnosticProvider"
                    value={newHealthProblem.diagnosticProvider}
                    onChange={(e) => setNewHealthProblem(prev => ({ ...prev, diagnosticProvider: e.target.value }))}
                    placeholder="e.g., Dr. Smith"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="treatment">Treatment</Label>
                <Textarea
                  id="treatment"
                  value={newHealthProblem.treatment}
                  onChange={(e) => setNewHealthProblem(prev => ({ ...prev, treatment: e.target.value }))}
                  placeholder="Describe current treatment"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={newHealthProblem.comments}
                  onChange={(e) => setNewHealthProblem(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Additional comments"
                  rows={2}
                />
              </div>

                <div className="flex gap-2">
                  <Button onClick={addHealthProblem} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Health Problem
                  </Button>
                  <Button 
                    onClick={() => setShowHealthProblemForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Current Medications
            <span className="text-sm font-normal text-gray-500">
              ({medicalConditions.medications.length} entries)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Medications */}
          {medicalConditions.medications.map((medication) => (
            <Card key={medication.id} className={`p-4 border-l-4 ${medication.isValid ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{medication.drugName}</h4>
                  {medication.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeMedicationEntry(medication.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {medication.errors.length > 0 && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <ul className="text-sm text-red-600">
                    {medication.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
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
                {medication.hasReminder && (
                  <div>
                    <span className="font-medium">Reminder:</span> {medication.reminderTime} on {medication.reminderDays?.join(", ")}
                  </div>
                )}
              </div>
              {medication.schedule.length > 0 && (
                <div className="mt-3">
                  <span className="font-medium">Schedule:</span>
                  <div className="mt-1 space-y-1">
                    {medication.schedule.map((entry, i) => (
                      <div key={i} className="text-sm text-gray-600">
                        {entry.time} - {entry.days.join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}

          {/* Add New Medication */}
          {!showMedicationForm ? (
            <Card className="p-4 border-dashed">
              <Button 
                onClick={() => setShowMedicationForm(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Medication
              </Button>
            </Card>
          ) : (
            <Card className="p-4 border-dashed">
              <h4 className="font-medium mb-4">Add New Medication</h4>
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="drugName">Name of Drug *</Label>
                  <Input
                    id="drugName"
                    value={newMedication.drugName}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, drugName: e.target.value }))}
                    placeholder="e.g., Metformin"
                  />
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    value={newMedication.purpose}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g., Diabetes management"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={newMedication.frequency} onValueChange={(value) => setNewMedication(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Schedule</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addScheduleEntry}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Time
                  </Button>
                </div>
                {newMedication.schedule.map((entry, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      type="time"
                      value={entry.time}
                      onChange={(e) => updateScheduleEntry(index, "time", e.target.value)}
                      className="w-32"
                    />
                    <div className="flex-1 flex gap-1">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={entry.days.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updatedDays = entry.days.includes(day)
                              ? entry.days.filter(d => d !== day)
                              : [...entry.days, day]
                            updateScheduleEntry(index, "days", updatedDays)
                          }}
                          className="text-xs px-2 py-1"
                        >
                          {day.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeScheduleEntry(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Reminder Settings */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasReminder"
                    checked={newMedication.hasReminder}
                    onCheckedChange={(checked) => setNewMedication(prev => ({ ...prev, hasReminder: checked as boolean }))}
                  />
                  <Label htmlFor="hasReminder">Set medication reminder</Label>
                </div>

                {newMedication.hasReminder && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reminderTime">Reminder Time</Label>
                      <Input
                        id="reminderTime"
                        type="time"
                        value={newMedication.reminderTime}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, reminderTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Reminder Days</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {daysOfWeek.map((day) => (
                          <Button
                            key={day}
                            type="button"
                            variant={newMedication.reminderDays.includes(day) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleDay(day)}
                            className="text-xs px-2 py-1"
                          >
                            {day.slice(0, 3)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

                <div className="flex gap-2">
                  <Button onClick={addMedicationEntry} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                  <Button 
                    onClick={() => setShowMedicationForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Past Medical Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Past Medical Conditions
            <span className="text-sm font-normal text-gray-500">
              ({medicalConditions.pastMedicalConditions.length} entries)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Past Conditions */}
          {medicalConditions.pastMedicalConditions.map((condition) => (
            <Card key={condition.id} className={`p-4 border-l-4 ${condition.isValid ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{condition.condition}</h4>
                  {condition.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removePastCondition(condition.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {condition.errors.length > 0 && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <ul className="text-sm text-red-600">
                    {condition.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Year of Diagnosis:</span> {condition.yearOfDiagnosis}
                </div>
                <div>
                  <span className="font-medium">Year Resolved:</span> {condition.yearResolved}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Treatment:</span> {condition.treatment}
                </div>
                {condition.comments && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Comments:</span> {condition.comments}
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Add New Past Condition */}
          {!showPastConditionForm ? (
            <Card className="p-4 border-dashed">
              <Button 
                onClick={() => setShowPastConditionForm(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Past Medical Condition
              </Button>
            </Card>
          ) : (
            <Card className="p-4 border-dashed">
              <h4 className="font-medium mb-4">Add Past Medical Condition</h4>
              <div className="space-y-4">
              <div>
                <Label htmlFor="pastCondition">Condition *</Label>
                <Input
                  id="pastCondition"
                  value={newPastCondition.condition}
                  onChange={(e) => setNewPastCondition(prev => ({ ...prev, condition: e.target.value }))}
                  placeholder="e.g., Pneumonia"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pastYearOfDiagnosis">Year of Diagnosis</Label>
                  <Input
                    id="pastYearOfDiagnosis"
                    type="number"
                    value={newPastCondition.yearOfDiagnosis}
                    onChange={(e) => setNewPastCondition(prev => ({ ...prev, yearOfDiagnosis: e.target.value }))}
                    placeholder="e.g., 2018"
                  />
                </div>
                <div>
                  <Label htmlFor="yearResolved">Year Resolved</Label>
                  <Input
                    id="yearResolved"
                    type="number"
                    value={newPastCondition.yearResolved}
                    onChange={(e) => setNewPastCondition(prev => ({ ...prev, yearResolved: e.target.value }))}
                    placeholder="e.g., 2019"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pastTreatment">Treatment</Label>
                <Textarea
                  id="pastTreatment"
                  value={newPastCondition.treatment}
                  onChange={(e) => setNewPastCondition(prev => ({ ...prev, treatment: e.target.value }))}
                  placeholder="Describe treatment received"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="pastComments">Comments</Label>
                <Textarea
                  id="pastComments"
                  value={newPastCondition.comments}
                  onChange={(e) => setNewPastCondition(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Additional comments"
                  rows={2}
                />
              </div>

                <div className="flex gap-2">
                  <Button onClick={addPastCondition} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Past Condition
                  </Button>
                  <Button 
                    onClick={() => setShowPastConditionForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Past Surgeries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Past Surgeries
            <span className="text-sm font-normal text-gray-500">
              ({medicalConditions.pastSurgeries.length} entries)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Surgeries */}
          {medicalConditions.pastSurgeries.map((surgery) => (
            <Card key={surgery.id} className={`p-4 border-l-4 ${surgery.isValid ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{surgery.surgeryType}</h4>
                  {surgery.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSurgery(surgery.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {surgery.errors.length > 0 && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <ul className="text-sm text-red-600">
                    {surgery.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Year:</span> {surgery.year}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {surgery.location}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Existing Conditions from Surgery:</span> {surgery.existingConditions}
                </div>
                {surgery.comments && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Comments:</span> {surgery.comments}
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Add New Surgery */}
          {!showSurgeryForm ? (
            <Card className="p-4 border-dashed">
              <Button 
                onClick={() => setShowSurgeryForm(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Past Surgery
              </Button>
            </Card>
          ) : (
            <Card className="p-4 border-dashed">
              <h4 className="font-medium mb-4">Add Past Surgery</h4>
              <div className="space-y-4">
              <div>
                <Label htmlFor="surgeryType">Type of Surgery *</Label>
                <Input
                  id="surgeryType"
                  value={newSurgery.surgeryType}
                  onChange={(e) => setNewSurgery(prev => ({ ...prev, surgeryType: e.target.value }))}
                  placeholder="e.g., Appendectomy"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="surgeryYear">Year</Label>
                  <Input
                    id="surgeryYear"
                    type="number"
                    value={newSurgery.year}
                    onChange={(e) => setNewSurgery(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="e.g., 2020"
                  />
                </div>
                <div>
                  <Label htmlFor="surgeryLocation">Location of Surgery</Label>
                  <Input
                    id="surgeryLocation"
                    value={newSurgery.location}
                    onChange={(e) => setNewSurgery(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., General Hospital"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="existingConditions">Any Existing Conditions from Surgery</Label>
                <Textarea
                  id="existingConditions"
                  value={newSurgery.existingConditions}
                  onChange={(e) => setNewSurgery(prev => ({ ...prev, existingConditions: e.target.value }))}
                  placeholder="Describe any ongoing conditions or complications"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="surgeryComments">Comments</Label>
                <Textarea
                  id="surgeryComments"
                  value={newSurgery.comments}
                  onChange={(e) => setNewSurgery(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Additional comments"
                  rows={2}
                />
              </div>

                <div className="flex gap-2">
                  <Button onClick={addSurgery} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Surgery
                  </Button>
                  <Button 
                    onClick={() => setShowSurgeryForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}