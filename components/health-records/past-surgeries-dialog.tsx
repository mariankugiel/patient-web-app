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
import { Trash2, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useSurgeryHospitalization } from "@/hooks/use-surgery-hospitalization"

interface PastSurgeriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => Promise<void>
  selectedSurgery?: any | null
}

export function PastSurgeriesDialog({ open, onOpenChange, onRefresh, selectedSurgery }: PastSurgeriesDialogProps) {
  const { t } = useLanguage()
  const { surgeries, loading, createSurgery, updateSurgery, deleteSurgery, refresh } = useSurgeryHospitalization()
  
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingSurgery, setEditingSurgery] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  
  // Confirmation dialog state
  const [surgeryToDelete, setSurgeryToDelete] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      // Clear validation errors when dialog opens
      setValidationErrors({})
      
      if (selectedSurgery) {
        // Edit mode - edit single surgery
        setIsEditMode(true)
        const formattedSurgery = {
          // Map backend fields to frontend fields
          procedure_type: selectedSurgery.procedure_type || 'surgery',
          name: selectedSurgery.name || selectedSurgery.condition_name?.replace('Surgery: ', '') || '',
          procedure_date: selectedSurgery.procedure_date || selectedSurgery.diagnosed_date?.split('T')[0] || '',
          reason: selectedSurgery.reason || '',
          treatment: selectedSurgery.treatment || selectedSurgery.treatment_plan || '',
          body_area: selectedSurgery.body_area || '',
          recovery_status: selectedSurgery.recovery_status || selectedSurgery.outcome || 'full_recovery',
          notes: selectedSurgery.notes || selectedSurgery.description || ''
        }
        setEditingSurgery(formattedSurgery)
      } else {
        // Add mode - create new single surgery
        setIsEditMode(false)
        const newSurgery = {
          procedure_type: 'surgery',
          name: '',
          procedure_date: '',
          reason: '',
          treatment: '',
          body_area: '',
          recovery_status: 'full_recovery',
          notes: ''
        }
        setEditingSurgery(newSurgery)
      }
    }
  }, [open, selectedSurgery])

  const updateSurgeryField = (field: string, value: any) => {
    if (editingSurgery) {
      setEditingSurgery((prev: any) => prev ? { ...prev, [field]: value } : null)
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
    
    if (!editingSurgery?.name?.trim()) {
      errors.name = 'Procedure name is required'
    }
    
    if (!editingSurgery?.procedure_date?.trim()) {
      errors.procedure_date = 'Procedure date is required'
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
      if (isEditMode && editingSurgery) {
        // Edit single surgery
        if (editingSurgery.id) {
          await updateSurgery(editingSurgery.id, editingSurgery)
        }
      } else if (!isEditMode && editingSurgery) {
        // Add mode - add single new surgery
        await createSurgery(editingSurgery)
      }
      
      if (onRefresh) {
        await onRefresh()
      } else {
        await refresh()
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save surgery:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingSurgery(null)
    onOpenChange(false)
  }

  const confirmDelete = () => {
    setSurgeryToDelete(editingSurgery?.id || null)
  }

  const handleDeleteConfirm = async () => {
    if (surgeryToDelete) {
      try {
        await deleteSurgery(surgeryToDelete)
        if (onRefresh) {
          await onRefresh()
        } else {
          await refresh()
        }
        onOpenChange(false)
      } catch (error) {
        console.error('Failed to delete surgery:', error)
      }
    }
    setSurgeryToDelete(null)
  }

  const handleDeleteCancel = () => {
    setSurgeryToDelete(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Surgery/Hospitalization' : 'Add New Surgery/Hospitalization'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Edit surgery/hospitalization details.'
                : 'Add a new surgery/hospitalization. All fields are optional except Name and Date.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Edit Mode - Single Surgery */}
            {isEditMode && editingSurgery && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Edit Surgery/Hospitalization</h4>
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
                    <Label htmlFor="edit_procedure_type">Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={editingSurgery.procedure_type}
                      onValueChange={(value) => updateSurgeryField('procedure_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surgery">Surgery</SelectItem>
                        <SelectItem value="hospitalization">Hospitalization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_recovery_status">Current Status</Label>
                    <Select
                      value={editingSurgery.recovery_status}
                      onValueChange={(value) => updateSurgeryField('recovery_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_recovery">Full Recovery</SelectItem>
                        <SelectItem value="partial_recovery">Partial Recovery</SelectItem>
                        <SelectItem value="no_recovery">No Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_name">Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit_name"
                      value={editingSurgery.name}
                      onChange={(e) => updateSurgeryField('name', e.target.value)}
                      placeholder="Procedure name"
                      className={validationErrors.name ? "border-red-500" : ""}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500">{validationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_procedure_date">Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit_procedure_date"
                      type="date"
                      value={editingSurgery.procedure_date}
                      onChange={(e) => updateSurgeryField('procedure_date', e.target.value)}
                      className={validationErrors.procedure_date ? "border-red-500" : ""}
                    />
                    {validationErrors.procedure_date && (
                      <p className="text-sm text-red-500">{validationErrors.procedure_date}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_reason">Reason</Label>
                    <Input
                      id="edit_reason"
                      value={editingSurgery.reason}
                      onChange={(e) => updateSurgeryField('reason', e.target.value)}
                      placeholder="Reason for surgery"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_body_area">Body Area</Label>
                    <Input
                      id="edit_body_area"
                      value={editingSurgery.body_area}
                      onChange={(e) => updateSurgeryField('body_area', e.target.value)}
                      placeholder="e.g., Abdomen, Heart, Brain"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_treatment">Treatment</Label>
                  <Input
                    id="edit_treatment"
                    value={editingSurgery.treatment}
                    onChange={(e) => updateSurgeryField('treatment', e.target.value)}
                    placeholder="Treatment provided"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_notes">Notes</Label>
                  <Textarea
                    id="edit_notes"
                    value={editingSurgery.notes}
                    onChange={(e) => updateSurgeryField('notes', e.target.value)}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Add Mode - Single Surgery Form */}
            {!isEditMode && editingSurgery && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add_procedure_type">Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={editingSurgery.procedure_type}
                      onValueChange={(value) => updateSurgeryField('procedure_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surgery">Surgery</SelectItem>
                        <SelectItem value="hospitalization">Hospitalization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_recovery_status">Current Status</Label>
                    <Select
                      value={editingSurgery.recovery_status}
                      onValueChange={(value) => updateSurgeryField('recovery_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_recovery">Full Recovery</SelectItem>
                        <SelectItem value="partial_recovery">Partial Recovery</SelectItem>
                        <SelectItem value="no_recovery">No Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add_name">Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="add_name"
                      value={editingSurgery.name}
                      onChange={(e) => updateSurgeryField('name', e.target.value)}
                      placeholder="Procedure name"
                      className={validationErrors.name ? "border-red-500" : ""}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500">{validationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_procedure_date">Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="add_procedure_date"
                      type="date"
                      value={editingSurgery.procedure_date}
                      onChange={(e) => updateSurgeryField('procedure_date', e.target.value)}
                      className={validationErrors.procedure_date ? "border-red-500" : ""}
                    />
                    {validationErrors.procedure_date && (
                      <p className="text-sm text-red-500">{validationErrors.procedure_date}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add_reason">Reason</Label>
                    <Input
                      id="add_reason"
                      value={editingSurgery.reason}
                      onChange={(e) => updateSurgeryField('reason', e.target.value)}
                      placeholder="Reason for surgery"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_body_area">Body Area</Label>
                    <Input
                      id="add_body_area"
                      value={editingSurgery.body_area}
                      onChange={(e) => updateSurgeryField('body_area', e.target.value)}
                      placeholder="e.g., Abdomen, Heart, Brain"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_treatment">Treatment</Label>
                  <Input
                    id="add_treatment"
                    value={editingSurgery.treatment}
                    onChange={(e) => updateSurgeryField('treatment', e.target.value)}
                    placeholder="Treatment provided"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_notes">Notes</Label>
                  <Textarea
                    id="add_notes"
                    value={editingSurgery.notes}
                    onChange={(e) => updateSurgeryField('notes', e.target.value)}
                    placeholder="Additional notes"
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
              {isEditMode ? 'Update Surgery' : 'Add Surgery'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={surgeryToDelete !== null} onOpenChange={() => setSurgeryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this surgery/hospitalization? This action cannot be undone.
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