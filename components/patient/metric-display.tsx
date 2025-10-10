"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HealthMetricsChart } from "./health-metrics-chart"
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricData {
  date: Date
  value: number
}

interface MetricDisplayProps {
  title: string
  data: MetricData[]
  unit?: string
  referenceRange?: string
  icon?: React.ReactNode
  className?: string
}

export function MetricDisplay({ title, data, unit, referenceRange, icon, className }: MetricDisplayProps) {
  // Determine if we should show a card or chart
  const shouldShowChart = data.length >= 2
  const latestValue = data[data.length - 1]?.value
  const previousValue = data.length > 1 ? data[data.length - 2]?.value : null

  // Calculate trend
  const getTrend = () => {
    if (!previousValue || !latestValue) return "stable"
    if (latestValue > previousValue) return "increasing"
    if (latestValue < previousValue) return "decreasing"
    return "stable"
  }

  // Determine status based on reference range
  const getStatus = (value: number): "normal" | "abnormal" | "critical" => {
    if (!referenceRange) return "normal"

    if (referenceRange.includes("-")) {
      const [min, max] = referenceRange.split("-").map((v) => Number.parseFloat(v.trim()))
      if (value < min * 0.7 || value > max * 1.3) return "critical"
      if (value < min || value > max) return "abnormal"
    } else if (referenceRange.startsWith("<")) {
      const max = Number.parseFloat(referenceRange.substring(1))
      if (value >= max * 1.5) return "critical"
      if (value >= max) return "abnormal"
    } else if (referenceRange.startsWith(">")) {
      const min = Number.parseFloat(referenceRange.substring(1))
      if (value <= min * 0.5) return "critical"
      if (value <= min) return "abnormal"
    }

    return "normal"
  }

  const status = latestValue ? getStatus(latestValue) : "normal"
  const trend = getTrend()

  // Render status icon
  const renderStatusIcon = () => {
    switch (status) {
      case "normal":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "abnormal":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  // Render trend icon
  const renderTrendIcon = () => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      case "stable":
        return <Minus className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  // Single value card display
  if (!shouldShowChart) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {renderStatusIcon()}
              <Badge
                variant={status === "normal" ? "outline" : status === "abnormal" ? "secondary" : "destructive"}
                className={
                  status === "normal"
                    ? "text-green-600 border-green-200"
                    : status === "abnormal"
                      ? "text-yellow-600 border-yellow-200"
                      : "text-red-600 border-red-200"
                }
              >
                {status === "normal" ? "Normal" : status === "abnormal" ? "Abnormal" : "Critical"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {latestValue !== null && latestValue !== undefined 
                  ? latestValue.toFixed(2).replace(/\.?0+$/, '') 
                  : "--"}
              </span>
              {unit && <span className="text-xs text-muted-foreground font-normal">{unit}</span>}
            </div>

            {referenceRange && (
              <p className="text-xs text-muted-foreground">
                Normal range: {referenceRange} {unit}
              </p>
            )}

            {data.length === 1 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">Add more readings to see trends and charts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Chart display for multiple values
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {renderTrendIcon()}
            {renderStatusIcon()}
            <Badge
              variant={status === "normal" ? "outline" : status === "abnormal" ? "secondary" : "destructive"}
              className={
                status === "normal"
                  ? "text-green-600 border-green-200"
                  : status === "abnormal"
                    ? "text-yellow-600 border-yellow-200"
                    : "text-red-600 border-red-200"
              }
            >
              {status === "normal" ? "Normal" : status === "abnormal" ? "Abnormal" : "Critical"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{latestValue?.toFixed(1) || "--"}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            {previousValue && (
              <span
                className={`text-sm ${
                  trend === "increasing" ? "text-green-600" : trend === "decreasing" ? "text-red-600" : "text-gray-600"
                }`}
              >
                {trend === "increasing" ? "+" : trend === "decreasing" ? "-" : ""}
                {Math.abs(latestValue - previousValue).toFixed(1)}
              </span>
            )}
          </div>

          {referenceRange && (
            <p className="text-xs text-muted-foreground">
              Normal range: {referenceRange} {unit}
            </p>
          )}

          <div className="h-[120px]">
            <HealthMetricsChart
              data={data}
              metricName={title}
              options={{
                fontSize: 10,
                tickCount: 3,
                roundValues: true,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.length} readings</span>
            <span>
              {data[0]?.date.toLocaleDateString()} - {data[data.length - 1]?.date.toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
