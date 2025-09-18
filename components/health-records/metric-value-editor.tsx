"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Activity, Droplets, Thermometer, Eye, Brain } from "lucide-react"
import { getMetricTemplate, METRIC_TEMPLATES } from "@/lib/metric-templates"

interface MetricValueEditorProps {
  metricName: string
  dataType: string
  currentValue: any
  unit?: string
  onValueChange: (value: any) => void
  disabled?: boolean
}

// Icon mapping for dynamic icon rendering
const ICON_MAP = {
  Heart,
  Activity,
  Droplets,
  Thermometer,
  Eye,
  Brain
}

export function MetricValueEditor({ 
  metricName, 
  dataType, 
  currentValue, 
  unit, 
  onValueChange, 
  disabled = false 
}: MetricValueEditorProps) {
  const [inputMode, setInputMode] = useState<'simple' | 'structured'>('simple')
  const [simpleValue, setSimpleValue] = useState('')
  const [structuredValues, setStructuredValues] = useState<Record<string, any>>({})

  // Get template from configuration
  const template = getMetricTemplate(metricName)

  useEffect(() => {
    if (template) {
      setInputMode('structured')
      const parsed = template.parseValue(currentValue)
      setStructuredValues(parsed)
    } else {
      setInputMode('simple')
      if (typeof currentValue === 'object' && currentValue !== null) {
        setSimpleValue(JSON.stringify(currentValue))
      } else {
        setSimpleValue(String(currentValue || ''))
      }
    }
  }, [currentValue, template])

  const handleSimpleValueChange = (value: string) => {
    setSimpleValue(value)
    // Try to parse as number if it looks like one
    if (dataType === 'number' && !isNaN(parseFloat(value))) {
      onValueChange(parseFloat(value))
    } else if (value.trim() === '') {
      onValueChange(null)
    } else {
      onValueChange(value)
    }
  }

  const handleStructuredValueChange = (key: string, value: any) => {
    const newValues = { ...structuredValues, [key]: value }
    setStructuredValues(newValues)
    onValueChange(newValues)
  }

  const toggleInputMode = () => {
    if (inputMode === 'simple') {
      setInputMode('structured')
      if (template) {
        const parsed = template.parseValue(currentValue)
        setStructuredValues(parsed)
      }
    } else {
      setInputMode('simple')
      if (template) {
        setSimpleValue(template.formatValue(structuredValues))
      }
    }
  }

  if (!template && inputMode === 'simple') {
    // Simple input for basic metrics
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Value</Label>
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

  if (template && inputMode === 'structured') {
    // Structured input for complex metrics
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {template.icon && ICON_MAP[template.icon as keyof typeof ICON_MAP] && 
                React.createElement(ICON_MAP[template.icon as keyof typeof ICON_MAP], { className: "h-4 w-4" })
              }
              {template.displayName}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleInputMode}
              disabled={disabled}
              className="h-7 text-xs"
            >
              Simple Mode
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {template.fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label className="text-sm font-medium">{field.label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={field.type}
                  value={structuredValues[field.key] || ''}
                  onChange={(e) => {
                    const value = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                    handleStructuredValueChange(field.key, value)
                  }}
                  placeholder={field.placeholder}
                  disabled={disabled}
                  className="flex-1"
                />
                {field.unit && (
                  <Badge variant="outline" className="text-xs">
                    {field.unit}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Formatted:</strong> {template.formatValue(structuredValues)}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fallback to simple input
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Value</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleInputMode}
          disabled={disabled}
          className="h-7 text-xs"
        >
          {inputMode === 'simple' ? 'Structured' : 'Simple'}
        </Button>
      </div>
      <Input
        type="text"
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
