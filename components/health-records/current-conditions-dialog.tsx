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
import { CurrentCondition, useCurrentMedicalConditions } from "@/hooks/use-medical-conditions"

interface CurrentConditionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => Promise<void>
}

export function CurrentConditionsDialog({ open, onOpenChange, onRefresh }: CurrentConditionsDialogProps) {
  const { t } = useLanguage()
  const { conditions, loading, addCondition, updateCondition, deleteCondition, refresh } = useCurrentMedicalConditions()
  
  const [editingConditions, setEditingConditions] = useState<CurrentCondition[]>([])
  const [saving, setSaving] = useState(false)
  
  // Track conditions marked for deletion (to delete from DB on save)
  const [deletedConditionIds, setDeletedConditionIds] = useState<number[]>([])
  
  // Confirmation dialog state
  const [conditionToDelete, setConditionToDelete] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      console.log('Loading conditions into dialog:', conditions) // Debug log
      // Ensure dates are in YYYY-MM-DD format for date inputs
      const formattedConditions = conditions.map(condition => ({
        ...condition,
        diagnosedDate: condition.diagnosedDate ? condition.diagnosedDate.split('T')[0] : ''
      }))
      console.log('Formatted conditions:', formattedConditions) // Debug log
      setEditingConditions(formattedConditions)
      setDeletedConditionIds([]) // Reset deletion tracking
    }
  }, [open, conditions])

  const handleAddNew = () => {
    const newCondition: CurrentCondition = {
      condition: '',
      diagnosedDate: '',
      treatedWith: '',
      status: 'controlled',
      notes: ''
    }
    setEditingConditions(prev => [...prev, newCondition])
  }

  const handleUpdateCondition = (index: number, field: keyof CurrentCondition, value: string) => {
    setEditingConditions(prev => prev.map((condition, i) => 
      i === index ? { ...condition, [field]: value } : condition
    ))
  }

  const confirmRemoveCondition = () => {
    if (conditionToDelete === null) return
    
    const condition = editingConditions[conditionToDelete]
    
    // If condition exists in DB, track it for deletion on save
    if (condition.id) {
      setDeletedConditionIds(prev => [...prev, condition.id!])
    }
    
    // Remove from frontend list
    setEditingConditions(prev => prev.filter((_, i) => i !== conditionToDelete))
    setConditionToDelete(null)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // First, delete conditions that were marked for deletion
      for (const conditionId of deletedConditionIds) {
        try {
          await deleteCondition(conditionId)
        } catch (error) {
          console.error(`Failed to delete condition ${conditionId}:`, error)
          // Continue with other operations
        }
      }
      
      // Then, save or update the remaining conditions
      for (const condition of editingConditions) {
        if (condition.id) {
          // Check if condition has actually changed
          const originalCondition = conditions.find(c => c.id === condition.id)
          if (originalCondition && hasConditionChanged(originalCondition, condition)) {
            await updateCondition(condition.id, condition)
          }
        } else if (condition.condition.trim()) {
          // Add new condition
          await addCondition(condition)
        }
      }
      
      setDeletedConditionIds([]) // Clear deletion tracking
      
      // Refresh the data to ensure UI is updated
      if (onRefresh) {
        await onRefresh()
      } else {
        await refresh()
      }
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setSaving(false)
    }
  }

  const hasConditionChanged = (original: CurrentCondition, edited: CurrentCondition): boolean => {
    return (
      original.condition !== edited.condition ||
      original.diagnosedDate !== edited.diagnosedDate ||
      original.treatedWith !== edited.treatedWith ||
      original.status !== edited.status ||
      original.notes !== edited.notes
    )
  }

  const validateForm = (): boolean => {
    // Allow saving even with no conditions (user can delete all)
    if (editingConditions.length === 0) {
      return true
    }
    
    // Check if all remaining conditions have required fields
    for (const condition of editingConditions) {
      // Condition name is required
      if (!condition.condition || !condition.condition.trim()) {
        return false
      }
      // Diagnosed date is required
      if (!condition.diagnosedDate) {
        return false
      }
      // Treatment is required
      if (!condition.treatedWith || !condition.treatedWith.trim()) {
        return false
      }
    }
    return true
  }

  const handleCancel = () => {
    setEditingConditions([...conditions])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("health.editCurrentConditions")}</DialogTitle>
          <DialogDescription>
            {t("health.editCurrentConditionsDesc")}
          </DialogDescription>
        </DialogHeader>
        
        {/* Add New Button - Sticky at Top */}
        <div className="flex-shrink-0 pb-4 border-b">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddNew}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Current Condition
          </Button>
        </div>
        
        {/* Scrollable Conditions List */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {editingConditions.map((condition, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {condition.condition || `Condition ${index + 1}`}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConditionToDelete(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`condition-${index}`}>
                    {t("health.condition")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`condition-${index}`}
                    value={condition.condition}
                    onChange={(e) => handleUpdateCondition(index, 'condition', e.target.value)}
                    placeholder="Enter condition name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`status-${index}`}>{t("health.status.label")}</Label>
                  <Select
                    value={condition.status}
                    onValueChange={(value: 'controlled' | 'partiallyControlled' | 'uncontrolled') => 
                      handleUpdateCondition(index, 'status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="controlled">{t("health.status.controlled")}</SelectItem>
                      <SelectItem value="partiallyControlled">{t("health.status.partiallyControlled")}</SelectItem>
                      <SelectItem value="uncontrolled">{t("health.status.uncontrolled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`diagnosed-${index}`}>
                    {t("health.diagnosed")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`diagnosed-${index}`}
                    type="date"
                    value={condition.diagnosedDate}
                    onChange={(e) => handleUpdateCondition(index, 'diagnosedDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`treatment-${index}`}>
                    {t("health.treatment")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`treatment-${index}`}
                    value={condition.treatedWith}
                    onChange={(e) => handleUpdateCondition(index, 'treatedWith', e.target.value)}
                    placeholder="Enter treatment details"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor={`notes-${index}`}>{t("health.notes")}</Label>
                <Textarea
                  id={`notes-${index}`}
                  value={condition.notes}
                  onChange={(e) => handleUpdateCondition(index, 'notes', e.target.value)}
                  placeholder="Enter additional notes"
                  rows={2}
                />
              </div>
            </div>
          ))}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={conditionToDelete !== null} onOpenChange={() => setConditionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Condition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this condition? This action will be saved when you click the Save button.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConditionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveCondition}
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
