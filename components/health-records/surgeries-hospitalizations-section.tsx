'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import { useLanguage } from '@/contexts/language-context'
import { useSurgeryHospitalization } from '@/hooks/use-surgery-hospitalization'
import { SurgeryHospitalization } from '@/lib/api/surgery-hospitalization-api'
import { Edit, Plus, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/date-formatter'
import { PastSurgeriesDialog } from './past-surgeries-dialog'

export function SurgeriesHospitalizationsSection() {
  const { t } = useLanguage()
  const { surgeries, loading, refresh } = useSurgeryHospitalization()
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSurgery, setSelectedSurgery] = useState<any>(null)

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

  const handleOpenEditDialog = () => {
    setSelectedSurgery(null)
    setEditDialogOpen(true)
  }

  const handleSurgeryClick = (surgery: any) => {
    setSelectedSurgery(surgery)
    setEditDialogOpen(true)
  }


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('health.surgeriesHospitalizations')}</CardTitle>
          <CardDescription>{t('health.previousSurgeriesDesc')}</CardDescription>
        </div>
        <Button onClick={handleOpenEditDialog} variant="outline" size="sm">
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
          <div className="space-y-3">
            {surgeries.map((surgery) => (
              <div 
                key={surgery.id} 
                className="p-4 border rounded-lg bg-white hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                onClick={() => handleSurgeryClick(surgery)}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold group-hover:text-blue-600 transition-colors">
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
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Past Surgeries Dialog */}
      <PastSurgeriesDialog 
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setSelectedSurgery(null)
        }}
        onRefresh={refresh}
        selectedSurgery={selectedSurgery}
      />
    </Card>
  )
}
