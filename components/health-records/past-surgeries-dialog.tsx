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
        setEditingSurgery({ ...selectedSurgery })
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
      errors.name = t('health.dialog.procedureNameRequired')
    }
    
    if (!editingSurgery?.procedure_date?.trim()) {
      errors.procedure_date = t('health.dialog.procedureDateRequired')
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
              {isEditMode ? t('health.dialog.editSurgeryHospitalization') : t('health.dialog.addNewSurgeryHospitalization')}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? t('health.dialog.editSurgeryHospitalizationDesc')
                : t('health.dialog.addNewSurgeryHospitalizationDesc')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Edit Mode - Single Surgery */}
            {isEditMode && editingSurgery && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">{t('health.dialog.editSurgeryHospitalization')}</h4>
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
                    <Label htmlFor="edit_procedure_type">{t('health.dialog.procedureType')} <span className="text-red-500">*</span></Label>
                    <Select
                      value={editingSurgery.procedure_type}
                      onValueChange={(value) => updateSurgeryField('procedure_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('health.dialog.selectProcedureType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surgery">{t('health.surgery')}</SelectItem>
                        <SelectItem value="hospitalization">{t('health.hospitalization')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_recovery_status">{t('health.currentStatus')}</Label>
                    <Select
                      value={editingSurgery.recovery_status}
                      onValueChange={(value) => updateSurgeryField('recovery_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('health.dialog.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_recovery">{t('health.recovery.full')}</SelectItem>
                        <SelectItem value="partial_recovery">{t('health.recovery.partial')}</SelectItem>
                        <SelectItem value="no_recovery">{t('health.recovery.none')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_name">{t('health.dialog.procedureName')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit_name"
                      value={editingSurgery.name}
                      onChange={(e) => updateSurgeryField('name', e.target.value)}
                      placeholder={t('health.dialog.procedureNamePlaceholder')}
                      className={validationErrors.name ? "border-red-500" : ""}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500">{validationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_procedure_date">{t('health.dialog.procedureDate')} <span className="text-red-500">*</span></Label>
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
                    <Label htmlFor="edit_reason">{t('health.dialog.reasonForSurgery')}</Label>
                    <Input
                      id="edit_reason"
                      value={editingSurgery.reason}
                      onChange={(e) => updateSurgeryField('reason', e.target.value)}
                      placeholder={t('health.dialog.reasonForSurgeryPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_body_area">{t('health.bodyArea')}</Label>
                    <Input
                      id="edit_body_area"
                      value={editingSurgery.body_area}
                      onChange={(e) => updateSurgeryField('body_area', e.target.value)}
                      placeholder={t('health.dialog.bodyAreaPlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_treatment">{t('health.dialog.treatmentProvided')}</Label>
                  <Input
                    id="edit_treatment"
                    value={editingSurgery.treatment}
                    onChange={(e) => updateSurgeryField('treatment', e.target.value)}
                    placeholder={t('health.dialog.treatmentProvidedPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_notes">{t('health.notes')}</Label>
                  <Textarea
                    id="edit_notes"
                    value={editingSurgery.notes}
                    onChange={(e) => updateSurgeryField('notes', e.target.value)}
                    placeholder={t('health.dialog.additionalNotesPlaceholder')}
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
                    <Label htmlFor="add_procedure_type">{t('health.dialog.procedureType')} <span className="text-red-500">*</span></Label>
                    <Select
                      value={editingSurgery.procedure_type}
                      onValueChange={(value) => updateSurgeryField('procedure_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('health.dialog.selectProcedureType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surgery">{t('health.surgery')}</SelectItem>
                        <SelectItem value="hospitalization">{t('health.hospitalization')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_recovery_status">{t('health.currentStatus')}</Label>
                    <Select
                      value={editingSurgery.recovery_status}
                      onValueChange={(value) => updateSurgeryField('recovery_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('health.dialog.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_recovery">{t('health.recovery.full')}</SelectItem>
                        <SelectItem value="partial_recovery">{t('health.recovery.partial')}</SelectItem>
                        <SelectItem value="no_recovery">{t('health.recovery.none')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add_name">{t('health.dialog.procedureName')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="add_name"
                      value={editingSurgery.name}
                      onChange={(e) => updateSurgeryField('name', e.target.value)}
                      placeholder={t('health.dialog.procedureNamePlaceholder')}
                      className={validationErrors.name ? "border-red-500" : ""}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500">{validationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_procedure_date">{t('health.dialog.procedureDate')} <span className="text-red-500">*</span></Label>
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
                    <Label htmlFor="add_reason">{t('health.dialog.reasonForSurgery')}</Label>
                    <Input
                      id="add_reason"
                      value={editingSurgery.reason}
                      onChange={(e) => updateSurgeryField('reason', e.target.value)}
                      placeholder={t('health.dialog.reasonForSurgeryPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_body_area">{t('health.bodyArea')}</Label>
                    <Input
                      id="add_body_area"
                      value={editingSurgery.body_area}
                      onChange={(e) => updateSurgeryField('body_area', e.target.value)}
                      placeholder={t('health.dialog.bodyAreaPlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_treatment">{t('health.dialog.treatmentProvided')}</Label>
                  <Input
                    id="add_treatment"
                    value={editingSurgery.treatment}
                    onChange={(e) => updateSurgeryField('treatment', e.target.value)}
                    placeholder={t('health.dialog.treatmentProvidedPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add_notes">{t('health.notes')}</Label>
                  <Textarea
                    id="add_notes"
                    value={editingSurgery.notes}
                    onChange={(e) => updateSurgeryField('notes', e.target.value)}
                    placeholder={t('health.dialog.additionalNotesPlaceholder')}
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
              {isEditMode ? t('health.dialog.updateSurgery') : t('health.dialog.addSurgery')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={surgeryToDelete !== null} onOpenChange={() => setSurgeryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('health.dialog.confirmDeletion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('health.dialog.deleteSurgeryConfirm')}
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