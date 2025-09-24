"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { FamilyHistoryEntry, useFamilyMedicalHistory } from "@/hooks/use-medical-conditions"

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

export function FamilyHistoryDialog({ open, onOpenChange, onRefresh }: FamilyHistoryDialogProps) {
  const { t } = useLanguage()
  const { history, addHistoryEntry, updateHistoryEntry, deleteHistoryEntry, refresh } = useFamilyMedicalHistory()
  
  const [editingHistory, setEditingHistory] = useState<FamilyHistoryEntry[]>([])
  const [originalHistory, setOriginalHistory] = useState<FamilyHistoryEntry[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setEditingHistory([...history])
      setOriginalHistory([...history])
    }
  }, [open, history])

  const handleAddNew = () => {
    const newEntry: FamilyHistoryEntry = {
      condition: '',
      relation: '',
      ageOfOnset: '',
      outcome: ''
    }
    setEditingHistory(prev => [...prev, newEntry])
  }

  const handleUpdateEntry = (index: number, field: keyof FamilyHistoryEntry, value: string) => {
    setEditingHistory(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ))
  }

  const handleRemoveEntry = async (index: number) => {
    const entry = editingHistory[index]
    if (entry.id) {
      try {
        // Delete from backend
        await deleteHistoryEntry(entry.id)
        // Refresh the data to ensure UI is updated
        if (onRefresh) {
          await onRefresh()
        } else {
          await refresh()
        }
      } catch (error) {
        // Error handling is done in the hook
        console.error('Failed to delete history entry:', error)
      }
    }
    setEditingHistory(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      for (const entry of editingHistory) {
        if (entry.id) {
          // Check if this entry has been modified
          const originalEntry = originalHistory.find(orig => orig.id === entry.id)
          if (originalEntry && hasEntryChanged(originalEntry, entry)) {
            // Only update if the entry has actually changed
            await updateHistoryEntry(entry.id, entry)
          }
        } else if (entry.condition.trim()) {
          // Add new entry
          await addHistoryEntry(entry)
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

  // Helper function to check if an entry has been modified
  const hasEntryChanged = (original: FamilyHistoryEntry, current: FamilyHistoryEntry): boolean => {
    return (
      original.condition !== current.condition ||
      original.relation !== current.relation ||
      original.ageOfOnset !== current.ageOfOnset ||
      original.outcome !== current.outcome
    )
  }

  const handleCancel = () => {
    setEditingHistory([...history])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("health.editFamilyHistory")}</DialogTitle>
          <DialogDescription>
            {t("health.editFamilyHistoryDesc")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[400px] overflow-y-auto space-y-4">
          {editingHistory.map((entry, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Family Member {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveEntry(index)}
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
                    value={entry.condition}
                    onChange={(e) => handleUpdateEntry(index, 'condition', e.target.value)}
                    placeholder="Enter condition name"
                  />
                </div>
                <div>
                  <Label htmlFor={`relation-${index}`}>{t("health.relation")}</Label>
                  <Select
                    value={entry.relation}
                    onValueChange={(value) => handleUpdateEntry(index, 'relation', value)}
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`age-${index}`}>{t("health.ageOfOnset")}</Label>
                  <Input
                    id={`age-${index}`}
                    type="number"
                    value={entry.ageOfOnset}
                    onChange={(e) => handleUpdateEntry(index, 'ageOfOnset', e.target.value)}
                    placeholder="Age at onset"
                    min="0"
                    max="120"
                  />
                </div>
                <div>
                  <Label htmlFor={`outcome-${index}`}>{t("health.outcome")}</Label>
                  <Input
                    id={`outcome-${index}`}
                    value={entry.outcome}
                    onChange={(e) => handleUpdateEntry(index, 'outcome', e.target.value)}
                    placeholder="Enter outcome details"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={handleAddNew}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Family Member
          </Button>
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
