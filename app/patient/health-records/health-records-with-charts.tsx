"use client"

import { useHealthMetrics } from "@/hooks/use-health-metrics"
import { MetricDisplay } from "@/components/patient/metric-display"
import { BloodPressureChart } from "@/components/patient/blood-pressure-chart"
import { Heart, Droplets, Scale, Activity, Thermometer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HealthRecordsWithCharts() {
  const { metrics, bloodPressure, loading, error, getChartData, getBloodPressureChartData } = useHealthMetrics()

  if (loading) return <div className="flex items-center justify-center p-8">Loading health data...</div>
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>

  // Get data for different metric types
  const glucoseData = getChartData("glucose")
  const weightData = getChartData("weight")
  const cholesterolData = getChartData("cholesterol")
  const vitaminDData = getChartData("vitamin_d")
  const temperatureData = getChartData("temperature")

  const fullBloodPressureData = getBloodPressureChartData()

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Health Metrics Dashboard</h1>
        <p className="text-muted-foreground">Track your health metrics over time</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Blood Pressure - Special handling for dual values */}
        {fullBloodPressureData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-base">Blood Pressure</CardTitle>
                </div>
                <Badge variant="secondary" className="text-red-600">
                  {fullBloodPressureData[fullBloodPressureData.length - 1]?.systolic >= 130 ? "High" : "Normal"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {fullBloodPressureData[fullBloodPressureData.length - 1]?.systolic}/
                    {fullBloodPressureData[fullBloodPressureData.length - 1]?.diastolic}
                  </span>
                  <span className="text-sm text-muted-foreground">mmHg</span>
                </div>

                <p className="text-xs text-muted-foreground">Normal range: {"<120/80 mmHg"}</p>

                {fullBloodPressureData.length >= 2 && (
                  <div className="h-[120px]">
                    <BloodPressureChart data={fullBloodPressureData} />
                  </div>
                )}

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{fullBloodPressureData.length} readings</span>
                  {fullBloodPressureData.length > 1 && (
                    <span>
                      {fullBloodPressureData[0]?.date.toLocaleDateString()} -{" "}
                      {fullBloodPressureData[fullBloodPressureData.length - 1]?.date.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blood Glucose */}
        <MetricDisplay
          title="Blood Glucose"
          data={glucoseData}
          unit="mg/dL"
          referenceRange="70-99"
          icon={<Droplets className="h-5 w-5 text-blue-500" />}
        />

        {/* Weight */}
        <MetricDisplay
          title="Weight"
          data={weightData}
          unit="lbs"
          referenceRange="145-165"
          icon={<Scale className="h-5 w-5 text-green-500" />}
        />

        {/* Cholesterol */}
        <MetricDisplay
          title="Total Cholesterol"
          data={cholesterolData}
          unit="mg/dL"
          referenceRange="<200"
          icon={<Activity className="h-5 w-5 text-purple-500" />}
        />

        {/* Vitamin D - Single value example */}
        <MetricDisplay
          title="Vitamin D"
          data={vitaminDData}
          unit="ng/mL"
          referenceRange="30-100"
          icon={<Activity className="h-5 w-5 text-orange-500" />}
        />

        {/* Temperature */}
        <MetricDisplay
          title="Body Temperature"
          data={temperatureData}
          unit="°F"
          referenceRange="97.8-99.1"
          icon={<Thermometer className="h-5 w-5 text-red-400" />}
        />
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Health Metrics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.filter((m) => m.status === "normal").length}
              </div>
              <div className="text-sm text-muted-foreground">Normal Readings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.filter((m) => m.status === "abnormal").length}
              </div>
              <div className="text-sm text-muted-foreground">Abnormal Readings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.filter((m) => m.status === "critical").length}
              </div>
              <div className="text-sm text-muted-foreground">Critical Readings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.length + bloodPressure.length}</div>
              <div className="text-sm text-muted-foreground">Total Readings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
