"use client"

import { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, AlertCircle, CheckCircle, Minus } from 'lucide-react'
import { type Language, getTranslation } from "@/lib/translations"

interface FamilyHistoryStepProps {
  language: Language
}

const chronicDiseases = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Stroke",
  "Cancer",
  "Alzheimer's Disease",
  "Parkinson's Disease",
  "Arthritis",
  "Asthma",
  "COPD",
  "Kidney Disease",
  "Liver Disease",
  "Mental Health Issues",
  "Autoimmune Diseases",
  "Other"
]

interface ChronicDisease {
  id: string
  disease: string
  ageAtDiagnosis: string
  comments: string
}

interface FamilyMemberForm {
  isDeceased: boolean
  ageAtDeath: string
  causeOfDeath: string
  chronicDiseases: ChronicDisease[]
}

export function FamilyHistoryStep({ language }: FamilyHistoryStepProps) {

  // Global family counts
  const [siblingCount, setSiblingCount] = useState(0)
  const [childrenCount, setChildrenCount] = useState(0)

  // Default forms for mother and father
  const [motherForm, setMotherForm] = useState<FamilyMemberForm>({
    isDeceased: false,
    ageAtDeath: "",
    causeOfDeath: "",
    chronicDiseases: []
  })

  const [fatherForm, setFatherForm] = useState<FamilyMemberForm>({
    isDeceased: false,
    ageAtDeath: "",
    causeOfDeath: "",
    chronicDiseases: []
  })


  // Dynamic forms for siblings and children
  const [siblingForms, setSiblingForms] = useState<Array<FamilyMemberForm & { gender: string; currentAge: string }>>([])
  const [childrenForms, setChildrenForms] = useState<Array<FamilyMemberForm & { gender: string; currentAge: string }>>([])

  // ============================================================================
  // FAMILY HISTORY FUNCTIONS
  // ============================================================================

  // Update sibling count and create/remove forms
  const updateSiblingCount = (newCount: number) => {
    setSiblingCount(newCount)
    if (newCount > siblingForms.length) {
      // Add new forms
      const newForms = Array.from({ length: newCount - siblingForms.length }, () => ({
        isDeceased: false,
        ageAtDeath: "",
        causeOfDeath: "",
        chronicDiseases: [],
        gender: "",
        currentAge: ""
      }))
      setSiblingForms(prev => [...prev, ...newForms])
    } else if (newCount < siblingForms.length) {
      // Remove forms
      setSiblingForms(prev => prev.slice(0, newCount))
    }
  }

  // Update children count and create/remove forms
  const updateChildrenCount = (newCount: number) => {
    setChildrenCount(newCount)
    if (newCount > childrenForms.length) {
      // Add new forms
      const newForms = Array.from({ length: newCount - childrenForms.length }, () => ({
        isDeceased: false,
        ageAtDeath: "",
        causeOfDeath: "",
        chronicDiseases: [],
        gender: "",
        currentAge: ""
      }))
      setChildrenForms(prev => [...prev, ...newForms])
    } else if (newCount < childrenForms.length) {
      // Remove forms
      setChildrenForms(prev => prev.slice(0, newCount))
    }
  }

  // Chronic disease management
  const addChronicDisease = (formType: 'mother' | 'father' | 'maternalGrandmother' | 'maternalGrandfather' | 'paternalGrandmother' | 'paternalGrandfather' | 'sibling' | 'child', index?: number) => {
    const newDisease: ChronicDisease = {
      id: `disease-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      disease: "",
      ageAtDiagnosis: "",
      comments: ""
    }

    if (formType === 'mother') {
      setMotherForm(prev => ({
        ...prev,
        chronicDiseases: [...prev.chronicDiseases, newDisease]
      }))
    } else if (formType === 'father') {
      setFatherForm(prev => ({
        ...prev,
        chronicDiseases: [...prev.chronicDiseases, newDisease]
      }))
    } else if (formType === 'maternalGrandmother') {
      setMaternalGrandmotherForm(prev => ({
        ...prev,
        chronicDiseases: [...prev.chronicDiseases, newDisease]
      }))
    } else if (formType === 'maternalGrandfather') {
      setMaternalGrandfatherForm(prev => ({
        ...prev,
        chronicDiseases: [...prev.chronicDiseases, newDisease]
      }))
    } else if (formType === 'paternalGrandmother') {
      setPaternalGrandmotherForm(prev => ({
        ...prev,
        chronicDiseases: [...prev.chronicDiseases, newDisease]
      }))
    } else if (formType === 'paternalGrandfather') {
      setPaternalGrandfatherForm(prev => ({
        ...prev,
        chronicDiseases: [...prev.chronicDiseases, newDisease]
      }))
    } else if (formType === 'sibling' && index !== undefined) {
      setSiblingForms(prev => prev.map((form, i) => 
        i === index 
          ? { ...form, chronicDiseases: [...form.chronicDiseases, newDisease] }
          : form
      ))
    } else if (formType === 'child' && index !== undefined) {
      setChildrenForms(prev => prev.map((form, i) => 
        i === index 
          ? { ...form, chronicDiseases: [...form.chronicDiseases, newDisease] }
          : form
      ))
    }
  }

  const removeChronicDisease = (formType: 'mother' | 'father' | 'sibling' | 'child', diseaseId: string, index?: number) => {
    if (formType === 'mother') {
      setMotherForm(prev => ({
        ...prev,
        chronicDiseases: prev.chronicDiseases.filter(d => d.id !== diseaseId)
      }))
    } else if (formType === 'father') {
      setFatherForm(prev => ({
        ...prev,
        chronicDiseases: prev.chronicDiseases.filter(d => d.id !== diseaseId)
      }))
    } else if (formType === 'sibling' && index !== undefined) {
      setSiblingForms(prev => prev.map((form, i) => 
        i === index 
          ? { ...form, chronicDiseases: form.chronicDiseases.filter(d => d.id !== diseaseId) }
          : form
      ))
    } else if (formType === 'child' && index !== undefined) {
      setChildrenForms(prev => prev.map((form, i) => 
        i === index 
          ? { ...form, chronicDiseases: form.chronicDiseases.filter(d => d.id !== diseaseId) }
          : form
      ))
    }
  }

  const updateChronicDisease = (formType: 'mother' | 'father' | 'sibling' | 'child', diseaseId: string, field: keyof ChronicDisease, value: string, index?: number) => {
    if (formType === 'mother') {
      setMotherForm(prev => ({
        ...prev,
        chronicDiseases: prev.chronicDiseases.map(d => 
          d.id === diseaseId ? { ...d, [field]: value } : d
        )
      }))
    } else if (formType === 'father') {
      setFatherForm(prev => ({
        ...prev,
        chronicDiseases: prev.chronicDiseases.map(d => 
          d.id === diseaseId ? { ...d, [field]: value } : d
        )
      }))
    } else if (formType === 'sibling' && index !== undefined) {
      setSiblingForms(prev => prev.map((form, i) => 
        i === index 
          ? { 
              ...form, 
              chronicDiseases: form.chronicDiseases.map(d => 
                d.id === diseaseId ? { ...d, [field]: value } : d
              )
            }
          : form
      ))
    } else if (formType === 'child' && index !== undefined) {
      setChildrenForms(prev => prev.map((form, i) => 
        i === index 
          ? { 
              ...form, 
              chronicDiseases: form.chronicDiseases.map(d => 
                d.id === diseaseId ? { ...d, [field]: value } : d
              )
            }
          : form
      ))
    }
  }


  // Reusable family member form component
  const FamilyMemberForm = ({ 
    title, 
    formData, 
    setFormData, 
    formType,
    showGender = false,
    showCurrentAge = false
  }: {
    title: string
    formData: any
    setFormData: (data: any) => void
    formType: 'mother' | 'father' | 'maternalGrandmother' | 'maternalGrandfather' | 'paternalGrandmother' | 'paternalGrandfather' | 'sibling' | 'child'
    showGender?: boolean
    showCurrentAge?: boolean
  }) => (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gender and Current Age (for siblings and children) */}
        {showGender && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Gender</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showCurrentAge && (
              <div>
                <Label>Current Age</Label>
                <Input
                  type="number"
                  value={formData.currentAge}
                  onChange={(e) => setFormData({ ...formData, currentAge: e.target.value })}
                  placeholder="Current age"
                />
              </div>
            )}
          </div>
        )}

        {/* Living Status */}
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap">Is this family member deceased?</Label>
          <div className="flex gap-2">
            <div
              className={`px-3 py-1.5 text-sm rounded-md cursor-pointer border transition-colors ${
                formData.isDeceased 
                  ? "bg-teal-600 text-white border-teal-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setFormData({ ...formData, isDeceased: true })
              }}
            >
              Yes
            </div>
            <div
              className={`px-3 py-1.5 text-sm rounded-md cursor-pointer border transition-colors ${
                !formData.isDeceased 
                  ? "bg-teal-600 text-white border-teal-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setFormData({ 
                  ...formData, 
                  isDeceased: false, 
                  ageAtDeath: "", 
                  causeOfDeath: "" 
                })
              }}
            >
              No
            </div>
          </div>
        </div>

        {/* Conditional Fields Based on Status */}
        {formData.isDeceased ? (
          // Deceased - Show cause of death and age at death
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`ageAtDeath-${formType}`}>Age at Death *</Label>
              <Input
                id={`ageAtDeath-${formType}`}
                type="number"
                value={formData.ageAtDeath}
                onChange={(e) => setFormData({ ...formData, ageAtDeath: e.target.value })}
                placeholder="Age when died"
              />
            </div>
            <div>
              <Label htmlFor={`causeOfDeath-${formType}`}>Cause of Death *</Label>
              <Input
                id={`causeOfDeath-${formType}`}
                value={formData.causeOfDeath}
                onChange={(e) => setFormData({ ...formData, causeOfDeath: e.target.value })}
                placeholder="Cause of death"
              />
            </div>
          </div>
        ) : (
          // Living - Show chronic diseases and ages at diagnosis
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Chronic Diseases</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addChronicDisease(formType, formType === 'sibling' || formType === 'child' ? 0 : undefined)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Disease
              </Button>
            </div>
            {formData.chronicDiseases.map((disease: ChronicDisease) => (
              <div key={disease.id} className="flex gap-2 mb-2">
                <Select 
                  value={disease.disease} 
                  onValueChange={(value) => updateChronicDisease(formType, disease.id, 'disease', value, formType === 'sibling' || formType === 'child' ? 0 : undefined)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select disease" />
                  </SelectTrigger>
                  <SelectContent>
                    {chronicDiseases.map((diseaseOption) => (
                      <SelectItem key={diseaseOption} value={diseaseOption}>{diseaseOption}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Age at diagnosis"
                  value={disease.ageAtDiagnosis}
                  onChange={(e) => updateChronicDisease(formType, disease.id, 'ageAtDiagnosis', e.target.value, formType === 'sibling' || formType === 'child' ? 0 : undefined)}
                  className="w-32"
                />
                <Input
                  placeholder="Comments"
                  value={disease.comments}
                  onChange={(e) => updateChronicDisease(formType, disease.id, 'comments', e.target.value, formType === 'sibling' || formType === 'child' ? 0 : undefined)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeChronicDisease(formType, disease.id, formType === 'sibling' || formType === 'child' ? 0 : undefined)}
                  className="text-red-600 hover:text-red-700 w-10 h-10 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Global Family Counts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Family Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="siblingCount">Number of Siblings</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateSiblingCount(Math.max(0, siblingCount - 1))}
                  disabled={siblingCount === 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  id="siblingCount"
                  type="number"
                  min="0"
                  value={siblingCount}
                  onChange={(e) => updateSiblingCount(parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateSiblingCount(siblingCount + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="childrenCount">Number of Children</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateChildrenCount(Math.max(0, childrenCount - 1))}
                  disabled={childrenCount === 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  id="childrenCount"
                  type="number"
                  min="0"
                  value={childrenCount}
                  onChange={(e) => updateChildrenCount(parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateChildrenCount(childrenCount + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mother Form (Default) */}
      <FamilyMemberForm
        title="Mother"
        formData={motherForm}
        setFormData={setMotherForm}
        formType="mother"
      />

      {/* Father Form (Default) */}
      <FamilyMemberForm
        title="Father"
        formData={fatherForm}
        setFormData={setFatherForm}
        formType="father"
      />


      {/* Siblings Forms (Dynamic based on count) */}
      {siblingCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Siblings ({siblingCount})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {siblingForms.map((sibling, index) => (
              <FamilyMemberForm
                key={index}
                title={`Sibling ${index + 1}`}
                formData={sibling}
                setFormData={(data) => setSiblingForms(prev => prev.map((form, i) => i === index ? data : form))}
                formType="sibling"
                showGender={true}
                showCurrentAge={true}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Children Forms (Dynamic based on count) */}
      {childrenCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Children ({childrenCount})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {childrenForms.map((child, index) => (
              <FamilyMemberForm
                key={index}
                title={`Child ${index + 1}`}
                formData={child}
                setFormData={(data) => setChildrenForms(prev => prev.map((form, i) => i === index ? data : form))}
                formType="child"
                showGender={true}
                showCurrentAge={true}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}