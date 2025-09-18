'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-toastify'

export interface HealthRecord {
  id: number
  created_by: number
  section_id: number
  metric_id: number
  value: any
  status?: string
  source?: string
  recorded_at: string
  device_id?: number
  device_info?: any
  accuracy?: string
  location_data?: any
  created_at: string
  updated_at?: string
  updated_by?: number
}

// Special metric types
export interface CholesterolValue {
  total: number
  ldl: number
  hdl: number
  triglycerides: number
}

export interface BloodPressureValue {
  systolic: number
  diastolic: number
}

interface SpecialMetricDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onValueCreated: (record: HealthRecord) => void
  sectionId: number
  sectionName: string
  metricName: string
  metricId: number
  createRecord: (recordData: {
    section_id: number
    metric_id: number
    value: any
    status?: string
    recorded_at: string
    notes?: string
    source?: string
  }) => Promise<HealthRecord>
}

export function SpecialMetricDialog({
  open,
  onOpenChange,
  onValueCreated,
  sectionId,
  sectionName,
  metricName,
  metricId,
  createRecord
}: SpecialMetricDialogProps) {
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Cholesterol values
  const [cholesterolValues, setCholesterolValues] = useState<CholesterolValue>({
    total: 0,
    ldl: 0,
    hdl: 0,
    triglycerides: 0
  })

  // Blood pressure values
  const [bloodPressureValues, setBloodPressureValues] = useState<BloodPressureValue>({
    systolic: 0,
    diastolic: 0
  })

  const handleCholesterolChange = (field: keyof CholesterolValue, value: string) => {
    const numValue = parseFloat(value) || 0
    setCholesterolValues(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  const handleBloodPressureChange = (field: keyof BloodPressureValue, value: string) => {
    const numValue = parseFloat(value) || 0
    setBloodPressureValues(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  const handleCreateValue = async () => {
    let value: any
    let status = 'normal'

    if (metricName.toLowerCase().includes('cholesterol')) {
      // Validate cholesterol values
      if (cholesterolValues.total === 0 || cholesterolValues.ldl === 0 || 
          cholesterolValues.hdl === 0 || cholesterolValues.triglycerides === 0) {
        toast.error('Please enter all cholesterol values')
        return
      }

      value = cholesterolValues
      
      // Determine status based on cholesterol values
      if (cholesterolValues.total > 200 || cholesterolValues.ldl > 100 || 
          cholesterolValues.hdl < 40 || cholesterolValues.triglycerides > 150) {
        status = 'abnormal'
      }
    } else if (metricName.toLowerCase().includes('blood pressure') || 
               metricName.toLowerCase().includes('bp')) {
      // Validate blood pressure values
      if (bloodPressureValues.systolic === 0 || bloodPressureValues.diastolic === 0) {
        toast.error('Please enter both systolic and diastolic values')
        return
      }

      value = bloodPressureValues
      
      // Determine status based on blood pressure values
      if (bloodPressureValues.systolic > 140 || bloodPressureValues.diastolic > 90) {
        status = 'abnormal'
      } else if (bloodPressureValues.systolic > 120 || bloodPressureValues.diastolic > 80) {
        status = 'abnormal'
      }
    } else {
      toast.error('Unsupported special metric type')
      return
    }

    setLoading(true)
    try {
      const newRecord = await createRecord({
        section_id: sectionId,
        metric_id: metricId,
        value: value,
        status: status,
        recorded_at: new Date(recordedDate).toISOString(),
        notes: notes,
        source: 'manual_entry'
      })
      
      // Reset form
      setCholesterolValues({ total: 0, ldl: 0, hdl: 0, triglycerides: 0 })
      setBloodPressureValues({ systolic: 0, diastolic: 0 })
      setRecordedDate(new Date().toISOString().split("T")[0])
      setNotes('')
      onOpenChange(false)
      onValueCreated(newRecord)
      
      toast.success('Value added successfully!')
    } catch (error) {
      console.error('Failed to create record:', error)
      toast.error('Failed to add value')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setCholesterolValues({ total: 0, ldl: 0, hdl: 0, triglycerides: 0 })
    setBloodPressureValues({ systolic: 0, diastolic: 0 })
    setRecordedDate(new Date().toISOString().split("T")[0])
    setNotes('')
    onOpenChange(false)
  }

  const renderCholesterolForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cholesterol Values</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="totalCholesterol">Total Cholesterol (mg/dL)</Label>
            <Input
              id="totalCholesterol"
              type="number"
              step="0.1"
              value={cholesterolValues.total || ''}
              onChange={(e) => handleCholesterolChange('total', e.target.value)}
              placeholder="e.g., 180"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ldlCholesterol">LDL Cholesterol (mg/dL)</Label>
            <Input
              id="ldlCholesterol"
              type="number"
              step="0.1"
              value={cholesterolValues.ldl || ''}
              onChange={(e) => handleCholesterolChange('ldl', e.target.value)}
              placeholder="e.g., 100"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hdlCholesterol">HDL Cholesterol (mg/dL)</Label>
            <Input
              id="hdlCholesterol"
              type="number"
              step="0.1"
              value={cholesterolValues.hdl || ''}
              onChange={(e) => handleCholesterolChange('hdl', e.target.value)}
              placeholder="e.g., 50"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="triglycerides">Triglycerides (mg/dL)</Label>
            <Input
              id="triglycerides"
              type="number"
              step="0.1"
              value={cholesterolValues.triglycerides || ''}
              onChange={(e) => handleCholesterolChange('triglycerides', e.target.value)}
              placeholder="e.g., 120"
            />
          </div>
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <strong>Reference Ranges:</strong><br />
          Total: &lt; 200 mg/dL<br />
          LDL: &lt; 100 mg/dL<br />
          HDL: &gt; 40 mg/dL (men), &gt; 50 mg/dL (women)<br />
          Triglycerides: &lt; 150 mg/dL
        </div>
      </CardContent>
    </Card>
  )

  const renderBloodPressureForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Blood Pressure Values</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="systolic">Systolic (mmHg)</Label>
            <Input
              id="systolic"
              type="number"
              value={bloodPressureValues.systolic || ''}
              onChange={(e) => handleBloodPressureChange('systolic', e.target.value)}
              placeholder="e.g., 120"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
            <Input
              id="diastolic"
              type="number"
              value={bloodPressureValues.diastolic || ''}
              onChange={(e) => handleBloodPressureChange('diastolic', e.target.value)}
              placeholder="e.g., 80"
            />
          </div>
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <strong>Reference Ranges:</strong><br />
          Normal: &lt; 120/80 mmHg<br />
          Elevated: 120-129/&lt; 80 mmHg<br />
          High Stage 1: 130-139/80-89 mmHg<br />
          High Stage 2: &gt; 140/&gt; 90 mmHg
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add {metricName} to {sectionName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {metricName.toLowerCase().includes('cholesterol') && renderCholesterolForm()}
          {(metricName.toLowerCase().includes('blood pressure') || 
            metricName.toLowerCase().includes('bp')) && renderBloodPressureForm()}
          
          <div className="grid gap-2">
            <Label htmlFor="recordedDate">Date *</Label>
            <Input
              id="recordedDate"
              type="date"
              value={recordedDate}
              onChange={(e) => setRecordedDate(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreateValue} disabled={loading}>
            {loading ? 'Adding...' : 'Add Value'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
