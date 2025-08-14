"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  Brain,
  ThumbsUp,
  Lightbulb,
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronsUpDown,
  Check,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { HealthMetricsChart } from "@/components/patient/health-metrics-chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

export default function AnalysisPage() {
  const { t } = useLanguage()

  // New state for global new section dialog
  const [newSectionDialogOpen, setNewSectionDialogOpen] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")
  const [sectionExistsAlert, setSectionExistsAlert] = useState(false)

  // New state for add metric dialog (previously add value dialog)
  const [addMetricDialogOpen, setAddMetricDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState("")
  const [selectedMetric, setSelectedMetric] = useState("")
  const [metricValue, setMetricValue] = useState("")
  const [metricUnit, setMetricUnit] = useState("")
  const [metricDate, setMetricDate] = useState(new Date().toISOString().split("T")[0])
  const [normalRangeMin, setNormalRangeMin] = useState("")
  const [normalRangeMax, setNormalRangeMax] = useState("")

  // Add new state for comboboxes
  const [metricComboboxOpen, setMetricComboboxOpen] = useState(false)
  const [selectedMetricForValue, setSelectedMetricForValue] = useState("")

  // Add state for new section dialog combobox
  const [newSectionNameComboboxOpen, setNewSectionNameComboboxOpen] = useState(false)

  // State for managing sections - this will be updated when new sections are added
  const [analysisSections, setAnalysisSections] = useState([
    {
      name: "Blood Work",
      metrics: [
        {
          name: "White Blood Cells",
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
          name: "Red Blood Cells",
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
          name: "Hemoglobin",
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
      ],
    },
    {
      name: "Chemistry Panel",
      metrics: [
        {
          name: "Total Cholesterol",
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
          name: "LDL Cholesterol",
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
      ],
    },
    {
      name: "Hormones & Vitamins",
      metrics: [
        {
          name: "Glucose",
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
      ],
    },
  ])

  // Predefined section names for the combobox
  const predefinedSections = [
    "Blood Work",
    "Chemistry Panel",
    "Hormones & Vitamins",
    "Heart Health",
    "Kidney Function",
    "Liver Function",
    "Bone Health",
    "Immune System",
    "Metabolism",
    "Inflammation Markers",
    "Thyroid Function",
    "Cardiac Markers",
    "Tumor Markers",
    "Coagulation Studies",
    "Electrolytes",
    "Proteins",
    "Enzymes",
    "Lipid Profile",
    "Diabetes Markers",
    "Nutritional Status",
  ]

  // Predefined metric names with default units and thresholds for each section
  const predefinedMetrics = {
    "Blood Work": [
      { name: "White Blood Cells", unit: "K/uL", min: "4.5", max: "10.0" },
      { name: "Red Blood Cells", unit: "M/uL", min: "4.5", max: "5.5" },
      { name: "Hemoglobin", unit: "g/dL", min: "13.5", max: "17.5" },
      { name: "Hematocrit", unit: "%", min: "41", max: "50" },
      { name: "Platelets", unit: "K/uL", min: "150", max: "450" },
      { name: "Neutrophils", unit: "%", min: "50", max: "70" },
      { name: "Lymphocytes", unit: "%", min: "20", max: "40" },
      { name: "Monocytes", unit: "%", min: "2", max: "8" },
      { name: "Eosinophils", unit: "%", min: "1", max: "4" },
      { name: "Basophils", unit: "%", min: "0.5", max: "1" },
      { name: "MCV", unit: "fL", min: "80", max: "100" },
      { name: "MCH", unit: "pg", min: "27", max: "32" },
      { name: "MCHC", unit: "g/dL", min: "32", max: "36" },
      { name: "RDW", unit: "%", min: "11.5", max: "14.5" },
    ],
    "Chemistry Panel": [
      { name: "Total Cholesterol", unit: "mg/dL", min: "0", max: "200" },
      { name: "LDL Cholesterol", unit: "mg/dL", min: "0", max: "100" },
      { name: "HDL Cholesterol", unit: "mg/dL", min: "40", max: "999" },
      { name: "VLDL Cholesterol", unit: "mg/dL", min: "5", max: "40" },
      { name: "Triglycerides", unit: "mg/dL", min: "0", max: "150" },
      { name: "Creatinine", unit: "mg/dL", min: "0.7", max: "1.3" },
      { name: "BUN", unit: "mg/dL", min: "7", max: "20" },
      { name: "Albumin", unit: "g/dL", min: "3.5", max: "5.0" },
      { name: "Total Protein", unit: "g/dL", min: "6.0", max: "8.3" },
      { name: "Calcium", unit: "mg/dL", min: "8.5", max: "10.5" },
      { name: "Magnesium", unit: "mg/dL", min: "1.7", max: "2.2" },
      { name: "Phosphorus", unit: "mg/dL", min: "2.5", max: "4.5" },
      { name: "Potassium", unit: "mEq/L", min: "3.5", max: "5.0" },
      { name: "Sodium", unit: "mEq/L", min: "136", max: "145" },
      { name: "Chloride", unit: "mEq/L", min: "98", max: "107" },
      { name: "CO2", unit: "mEq/L", min: "22", max: "28" },
    ],
    "Hormones & Vitamins": [
      { name: "Glucose", unit: "mg/dL", min: "70", max: "99" },
      { name: "Insulin", unit: "uU/mL", min: "2.6", max: "24.9" },
      { name: "HbA1c", unit: "%", min: "0", max: "5.7" },
      { name: "C-Peptide", unit: "ng/mL", min: "1.1", max: "4.4" },
      { name: "TSH", unit: "mIU/L", min: "0.27", max: "4.2" },
      { name: "T3", unit: "pg/mL", min: "2.0", max: "4.4" },
      { name: "T4", unit: "ug/dL", min: "4.5", max: "12.0" },
      { name: "Cortisol", unit: "ug/dL", min: "6.2", max: "19.4" },
      { name: "Testosterone", unit: "ng/dL", min: "264", max: "916" },
      { name: "Estrogen", unit: "pg/mL", min: "15", max: "350" },
      { name: "Progesterone", unit: "ng/mL", min: "0.2", max: "25" },
      { name: "Vitamin D", unit: "ng/mL", min: "30", max: "100" },
      { name: "Vitamin B12", unit: "pg/mL", min: "200", max: "900" },
      { name: "Folate", unit: "ng/mL", min: "2.7", max: "17.0" },
      { name: "Iron", unit: "ug/dL", min: "60", max: "170" },
      { name: "Ferritin", unit: "ng/mL", min: "12", max: "300" },
    ],
    "Liver Function": [
      { name: "ALT", unit: "U/L", min: "7", max: "56" },
      { name: "AST", unit: "U/L", min: "10", max: "40" },
      { name: "Bilirubin Total", unit: "mg/dL", min: "0.3", max: "1.2" },
      { name: "Bilirubin Direct", unit: "mg/dL", min: "0.0", max: "0.3" },
      { name: "Alkaline Phosphatase", unit: "U/L", min: "44", max: "147" },
      { name: "GGT", unit: "U/L", min: "9", max: "48" },
      { name: "LDH", unit: "U/L", min: "122", max: "222" },
    ],
    "Kidney Function": [
      { name: "Creatinine", unit: "mg/dL", min: "0.7", max: "1.3" },
      { name: "BUN", unit: "mg/dL", min: "7", max: "20" },
      { name: "eGFR", unit: "mL/min/1.73m²", min: "90", max: "999" },
      { name: "BUN/Creatinine Ratio", unit: "ratio", min: "10", max: "20" },
      { name: "Uric Acid", unit: "mg/dL", min: "3.5", max: "7.2" },
      { name: "Microalbumin", unit: "mg/g", min: "0", max: "30" },
    ],
    "Heart Health": [
      { name: "Troponin I", unit: "ng/mL", min: "0", max: "0.04" },
      { name: "Troponin T", unit: "ng/mL", min: "0", max: "0.01" },
      { name: "CK-MB", unit: "ng/mL", min: "0", max: "6.3" },
      { name: "BNP", unit: "pg/mL", min: "0", max: "100" },
      { name: "NT-proBNP", unit: "pg/mL", min: "0", max: "125" },
      { name: "Homocysteine", unit: "umol/L", min: "0", max: "15" },
    ],
    "Inflammation Markers": [
      { name: "CRP", unit: "mg/L", min: "0", max: "3.0" },
      { name: "ESR", unit: "mm/hr", min: "0", max: "30" },
      { name: "Procalcitonin", unit: "ng/mL", min: "0", max: "0.25" },
      { name: "Interleukin-6", unit: "pg/mL", min: "0", max: "7" },
    ],
  }

  const renderTrendIcon = (status: string) => {
    if (status === "improving") {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (status === "declining" || status === "needs improvement") {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    } else {
      return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

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
      ],
    },
  ]

  // Check if section name already exists
  const checkSectionExists = (name: string) => {
    const allSections = analysisSections.map((section) => section.name.toLowerCase())
    return allSections.includes(name.toLowerCase())
  }

  // Handle new section name change
  const handleNewSectionNameChange = (value: string) => {
    setNewSectionName(value)
    setSectionExistsAlert(checkSectionExists(value))
  }

  // Handle new section creation
  const handleCreateNewSection = () => {
    if (!newSectionName) {
      alert("Please enter a section name")
      return
    }

    if (sectionExistsAlert) {
      alert("This section already exists. Please choose a different name.")
      return
    }

    // Create new section
    const newSection = {
      name: newSectionName,
      metrics: [],
    }

    setAnalysisSections([...analysisSections, newSection])
    alert(`New section "${newSectionName}" created successfully!`)

    // Reset form
    setNewSectionName("")
    setSectionExistsAlert(false)
    setNewSectionDialogOpen(false)
  }

  // Handle add metric for section (previously add value for category)
  const handleAddMetricForSection = (sectionName: string) => {
    setSelectedSection(sectionName)
    setAddMetricDialogOpen(true)
  }

  // Handle metric selection for add metric
  const handleMetricForValueChange = (value: string) => {
    setSelectedMetricForValue(value)

    // Find the selected metric and populate normal range if it exists
    const section = analysisSections.find((sec) => sec.name === selectedSection)
    const metric = section?.metrics.find((m) => m.name === value)

    if (metric) {
      // Extract min and max from reference range for existing metrics
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
    } else {
      // Auto-populate for predefined metrics
      const predefinedMetricsForSection = predefinedMetrics[selectedSection as keyof typeof predefinedMetrics]
      const predefinedMetric = predefinedMetricsForSection?.find((m) => m.name === value)

      if (predefinedMetric) {
        setMetricUnit(predefinedMetric.unit)
        setNormalRangeMin(predefinedMetric.min)
        setNormalRangeMax(predefinedMetric.max)
      }
    }
  }

  // Handle add metric submission
  const handleAddMetricSubmit = () => {
    if (!selectedMetricForValue || !metricValue || !metricUnit || !metricDate || !normalRangeMin || !normalRangeMax) {
      alert("Please fill in all required fields")
      return
    }

    // Find the section and add the new metric
    const sectionIndex = analysisSections.findIndex((sec) => sec.name === selectedSection)
    if (sectionIndex >= 0) {
      const updatedSections = [...analysisSections]
      const newMetric = {
        name: selectedMetricForValue,
        current: `${metricValue} ${metricUnit}`,
        reference: `${normalRangeMin}-${normalRangeMax} ${metricUnit}`,
        trend: "stable",
        change: "N/A",
        status: "normal",
        data: [
          {
            date: new Date(metricDate),
            value: Number.parseFloat(metricValue),
          },
        ],
      }

      // Check if metric already exists in this section
      const existingMetricIndex = updatedSections[sectionIndex].metrics.findIndex(
        (m) => m.name.toLowerCase() === selectedMetricForValue.toLowerCase(),
      )

      if (existingMetricIndex >= 0) {
        // Update existing metric with new data point
        updatedSections[sectionIndex].metrics[existingMetricIndex].current = `${metricValue} ${metricUnit}`
        updatedSections[sectionIndex].metrics[existingMetricIndex].data.push({
          date: new Date(metricDate),
          value: Number.parseFloat(metricValue),
        })
        alert(
          `Value added to existing metric: ${selectedMetricForValue} = ${metricValue} ${metricUnit} on ${metricDate}`,
        )
      } else {
        // Add new metric
        updatedSections[sectionIndex].metrics.push(newMetric)
        alert(`New metric created: ${selectedMetricForValue} = ${metricValue} ${metricUnit} on ${metricDate}`)
      }

      setAnalysisSections(updatedSections)
    }

    // Reset form
    setSelectedMetricForValue("")
    setMetricValue("")
    setMetricUnit("")
    setMetricDate(new Date().toISOString().split("T")[0])
    setNormalRangeMin("")
    setNormalRangeMax("")
    setAddMetricDialogOpen(false)
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <div className="grid gap-2">
                    <Label htmlFor="docDate">{t("health.date")}</Label>
                    <Input id="docDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="docType">{t("health.type")}</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Complete Blood Count">{t("health.documents.completeBloodCount")}</SelectItem>
                        <SelectItem value="Comprehensive Metabolic Panel">
                          {t("health.documents.comprehensiveMetabolicPanel")}
                        </SelectItem>
                        <SelectItem value="Lipid Panel">{t("health.documents.lipidPanel")}</SelectItem>
                        <SelectItem value="Hemoglobin A1C">{t("health.documents.hemoglobinA1C")}</SelectItem>
                        <SelectItem value="Other">{t("health.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="provider">{t("health.provider")}</Label>
                    <Input id="provider" type="text" defaultValue="Lab Corp" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="docFile">{t("health.file")}</Label>
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
              <Button variant="ghost" size="sm" className="w-full text-xs">
                {t("health.seeAllDocuments")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global New Section Button */}
      <div className="flex justify-end">
        <Dialog open={newSectionDialogOpen} onOpenChange={setNewSectionDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              New Section
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
              <DialogDescription>Add a new section to organize your health metrics</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-section-name">Section Name</Label>
                <Popover open={newSectionNameComboboxOpen} onOpenChange={setNewSectionNameComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={newSectionNameComboboxOpen}
                      className="justify-between bg-transparent"
                    >
                      {newSectionName || "Select or type custom name..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search sections or type custom name..."
                        value={newSectionName}
                        onValueChange={handleNewSectionNameChange}
                      />
                      <CommandList>
                        <CommandEmpty>No section found. Type to create custom.</CommandEmpty>
                        <CommandGroup>
                          {predefinedSections
                            .filter((section) => !checkSectionExists(section))
                            .map((sectionName) => (
                              <CommandItem
                                key={sectionName}
                                value={sectionName}
                                onSelect={(currentValue) => {
                                  setNewSectionName(currentValue)
                                  setSectionExistsAlert(false)
                                  setNewSectionNameComboboxOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newSectionName === sectionName ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {sectionName}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {sectionExistsAlert && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>This section already exists. Please choose a different name.</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewSectionDialogOpen(false)}>
                {t("action.cancel")}
              </Button>
              <Button onClick={handleCreateNewSection} disabled={sectionExistsAlert}>
                {t("action.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Accordion type="multiple" defaultValue={analysisSections.map((sec) => sec.name)}>
        {analysisSections.map((section, index) => (
          <AccordionItem key={index} value={section.name}>
            <AccordionTrigger className="text-lg">
              <div className="flex items-center justify-between w-full pr-4">
                <span>{section.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddMetricForSection(section.name)
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs">New Metric</span>
                </Button>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {section.metrics.map((metric, mIndex) => renderMetricBox(metric))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Add Metric Dialog (previously Add Value Dialog) */}
      <Dialog open={addMetricDialogOpen} onOpenChange={setAddMetricDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Metric - {selectedSection}</DialogTitle>
            <DialogDescription>Add a new metric or update an existing one in this section</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="metric-name">Metric Name</Label>
              <Popover open={metricComboboxOpen} onOpenChange={setMetricComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={metricComboboxOpen}
                    className="justify-between bg-transparent"
                  >
                    {selectedMetricForValue || "Select or type custom name..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search or type new metric..."
                      value={selectedMetricForValue}
                      onValueChange={setSelectedMetricForValue}
                    />
                    <CommandList>
                      <CommandEmpty>No metric found. Type to create new.</CommandEmpty>
                      <CommandGroup>
                        {/* Show existing metrics in this section */}
                        {analysisSections
                          .find((sec) => sec.name === selectedSection)
                          ?.metrics.map((metric) => (
                            <CommandItem
                              key={metric.name}
                              value={metric.name}
                              onSelect={(currentValue) => {
                                setSelectedMetricForValue(currentValue)
                                handleMetricForValueChange(currentValue)
                                setMetricComboboxOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedMetricForValue === metric.name ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {metric.name}
                            </CommandItem>
                          ))}
                        {/* Show only predefined metrics for this specific section */}
                        {predefinedMetrics[selectedSection as keyof typeof predefinedMetrics]
                          ?.filter(
                            (predefinedMetric) =>
                              !analysisSections
                                .find((sec) => sec.name === selectedSection)
                                ?.metrics.some((existingMetric) => existingMetric.name === predefinedMetric.name),
                          )
                          .map((predefinedMetric) => (
                            <CommandItem
                              key={predefinedMetric.name}
                              value={predefinedMetric.name}
                              onSelect={(currentValue) => {
                                setSelectedMetricForValue(currentValue)
                                handleMetricForValueChange(currentValue)
                                setMetricComboboxOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedMetricForValue === predefinedMetric.name ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {predefinedMetric.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="metric-value">Value</Label>
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
                <Label htmlFor="metric-unit">Unit</Label>
                <Input
                  id="metric-unit"
                  placeholder="e.g., mg/dL"
                  value={metricUnit}
                  onChange={(e) => setMetricUnit(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Normal Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min" value={normalRangeMin} onChange={(e) => setNormalRangeMin(e.target.value)} />
                <Input placeholder="Max" value={normalRangeMax} onChange={(e) => setNormalRangeMax(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="metric-date">Date</Label>
              <Input id="metric-date" type="date" value={metricDate} onChange={(e) => setMetricDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMetricDialogOpen(false)}>
              {t("action.cancel")}
            </Button>
            <Button onClick={handleAddMetricSubmit}>Add Metric</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
