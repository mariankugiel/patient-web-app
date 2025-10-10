"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { toast } from "react-toastify"
import apiClient from "@/lib/api/axios-config"

interface ChronicDisease {
  id: string
  disease: string
  age_at_diagnosis: string
  comments: string
}

interface FamilyMember {
  id?: number
  relation: string
  is_deceased: boolean
  age_at_death: string
  cause_of_death: string
  current_age: string
  gender: string
  chronic_diseases: ChronicDisease[]
}

interface FamilyHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => Promise<void>
}

const relationshipOptions = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Child",
  "Maternal Grandfather",
  "Maternal Grandmother",
  "Paternal Grandfather",
  "Paternal Grandmother"
]

const chronicDiseaseOptions = [
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

export function FamilyHistoryDialog({ open, onOpenChange, onRefresh }: FamilyHistoryDialogProps) {
  const { t } = useLanguage()
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load existing family history when dialog opens
  useEffect(() => {
    if (open) {
      loadFamilyHistory()
    }
  }, [open])

  const loadFamilyHistory = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/health-records/family-medical-history')
      const histories = response.data || []
      
      // Convert backend format to component format
      const members: FamilyMember[] = histories.map((h: any) => ({
        id: h.id,
        relation: h.relation || '',
        is_deceased: h.is_deceased || false,
        age_at_death: h.age_at_death?.toString() || '',
        cause_of_death: h.cause_of_death || '',
        current_age: h.current_age?.toString() || '',
        gender: h.gender || '',
        chronic_diseases: (h.chronic_diseases || []).map((d: any, idx: number) => ({
          id: `disease-${h.id}-${idx}`,
          disease: d.disease || '',
          age_at_diagnosis: d.age_at_diagnosis || '',
          comments: d.comments || ''
        }))
      }))
      
      setFamilyMembers(members)
    } catch (error) {
      console.error('Failed to load family history:', error)
      toast.error('Failed to load family history')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFamilyMember = () => {
    const newMember: FamilyMember = {
      relation: '',
      is_deceased: false,
      age_at_death: '',
      cause_of_death: '',
      current_age: '',
      gender: '',
      chronic_diseases: []
    }
    setFamilyMembers(prev => [...prev, newMember])
  }

  const handleRemoveFamilyMember = async (index: number) => {
    const member = familyMembers[index]
    if (member.id) {
      try {
        await apiClient.delete(`/health-records/family-medical-history/${member.id}`)
        toast.success('Family member removed')
        if (onRefresh) await onRefresh()
      } catch (error) {
        console.error('Failed to delete family member:', error)
        toast.error('Failed to delete family member')
        return
      }
    }
    setFamilyMembers(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateMember = (index: number, field: keyof FamilyMember, value: any) => {
    setFamilyMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ))
  }

  const handleAddDisease = (memberIndex: number) => {
    const newDisease: ChronicDisease = {
      id: `disease-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      disease: '',
      age_at_diagnosis: '',
      comments: ''
    }
    setFamilyMembers(prev => prev.map((member, i) => 
      i === memberIndex 
        ? { ...member, chronic_diseases: [...member.chronic_diseases, newDisease] }
        : member
    ))
  }

  const handleRemoveDisease = (memberIndex: number, diseaseId: string) => {
    setFamilyMembers(prev => prev.map((member, i) => 
      i === memberIndex 
        ? { ...member, chronic_diseases: member.chronic_diseases.filter(d => d.id !== diseaseId) }
        : member
    ))
  }

  const handleUpdateDisease = (memberIndex: number, diseaseId: string, field: keyof ChronicDisease, value: string) => {
    setFamilyMembers(prev => prev.map((member, i) => 
      i === memberIndex 
        ? { 
            ...member, 
            chronic_diseases: member.chronic_diseases.map(d => 
              d.id === diseaseId ? { ...d, [field]: value } : d
            )
          }
        : member
    ))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      for (const member of familyMembers) {
        // Validate required fields
        if (!member.relation) {
          toast.error('Please select a relationship for all family members')
          setSaving(false)
          return
        }
        
        const memberData = {
          relation: member.relation,
          is_deceased: member.is_deceased,
          age_at_death: member.age_at_death ? parseInt(member.age_at_death) : null,
          cause_of_death: member.cause_of_death || null,
          current_age: member.current_age ? parseInt(member.current_age) : null,
          gender: member.gender || null,
          chronic_diseases: member.chronic_diseases.map(d => ({
            disease: d.disease,
            age_at_diagnosis: d.age_at_diagnosis,
            comments: d.comments
          }))
        }
        
        if (member.id) {
          // Update existing
          await apiClient.put(`/health-records/family-medical-history/${member.id}`, memberData)
        } else {
          // Create new
          await apiClient.post('/health-records/family-medical-history', memberData)
        }
      }
      
      toast.success('Family medical history saved successfully!')
      if (onRefresh) await onRefresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save family history:', error)
      toast.error('Failed to save family history')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("health.editFamilyHistory")}</DialogTitle>
          <DialogDescription>
            Add information about your family members and their medical conditions
          </DialogDescription>
        </DialogHeader>
        
        {/* Add New Button - Sticky at Top */}
        <div className="flex-shrink-0 pb-4 border-b">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddFamilyMember}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Family Member
          </Button>
        </div>
        
        {/* Scrollable Family Members List */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : familyMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No family members added yet.</p>
              <p className="text-sm">Click "Add Family Member" above to get started.</p>
            </div>
          ) : (
            familyMembers.map((member, memberIndex) => (
              <div key={memberIndex} className="border-2 rounded-lg p-5 space-y-4 bg-blue-50/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">Family Member {memberIndex + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFamilyMember(memberIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove Member
                  </Button>
                </div>
                
                {/* Relationship */}
                <div>
                  <Label className="text-sm font-medium">
                    Relationship <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={member.relation}
                    onValueChange={(value) => handleUpdateMember(memberIndex, 'relation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender and Current Age (for siblings/children) */}
                {(member.relation.includes('Brother') || member.relation.includes('Sister') || member.relation.includes('Child')) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Gender</Label>
                      <Select 
                        value={member.gender} 
                        onValueChange={(value) => handleUpdateMember(memberIndex, 'gender', value)}
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
                    {!member.is_deceased && (
                      <div>
                        <Label>Current Age</Label>
                        <Input
                          type="number"
                          value={member.current_age}
                          onChange={(e) => handleUpdateMember(memberIndex, 'current_age', e.target.value)}
                          placeholder="Current age"
                          min="0"
                          max="120"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Alive/Deceased Toggle */}
                <div className="flex items-center gap-4">
                  <Label className="whitespace-nowrap font-medium">Is this family member deceased?</Label>
                  <div className="flex gap-2">
                    <div
                      className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer border transition-colors ${
                        member.is_deceased 
                          ? "bg-teal-600 text-white border-teal-600" 
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => handleUpdateMember(memberIndex, 'is_deceased', true)}
                    >
                      Yes
                    </div>
                    <div
                      className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer border transition-colors ${
                        !member.is_deceased 
                          ? "bg-teal-600 text-white border-teal-600" 
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        handleUpdateMember(memberIndex, 'is_deceased', false)
                        handleUpdateMember(memberIndex, 'age_at_death', '')
                        handleUpdateMember(memberIndex, 'cause_of_death', '')
                      }}
                    >
                      No
                    </div>
                  </div>
                </div>

                {/* Conditional Fields Based on Status */}
                {member.is_deceased ? (
                  // Deceased - Show cause of death and age at death
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-100 rounded-lg">
                    <div>
                      <Label>Age at Death <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={member.age_at_death}
                        onChange={(e) => handleUpdateMember(memberIndex, 'age_at_death', e.target.value)}
                        placeholder="Age when died"
                        min="0"
                        max="120"
                      />
                    </div>
                    <div>
                      <Label>Cause of Death</Label>
                      <Input
                        value={member.cause_of_death}
                        onChange={(e) => handleUpdateMember(memberIndex, 'cause_of_death', e.target.value)}
                        placeholder="Cause of death"
                      />
                    </div>
                  </div>
                ) : (
                  // Living - Show chronic diseases
                  <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Chronic Diseases</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddDisease(memberIndex)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Disease
                      </Button>
                    </div>
                    
                    {member.chronic_diseases.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No chronic diseases added. Click "Add Disease" to add one.</p>
                    ) : (
                      member.chronic_diseases.map((disease) => (
                        <div key={disease.id} className="bg-white p-3 rounded border space-y-2">
                          <div className="flex gap-2 items-start">
                            <div className="flex-1">
                              <Label className="text-xs">Disease</Label>
                              <Select 
                                value={disease.disease} 
                                onValueChange={(value) => handleUpdateDisease(memberIndex, disease.id, 'disease', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select disease" />
                                </SelectTrigger>
                                <SelectContent>
                                  {chronicDiseaseOptions.map((diseaseOption) => (
                                    <SelectItem key={diseaseOption} value={diseaseOption}>{diseaseOption}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32">
                              <Label className="text-xs">Age at Diagnosis</Label>
                              <Input
                                type="number"
                                placeholder="Age"
                                value={disease.age_at_diagnosis}
                                onChange={(e) => handleUpdateDisease(memberIndex, disease.id, 'age_at_diagnosis', e.target.value)}
                                className="mt-1"
                                min="0"
                                max="120"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDisease(memberIndex, disease.id)}
                              className="text-red-600 hover:text-red-700 mt-5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-xs">Comments (Optional)</Label>
                            <Input
                              placeholder="Additional notes"
                              value={disease.comments}
                              onChange={(e) => handleUpdateDisease(memberIndex, disease.id, 'comments', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleCancel} disabled={saving || loading}>
            {t("action.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || familyMembers.length === 0}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("action.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
