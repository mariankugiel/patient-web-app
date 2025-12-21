"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { CurrentCondition } from "@/hooks/use-medical-conditions"
import { ChronicDiseaseAutocomplete } from "@/components/ui/chronic-disease-autocomplete"

interface CurrentConditionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => Promise<void>
  selectedCondition?: any | null
  addCondition?: (condition: Omit<CurrentCondition, 'id'>) => Promise<CurrentCondition>
  updateCondition?: (id: number, condition: Omit<CurrentCondition, 'id'>) => Promise<CurrentCondition>
  deleteCondition?: (id: number) => Promise<void>
}

export function CurrentConditionsDialog({ 
  open, 
  onOpenChange, 
  onRefresh, 
  selectedCondition,
  addCondition,
  updateCondition,
  deleteCondition
}: CurrentConditionsDialogProps) {
  const { t } = useLanguage()
  
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCondition, setEditingCondition] = useState<CurrentCondition | null>(null)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  
  // Confirmation dialog state
  const [conditionToDelete, setConditionToDelete] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      // Clear validation errors when dialog opens
      setValidationErrors({})
      
      if (selectedCondition) {
        // Edit mode - edit single condition
        setIsEditMode(true)
        const formattedCondition = {
          ...selectedCondition,
          diagnosedDate: selectedCondition.diagnosedDate?.includes('T') 
            ? selectedCondition.diagnosedDate.split('T')[0] 
            : selectedCondition.diagnosedDate || ''
        }
        setEditingCondition(formattedCondition)
      } else {
        // Add mode - create new single condition
        setIsEditMode(false)
        const newCondition: CurrentCondition = {
          condition: '',
          diagnosedDate: '',
          status: 'uncontrolled',
          treatedWith: '',
          notes: ''
        }
        setEditingCondition(newCondition)
      }
    }
  }, [open, selectedCondition])


  const updateSingleConditionField = (field: keyof CurrentCondition, value: string) => {
    if (editingCondition) {
      setEditingCondition(prev => prev ? { ...prev, [field]: value } : null)
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
    
    if (!editingCondition?.condition?.trim()) {
      errors.condition = t('health.dialog.conditionNameRequired')
    }
    
    if (!editingCondition?.diagnosedDate?.trim()) {
      errors.diagnosedDate = t('health.dialog.dateDiagnosedRequired')
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }


  const handleSave = async () => {
    if (!validateForm()) {
      return
    }
    
    setSaving(true)
    try {
      if (isEditMode && editingCondition) {
        // Edit single condition
        if (editingCondition.id && updateCondition) {
          await updateCondition(editingCondition.id, editingCondition)
        }
      } else if (!isEditMode && editingCondition && addCondition) {
        // Add mode - add single new condition
        await addCondition(editingCondition)
      }
      
      if (onRefresh) {
        await onRefresh()
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save conditions:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingCondition?.id || !deleteCondition) return
    
    try {
      await deleteCondition(editingCondition.id)
      if (onRefresh) {
        await onRefresh()
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete condition:', error)
    }
  }


  const handleCancel = () => {
    setEditingCondition(null)
    onOpenChange(false)
  }

  const confirmDelete = () => {
    setConditionToDelete(editingCondition?.id || null)
  }

  const handleDeleteConfirm = async () => {
    if (conditionToDelete && deleteCondition) {
      try {
        await deleteCondition(conditionToDelete)
        if (onRefresh) {
          await onRefresh()
        } else {
          await refresh()
        }
        onOpenChange(false)
      } catch (error) {
        console.error('Failed to delete condition:', error)
      }
    }
    setConditionToDelete(null)
  }

  const handleDeleteCancel = () => {
    setConditionToDelete(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? t('health.dialog.editCurrentCondition') : t('health.dialog.addNewCurrentCondition')}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? t('health.dialog.editCurrentConditionDesc')
                : t('health.dialog.addNewCurrentConditionDesc')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">

            {/* Edit Mode - Single Condition */}
            {isEditMode && editingCondition && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">{t('health.dialog.editCondition')}</h4>
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
                    <Label htmlFor="condition">{t('health.dialog.conditionName')} <span className="text-red-500">*</span></Label>
                    <ChronicDiseaseAutocomplete
                      value={editingCondition.condition}
                      onChange={(value) => updateSingleConditionField('condition', value)}
                      placeholder={t('health.dialog.enterConditionName')}
                      error={validationErrors.condition}
                    />
                    {validationErrors.condition && (
                      <p className="text-sm text-red-500">{validationErrors.condition}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('health.dialog.status')}</Label>
                    <Select
                      value={editingCondition.status}
                      onValueChange={(value) => updateSingleConditionField('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('health.dialog.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="controlled">{t('health.dialog.statusControlled')}</SelectItem>
                        <SelectItem value="partiallyControlled">{t('health.dialog.statusPartiallyControlled')}</SelectItem>
                        <SelectItem value="uncontrolled">{t('health.dialog.statusUncontrolled')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosedDate">{t('health.dialog.dateDiagnosed')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="diagnosedDate"
                      type="date"
                      value={editingCondition.diagnosedDate}
                      onChange={(e) => updateSingleConditionField('diagnosedDate', e.target.value)}
                      className={validationErrors.diagnosedDate ? "border-red-500" : ""}
                    />
                    {validationErrors.diagnosedDate && (
                      <p className="text-sm text-red-500">{validationErrors.diagnosedDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatedWith">{t('health.dialog.treatment')}</Label>
                    <Input
                      id="treatedWith"
                      value={editingCondition.treatedWith}
                      onChange={(e) => updateSingleConditionField('treatedWith', e.target.value)}
                      placeholder={t('health.dialog.currentTreatment')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('health.dialog.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={editingCondition.notes}
                    onChange={(e) => updateSingleConditionField('notes', e.target.value)}
                    placeholder={t('health.dialog.additionalNotes')}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Add Mode - Single Condition Form */}
            {!isEditMode && editingCondition && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add_condition">{t('health.dialog.conditionName')} <span className="text-red-500">*</span></Label>
                    <ChronicDiseaseAutocomplete
                      value={editingCondition.condition}
                      onChange={(value) => updateSingleConditionField('condition', value)}
                      placeholder={t('health.dialog.enterConditionName')}
                      error={validationErrors.condition}
                    />
                    {validationErrors.condition && (
                      <p className="text-sm text-red-500">{validationErrors.condition}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_status">{t('health.dialog.status')}</Label>
                    <Select
                      value={editingCondition.status}
                      onValueChange={(value) => updateSingleConditionField('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('health.dialog.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="controlled">{t('health.dialog.statusControlled')}</SelectItem>
                        <SelectItem value="partiallyControlled">{t('health.dialog.statusPartiallyControlled')}</SelectItem>
                        <SelectItem value="uncontrolled">{t('health.dialog.statusUncontrolled')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add_diagnosedDate">{t('health.dialog.dateDiagnosed')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="add_diagnosedDate"
                      type="date"
                      value={editingCondition.diagnosedDate}
                      onChange={(e) => updateSingleConditionField('diagnosedDate', e.target.value)}
                      className={validationErrors.diagnosedDate ? "border-red-500" : ""}
                    />
                    {validationErrors.diagnosedDate && (
                      <p className="text-sm text-red-500">{validationErrors.diagnosedDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_treatedWith">{t('health.dialog.treatment')}</Label>
                    <Input
                      id="add_treatedWith"
                      value={editingCondition.treatedWith}
                      onChange={(e) => updateSingleConditionField('treatedWith', e.target.value)}
                      placeholder={t('health.dialog.currentTreatment')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_notes">{t('health.dialog.notes')}</Label>
                  <Textarea
                    id="add_notes"
                    value={editingCondition.notes}
                    onChange={(e) => updateSingleConditionField('notes', e.target.value)}
                    placeholder={t('health.dialog.additionalNotes')}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              {t('health.dialog.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? t('health.dialog.updateCondition') : t('health.dialog.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={conditionToDelete !== null} onOpenChange={() => setConditionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('health.dialog.confirmDeletion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('health.dialog.deleteCurrentConditionConfirm')}
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
