"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Trash2, Loader2, Plus } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface FamilyHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => Promise<void>
  selectedEntry?: any | null
  existingEntries?: any[]
  addHistoryEntry?: (entry: any) => Promise<any>
  updateHistoryEntry?: (id: number, entry: any) => Promise<void>
  deleteHistoryEntry?: (id: number) => Promise<void>
}

export function FamilyHistoryDialog({ 
  open, 
  onOpenChange, 
  onRefresh, 
  selectedEntry,
  existingEntries = [],
  addHistoryEntry: addFamilyMember,
  updateHistoryEntry: updateFamilyMember,
  deleteHistoryEntry: deleteFamilyMember
}: FamilyHistoryDialogProps) {
  const { t } = useLanguage()
  
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  
  // Confirmation dialog state
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      if (selectedEntry) {
        // Edit mode - edit single entry
        setIsEditMode(true)
        setEditingEntry({ ...selectedEntry })
      } else {
        // Add mode - create new single entry
        setIsEditMode(false)
        const newEntry = {
          relation: '',
          current_age: '',
          is_deceased: false,
          age_at_death: '',
          cause_of_death: '',
          chronic_diseases: []
        }
        setEditingEntry(newEntry)
      }
    }
  }, [open, selectedEntry])

  const updateEntryField = (field: string, value: any) => {
    if (editingEntry) {
      setEditingEntry((prev: any) => prev ? { ...prev, [field]: value } : null)
      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    }
  }

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!editingEntry?.relation?.trim()) {
      errors.relation = t('health.dialog.relationRequired')
    }
    
    // If deceased, age_at_death and cause_of_death are mandatory
    if (editingEntry?.is_deceased) {
      if (!editingEntry?.age_at_death?.trim()) {
        errors.age_at_death = t('health.dialog.ageAtDeathRequired')
      }
      if (!editingEntry?.cause_of_death?.trim()) {
        errors.cause_of_death = t('health.dialog.causeOfDeathRequired')
      }
    }
    
    // If alive and has chronic diseases, disease name and age at diagnosis are mandatory
    if (!editingEntry?.is_deceased && editingEntry?.chronic_diseases?.length > 0) {
      editingEntry.chronic_diseases.forEach((disease: any, index: number) => {
        if (!disease.disease?.trim()) {
          errors[`chronic_disease_${index}_name`] = t('health.dialog.diseaseNameRequired')
        }
        if (!disease.age_at_diagnosis?.trim()) {
          errors[`chronic_disease_${index}_age`] = t('health.dialog.ageAtDiagnosisRequired')
        }
      })
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const addChronicDisease = () => {
    if (editingEntry) {
      const newDisease = { disease: '', age_at_diagnosis: '', comments: '' }
      console.log('Adding chronic disease, current chronic_diseases:', editingEntry.chronic_diseases)
      setEditingEntry((prev: any) => {
        const newEntry = prev ? {
          ...prev,
          chronic_diseases: [...(prev.chronic_diseases || []), newDisease]
        } : null
        console.log('New entry after adding chronic disease:', newEntry)
        return newEntry
      })
    }
  }

  const updateChronicDisease = (index: number, field: string, value: string) => {
    if (editingEntry) {
      const updatedDiseases = [...(editingEntry.chronic_diseases || [])]
      updatedDiseases[index] = { ...updatedDiseases[index], [field]: value }
      console.log('Updating chronic disease, new diseases:', updatedDiseases)
      setEditingEntry((prev: any) => {
        const newEntry = prev ? { ...prev, chronic_diseases: updatedDiseases } : null
        console.log('Entry after updating chronic disease:', newEntry)
        return newEntry
      })
      
      // Clear validation error when user starts typing
      const errorKey = `chronic_disease_${index}_${field === 'disease' ? 'name' : 'age'}`
      if (validationErrors[errorKey]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[errorKey]
          return newErrors
        })
      }
    }
  }

  const removeChronicDisease = (index: number) => {
    if (editingEntry) {
      const updatedDiseases = editingEntry.chronic_diseases.filter((_: any, i: number) => i !== index)
      setEditingEntry((prev: any) => prev ? { ...prev, chronic_diseases: updatedDiseases } : null)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }
    
    console.log('Saving family history entry:', editingEntry)
    console.log('Chronic diseases:', editingEntry?.chronic_diseases)
    
    setSaving(true)
    try {
      if (isEditMode && editingEntry) {
        // Edit single entry
        if (editingEntry.id && updateFamilyMember) {
          await updateFamilyMember(editingEntry.id, editingEntry)
        }
      } else if (!isEditMode && editingEntry && addFamilyMember) {
        // Add mode - add single new entry
        await addFamilyMember(editingEntry)
      }
      
      if (onRefresh) {
        await onRefresh()
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save family history:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingEntry?.id || !deleteFamilyMember) return
    
    try {
      await deleteFamilyMember(editingEntry.id)
      if (onRefresh) {
        await onRefresh()
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete family member:', error)
    }
  }

  const handleCancel = () => {
    setEditingEntry(null)
    onOpenChange(false)
  }

  const confirmDelete = () => {
    setEntryToDelete(editingEntry?.id || null)
  }

  const handleDeleteConfirm = async () => {
    if (entryToDelete && deleteFamilyMember) {
      try {
        await deleteFamilyMember(entryToDelete)
        if (onRefresh) {
          await onRefresh()
        }
        onOpenChange(false)
      } catch (error) {
        console.error('Failed to delete family member:', error)
      }
    }
    setEntryToDelete(null)
  }

  const handleDeleteCancel = () => {
    setEntryToDelete(null)
  }

  const relationOptions = [
    { value: 'MOTHER', label: t('health.dialog.relationMother') },
    { value: 'FATHER', label: t('health.dialog.relationFather') },
    { value: 'MATERNAL_GRANDMOTHER', label: t('health.dialog.relationMaternalGrandmother') },
    { value: 'MATERNAL_GRANDFATHER', label: t('health.dialog.relationMaternalGrandfather') },
    { value: 'PATERNAL_GRANDMOTHER', label: t('health.dialog.relationPaternalGrandmother') },
    { value: 'PATERNAL_GRANDFATHER', label: t('health.dialog.relationPaternalGrandfather') },
    { value: 'SISTER', label: t('health.dialog.relationSister') },
    { value: 'BROTHER', label: t('health.dialog.relationBrother') },
    { value: 'SON', label: t('health.dialog.relationSon') },
    { value: 'DAUGHTER', label: t('health.dialog.relationDaughter') }
  ]

  // Filter out already used relations (only in add mode)
  const availableRelations = isEditMode 
    ? relationOptions // In edit mode, show all options
    : relationOptions.filter(option => 
        !existingEntries.some(entry => entry.relation === option.value)
      )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? t('health.dialog.editFamilyHistory') : t('health.dialog.addNewFamilyHistory')}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? t('health.dialog.editFamilyHistoryDesc')
                : t('health.dialog.addNewFamilyHistoryDesc')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Edit Mode - Single Entry */}
            {isEditMode && editingEntry && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">{t('health.dialog.editFamilyMember')}</h4>
                  <Button
                    onClick={confirmDelete}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="relation">{t('health.dialog.relation')} <span className="text-red-500">*</span></Label>
                    <Select
                      value={editingEntry.relation}
                      onValueChange={(value) => updateEntryField('relation', value)}
                    >
                      <SelectTrigger className={validationErrors.relation ? "border-red-500" : ""}>
                        <SelectValue placeholder={t('health.dialog.selectRelation')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRelations.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.relation && (
                      <p className="text-sm text-red-500">{validationErrors.relation}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_age">{t('health.dialog.currentAge')}</Label>
                    <Input
                      id="current_age"
                      type="number"
                      min="0"
                      max="150"
                      value={editingEntry.current_age}
                      onChange={(e) => updateEntryField('current_age', e.target.value)}
                      placeholder={t('health.dialog.enterCurrentAge')}
                      disabled={editingEntry.is_deceased}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_deceased"
                    checked={editingEntry.is_deceased}
                    onCheckedChange={(checked) => updateEntryField('is_deceased', checked)}
                  />
                  <Label htmlFor="is_deceased">{t('health.dialog.deceased')}</Label>
                </div>

                {editingEntry.is_deceased && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age_at_death">{t('health.dialog.ageAtDeath')} <span className="text-red-500">*</span></Label>
                      <Input
                        id="age_at_death"
                        type="number"
                        min="0"
                        max="150"
                        value={editingEntry.age_at_death}
                        onChange={(e) => updateEntryField('age_at_death', e.target.value)}
                        placeholder={t('health.dialog.enterAgeAtDeath')}
                        className={validationErrors.age_at_death ? "border-red-500" : ""}
                      />
                      {validationErrors.age_at_death && (
                        <p className="text-sm text-red-500">{validationErrors.age_at_death}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cause_of_death">{t('health.dialog.causeOfDeath')} <span className="text-red-500">*</span></Label>
                      <Input
                        id="cause_of_death"
                        value={editingEntry.cause_of_death}
                        onChange={(e) => updateEntryField('cause_of_death', e.target.value)}
                        placeholder={t('health.dialog.enterCauseOfDeath')}
                        className={validationErrors.cause_of_death ? "border-red-500" : ""}
                      />
                      {validationErrors.cause_of_death && (
                        <p className="text-sm text-red-500">{validationErrors.cause_of_death}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Chronic Diseases - Only show if not deceased */}
                {!editingEntry.is_deceased && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">{t('health.dialog.chronicDiseases')}</Label>
                      <Button onClick={addChronicDisease} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('health.dialog.addDisease')}
                      </Button>
                    </div>
                    
                    {(editingEntry.chronic_diseases || []).map((disease: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium text-sm">{t('health.dialog.diseaseNumber')}{index + 1}</h5>
                          <Button
                            onClick={() => removeChronicDisease(index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div className="space-y-1">
                             <Label className="text-xs">{t('health.dialog.diseaseName')} <span className="text-red-500">*</span></Label>
                             <Input
                               value={disease.disease}
                               onChange={(e) => updateChronicDisease(index, 'disease', e.target.value)}
                               placeholder={t('health.dialog.diseaseNamePlaceholder')}
                               className={`text-sm ${validationErrors[`chronic_disease_${index}_name`] ? "border-red-500" : ""}`}
                             />
                             {validationErrors[`chronic_disease_${index}_name`] && (
                               <p className="text-xs text-red-500">{validationErrors[`chronic_disease_${index}_name`]}</p>
                             )}
                           </div>
                           <div className="space-y-1">
                             <Label className="text-xs">{t('health.dialog.ageAtDiagnosis')} <span className="text-red-500">*</span></Label>
                             <Input
                               type="number"
                               min="0"
                               max="150"
                               value={disease.age_at_diagnosis}
                               onChange={(e) => updateChronicDisease(index, 'age_at_diagnosis', e.target.value)}
                               placeholder={t('health.dialog.agePlaceholder')}
                               className={`text-sm ${validationErrors[`chronic_disease_${index}_age`] ? "border-red-500" : ""}`}
                             />
                             {validationErrors[`chronic_disease_${index}_age`] && (
                               <p className="text-xs text-red-500">{validationErrors[`chronic_disease_${index}_age`]}</p>
                             )}
                           </div>
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs">{t('health.dialog.comments')}</Label>
                           <Textarea
                             value={disease.comments}
                             onChange={(e) => updateChronicDisease(index, 'comments', e.target.value)}
                             placeholder={t('health.dialog.commentsPlaceholder')}
                             className="text-sm"
                             rows={2}
                           />
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add Mode - Single Entry Form */}
            {!isEditMode && editingEntry && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add_relation">{t('health.dialog.relation')} <span className="text-red-500">*</span></Label>
                    <Select
                      value={editingEntry.relation}
                      onValueChange={(value) => updateEntryField('relation', value)}
                    >
                      <SelectTrigger className={validationErrors.relation ? "border-red-500" : ""}>
                        <SelectValue placeholder={t('health.dialog.selectRelation')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRelations.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.relation && (
                      <p className="text-sm text-red-500">{validationErrors.relation}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_current_age">{t('health.dialog.currentAge')}</Label>
                    <Input
                      id="add_current_age"
                      type="number"
                      min="0"
                      max="150"
                      value={editingEntry.current_age}
                      onChange={(e) => updateEntryField('current_age', e.target.value)}
                      placeholder={t('health.dialog.enterCurrentAge')}
                      disabled={editingEntry.is_deceased}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add_is_deceased"
                    checked={editingEntry.is_deceased}
                    onCheckedChange={(checked) => updateEntryField('is_deceased', checked)}
                  />
                  <Label htmlFor="add_is_deceased">{t('health.dialog.deceased')}</Label>
                </div>

                {editingEntry.is_deceased && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add_age_at_death">{t('health.dialog.ageAtDeath')} <span className="text-red-500">*</span></Label>
                      <Input
                        id="add_age_at_death"
                        type="number"
                        min="0"
                        max="150"
                        value={editingEntry.age_at_death}
                        onChange={(e) => updateEntryField('age_at_death', e.target.value)}
                        placeholder={t('health.dialog.enterAgeAtDeath')}
                        className={validationErrors.age_at_death ? "border-red-500" : ""}
                      />
                      {validationErrors.age_at_death && (
                        <p className="text-sm text-red-500">{validationErrors.age_at_death}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add_cause_of_death">{t('health.dialog.causeOfDeath')} <span className="text-red-500">*</span></Label>
                      <Input
                        id="add_cause_of_death"
                        value={editingEntry.cause_of_death}
                        onChange={(e) => updateEntryField('cause_of_death', e.target.value)}
                        placeholder={t('health.dialog.enterCauseOfDeath')}
                        className={validationErrors.cause_of_death ? "border-red-500" : ""}
                      />
                      {validationErrors.cause_of_death && (
                        <p className="text-sm text-red-500">{validationErrors.cause_of_death}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Chronic Diseases - Only show if not deceased */}
                {!editingEntry.is_deceased && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">{t('health.dialog.chronicDiseases')}</Label>
                      <Button onClick={addChronicDisease} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('health.dialog.addDisease')}
                      </Button>
                    </div>
                    
                    {(editingEntry.chronic_diseases || []).map((disease: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium text-sm">{t('health.dialog.diseaseNumber')}{index + 1}</h5>
                          <Button
                            onClick={() => removeChronicDisease(index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div className="space-y-1">
                             <Label className="text-xs">{t('health.dialog.diseaseName')} <span className="text-red-500">*</span></Label>
                             <Input
                               value={disease.disease}
                               onChange={(e) => updateChronicDisease(index, 'disease', e.target.value)}
                               placeholder={t('health.dialog.diseaseNamePlaceholder')}
                               className={`text-sm ${validationErrors[`chronic_disease_${index}_name`] ? "border-red-500" : ""}`}
                             />
                             {validationErrors[`chronic_disease_${index}_name`] && (
                               <p className="text-xs text-red-500">{validationErrors[`chronic_disease_${index}_name`]}</p>
                             )}
                           </div>
                           <div className="space-y-1">
                             <Label className="text-xs">{t('health.dialog.ageAtDiagnosis')} <span className="text-red-500">*</span></Label>
                             <Input
                               type="number"
                               min="0"
                               max="150"
                               value={disease.age_at_diagnosis}
                               onChange={(e) => updateChronicDisease(index, 'age_at_diagnosis', e.target.value)}
                               placeholder={t('health.dialog.agePlaceholder')}
                               className={`text-sm ${validationErrors[`chronic_disease_${index}_age`] ? "border-red-500" : ""}`}
                             />
                             {validationErrors[`chronic_disease_${index}_age`] && (
                               <p className="text-xs text-red-500">{validationErrors[`chronic_disease_${index}_age`]}</p>
                             )}
                           </div>
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs">{t('health.dialog.comments')}</Label>
                           <Textarea
                             value={disease.comments}
                             onChange={(e) => updateChronicDisease(index, 'comments', e.target.value)}
                             placeholder={t('health.dialog.commentsPlaceholder')}
                             className="text-sm"
                             rows={2}
                           />
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              {t('health.dialog.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? t('health.dialog.updateEntry') : t('health.dialog.addEntry')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={entryToDelete !== null} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('health.dialog.confirmDeletion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('health.dialog.deleteFamilyMemberConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>{t('health.dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              {t('health.dialog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}