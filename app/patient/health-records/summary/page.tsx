"use client"

export const dynamic = "force-dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Activity,
  AlertTriangle,
  Heart,
  Brain,
  ThumbsUp,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Droplets,
  Scale,
  ArrowRight,
  TreesIcon as Lungs,
  Pill,
  Utensils,
  Moon,
  Dumbbell,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useSwitchedPatient } from "@/contexts/patient-context"
import { HealthMetricsChart } from "@/components/patient/health-metrics-chart"
import { useRouter } from "next/navigation"

export default function SummaryPage() {
  const { t } = useLanguage()
  const { patientToken } = useSwitchedPatient()
  const router = useRouter()

  const renderTrendIcon = (status: string) => {
    if (status === "improving") {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (status === "declining" || status === "needs improvement") {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    } else {
      return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  // Sample data for charts
  const sampleData = [
    { date: new Date("2023-01-15"), value: 135 },
    { date: new Date("2023-02-15"), value: 132 },
    { date: new Date("2023-03-15"), value: 128 },
    { date: new Date("2023-04-15"), value: 125 },
  ]

  // Group metrics by category for the summary tab
  const healthMetricsSummary = [
    {
      name: t("health.metrics.bloodPressure"),
      value: "132/85 mmHg",
      reference: "<120/80 mmHg",
      trend: "improving",
      change: "-13/7 mmHg",
      status: "abnormal",
      icon: <Heart className="h-5 w-5 text-red-500" />,
      category: "health",
      data: sampleData,
      chartType: "line",
      tab: "vitals",
    },
    {
      name: t("health.metrics.bloodGlucose"),
      value: "98 mg/dL",
      reference: "70-99 mg/dL",
      trend: "improving",
      change: "-12 mg/dL",
      status: "normal",
      icon: <Droplets className="h-5 w-5 text-blue-500" />,
      category: "health",
      data: sampleData,
      chartType: "line",
      tab: "analysis",
    },
    {
      name: t("health.metrics.ldlCholesterol"),
      value: "125 mg/dL",
      reference: "<100 mg/dL",
      trend: "improving",
      change: "-10 mg/dL",
      status: "abnormal",
      icon: <BarChart3 className="h-5 w-5 text-orange-500" />,
      category: "health",
      data: sampleData,
      chartType: "line",
      tab: "analysis",
    },
    {
      name: t("health.metrics.heartRate"),
      value: "68 bpm",
      reference: "60-100 bpm",
      trend: "improving",
      change: "-3 bpm",
      status: "normal",
      icon: <Activity className="h-5 w-5 text-pink-500" />,
      category: "health",
      data: sampleData,
      chartType: "line",
      tab: "vitals",
    },
    {
      name: t("health.metrics.oxygenSaturation"),
      value: "98%",
      reference: "95-100%",
      trend: "improving",
      change: "+1%",
      status: "normal",
      icon: <Lungs className="h-5 w-5 text-cyan-500" />,
      category: "health",
      data: sampleData,
      chartType: "line",
      tab: "vitals",
    },
    {
      name: t("health.metrics.whiteBloodCells"),
      value: "11.2 K/uL",
      reference: "4.5-10.0 K/uL",
      trend: "improving",
      change: "-0.8 K/uL",
      status: "abnormal",
      icon: <Pill className="h-5 w-5 text-violet-500" />,
      category: "health",
      data: sampleData,
      chartType: "line",
      tab: "analysis",
    },
  ]

  const wellnessMetricsSummary = [
    {
      name: t("health.metrics.weight"),
      value: "158 lbs",
      reference: "145-165 lbs",
      trend: "improving",
      change: "-7 lbs",
      status: "normal",
      icon: <Scale className="h-5 w-5 text-blue-500" />,
      category: "wellness",
      data: sampleData,
      chartType: "line",
      tab: "body-composition",
    },
    {
      name: t("health.metrics.bodyFat"),
      value: "24%",
      reference: "10-20%",
      trend: "improving",
      change: "-2.3%",
      status: "abnormal",
      icon: <Scale className="h-5 w-5 text-purple-500" />,
      category: "wellness",
      data: sampleData,
      chartType: "line",
      tab: "body-composition",
    },
    {
      name: t("health.metrics.sleep"),
      value: "7.2 " + t("health.units.hours"),
      reference: "7-9 " + t("health.units.hours"),
      trend: "stable",
      change: "+0.2 " + t("health.units.hours"),
      status: "normal",
      icon: <Moon className="h-5 w-5 text-indigo-500" />,
      category: "wellness",
      data: sampleData,
      chartType: "line",
      tab: "lifestyle",
    },
    {
      name: t("health.metrics.steps"),
      value: "6,200",
      reference: "10,000",
      trend: "improving",
      change: "+800",
      status: "abnormal",
      icon: <Activity className="h-5 w-5 text-green-500" />,
      category: "wellness",
      data: sampleData,
      chartType: "line",
      tab: "lifestyle",
    },
    {
      name: t("health.metrics.workouts"),
      value: "3/" + t("health.units.week"),
      reference: "3-5/" + t("health.units.week"),
      trend: "improving",
      change: "+1",
      status: "normal",
      icon: <Dumbbell className="h-5 w-5 text-amber-500" />,
      category: "wellness",
      data: sampleData,
      chartType: "line",
      tab: "lifestyle",
    },
    {
      name: t("health.metrics.nutritionScore"),
      value: "72/100",
      reference: ">80/100",
      trend: "improving",
      change: "+5 " + t("health.units.points"),
      status: "abnormal",
      icon: <Utensils className="h-5 w-5 text-emerald-500" />,
      category: "wellness",
      data: sampleData,
      chartType: "line",
      tab: "lifestyle",
    },
  ]

  // Render a metric card with appropriate chart type and link to detailed tab
  const renderSummaryMetricCard = (metric: any) => {
    return (
      <Card key={metric.name} className="overflow-hidden flex flex-col h-full">
        <CardHeader className="pb-2 flex-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {metric.icon}
              <CardTitle className="text-base">{metric.name}</CardTitle>
            </div>
            <Badge
              variant={metric.status === "normal" ? "outline" : "secondary"}
              className={metric.status === "normal" ? "text-green-500" : "text-red-500"}
            >
              {metric.status === "normal" ? t("health.status.normal") : t("health.status.abnormal")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xl font-bold">{metric.value}</p>
            <div className="flex items-center gap-1">
              {renderTrendIcon(metric.trend)}
              <span
                className={`text-xs ${
                  metric.trend === "improving"
                    ? "text-green-500"
                    : metric.trend === "declining"
                      ? "text-red-500"
                      : "text-yellow-500"
                }`}
              >
                {metric.change}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {t("health.reference")}: {metric.reference}
          </p>

          <div className="h-[120px]">
            <HealthMetricsChart
              data={metric.data}
              metricName={metric.name}
              options={{
                fontSize: 10,
                tickCount: 5,
                roundValues: true,
              }}
            />
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex-none">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              const tokenQuery = patientToken ? `?patientToken=${encodeURIComponent(patientToken)}` : ""
              const targetUrl = `/patient/health-records/${metric.tab}${tokenQuery}`
              router.push(targetUrl)
            }}
          >
            {t("health.viewDetails")} <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Calculate overall health score
  const calculateHealthScore = () => {
    // Count normal vs abnormal metrics
    const healthMetrics = [...healthMetricsSummary, ...wellnessMetricsSummary]
    const normalCount = healthMetrics.filter((m) => m.status === "normal").length
    const totalCount = healthMetrics.length

    // Calculate percentage
    return Math.round((normalCount / totalCount) * 100)
  }

  const healthScore = calculateHealthScore()

  return (
    <div className="space-y-6">
      {/* Overall Health Assessment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{t("health.overallAssessment")}</CardTitle>
          <CardDescription>{t("health.overallAssessmentDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Health Score */}
            <div className="flex-1">
              <div className="flex flex-col items-center justify-center">
                <div className="relative h-36 w-36 flex items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <circle
                      className={`${
                        healthScore >= 80 ? "text-green-500" : healthScore >= 60 ? "text-yellow-500" : "text-red-500"
                      } stroke-current`}
                      strokeWidth="10"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray={`${healthScore * 2.51} 251`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{healthScore}</span>
                    <span className="text-sm text-muted-foreground">{t("health.healthScore")}</span>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="font-medium">
                    {healthScore >= 80
                      ? t("health.excellent")
                      : healthScore >= 60
                        ? t("health.good")
                        : t("health.needsImprovement")}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="flex-[2]">
              <div className="rounded-lg bg-muted/50 p-4 border border-muted h-full">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {t("health.areasOfConcern")}:
                      </h4>
                      <p className="text-sm">{t("health.ldlConcern")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        {t("health.positiveTrends")}:
                      </h4>
                      <p className="text-sm">{t("health.bpImprovement")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-blue-600">
                        <Lightbulb className="h-4 w-4" />
                        {t("health.recommendations")}:
                      </h4>
                      <p className="text-sm">{t("health.medicationRecommendation")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Records Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("health.healthRecords")}</CardTitle>
          <CardDescription>{t("health.importantMetrics")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {healthMetricsSummary.map((metric) => renderSummaryMetricCard(metric))}
          </div>
        </CardContent>
      </Card>

      {/* Wellness Records Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("health.wellnessRecords")}</CardTitle>
          <CardDescription>{t("health.lifestyleMetrics")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wellnessMetricsSummary.map((metric) => renderSummaryMetricCard(metric))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
