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
  "Son",
  "Daughter",
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
  
  // Track members marked for deletion (to delete from DB on save)
  const [deletedMemberIds, setDeletedMemberIds] = useState<number[]>([])
  
  // Confirmation dialog states
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null)
  const [diseaseToDelete, setDiseaseToDelete] = useState<{ memberIndex: number; diseaseId: string } | null>(null)

  // Helper function to convert UPPERCASE_WITH_UNDERSCORES to Title Case With Spaces
  const convertRelationToDisplayFormat = (relation: string): string => {
    return relation
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Get available relationship options for a specific member
  const getAvailableRelationships = (currentMemberIndex: number): string[] => {
    // Relationships that can appear multiple times
    const multipleAllowed = ["Brother", "Sister", "Son", "Daughter"]
    
    // Get all currently used relationships except for the current member being edited
    const usedRelationships = familyMembers
      .filter((_, index) => index !== currentMemberIndex)
      .map(member => member.relation)
    
    // Filter out relationships that are already used (unless they allow multiples)
    return relationshipOptions.filter(relation => 
      multipleAllowed.includes(relation) || !usedRelationships.includes(relation)
    )
  }

  // Load existing family history when dialog opens
  useEffect(() => {
    if (open) {
      loadFamilyHistory()
      setDeletedMemberIds([]) // Reset deletion tracking
    }
  }, [open])

  const loadFamilyHistory = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/health-records/family-history')
      const histories = response.data || []
      
      // Convert backend format to component format
      // Backend uses UPPERCASE with underscores, frontend uses Title Case with spaces
      const members: FamilyMember[] = histories.map((h: any) => ({
        id: h.id,
        relation: h.relation ? convertRelationToDisplayFormat(h.relation) : '',
        is_deceased: h.is_deceased || false,
        age_at_death: h.age_at_death?.toString() || '',
        cause_of_death: h.cause_of_death || '',
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
      chronic_diseases: []
    }
    setFamilyMembers(prev => [...prev, newMember])
  }

  const confirmRemoveFamilyMember = () => {
    if (memberToDelete === null) return
    
    const member = familyMembers[memberToDelete]
    
    // If member exists in DB, track it for deletion on save
    if (member.id) {
      setDeletedMemberIds(prev => [...prev, member.id!])
    }
    
    // Remove from frontend list
    setFamilyMembers(prev => prev.filter((_, i) => i !== memberToDelete))
    setMemberToDelete(null)
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

  const confirmRemoveDisease = () => {
    if (!diseaseToDelete) return
    
    setFamilyMembers(prev => prev.map((member, i) => 
      i === diseaseToDelete.memberIndex 
        ? { ...member, chronic_diseases: member.chronic_diseases.filter(d => d.id !== diseaseToDelete.diseaseId) }
        : member
    ))
    setDiseaseToDelete(null)
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
      
      console.log('Family members state before save:', familyMembers) // Debug log
      console.log('Deleted member IDs:', deletedMemberIds) // Debug log
      
      // First, delete members that were marked for deletion
      for (const memberId of deletedMemberIds) {
        try {
          await apiClient.delete(`/health-records/family-history/${memberId}`)
          console.log(`Deleted family member ${memberId}`)
        } catch (error) {
          console.error(`Failed to delete family member ${memberId}:`, error)
          // Continue with other operations even if one deletion fails
        }
      }
      
      // Then, save or update the remaining members
      for (const member of familyMembers) {
        // Validate required fields
        if (!member.relation) {
          toast.error('Please select a relationship for all family members')
          setSaving(false)
          return
        }
        
        console.log('Processing member:', member) // Debug log
        
        const memberData = {
          relation: member.relation.toUpperCase().replace(/ /g, '_'), // Convert to uppercase with underscores
          is_deceased: member.is_deceased,
          age_at_death: member.age_at_death ? parseInt(member.age_at_death) : null,
          cause_of_death: member.cause_of_death || null,
          chronic_diseases: member.chronic_diseases
            .filter(d => d.disease) // Only include diseases with a name
            .map(d => ({
              disease: d.disease,
              age_at_diagnosis: d.age_at_diagnosis,
              comments: d.comments
            }))
        }
        
        console.log('Saving family member data:', memberData) // Debug log
        
        if (member.id) {
          // Update existing
          await apiClient.put(`/health-records/family-history/${member.id}`, memberData)
        } else {
          // Create new
          await apiClient.post('/health-records/family-history', memberData)
        }
      }
      
      toast.success('Family medical history saved successfully!')
      setDeletedMemberIds([]) // Clear deletion tracking
      if (onRefresh) await onRefresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save family history:', error)
      toast.error('Failed to save family history')
    } finally {
      setSaving(false)
    }
  }

  const validateForm = (): boolean => {
    // Allow saving even with no members (user can delete all)
    if (familyMembers.length === 0) {
      return true
    }
    
    // Check if all family members have a relation selected
    for (const member of familyMembers) {
      if (!member.relation) {
        return false
      }
      
      // If deceased, must have age at death
      if (member.is_deceased && !member.age_at_death) {
        return false
      }
      
      // Check all chronic diseases have at least a disease name
      for (const disease of member.chronic_diseases) {
        if (!disease.disease) {
          return false
        }
      }
    }
    
    return true
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
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
                  <h4 className="font-bold text-lg">
                    {member.relation || `Family Member ${memberIndex + 1}`}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMemberToDelete(memberIndex)}
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
                      {getAvailableRelationships(memberIndex).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                              onClick={() => setDiseaseToDelete({ memberIndex, diseaseId: disease.id })}
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
          <Button onClick={handleSave} disabled={saving || loading || !validateForm()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("action.save")}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Delete Family Member Confirmation Dialog */}
      <AlertDialog open={memberToDelete !== null} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Family Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this family member? This will delete all their medical history information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveFamilyMember}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Chronic Disease Confirmation Dialog */}
      <AlertDialog open={diseaseToDelete !== null} onOpenChange={() => setDiseaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Chronic Disease</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this chronic disease entry?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDiseaseToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveDisease}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
