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

  useEffect(() => {
    if (open) {
      // Ensure dates are in YYYY-MM-DD format for date inputs
      const formattedConditions = conditions.map(condition => ({
        ...condition,
        diagnosedDate: condition.diagnosedDate ? condition.diagnosedDate.split('T')[0] : ''
      }))
      setEditingConditions(formattedConditions)
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

  const handleRemoveCondition = async (index: number) => {
    const condition = editingConditions[index]
    if (condition.id) {
      try {
        // Delete from backend
        await deleteCondition(condition.id)
        // Refresh the data to ensure UI is updated
        if (onRefresh) {
          await onRefresh()
        } else {
          await refresh()
        }
      } catch (error) {
        // Error handling is done in the hook
        console.error('Failed to delete condition:', error)
      }
    }
    setEditingConditions(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
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

  const handleCancel = () => {
    setEditingConditions([...conditions])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("health.editCurrentConditions")}</DialogTitle>
          <DialogDescription>
            {t("health.editCurrentConditionsDesc")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[400px] overflow-y-auto space-y-4">
          {/* Add New Button at Top */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddNew}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Current Condition
          </Button>
          
          {editingConditions.map((condition, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Condition {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveCondition(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`condition-${index}`}>{t("health.condition")}</Label>
                  <Input
                    id={`condition-${index}`}
                    value={condition.condition}
                    onChange={(e) => handleUpdateCondition(index, 'condition', e.target.value)}
                    placeholder="Enter condition name"
                  />
                </div>
                <div>
                  <Label htmlFor={`status-${index}`}>{t("health.statusLabel")}</Label>
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
                  <Label htmlFor={`diagnosed-${index}`}>{t("health.diagnosed")}</Label>
                  <Input
                    id={`diagnosed-${index}`}
                    type="date"
                    value={condition.diagnosedDate}
                    onChange={(e) => handleUpdateCondition(index, 'diagnosedDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`treatment-${index}`}>{t("health.treatment")}</Label>
                  <Input
                    id={`treatment-${index}`}
                    value={condition.treatedWith}
                    onChange={(e) => handleUpdateCondition(index, 'treatedWith', e.target.value)}
                    placeholder="Enter treatment details"
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
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            {t("action.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("action.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
