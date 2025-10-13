'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-toastify'
import { useLanguage } from '@/contexts/language-context'
import { useSurgeryHospitalization } from '@/hooks/use-surgery-hospitalization'
import { SurgeryHospitalization, SurgeryHospitalizationCreate, SurgeryHospitalizationUpdate } from '@/lib/api/surgery-hospitalization-api'
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/date-formatter'

export function SurgeriesHospitalizationsSection() {
  const { t } = useLanguage()
  const { surgeries, loading, createSurgery, updateSurgery, deleteSurgery } = useSurgeryHospitalization()
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSurgery, setSelectedSurgery] = useState<SurgeryHospitalization | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [surgeryToDelete, setSurgeryToDelete] = useState<number | null>(null)
  const [formData, setFormData] = useState<SurgeryHospitalizationCreate>({
    procedure_type: 'surgery',
    name: '',
    procedure_date: '',
    reason: '',
    treatment: '',
    body_area: '',
    recovery_status: 'full_recovery',
    notes: ''
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full_recovery':
        return 'bg-green-500 text-white hover:bg-green-600'
      case 'partial_recovery':
        return 'bg-yellow-500 text-white hover:bg-yellow-600'
      case 'no_recovery':
        return 'bg-red-500 text-white hover:bg-red-600'
      default:
        return ''
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'full_recovery':
        return t('health.recovery.full')
      case 'partial_recovery':
        return t('health.recovery.partial')
      case 'no_recovery':
        return t('health.recovery.none')
      default:
        return status
    }
  }

  const getProcedureTypeLabel = (type: string) => {
    return type === 'surgery' ? t('health.surgery') : t('health.hospitalization')
  }

  const handleOpenEditDialog = (surgery?: SurgeryHospitalization) => {
    if (surgery) {
      setSelectedSurgery(surgery)
      setIsEditing(true)
      setFormData({
        procedure_type: surgery.procedure_type,
        name: surgery.name,
        procedure_date: surgery.procedure_date,
        reason: surgery.reason || '',
        treatment: surgery.treatment || '',
        body_area: surgery.body_area || '',
        recovery_status: surgery.recovery_status,
        notes: surgery.notes || ''
      })
    } else {
      setSelectedSurgery(null)
      setIsEditing(false)
      setFormData({
        procedure_type: 'surgery',
        name: '',
        procedure_date: '',
        reason: '',
        treatment: '',
        body_area: '',
        recovery_status: 'full_recovery',
        notes: ''
      })
    }
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    // Validate mandatory fields
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    
    if (!formData.procedure_date) {
      toast.error('Date is required')
      return
    }

    try {
      setSaving(true)
      if (isEditing && selectedSurgery) {
        const updateData: SurgeryHospitalizationUpdate = {
          procedure_type: formData.procedure_type,
          name: formData.name,
          procedure_date: formData.procedure_date,
          reason: formData.reason,
          treatment: formData.treatment,
          body_area: formData.body_area,
          recovery_status: formData.recovery_status,
          notes: formData.notes
        }
        await updateSurgery(selectedSurgery.id, updateData)
      } else {
        await createSurgery(formData)
      }
      setEditDialogOpen(false)
    } catch (error) {
      console.error('Error saving surgery/hospitalization:', error)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (surgeryToDelete === null) return
    
    try {
      await deleteSurgery(surgeryToDelete)
      setSurgeryToDelete(null)
    } catch (error) {
      console.error('Error deleting surgery/hospitalization:', error)
      setSurgeryToDelete(null)
    }
  }


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('health.surgeriesHospitalizations')}</CardTitle>
          <CardDescription>{t('health.previousSurgeriesDesc')}</CardDescription>
        </div>
        <Button onClick={() => handleOpenEditDialog()} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('action.add')}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : surgeries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No surgeries or hospitalizations recorded.</p>
            <p className="text-sm">Click the Add button above to add your first entry.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {surgeries.map((surgery) => (
              <div key={surgery.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {getProcedureTypeLabel(surgery.procedure_type)} - {surgery.name}
                      </h3>
                      <Badge className={getStatusColor(surgery.recovery_status)}>
                        {getStatusLabel(surgery.recovery_status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">{t('health.date')}:</span> {formatDate(surgery.procedure_date)}
                      </p>
                      {surgery.reason && (
                        <p>
                          <span className="font-medium">{t('health.reason')}:</span> {surgery.reason}
                        </p>
                      )}
                      {surgery.treatment && (
                        <p>
                          <span className="font-medium">{t('health.treatment')}:</span> {surgery.treatment}
                        </p>
                      )}
                      {surgery.body_area && (
                        <p>
                          <span className="font-medium">{t('health.bodyArea')}:</span> {surgery.body_area}
                        </p>
                      )}
                      {surgery.notes && (
                        <p>
                          <span className="font-medium">{t('health.notes')}:</span> {surgery.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditDialog(surgery)}
                      className="h-8 w-8 p-0"
                      title={t('action.edit')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSurgeryToDelete(surgery.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title={t('action.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {isEditing ? t('action.edit') : t('action.add')} {t('health.surgeriesHospitalizations')}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? t('health.editSurgeriesDesc') : t('health.addSurgeriesDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 py-4 px-2">
            <div>
              <Label>{t('health.type')}</Label>
              <Select
                value={formData.procedure_type}
                onValueChange={(value: 'surgery' | 'hospitalization') =>
                  setFormData(prev => ({ ...prev, procedure_type: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="surgery">{t('health.surgery')}</SelectItem>
                  <SelectItem value="hospitalization">{t('health.hospitalization')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('health.name')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('health.namePlaceholder')}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label>{t('health.date')} <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={formData.procedure_date}
                onChange={(e) => setFormData(prev => ({ ...prev, procedure_date: e.target.value }))}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label>{t('health.reason')}</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={t('health.reasonPlaceholder')}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t('health.treatment')}</Label>
              <Input
                value={formData.treatment}
                onChange={(e) => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
                placeholder={t('health.treatmentPlaceholder')}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t('health.bodyArea')}</Label>
              <Input
                value={formData.body_area}
                onChange={(e) => setFormData(prev => ({ ...prev, body_area: e.target.value }))}
                placeholder={t('health.bodyAreaPlaceholder')}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t('health.currentStatus')}</Label>
              <Select
                value={formData.recovery_status}
                onValueChange={(value: 'full_recovery' | 'partial_recovery' | 'no_recovery') =>
                  setFormData(prev => ({ ...prev, recovery_status: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_recovery">{t('health.recovery.full')}</SelectItem>
                  <SelectItem value="partial_recovery">{t('health.recovery.partial')}</SelectItem>
                  <SelectItem value="no_recovery">{t('health.recovery.none')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('health.notes')}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('health.notesPlaceholder')}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              {t('action.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? t('action.updating') : t('action.creating')}
                </>
              ) : (
                isEditing ? t('action.update') : t('action.create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={surgeryToDelete !== null} onOpenChange={() => setSurgeryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Surgery/Hospitalization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSurgeryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
