"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"

export interface HealthMetric {
  id: string
  user_id: string
  metric_type: string
  metric_name: string
  value: number
  unit?: string
  reference_range?: string
  status: "normal" | "abnormal" | "critical"
  notes?: string
  recorded_at: string
  created_at: string
  updated_at: string
}

export interface BloodPressureReading {
  id: string
  user_id: string
  systolic: number
  diastolic: number
  pulse?: number
  status: "normal" | "abnormal" | "critical"
  recorded_at: string
  created_at: string
}

export function useHealthMetrics() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [bloodPressure, setBloodPressure] = useState<BloodPressureReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch health metrics
  const fetchHealthMetrics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })

      if (error) throw error
      setMetrics(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch health metrics")
    }
  }

  // Fetch blood pressure readings
  const fetchBloodPressure = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("blood_pressure_readings")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })

      if (error) throw error
      setBloodPressure(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch blood pressure")
    }
  }

  // Add new health metric
  const addHealthMetric = async (metricData: Omit<HealthMetric, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Determine status based on reference range
      const status = determineMetricStatus(metricData.value, metricData.reference_range)

      const { data, error } = await supabase
        .from("health_metrics")
        .insert({
          ...metricData,
          user_id: user.id,
          status,
        })
        .select()
        .single()

      if (error) throw error

      setMetrics((prev) => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add health metric")
      throw err
    }
  }

  // Add blood pressure reading
  const addBloodPressureReading = async (
    reading: Omit<BloodPressureReading, "id" | "user_id" | "created_at" | "status">,
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Determine status based on blood pressure guidelines
      const status = determineBloodPressureStatus(reading.systolic, reading.diastolic)

      const { data, error } = await supabase
        .from("blood_pressure_readings")
        .insert({
          ...reading,
          user_id: user.id,
          status,
        })
        .select()
        .single()

      if (error) throw error

      setBloodPressure((prev) => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add blood pressure reading")
      throw err
    }
  }

  // Get metrics by type
  const getMetricsByType = (metricType: string) => {
    return metrics.filter((metric) => metric.metric_type === metricType)
  }

  // Get formatted chart data
  const getChartData = (metricType: string) => {
    const typeMetrics = getMetricsByType(metricType)
    return typeMetrics
      .map((metric) => ({
        date: new Date(metric.recorded_at),
        value: metric.value,
      }))
      .reverse() // Reverse to show chronological order
  }

  // Get blood pressure chart data
  const getBloodPressureChartData = () => {
    return bloodPressure
      .map((reading) => ({
        date: new Date(reading.recorded_at),
        systolic: reading.systolic,
        diastolic: reading.diastolic,
      }))
      .reverse()
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchHealthMetrics(), fetchBloodPressure()])
      setLoading(false)
    }

    loadData()
  }, [])

  return {
    metrics,
    bloodPressure,
    loading,
    error,
    addHealthMetric,
    addBloodPressureReading,
    getMetricsByType,
    getChartData,
    getBloodPressureChartData,
    refetch: () => {
      fetchHealthMetrics()
      fetchBloodPressure()
    },
  }
}

// Helper function to determine metric status
function determineMetricStatus(value: number, referenceRange?: string): "normal" | "abnormal" | "critical" {
  if (!referenceRange) return "normal"

  // Parse reference range (e.g., "70-99", "<100", ">40")
  if (referenceRange.includes("-")) {
    const [min, max] = referenceRange.split("-").map((v) => Number.parseFloat(v.trim()))
    if (value < min || value > max) return "abnormal"
  } else if (referenceRange.startsWith("<")) {
    const max = Number.parseFloat(referenceRange.substring(1))
    if (value >= max) return "abnormal"
  } else if (referenceRange.startsWith(">")) {
    const min = Number.parseFloat(referenceRange.substring(1))
    if (value <= min) return "abnormal"
  }

  return "normal"
}

// Helper function for blood pressure status
function determineBloodPressureStatus(systolic: number, diastolic: number): "normal" | "abnormal" | "critical" {
  // Based on AHA guidelines
  if (systolic >= 180 || diastolic >= 120) return "critical"
  if (systolic >= 130 || diastolic >= 80) return "abnormal"
  return "normal"
}
