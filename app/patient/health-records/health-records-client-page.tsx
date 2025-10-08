"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { healthMetrics } from "@/lib/data"
import { HealthMetricsChart } from "@/components/patient/health-metrics-chart"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  Heart,
  LineChart,
  Dna,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Droplets,
  Scale,
  Brain,
  ThumbsUp,
  Lightbulb,
  Dumbbell,
  ArrowRight,
  TreesIcon as Lungs,
  Pill,
  Utensils,
  Moon,
  PencilIcon,
  Plus,
  Stethoscope,
  Download,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLanguage } from "@/contexts/language-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HealthRecordsClientPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("summary")
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [editCurrentConditionsOpen, setEditCurrentConditionsOpen] = useState(false)
  const [editPastConditionsOpen, setEditPastConditionsOpen] = useState(false)
  const [editFamilyHistoryOpen, setEditFamilyHistoryOpen] = useState(false)

  // New state for global new metric dialog
  const [newMetricDialogOpen, setNewMetricDialogOpen] = useState(false)
  const [newMetricName, setNewMetricName] = useState("")
  const [newMetricCategory, setNewMetricCategory] = useState("")
  const [newMetricUnit, setNewMetricUnit] = useState("")
  const [newMetricNormalRange, setNewMetricNormalRange] = useState("")
  const [metricExistsAlert, setMetricExistsAlert] = useState(false)

  // New state for add value dialog
  const [addValueDialogOpen, setAddValueDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubMetric, setSelectedSubMetric] = useState("")
  const [newSubMetricName, setNewSubMetricName] = useState("")
  const [metricValue, setMetricValue] = useState("")
  const [metricUnit, setMetricUnit] = useState("")
  const [metricDate, setMetricDate] = useState(new Date().toISOString().split("T")[0])
  const [normalRangeMin, setNormalRangeMin] = useState("")
  const [normalRangeMax, setNormalRangeMax] = useState("")
  const [showNewSubMetricInput, setShowNewSubMetricInput] = useState(false)

  // Ensure data exists with fallbacks
  const bloodPressureData = healthMetrics?.bloodPressure || []
  const weightData = healthMetrics?.weight || []
  const glucoseData = healthMetrics?.glucose || []
  const cholesterolData = healthMetrics?.cholesterol || []

  // Format data for charts
  const formattedBloodPressureData = bloodPressureData.map((item) => ({
    date: new Date(item.date),
    value: item.systolic,
  }))

  const formattedWeightData = weightData.map((item) => ({
    date: new Date(item.date),
    value: item.value,
  }))

  const formattedGlucoseData = glucoseData.map((item) => ({
    date: new Date(item.date),
    value: item.value,
  }))

  const formattedCholesterolData = cholesterolData.map((item) => ({
    date: new Date(item.date),
    value: item.total,
  }))

  const renderTrendIcon = (status: string) => {
    if (status === "improving") {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (status === "declining" || status === "needs improvement") {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    } else {
      return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  const renderStatusIcon = (status: string) => {
    if (status === "normal" || status === "Normal") {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const renderMetricCard = (
    title: string,
    value: string,
    change: string,
    status: string,
    icon: React.ReactNode,
    chartData: any[],
  ) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {renderTrendIcon(status)}
            <span
              className={`text-xs ${
                status === "improving"
                  ? "text-green-500"
                  : status === "declining" || status === "needs improvement"
                    ? "text-red-500"
                    : "text-yellow-500"
              }`}
            >
              {change}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <div className="mt-2">
          <HealthMetricsChart data={chartData} metricName={title} />
        </div>
      </CardContent>
    </Card>
  )

  // AI-generated summaries
  const aiSummaries = {
    overall: t("health.aiSummary.overall"),
    bloodTests: t("health.aiSummary.bloodTests"),
    bodyComposition: t("health.aiSummary.bodyComposition"),
    vitals: t("health.aiSummary.vitals"),
    lifestyle: t("health.aiSummary.lifestyle"),
  }

  // Medical conditions data
  const medicalConditions = {
    current: [
      {
        condition: t("health.conditions.hypertension"),
        diagnosedDate: t("health.dates.january2020"),
        treatedWith: "Lisinopril 10mg " + t("health.frequency.daily"),
        status: t("health.status.controlled"),
        notes: t("health.notesExamples.bloodPressureImproved"),
      },
      {
        condition: t("health.conditions.hyperlipidemia"),
        diagnosedDate: t("health.dates.january2020"),
        treatedWith: "Atorvastatin 20mg " + t("health.frequency.daily"),
        status: t("health.status.partiallyControlled"),
        notes: t("health.notesExamples.ldlElevated"),
      },
      {
        condition: t("health.conditions.type2Diabetes"),
        diagnosedDate: t("health.dates.february2020"),
        treatedWith: "Metformin 500mg " + t("health.frequency.twiceDaily") + ", " + t("health.treatmentExamples.dietExercise"),
        status: t("health.status.controlled"),
        notes: t("health.notesExamples.glucoseNormalized"),
      },
    ],
    past: [
      {
        condition: t("health.conditions.acuteBronchitis"),
        diagnosedDate: t("health.dates.november2022"),
        treatedWith: t("health.treatmentExamples.antibioticsRest"),
        resolvedDate: t("health.dates.december2022"),
        notes: t("health.notesExamples.fullyResolved"),
      },
      {
        condition: t("health.conditions.ankleSprainRight"),
        diagnosedDate: t("health.dates.june2021"),
        treatedWith: t("health.treatmentExamples.ricePhysicalTherapy"),
        resolvedDate: t("health.dates.august2021"),
        notes: t("health.notesExamples.fullyHealed"),
      },
    ],
    family: [
      {
        condition: t("health.conditions.coronaryArteryDisease"),
        relation: t("health.relations.father"),
        ageOfOnset: "55",
        outcome: t("health.outcomes.managedMedicationStents"),
      },
      {
        condition: t("health.conditions.type2Diabetes"),
        relation: t("health.relations.mother"),
        ageOfOnset: "60",
        outcome: t("health.outcomes.managedMedicationDiet"),
      },
      {
        condition: t("health.conditions.hypertension"),
        relation: t("health.relations.fatherMother"),
        ageOfOnset: t("health.ageRanges.fifties"),
        outcome: t("health.outcomes.controlledMedication"),
      },
      {
        condition: t("health.conditions.breastCancer"),
        relation: t("health.relations.maternalAunt"),
        ageOfOnset: "62",
        outcome: t("health.outcomes.successfullyTreated"),
      },
    ],
  }

  // Analysis categories and metrics
  const analysisCategories = [
    {
      name: t("health.categories.hematology"),
      metrics: [
        {
          name: t("health.metrics.whiteBloodCells"),
          current: "11.2 K/uL",
          reference: "4.5-10.0 K/uL",
          trend: "improving",
          change: "-0.8 K/uL",
          status: "abnormal",
          data: [
            { date: new Date("2023-01-15"), value: 12.0 },
            { date: new Date("2023-04-15"), value: 11.2 },
          ],
        },
        {
          name: t("health.metrics.redBloodCells"),
          current: "4.8 M/uL",
          reference: "4.5-5.5 M/uL",
          trend: "stable",
          change: "+0.1 M/uL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 4.7 },
            { date: new Date("2023-04-15"), value: 4.8 },
          ],
        },
        {
          name: t("health.metrics.hemoglobin"),
          current: "14.2 g/dL",
          reference: "13.5-17.5 g/dL",
          trend: "stable",
          change: "+0.2 g/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 14.0 },
            { date: new Date("2023-04-15"), value: 14.2 },
          ],
        },
        {
          name: t("health.metrics.platelets"),
          current: "250 K/uL",
          reference: "150-450 K/uL",
          trend: "stable",
          change: "+5 K/uL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 245 },
            { date: new Date("2023-04-15"), value: 250 },
          ],
        },
        {
          name: t("health.metrics.hematocrit"),
          current: "42%",
          reference: "38.3-48.6%",
          trend: "stable",
          change: "+1%",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 41 },
            { date: new Date("2023-04-15"), value: 42 },
          ],
        },
      ],
    },
    {
      name: t("health.categories.biochemistry"),
      metrics: [
        {
          name: t("health.metrics.totalCholesterol"),
          current: "195 mg/dL",
          reference: "<200 mg/dL",
          trend: "improving",
          change: "-15 mg/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 210 },
            { date: new Date("2023-04-15"), value: 195 },
          ],
        },
        {
          name: t("health.metrics.ldlCholesterol"),
          current: "125 mg/dL",
          reference: "<100 mg/dL",
          trend: "improving",
          change: "-10 mg/dL",
          status: "abnormal",
          data: [
            { date: new Date("2023-01-15"), value: 135 },
            { date: new Date("2023-04-15"), value: 125 },
          ],
        },
        {
          name: t("health.metrics.hdlCholesterol"),
          current: "50 mg/dL",
          reference: ">40 mg/dL",
          trend: "improving",
          change: "+4 mg/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 46 },
            { date: new Date("2023-04-15"), value: 50 },
          ],
        },
        {
          name: t("health.metrics.triglycerides"),
          current: "135 mg/dL",
          reference: "<150 mg/dL",
          trend: "improving",
          change: "-10 mg/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 145 },
            { date: new Date("2023-04-15"), value: 135 },
          ],
        },
        {
          name: t("health.metrics.totalHdlRatio"),
          current: "3.9",
          reference: "<5.0",
          trend: "improving",
          change: "-0.7",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 4.6 },
            { date: new Date("2023-04-15"), value: 3.9 },
          ],
        },
      ],
    },
    {
      name: t("health.categories.endocrinology"),
      metrics: [
        {
          name: t("health.metrics.glucose"),
          current: "98 mg/dL",
          reference: "70-99 mg/dL",
          trend: "improving",
          change: "-12 mg/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 110 },
            { date: new Date("2023-02-15"), value: 108 },
            { date: new Date("2023-03-15"), value: 105 },
            { date: new Date("2023-04-15"), value: 102 },
            { date: new Date("2023-05-15"), value: 98 },
          ],
        },
        {
          name: t("health.metrics.hemoglobinA1C"),
          current: "5.8%",
          reference: "<5.7%",
          trend: "improving",
          change: "-0.3%",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 6.1 },
            { date: new Date("2023-04-15"), value: 5.8 },
          ],
        },
        {
          name: t("health.metrics.tsh"),
          current: "2.1 mIU/L",
          reference: "0.4-4.0 mIU/L",
          trend: "stable",
          change: "+0.1 mIU/L",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 2.0 },
            { date: new Date("2023-04-15"), value: 2.1 },
          ],
        },
        {
          name: t("health.metrics.t4Free"),
          current: "1.2 ng/dL",
          reference: "0.8-1.8 ng/dL",
          trend: "stable",
          change: "0 ng/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 1.2 },
            { date: new Date("2023-04-15"), value: 1.2 },
          ],
        },
        {
          name: t("health.metrics.insulin"),
          current: "8.2 μIU/mL",
          reference: "2.6-24.9 μIU/mL",
          trend: "improving",
          change: "-2.1 μIU/mL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 10.3 },
            { date: new Date("2023-04-15"), value: 8.2 },
          ],
        },
      ],
    },
    {
      name: t("health.categories.kidneyfunction"),
      metrics: [
        {
          name: t("health.metrics.bun"),
          current: "15 mg/dL",
          reference: "7-20 mg/dL",
          trend: "stable",
          change: "-1 mg/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 16 },
            { date: new Date("2023-04-15"), value: 15 },
          ],
        },
        {
          name: t("health.metrics.creatinine"),
          current: "0.9 mg/dL",
          reference: "0.6-1.2 mg/dL",
          trend: "stable",
          change: "0 mg/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 0.9 },
            { date: new Date("2023-04-15"), value: 0.9 },
          ],
        },
        {
          name: t("health.metrics.egfr"),
          current: "85 mL/min",
          reference: ">60 mL/min",
          trend: "stable",
          change: "+2 mL/min",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 83 },
            { date: new Date("2023-04-15"), value: 85 },
          ],
        },
        {
          name: t("health.metrics.bunCreatinineRatio"),
          current: "16.7",
          reference: "10-20",
          trend: "stable",
          change: "-1.1",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 17.8 },
            { date: new Date("2023-04-15"), value: 16.7 },
          ],
        },
        {
          name: t("health.metrics.uricAcid"),
          current: "5.2 mg/dL",
          reference: "3.5-7.2 mg/dL",
          trend: "stable",
          change: "-0.3 mg/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 5.5 },
            { date: new Date("2023-04-15"), value: 5.2 },
          ],
        },
      ],
    },
    {
      name: t("health.categories.electrolytes"),
      metrics: [
        {
          name: t("health.metrics.sodium"),
          current: "140 mmol/L",
          reference: "136-145 mmol/L",
          trend: "stable",
          change: "+1 mmol/L",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 139 },
            { date: new Date("2023-04-15"), value: 140 },
          ],
        },
        {
          name: t("health.metrics.potassium"),
          current: "4.0 mmol/L",
          reference: "3.5-5.1 mmol/L",
          trend: "stable",
          change: "+0.1 mmol/L",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 3.9 },
            { date: new Date("2023-04-15"), value: 4.0 },
          ],
        },
        {
          name: t("health.metrics.calcium"),
          current: "9.5 mg/dL",
          reference: "8.5-10.2 mg/dL",
          trend: "stable",
          change: "+0.1 mg/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 9.4 },
            { date: new Date("2023-04-15"), value: 9.5 },
          ],
        },
        {
          name: t("health.metrics.chloride"),
          current: "102 mmol/L",
          reference: "98-107 mmol/L",
          trend: "stable",
          change: "+1 mmol/L",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 101 },
            { date: new Date("2023-04-15"), value: 102 },
          ],
        },
        {
          name: t("health.metrics.magnesium"),
          current: "2.1 mg/dL",
          reference: "1.6-2.6 mg/dL",
          trend: "stable",
          change: "+0.1 mg/dL",
          status: "normal",
          data: [
            { date: new Date("2023-01-15"), value: 2.0 },
            { date: new Date("2023-04-15"), value: 2.1 },
          ],
        },
      ],
    },
    {
      name: t("health.categories.urinalysis"),
      metrics: [
        {
          name: t("health.metrics.protein"),
          current: t("health.values.negative"),
          reference: t("health.values.negative"),
          trend: "stable",
          change: t("health.changes.noChange"),
          status: "normal",
          data: [],
        },
        {
          name: t("health.metrics.glucose"),
          current: t("health.values.negative"),
          reference: t("health.values.negative"),
          trend: "stable",
          change: t("health.changes.noChange"),
          status: "normal",
          data: [],
        },
        {
          name: t("health.metrics.ketones"),
          current: t("health.values.negative"),
          reference: t("health.values.negative"),
          trend: "stable",
          change: t("health.changes.noChange"),
          status: "normal",
          data: [],
        },
        {
          name: t("health.metrics.ph"),
          current: "6.0",
          reference: "5.0-8.0",
          trend: "stable",
          change: t("health.changes.noChange"),
          status: "normal",
          data: [],
        },
        {
          name: t("health.metrics.specificGravity"),
          current: "1.020",
          reference: "1.005-1.030",
          trend: "stable",
          change: t("health.changes.noChange"),
          status: "normal",
          data: [],
        },
      ],
    },
  ]

  // Body composition data
  const bodyCompositionMetrics = [
    {
      name: t("health.metrics.bodyFat"),
      current: "24%",
      reference: "10-20%",
      trend: "improving",
      change: "-2.3%",
      status: "abnormal",
      data: [
        { date: new Date("2022-11-15"), value: 28.5 },
        { date: new Date("2023-01-15"), value: 26.3 },
        { date: new Date("2023-04-15"), value: 24.0 },
      ],
    },
    {
      name: t("health.metrics.muscleMass"),
      current: "32%",
      reference: ">30%",
      trend: "improving",
      change: "+1.5%",
      status: "normal",
      data: [
        { date: new Date("2022-11-15"), value: 29.5 },
        { date: new Date("2023-01-15"), value: 30.5 },
        { date: new Date("2023-04-15"), value: 32.0 },
      ],
    },
    {
      name: t("health.metrics.bmi"),
      current: "26.2",
      reference: "18.5-24.9",
      trend: "improving",
      change: "-1.1",
      status: "abnormal",
      data: [
        { date: new Date("2022-11-15"), value: 28.0 },
        { date: new Date("2023-01-15"), value: 27.3 },
        { date: new Date("2023-04-15"), value: 26.2 },
      ],
    },
    {
      name: t("health.metrics.waistCircumference"),
      current: "36 " + t("health.units.inches"),
      reference: "<35 " + t("health.units.inches"),
      trend: "improving",
      change: "-2 " + t("health.units.inches"),
      status: "abnormal",
      data: [
        { date: new Date("2022-11-15"), value: 39 },
        { date: new Date("2023-01-15"), value: 38 },
        { date: new Date("2023-04-15"), value: 36 },
      ],
    },
    {
      name: t("health.metrics.waistHipRatio"),
      current: "0.88",
      reference: "<0.85",
      trend: "improving",
      change: "-0.03",
      status: "abnormal",
      data: [
        { date: new Date("2022-11-15"), value: 0.93 },
        { date: new Date("2023-01-15"), value: 0.91 },
        { date: new Date("2023-04-15"), value: 0.88 },
      ],
    },
    {
      name: t("health.metrics.visceralFat"),
      current: "9",
      reference: "<10",
      trend: "improving",
      change: "-2",
      status: "normal",
      data: [
        { date: new Date("2022-11-15"), value: 12 },
        { date: new Date("2023-01-15"), value: 11 },
        { date: new Date("2023-04-15"), value: 9 },
      ],
    },
  ]

  // Lifestyle data
  const lifestyleMetrics = [
    {
      name: t("health.metrics.sleep"),
      current: "7.2 " + t("health.units.hours"),
      reference: "7-9 " + t("health.units.hours"),
      trend: "stable",
      change: "+0.2 " + t("health.units.hours"),
      status: "normal",
      data: [
        { date: new Date("2022-11-15"), value: 6.8 },
        { date: new Date("2023-01-15"), value: 7.0 },
        { date: new Date("2023-04-15"), value: 7.2 },
      ],
    },
    {
      name: t("health.metrics.steps"),
      current: "6,200",
      reference: "10,000",
      trend: "improving",
      change: "+800",
      status: "abnormal",
      data: [
        { date: new Date("2022-11-15"), value: 4800 },
        { date: new Date("2023-01-15"), value: 5400 },
        { date: new Date("2023-04-15"), value: 6200 },
      ],
    },
    {
      name: t("health.metrics.workouts"),
      current: "3/" + t("health.units.week"),
      reference: "3-5/" + t("health.units.week"),
      trend: "improving",
      change: "+1",
      status: "normal",
      data: [
        { date: new Date("2022-11-15"), value: 1 },
        { date: new Date("2023-01-15"), value: 2 },
        { date: new Date("2023-04-15"), value: 3 },
      ],
    },
    {
      name: t("health.metrics.stressLevel"),
      current: t("health.values.moderate"),
      reference: t("health.values.low"),
      trend: "improving",
      change: "-1 " + t("health.units.level"),
      status: "abnormal",
      data: [
        { date: new Date("2022-11-15"), value: 4 },
        { date: new Date("2023-01-15"), value: 3 },
        { date: new Date("2023-04-15"), value: 2 },
      ],
    },
    {
      name: t("health.metrics.screenTime"),
      current: "5.5 " + t("health.units.hoursPerDay"),
      reference: "<4 " + t("health.units.hoursPerDay"),
      trend: "declining",
      change: "+0.5 " + t("health.units.hours"),
      status: "abnormal",
      data: [
        { date: new Date("2022-11-15"), value: 4.5 },
        { date: new Date("2023-01-15"), value: 5.0 },
        { date: new Date("2023-04-15"), value: 5.5 },
      ],
    },
    {
      name: t("health.metrics.nutritionScore"),
      current: "72/100",
      reference: ">80/100",
      trend: "improving",
      change: "+5 " + t("health.units.points"),
      status: "abnormal",
      data: [
        { date: new Date("2022-11-15"), value: 65 },
        { date: new Date("2023-01-15"), value: 68 },
        { date: new Date("2023-04-15"), value: 72 },
      ],
    },
  ]

  // Vitals data
  const vitalsMetrics = [
    {
      name: t("health.metrics.heartRate"),
      current: "68 bpm",
      reference: "60-100 bpm",
      trend: "improving",
      change: "-3 bpm",
      status: "normal",
      data: [
        { date: new Date("2022-11-15"), value: 74 },
        { date: new Date("2023-01-15"), value: 71 },
        { date: new Date("2023-04-15"), value: 68 },
      ],
    },
    {
      name: t("health.metrics.bloodPressure"),
      current: "132/85 mmHg",
      reference: "<120/80 mmHg",
      trend: "improving",
      change: "-13/7 mmHg",
      status: "abnormal",
      data: [
        { date: new Date("2022-11-15"), value: 150 },
        { date: new Date("2023-01-15"), value: 145 },
        { date: new Date("2023-04-15"), value: 132 },
      ],
    },
    {
      name: t("health.metrics.oxygenSaturation"),
      current: "98%",
      reference: "95-100%",
      trend: "improving",
      change: "+1%",
      status: "normal",
      data: [
        { date: new Date("2022-11-15"), value: 96 },
        { date: new Date("2023-01-15"), value: 97 },
        {
          date: new Date("2023-04-15"),
          value: 98,
        },
      ],
    },
    {
      name: t("health.metrics.respiratoryRate"),
      current: "14 " + t("health.units.breathsPerMinute"),
      reference: "12-20 " + t("health.units.breathsPerMinute"),
      trend: "stable",
      change: "0 " + t("health.units.breathsPerMinute"),
      status: "normal",
      data: [
        { date: new Date("2022-11-15"), value: 14 },
        { date: new Date("2023-01-15"), value: 14 },
        { date: new Date("2023-04-15"), value: 14 },
      ],
    },
    {
      name: t("health.metrics.temperature"),
      current: "98.6°F",
      reference: "97.8-99.1°F",
      trend: "stable",
      change: "0°F",
      status: "normal",
      data: [
        { date: new Date("2022-11-15"), value: 98.6 },
        { date: new Date("2023-01-15"), value: 98.6 },
        { date: new Date("2023-04-15"), value: 98.6 },
      ],
    },
  ]

  // Lab documents
  const labDocuments = [
    {
      id: "doc1",
      name: t("health.documents.completeBloodCount"),
      date: t("health.dates.april152023"),
      type: t("health.documentTypes.labResults"),
      provider: "Lab Corp",
      fileUrl: "/documents/cbc-20230415.pdf",
    },
    {
      id: "doc2",
      name: t("health.documents.comprehensiveMetabolicPanel"),
      date: t("health.dates.april152023"),
      type: t("health.documentTypes.labResults"),
      provider: "Lab Corp",
      fileUrl: "/documents/cmp-20230415.pdf",
    },
    {
      id: "doc3",
      name: t("health.documents.lipidPanel"),
      date: t("health.dates.april152023"),
      type: t("health.documentTypes.labResults"),
      provider: "Lab Corp",
      fileUrl: "/documents/lipid-20230415.pdf",
    },
    {
      id: "doc4",
      name: t("health.documents.hemoglobinA1C"),
      date: t("health.dates.april152023"),
      type: t("health.documentTypes.labResults"),
      provider: "Lab Corp",
      fileUrl: "/documents/a1c-20230415.pdf",
    },
    {
      id: "doc5",
      name: t("health.documents.completeBloodCount"),
      date: t("health.dates.january152023"),
      type: t("health.documentTypes.labResults"),
      provider: "Lab Corp",
      fileUrl: "/documents/cbc-20230115.pdf",
    },
    {
      id: "doc6",
      name: t("health.documents.comprehensiveMetabolicPanel"),
      date: t("health.dates.january152023"),
      type: t("health.documentTypes.labResults"),
      provider: "Lab Corp",
      fileUrl: "/documents/cmp-20230115.pdf",
    },
    {
      id: "doc7",
      name: t("health.documents.lipidPanel"),
      date: t("health.dates.january152023"),
      type: t("health.documentTypes.labResults"),
      provider: "Lab Corp",
      fileUrl: "/documents/lipid-20230115.pdf",
    },
  ]

  // Check if metric name already exists
  const checkMetricExists = (name: string) => {
    const allMetrics = analysisCategories.flatMap((category) => category.metrics.map((m) => m.name.toLowerCase()))
    return allMetrics.includes(name.toLowerCase())
  }

  // Handle new metric name change
  const handleNewMetricNameChange = (value: string) => {
    setNewMetricName(value)
    setMetricExistsAlert(checkMetricExists(value))
  }

  // Handle new metric creation
  const handleCreateNewMetric = () => {
    if (!newMetricName || !newMetricCategory || !newMetricUnit || !newMetricNormalRange) {
      alert("Please fill in all required fields")
      return
    }

    if (metricExistsAlert) {
      alert("This metric already exists. Please choose a different name.")
      return
    }

    // In a real app, this would create the metric in the database
    alert(`New metric "${newMetricName}" created successfully in ${newMetricCategory} category!`)

    // Reset form
    setNewMetricName("")
    setNewMetricCategory("")
    setNewMetricUnit("")
    setNewMetricNormalRange("")
    setMetricExistsAlert(false)
    setNewMetricDialogOpen(false)
  }

  // Handle add value for category
  const handleAddValueForCategory = (categoryName: string) => {
    setSelectedCategory(categoryName)
    setAddValueDialogOpen(true)
  }

  // Handle sub-metric selection change
  const handleSubMetricChange = (value: string) => {
    if (value === "new") {
      setShowNewSubMetricInput(true)
      setSelectedSubMetric("")
    } else {
      setShowNewSubMetricInput(false)
      setSelectedSubMetric(value)

      // Find the selected metric and populate normal range
      const category = analysisCategories.find((cat) => cat.name === selectedCategory)
      const metric = category?.metrics.find((m) => m.name === value)
      if (metric) {
        // Extract min and max from reference range
        const reference = metric.reference
        const rangeMatch = reference.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/)
        if (rangeMatch) {
          setNormalRangeMin(rangeMatch[1])
          setNormalRangeMax(rangeMatch[2])
        } else if (reference.includes("<")) {
          const maxMatch = reference.match(/<(\d+(?:\.\d+)?)/)
          if (maxMatch) {
            setNormalRangeMin("0")
            setNormalRangeMax(maxMatch[1])
          }
        } else if (reference.includes(">")) {
          const minMatch = reference.match(/>(\d+(?:\.\d+)?)/)
          if (minMatch) {
            setNormalRangeMin(minMatch[1])
            setNormalRangeMax("999")
          }
        }
      }
    }
  }

  // Handle add value submission
  const handleAddValueSubmit = () => {
    const metricName = showNewSubMetricInput ? newSubMetricName : selectedSubMetric

    if (!metricName || !metricValue || !metricUnit || !metricDate) {
      alert("Please fill in all required fields")
      return
    }

    // In a real app, this would save the value to the database
    alert(`Value added successfully: ${metricName} = ${metricValue} ${metricUnit} on ${metricDate}`)

    // Reset form
    setSelectedSubMetric("")
    setNewSubMetricName("")
    setMetricValue("")
    setMetricUnit("")
    setMetricDate(new Date().toISOString().split("T")[0])
    setNormalRangeMin("")
    setNormalRangeMax("")
    setShowNewSubMetricInput(false)
    setAddValueDialogOpen(false)
  }

  // Render metric box for analysis tab
  const renderMetricBox = (metric: any) => {
    const isAbnormal = metric.status === "abnormal"
    const trendIcon = renderTrendIcon(metric.trend)

    return (
      <Dialog key={metric.name}>
        <DialogTrigger asChild>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-medium text-sm">{metric.name}</h3>
              <Badge
                variant={isAbnormal ? "secondary" : "outline"}
                className={`${isAbnormal ? "bg-red-50 text-red-600 border-red-200" : "text-green-600"} text-xs py-0 px-1 h-5`}
              >
                {isAbnormal ? (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{t("health.status.abnormal")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{t("health.status.normal")}</span>
                  </div>
                )}
              </Badge>
            </div>
            <div className="mt-1">
              <div className="flex justify-between items-center">
                <p className="text-xl font-bold">{metric.current}</p>
                <p className="text-xs text-muted-foreground">
                  {t("health.status.normal")}: {metric.reference}
                </p>
              </div>

              {/* Add chart below the value */}
              {metric.data.length > 0 && (
                <div className="h-[60px] mt-2">
                  <HealthMetricsChart
                    data={metric.data.map((item: any) => ({
                      date: item.date,
                      value: item.value,
                    }))}
                    metricName={metric.name}
                    options={{
                      fontSize: 8,
                      tickCount: 3,
                      roundValues: true,
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end items-center mt-1">
                <div className="flex items-center gap-1">
                  {trendIcon}
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
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {metric.name} {t("health.trend")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">{metric.current}</div>
                  <div className="text-sm text-muted-foreground">
                    {t("health.reference")}: {metric.reference}
                  </div>
                </div>
                <Badge
                  variant={metric.status === "normal" ? "outline" : "secondary"}
                  className={metric.status === "normal" ? "text-green-500" : "text-red-500"}
                >
                  {metric.status === "normal" ? t("health.status.normal") : t("health.status.abnormal")}
                </Badge>
              </div>
            </div>
            <div className="h-[300px]">
              {metric.data.length > 0 ? (
                <HealthMetricsChart
                  data={metric.data.map((item: any) => ({
                    date: item.date,
                    value: item.value,
                  }))}
                  metricName={metric.name}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-muted/30 rounded-md">
                  <span className="text-sm text-muted-foreground">{t("health.noTrendData")}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

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
      data: formattedBloodPressureData,
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
      data: formattedGlucoseData,
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
      data: formattedCholesterolData,
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
      data: vitalsMetrics[0].data,
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
      data: vitalsMetrics[2].data,
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
      data: analysisCategories[0].metrics[0].data,
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
      data: formattedWeightData,
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
      data: bodyCompositionMetrics[0].data,
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
      data: lifestyleMetrics[0].data,
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
      data: lifestyleMetrics[1].data,
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
      data: lifestyleMetrics[2].data,
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
      data: lifestyleMetrics[5].data,
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

          <div className="h-[100px]">
            <HealthMetricsChart
              data={metric.data}
              metricName={metric.name}
              options={{
                fontSize: 10,
                tickCount: 3,
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
            onClick={() => setActiveTab(metric.tab)}
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

  // Lab documents grouped by date
  const labDocumentsByDate = [
    {
      date: t("health.dates.april152023"),
      provider: "Lab Corp",
      documents: [
        {
          id: "doc1",
          name: t("health.documents.completeBloodCount"),
          type: t("health.documentTypes.labResults"),
          fileUrl: "/documents/cbc-20230415.pdf",
        },
        {
          id: "doc2",
          name: t("health.documents.comprehensiveMetabolicPanel"),
          type: t("health.documentTypes.labResults"),
          fileUrl: "/documents/cmp-20230415.pdf",
        },
        {
          id: "doc3",
          name: t("health.documents.lipidPanel"),
          type: t("health.documentTypes.labResults"),
          fileUrl: "/documents/lipid-20230415.pdf",
        },
        {
          id: "doc4",
          name: t("health.documents.hemoglobinA1C"),
          fileUrl: "/documents/a1c-20230415.pdf",
        },
      ],
    },
    {
      date: t("health.dates.january152023"),
      provider: "Lab Corp",
      documents: [
        {
          id: "doc5",
          name: t("health.documents.completeBloodCount"),
          type: t("health.documentTypes.labResults"),
          fileUrl: "/documents/cbc-20230115.pdf",
        },
        {
          id: "doc6",
          name: t("health.documents.comprehensiveMetabolicPanel"),
          type: t("health.documentTypes.labResults"),
          fileUrl: "/documents/cmp-20230115.pdf",
        },
        {
          id: "doc7",
          name: t("health.documents.lipidPanel"),
          provider: "Lab Corp",
          fileUrl: "/documents/lipid-20230115.pdf",
        },
      ],
    },
    {
      date: t("health.dates.october102022"),
      provider: "Lab Corp",
      documents: [
        {
          id: "doc8",
          name: t("health.documents.completeBloodCount"),
          type: t("health.documentTypes.labResults"),
          fileUrl: "/documents/cbc-20221010.pdf",
        },
        {
          id: "doc9",
          name: t("health.documents.comprehensiveMetabolicPanel"),
          type: t("health.documentTypes.labResults"),
          fileUrl: "/documents/cmp-20221010.pdf",
        },
      ],
    },
  ]

  return (
    <div className="container py-6">
      {/* New header with patient photo and salutation */}
      <header className="mb-6 flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-teal-500">
          <img src="/middle-aged-man-profile.png" alt="John's profile" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-2xl font-bold text-primary dark:text-teal-300">{t("greeting.morning")}, John!</p>
          <p className="text-muted-foreground">{t("health.controlRecords")}</p>
        </div>
      </header>

      {/* Improved tabs layout with horizontal scrolling on mobile */}
      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-max min-w-full h-auto flex flex-nowrap gap-1 p-1">
            <TabsTrigger value="summary" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>{t("health.summary")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{t("health.history")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span>{t("health.analysis")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="body-composition" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                <span>{t("health.body")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                <span>{t("health.lifestyle")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>{t("health.vitals")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="genetics" className="flex-1 py-2">
              <div className="flex items-center gap-2">
                <Dna className="h-4 w-4" />
                <span>{t("health.genetics")}</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Summary Tab - Reorganized with Health and Wellness sections */}
        <TabsContent value="summary">
          {/* Overall Health Assessment */}
          <Card className="mb-6">
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
                            healthScore >= 80
                              ? "text-green-500"
                              : healthScore >= 60
                                ? "text-yellow-500"
                                : "text-red-500"
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
          <Card className="mb-6">
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
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("health.currentConditions")}</CardTitle>
                  <CardDescription>{t("health.activeConditions")}</CardDescription>
                </div>
                <Dialog open={editCurrentConditionsOpen} onOpenChange={setEditCurrentConditionsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                      <PencilIcon className="h-3.5 w-3.5" />
                      <span>{t("action.edit")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>{t("health.editCurrentConditions")}</DialogTitle>
                      <DialogDescription>{t("health.editCurrentConditionsDesc")}</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto">
                      <div className="space-y-4 p-4">
                        {medicalConditions.current.map((condition, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="grid gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">{t("health.condition")}</label>
                                  <input
                                    type="text"
                                    defaultValue={condition.condition}
                                    className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">{t("health.status")}</label>
                                  <select
                                    defaultValue={condition.status}
                                    className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                  >
                                    <option value={t("health.status.controlled")}>
                                      {t("health.status.controlled")}
                                    </option>
                                    <option value={t("health.status.partiallyControlled")}>
                                      {t("health.status.partiallyControlled")}
                                    </option>
                                    <option value={t("health.status.uncontrolled")}>
                                      {t("health.status.uncontrolled")}
                                    </option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">{t("health.treatment")}</label>
                                <input
                                  type="text"
                                  defaultValue={condition.treatedWith}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">{t("health.notes")}</label>
                                <textarea
                                  defaultValue={condition.notes}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditCurrentConditionsOpen(false)}>
                        {t("action.cancel")}
                      </Button>
                      <Button
                        onClick={() => {
                          alert(t("health.conditionsUpdated"))
                          setEditCurrentConditionsOpen(false)
                        }}
                      >
                        {t("action.save")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicalConditions.current.map((condition, index) => (
                    <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{condition.condition}</h3>
                        <Badge
                          variant={condition.status === t("health.status.controlled") ? "outline" : "secondary"}
                          className={
                            condition.status === t("health.status.controlled") ? "text-green-500" : "text-yellow-500"
                          }
                        >
                          {condition.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <p>
                          {t("health.diagnosed")}: {condition.diagnosedDate}
                        </p>
                        <p>
                          {t("health.treatment")}: {condition.treatedWith}
                        </p>
                        <p className="mt-1">{condition.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("health.pastConditions")}</CardTitle>
                  <CardDescription>{t("health.resolvedConditions")}</CardDescription>
                </div>
                <Dialog open={editPastConditionsOpen} onOpenChange={setEditPastConditionsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                      <PencilIcon className="h-3.5 w-3.5" />
                      <span>{t("action.edit")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>{t("health.editPastConditions")}</DialogTitle>
                      <DialogDescription>{t("health.editPastConditionsDesc")}</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto">
                      <div className="space-y-4 p-4">
                        {medicalConditions.past.map((condition, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="grid gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">{t("health.condition")}</label>
                                  <input
                                    type="text"
                                    defaultValue={condition.condition}
                                    className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">{t("health.resolvedDate")}</label>
                                  <input
                                    type="date"
                                    defaultValue="2022-12-01"
                                    className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">{t("health.treatment")}</label>
                                <input
                                  type="text"
                                  defaultValue={condition.treatedWith}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">{t("health.notes")}</label>
                                <textarea
                                  defaultValue={condition.notes}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditPastConditionsOpen(false)}>
                        {t("action.cancel")}
                      </Button>
                      <Button
                        onClick={() => {
                          alert(t("health.conditionsUpdated"))
                          setEditPastConditionsOpen(false)
                        }}
                      >
                        {t("action.save")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicalConditions.past.map((condition, index) => (
                    <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{condition.condition}</h3>
                        <Badge variant="outline" className="text-green-500">
                          {t("health.resolved")}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <p>
                          {t("health.diagnosed")}: {condition.diagnosedDate}
                        </p>
                        <p>
                          {t("health.resolved")}: {condition.resolvedDate}
                        </p>
                        <p>
                          {t("health.treatment")}: {condition.treatedWith}
                        </p>
                        <p className="mt-1">{condition.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.familyHistory")}</CardTitle>
                <CardDescription>{t("health.familyConditions")}</CardDescription>
              </div>
              <Dialog open={editFamilyHistoryOpen} onOpenChange={setEditFamilyHistoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                    <PencilIcon className="h-3.5 w-3.5" />
                    <span>{t("action.edit")}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{t("health.editFamilyHistory")}</DialogTitle>
                    <DialogDescription>{t("health.editFamilyHistoryDesc")}</DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="space-y-4 p-4">
                      {medicalConditions.family.map((condition, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">{t("health.condition")}</label>
                                <input
                                  type="text"
                                  defaultValue={condition.condition}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">{t("health.relation")}</label>
                                <select
                                  defaultValue={condition.relation}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                >
                                  <option value={t("health.relations.father")}>{t("health.relations.father")}</option>
                                  <option value={t("health.relations.mother")}>{t("health.relations.mother")}</option>
                                  <option value={t("health.relations.fatherMother")}>
                                    {t("health.relations.fatherMother")}
                                  </option>
                                  <option value={t("health.relations.maternalAunt")}>
                                    {t("health.relations.maternalAunt")}
                                  </option>
                                  <option value="Sibling">Sibling</option>
                                  <option value="Grandparent">Grandparent</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">{t("health.ageOfOnset")}</label>
                                <input
                                  type="text"
                                  defaultValue={condition.ageOfOnset}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">{t("health.outcome")}</label>
                                <input
                                  type="text"
                                  defaultValue={condition.outcome}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditFamilyHistoryOpen(false)}>
                      {t("action.cancel")}
                    </Button>
                    <Button
                      onClick={() => {
                        alert(t("health.familyHistoryUpdated"))
                        setEditFamilyHistoryOpen(false)
                      }}
                    >
                      {t("action.save")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medicalConditions.family.map((condition, index) => (
                  <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{condition.condition}</h3>
                      <span className="text-sm text-muted-foreground">
                        {t("health.ageOfOnset")}: {condition.ageOfOnset}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <p>
                        {t("health.relation")}: {condition.relation}
                      </p>
                      <p>
                        {t("health.outcome")}: {condition.outcome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("health.healthAnalysis")}</CardTitle>
                  <CardDescription>{t("health.aiInsights")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted/50 p-4 border border-muted">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-teal-600 mt-0.5" />
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            {t("health.areasOfConcern")}:
                          </h4>
                          <p className="text-sm">{t("health.ldlCholesterolConcern")}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-green-600">
                            <ThumbsUp className="h-4 w-4" />
                            {t("health.positiveTrends")}:
                          </h4>
                          <p className="text-sm">{t("health.cholesterolImprovement")}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-blue-600">
                            <Lightbulb className="h-4 w-4" />
                            {t("health.recommendations")}:
                          </h4>
                          <p className="text-sm">{t("health.statinRecommendation")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>{t("health.labDocuments")}</CardTitle>
                  <CardDescription>{t("health.recentResults")}</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t("action.add")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("health.uploadLabDocument")}</DialogTitle>
                      <DialogDescription>{t("health.uploadLabDesc")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="docDate" className="text-right text-sm">
                          {t("health.date")}
                        </Label>
                        <Input
                          id="docDate"
                          type="date"
                          defaultValue={new Date().toISOString().split("T")[0]}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="docType" className="text-right text-sm">
                          {t("health.type")}
                        </Label>
                        <Select>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Complete Blood Count">
                              {t("health.documents.completeBloodCount")}
                            </SelectItem>
                            <SelectItem value="Comprehensive Metabolic Panel">
                              {t("health.documents.comprehensiveMetabolicPanel")}
                            </SelectItem>
                            <SelectItem value="Lipid Panel">{t("health.documents.lipidPanel")}</SelectItem>
                            <SelectItem value="Hemoglobin A1C">{t("health.documents.hemoglobinA1C")}</SelectItem>
                            <SelectItem value="Urinalysis">{t("health.documents.urinalysis")}</SelectItem>
                            <SelectItem value="Thyroid Panel">{t("health.documents.thyroidPanel")}</SelectItem>
                            <SelectItem value="Other">{t("health.other")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="provider" className="text-right text-sm">
                          {t("health.provider")}
                        </Label>
                        <Input id="provider" type="text" defaultValue="Lab Corp" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="docFile" className="text-right text-sm">
                          {t("health.file")}
                        </Label>
                        <div className="col-span-3">
                          <Label
                            htmlFor="docFile"
                            className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50"
                          >
                            <FileText className="mb-2 h-6 w-6" />
                            <span className="font-medium">{t("health.clickToUpload")}</span>
                            <span className="text-xs">{t("health.pdfMaxSize")}</span>
                            <Input id="docFile" type="file" accept=".pdf" className="sr-only" />
                          </Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => alert(t("health.documentUploaded"))}>
                        {t("health.uploadDocument")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {labDocumentsByDate.slice(0, 2).map((dateGroup, index) => (
                    <div key={index} className="border-b pb-3 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm">{dateGroup.date}</h3>
                        <span className="text-xs text-muted-foreground ml-1">({dateGroup.provider})</span>
                      </div>
                      <div className="pl-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {dateGroup.documents.map((doc) => doc.name).join(", ")}
                          </p>
                          <Button variant="ghost" size="sm" className="h-7">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      const allDocsTab = document.createElement("div")
                      allDocsTab.innerHTML = `
                        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
                            <div class="flex justify-between items-center mb-4">
                              <h2 class="text-xl font-bold">${t("health.allLabDocuments")}</h2>
                              <button id="closeDocsModal" class="text-gray-500 hover:text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                            <div class="space-y-4">
                              ${labDocumentsByDate
                                .map(
                                  (group) => `
                                <div class="border-b pb-3">
                                  <div class="flex items-center gap-2 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-gray-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    <h3 class="font-medium text-sm">${group.date}</h3>
                                    <span class="text-xs text-gray-500 ml-1">(${group.provider})</span>
                                  </div>
                                  <div class="pl-6 space-y-2">
                                    ${group.documents
                                      .map(
                                        (doc) => `
                                      <div class="flex items-center justify-between">
                                        <span class="text-sm">${doc.name}</span>
                                        <button class="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                          ${t("action.download")}
                                        </button>
                                      </div>
                                    `,
                                      )
                                      .join("")}
                                  </div>
                                </div>
                              `,
                                )
                                .join("")}
                            </div>
                          </div>
                        </div>
                      `
                      document.body.appendChild(allDocsTab)
                      document.getElementById("closeDocsModal")?.addEventListener("click", () => {
                        document.body.removeChild(allDocsTab)
                      })
                    }}
                  >
                    {t("health.seeAllDocuments")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Global New Metric Button */}
          <div className="mb-4 flex justify-end">
            <Dialog open={newMetricDialogOpen} onOpenChange={setNewMetricDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  {t("health.newMetric")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t("health.createNewMetric")}</DialogTitle>
                  <DialogDescription>{t("health.addCustomMetric")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-metric-name">{t("health.metricName")}</Label>
                    <Input
                      id="new-metric-name"
                      placeholder="e.g., Vitamin D"
                      value={newMetricName}
                      onChange={(e) => handleNewMetricNameChange(e.target.value)}
                    />
                    {metricExistsAlert && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>This metric already exists. Please choose a different name.</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-metric-category">{t("health.category")}</Label>
                    <Select value={newMetricCategory} onValueChange={setNewMetricCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {analysisCategories.map((category) => (
                          <SelectItem key={category.name} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-metric-unit">{t("health.unit")}</Label>
                    <Input
                      id="new-metric-unit"
                      placeholder="e.g., ng/mL"
                      value={newMetricUnit}
                      onChange={(e) => setNewMetricUnit(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-metric-range">{t("health.normalRange")}</Label>
                    <Input
                      id="new-metric-range"
                      placeholder="e.g., 30-100"
                      value={newMetricNormalRange}
                      onChange={(e) => setNewMetricNormalRange(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewMetricDialogOpen(false)}>
                    {t("action.cancel")}
                  </Button>
                  <Button onClick={handleCreateNewMetric} disabled={metricExistsAlert}>
                    {t("action.create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Accordion type="multiple" defaultValue={analysisCategories.map((cat) => cat.name)} className="mb-6">
            {analysisCategories.map((category, index) => (
              <AccordionItem key={index} value={category.name}>
                <AccordionTrigger className="text-lg">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{category.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddValueForCategory(category.name)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-xs">{t("health.addValue")}</span>
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {category.metrics.map((metric, mIndex) => renderMetricBox(metric))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Add Value Dialog */}
          <Dialog open={addValueDialogOpen} onOpenChange={setAddValueDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {t("health.addValue")} - {selectedCategory}
                </DialogTitle>
                <DialogDescription>{t("health.selectOrCreateMetric")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="sub-metric">{t("health.metric")}</Label>
                  <Select value={selectedSubMetric} onValueChange={handleSubMetricChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing metric or create new" />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisCategories
                        .find((cat) => cat.name === selectedCategory)
                        ?.metrics.map((metric) => (
                          <SelectItem key={metric.name} value={metric.name}>
                            {metric.name}
                          </SelectItem>
                        ))}
                      <SelectItem value="new">+ Create New Metric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showNewSubMetricInput && (
                  <div className="grid gap-2">
                    <Label htmlFor="new-sub-metric">{t("health.newMetricName")}</Label>
                    <Input
                      id="new-sub-metric"
                      placeholder="Enter new metric name"
                      value={newSubMetricName}
                      onChange={(e) => setNewSubMetricName(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="metric-value">{t("health.value")}</Label>
                    <Input
                      id="metric-value"
                      type="number"
                      step="0.01"
                      placeholder="Enter value"
                      value={metricValue}
                      onChange={(e) => setMetricValue(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="metric-unit">{t("health.unit")}</Label>
                    <Input
                      id="metric-unit"
                      placeholder="e.g., mg/dL"
                      value={metricUnit}
                      onChange={(e) => setMetricUnit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>{t("health.normalRange")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min"
                      value={normalRangeMin}
                      onChange={(e) => setNormalRangeMin(e.target.value)}
                    />
                    <Input
                      placeholder="Max"
                      value={normalRangeMax}
                      onChange={(e) => setNormalRangeMax(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="metric-date">{t("health.date")}</Label>
                  <Input
                    id="metric-date"
                    type="date"
                    value={metricDate}
                    onChange={(e) => setMetricDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddValueDialogOpen(false)}>
                  {t("action.cancel")}
                </Button>
                <Button onClick={handleAddValueSubmit}>{t("health.addValue")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Body Composition Tab */}
        <TabsContent value="body-composition">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("health.bodyCompositionAnalysis")}</CardTitle>
              <CardDescription>{t("health.bodyCompositionDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4 border border-muted">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {t("health.areasOfConcern")}:
                      </h4>
                      <p className="text-sm">{t("health.bmiConcern")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        {t("health.positiveTrends")}:
                      </h4>
                      <p className="text-sm">{t("health.bodyFatDecrease")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-blue-600">
                        <Lightbulb className="h-4 w-4" />
                        {t("health.recommendations")}:
                      </h4>
                      <p className="text-sm">{t("health.exerciseRecommendation")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.bodyCompositionMetrics")}</CardTitle>
                <CardDescription>{t("health.bodyMeasurements")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t("health.addValue")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("health.addBodyMetric")}</DialogTitle>
                      <DialogDescription>{t("health.enterBodyMetricDetails")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="metric">{t("health.metric")}</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Body Fat">{t("health.metrics.bodyFat")}</SelectItem>
                            <SelectItem value="Muscle Mass">{t("health.metrics.muscleMass")}</SelectItem>
                            <SelectItem value="BMI">{t("health.metrics.bmi")}</SelectItem>
                            <SelectItem value="Waist Circumference">
                              {t("health.metrics.waistCircumference")}
                            </SelectItem>
                            <SelectItem value="Waist-Hip Ratio">{t("health.metrics.waistHipRatio")}</SelectItem>
                            <SelectItem value="Visceral Fat">{t("health.metrics.visceralFat")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="value">{t("health.value")}</Label>
                        <Input id="value" type="number" step="0.1" placeholder="Enter value" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="unit">{t("health.unit")}</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="%">%</SelectItem>
                            <SelectItem value="kg/m²">kg/m²</SelectItem>
                            <SelectItem value="inches">{t("health.units.inches")}</SelectItem>
                            <SelectItem value="cm">cm</SelectItem>
                            <SelectItem value="ratio">ratio</SelectItem>
                            <SelectItem value="level">{t("health.units.level")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">{t("health.date")}</Label>
                        <Input id="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => alert(t("health.metricSaved"))}>
                        {t("health.saveMetric")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bodyCompositionMetrics.map((metric) => renderMetricBox(metric))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lifestyle Tab */}
        <TabsContent value="lifestyle">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("health.lifestyleAnalysis")}</CardTitle>
              <CardDescription>{t("health.lifestyleInsights")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4 border border-muted">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {t("health.areasOfConcern")}:
                      </h4>
                      <p className="text-sm">{t("health.stepsConcern")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        {t("health.positiveTrends")}:
                      </h4>
                      <p className="text-sm">{t("health.sleepPositive")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-blue-600">
                        <Lightbulb className="h-4 w-4" />
                        {t("health.recommendations")}:
                      </h4>
                      <p className="text-sm">{t("health.walkingRecommendation")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.lifestyleMeasurements")}</CardTitle>
                <CardDescription>{t("health.lifestyleMeasurements")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t("health.addValue")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("health.addLifestyleMetric")}</DialogTitle>
                      <DialogDescription>{t("health.enterLifestyleDetails")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="lifestyle-metric">{t("health.metric")}</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sleep">{t("health.metrics.sleep")}</SelectItem>
                            <SelectItem value="Steps">{t("health.metrics.steps")}</SelectItem>
                            <SelectItem value="Workouts">{t("health.metrics.workouts")}</SelectItem>
                            <SelectItem value="Stress Level">{t("health.metrics.stressLevel")}</SelectItem>
                            <SelectItem value="Screen Time">{t("health.metrics.screenTime")}</SelectItem>
                            <SelectItem value="Nutrition Score">{t("health.metrics.nutritionScore")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lifestyle-value">{t("health.value")}</Label>
                        <Input id="lifestyle-value" type="number" step="0.1" placeholder="Enter value" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lifestyle-unit">{t("health.unit")}</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hrs">{t("health.units.hours")}</SelectItem>
                            <SelectItem value="steps">steps</SelectItem>
                            <SelectItem value="/week">/{t("health.units.week")}</SelectItem>
                            <SelectItem value="level">{t("health.units.level")}</SelectItem>
                            <SelectItem value="hrs/day">{t("health.units.hoursPerDay")}</SelectItem>
                            <SelectItem value="/100">/100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lifestyle-date">{t("health.date")}</Label>
                        <Input id="lifestyle-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => alert(t("health.metricSaved"))}>
                        {t("health.saveMetric")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lifestyleMetrics.map((metric) => renderMetricBox(metric))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vitals Tab */}
        <TabsContent value="vitals">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("health.vitalsAnalysis")}</CardTitle>
              <CardDescription>{t("health.vitalsInsights")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4 border border-muted">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {t("health.areasOfConcern")}:
                      </h4>
                      <p className="text-sm">{t("health.bloodPressureConcern")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        {t("health.positiveTrends")}:
                      </h4>
                      <p className="text-sm">{t("health.heartRateImprovement")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-2 text-blue-600">
                        <Lightbulb className="h-4 w-4" />
                        {t("health.recommendations")}:
                      </h4>
                      <p className="text-sm">{t("health.medicationExerciseRecommendation")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.vitalSigns")}</CardTitle>
                <CardDescription>{t("health.vitalsTrends")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t("health.addValue")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("health.addVitalSign")}</DialogTitle>
                      <DialogDescription>{t("health.enterVitalDetails")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="vitals-metric">{t("health.metric")}</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Heart Rate">{t("health.metrics.heartRate")}</SelectItem>
                            <SelectItem value="Blood Pressure">{t("health.metrics.bloodPressure")}</SelectItem>
                            <SelectItem value="O₂ Saturation">{t("health.metrics.oxygenSaturation")}</SelectItem>
                            <SelectItem value="Respiratory Rate">{t("health.metrics.respiratoryRate")}</SelectItem>
                            <SelectItem value="Temperature">{t("health.metrics.temperature")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="vitals-value">{t("health.value")}</Label>
                        <Input id="vitals-value" type="number" step="0.1" placeholder="Enter value" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="vitals-unit">{t("health.unit")}</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bpm">bpm</SelectItem>
                            <SelectItem value="mmHg">mmHg</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                            <SelectItem value="breaths/min">{t("health.units.breathsPerMinute")}</SelectItem>
                            <SelectItem value="°F">°F</SelectItem>
                            <SelectItem value="°C">°C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="vitals-date">{t("health.date")}</Label>
                        <Input id="vitals-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => alert(t("health.vitalSignSaved"))}>
                        {t("health.saveVitalSign")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vitalsMetrics.map((metric) => renderMetricBox(metric))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Genetics Tab */}
        <TabsContent value="genetics">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.geneticAnalysis")}</CardTitle>
                <CardDescription>{t("health.geneticInsights")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                <PencilIcon className="h-3.5 w-3.5" />
                <span>{t("action.edit")}</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4 border border-muted mb-6">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-teal-600 mt-0.5" />
                  <p className="text-sm">{t("health.geneticSummary")}</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("health.healthRiskFactors")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("health.cardiovascularDisease")}</span>
                        <Badge variant="secondary">{t("health.elevatedRisk")}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("health.type2Diabetes")}</span>
                        <Badge variant="outline">{t("health.averageRisk")}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("health.hypertension")}</span>
                        <Badge variant="secondary">{t("health.elevatedRisk")}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("health.alzheimersDisease")}</span>
                        <Badge variant="outline">{t("health.averageRisk")}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("health.medicationResponse")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("health.statins")}</span>
                        <Badge variant="outline">{t("health.normalResponse")}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("health.betaBlockers")}</span>
                        <Badge variant="secondary">{t("health.reducedEfficacy")}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("health.metformin")}</span>
                        <Badge variant="outline">{t("health.normalResponse")}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("health.ssris")}</span>
                        <Badge variant="outline">{t("health.normalResponse")}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">{t("health.geneticReports")}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <Dna className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">{t("health.comprehensiveGeneticPanel")}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{t("health.dates.january152023")}</span>
                          <span>•</span>
                          <Stethoscope className="h-3 w-3" />
                          <span>GenomicHealth Labs</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <FileText className="mr-1 h-4 w-4" />
                      {t("health.view")}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <Dna className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">{t("health.pharmacogenomicAnalysis")}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{t("health.dates.january152023")}</span>
                          <span>•</span>
                          <Stethoscope className="h-3 w-3" />
                          <span>GenomicHealth Labs</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <FileText className="mr-1 h-4 w-4" />
                      {t("health.view")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
