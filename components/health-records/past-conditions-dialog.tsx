"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Trash2, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { PastCondition, usePastMedicalConditions } from "@/hooks/use-medical-conditions"

interface PastConditionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => Promise<void>
  selectedCondition?: any | null
}

export function PastConditionsDialog({ 
  open, 
  onOpenChange, 
  onRefresh, 
  selectedCondition 
}: PastConditionsDialogProps) {
  const { t } = useLanguage()
  const { conditions, loading, addCondition, updateCondition, deleteCondition, refresh } = usePastMedicalConditions()
  
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCondition, setEditingCondition] = useState<PastCondition | null>(null)
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
            : selectedCondition.diagnosedDate || '',
          resolvedDate: selectedCondition.resolvedDate?.includes('T') 
            ? selectedCondition.resolvedDate.split('T')[0] 
            : selectedCondition.resolvedDate || ''
        }
        setEditingCondition(formattedCondition)
      } else {
        // Add mode - create new single condition
        setIsEditMode(false)
        const newCondition: PastCondition = {
          condition: '',
          diagnosedDate: '',
          resolvedDate: '',
          treatedWith: '',
          notes: ''
        }
        setEditingCondition(newCondition)
      }
    }
  }, [open, conditions, selectedCondition])

  const updateSingleConditionField = (field: keyof PastCondition, value: string) => {
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
      errors.condition = 'Condition name is required'
    }
    
    if (!editingCondition?.diagnosedDate?.trim()) {
      errors.diagnosedDate = 'Diagnosed date is required'
    }
    
    if (!editingCondition?.resolvedDate?.trim()) {
      errors.resolvedDate = 'Resolved date is required'
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
        if (editingCondition.id) {
          await updateCondition(editingCondition.id, editingCondition)
        }
      } else if (!isEditMode && editingCondition) {
        // Add mode - add single new condition
        await addCondition(editingCondition)
      }
      
      if (onRefresh) {
        await onRefresh()
      } else {
        await refresh()
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save past condition:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingCondition?.id) return
    
    try {
      await deleteCondition(editingCondition.id)
      if (onRefresh) {
        await onRefresh()
      } else {
        await refresh()
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete past condition:', error)
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
    if (conditionToDelete) {
      try {
        await deleteCondition(conditionToDelete)
        if (onRefresh) {
          await onRefresh()
        } else {
          await refresh()
        }
        onOpenChange(false)
      } catch (error) {
        console.error('Failed to delete past condition:', error)
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
              {isEditMode ? 'Edit Past Medical Condition' : 'Add New Past Medical Condition'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Edit your past medical condition details.'
                : 'Add a new past medical condition. All fields are optional except Condition Name.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Edit Mode - Single Condition */}
            {isEditMode && editingCondition && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Edit Past Condition</h4>
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
                    <Label htmlFor="condition">Condition Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="condition"
                      value={editingCondition.condition}
                      onChange={(e) => updateSingleConditionField('condition', e.target.value)}
                      placeholder="Enter condition name"
                      className={validationErrors.condition ? "border-red-500" : ""}
                    />
                    {validationErrors.condition && (
                      <p className="text-sm text-red-500">{validationErrors.condition}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatedWith">Treatment</Label>
                    <Input
                      id="treatedWith"
                      value={editingCondition.treatedWith}
                      onChange={(e) => updateSingleConditionField('treatedWith', e.target.value)}
                      placeholder="Treatment received"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosedDate">Date Diagnosed <span className="text-red-500">*</span></Label>
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
                    <Label htmlFor="resolvedDate">Date Resolved <span className="text-red-500">*</span></Label>
                    <Input
                      id="resolvedDate"
                      type="date"
                      value={editingCondition.resolvedDate}
                      onChange={(e) => updateSingleConditionField('resolvedDate', e.target.value)}
                      className={validationErrors.resolvedDate ? "border-red-500" : ""}
                    />
                    {validationErrors.resolvedDate && (
                      <p className="text-sm text-red-500">{validationErrors.resolvedDate}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editingCondition.notes}
                    onChange={(e) => updateSingleConditionField('notes', e.target.value)}
                    placeholder="Additional notes about the condition"
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
                    <Label htmlFor="add_condition">Condition Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="add_condition"
                      value={editingCondition.condition}
                      onChange={(e) => updateSingleConditionField('condition', e.target.value)}
                      placeholder="Enter condition name"
                      className={validationErrors.condition ? "border-red-500" : ""}
                    />
                    {validationErrors.condition && (
                      <p className="text-sm text-red-500">{validationErrors.condition}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_treatedWith">Treatment</Label>
                    <Input
                      id="add_treatedWith"
                      value={editingCondition.treatedWith}
                      onChange={(e) => updateSingleConditionField('treatedWith', e.target.value)}
                      placeholder="Treatment received"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add_diagnosedDate">Date Diagnosed <span className="text-red-500">*</span></Label>
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
                    <Label htmlFor="add_resolvedDate">Date Resolved <span className="text-red-500">*</span></Label>
                    <Input
                      id="add_resolvedDate"
                      type="date"
                      value={editingCondition.resolvedDate}
                      onChange={(e) => updateSingleConditionField('resolvedDate', e.target.value)}
                      className={validationErrors.resolvedDate ? "border-red-500" : ""}
                    />
                    {validationErrors.resolvedDate && (
                      <p className="text-sm text-red-500">{validationErrors.resolvedDate}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_notes">Notes</Label>
                  <Textarea
                    id="add_notes"
                    value={editingCondition.notes}
                    onChange={(e) => updateSingleConditionField('notes', e.target.value)}
                    placeholder="Additional notes about the condition"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? 'Update Condition' : 'Add Condition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={conditionToDelete !== null} onOpenChange={() => setConditionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this past medical condition? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
