"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, Activity, Droplets, Thermometer, Eye, Brain } from "lucide-react"

interface MetricValueEditorProps {
  metricName: string
  dataType: string
  currentValue: any
  unit?: string
  onValueChange: (value: any) => void
  disabled?: boolean
  showLabel?: boolean
}


export function MetricValueEditor({ 
  metricName, 
  dataType, 
  currentValue, 
  unit, 
  onValueChange, 
  disabled = false,
  showLabel = true
}: MetricValueEditorProps) {
  const [simpleValue, setSimpleValue] = useState('')

  useEffect(() => {
    if (typeof currentValue === 'object' && currentValue !== null) {
      // Handle object values - extract the value if it has a 'value' key
      if (currentValue.value !== undefined) {
        setSimpleValue(String(currentValue.value))
      } else {
        setSimpleValue(JSON.stringify(currentValue))
      }
    } else {
      setSimpleValue(String(currentValue || ''))
    }
  }, [currentValue])

  const handleSimpleValueChange = (value: string) => {
    setSimpleValue(value)
    
    // Always wrap the value in a 'value' key for consistency
    if (dataType === 'number' && !isNaN(parseFloat(value))) {
      onValueChange({ value: parseFloat(value) })
    } else if (value.trim() === '') {
      onValueChange({ value: null })
    } else {
      onValueChange({ value: value })
    }
  }

  // Always use simple input mode
  return (
    <div className="space-y-2">
      {showLabel && <Label className="text-sm font-medium">{metricName}</Label>}
      <Input
        type={dataType === 'number' ? 'number' : 'text'}
        value={simpleValue}
        onChange={(e) => handleSimpleValueChange(e.target.value)}
        placeholder={`Enter ${metricName.toLowerCase()} value`}
        disabled={disabled}
        className="w-full"
      />
      {unit && (
        <p className="text-xs text-muted-foreground">Unit: {unit}</p>
      )}
    </div>
  )
}
