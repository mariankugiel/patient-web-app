"use client"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  AlertCircle,
  CheckCircle,
  Brain,
  ThumbsUp,
  Lightbulb,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { HealthMetricsChart } from "@/components/patient/health-metrics-chart"
import { cn } from "@/lib/utils"

export default function VitalsPage() {
  const { t } = useLanguage()
  const [openMetricCombobox, setOpenMetricCombobox] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState("")
  const [openSectionCombobox, setOpenSectionCombobox] = useState(false)
  const [selectedSection, setSelectedSection] = useState("")
  const [currentSection, setCurrentSection] = useState("")
  const [unit, setUnit] = useState("")
  const [minThreshold, setMinThreshold] = useState("")
  const [maxThreshold, setMaxThreshold] = useState("")
  const [metricValue, setMetricValue] = useState("")
  const [metricDate, setMetricDate] = useState(new Date().toISOString().split("T")[0])

  // Predefined sections with their metrics
  const predefinedSections = {
    Cardiovascular: [
      { name: "Heart Rate", unit: "bpm", min: "60", max: "100" },
      { name: "Blood Pressure Systolic", unit: "mmHg", min: "90", max: "120" },
      { name: "Blood Pressure Diastolic", unit: "mmHg", min: "60", max: "80" },
      { name: "Pulse Pressure", unit: "mmHg", min: "30", max: "50" },
      { name: "Mean Arterial Pressure", unit: "mmHg", min: "70", max: "100" },
      { name: "Heart Rate Variability", unit: "ms", min: "20", max: "50" },
    ],
    Respiratory: [
      { name: "Respiratory Rate", unit: "breaths/min", min: "12", max: "20" },
      { name: "Oxygen Saturation", unit: "%", min: "95", max: "100" },
      { name: "Peak Flow", unit: "L/min", min: "400", max: "700" },
      { name: "Tidal Volume", unit: "mL", min: "400", max: "600" },
      { name: "Breath Hold Time", unit: "seconds", min: "30", max: "90" },
    ],
    Temperature: [
      { name: "Body Temperature", unit: "°F", min: "97.8", max: "99.1" },
      { name: "Core Temperature", unit: "°F", min: "98.0", max: "99.5" },
      { name: "Skin Temperature", unit: "°F", min: "89", max: "95" },
    ],
    Neurological: [
      { name: "Reaction Time", unit: "ms", min: "150", max: "300" },
      { name: "Balance Score", unit: "/10", min: "7", max: "10" },
      { name: "Cognitive Score", unit: "/100", min: "80", max: "100" },
      { name: "Reflex Response", unit: "ms", min: "10", max: "30" },
    ],
  }

  // Current sections data - now with multiple data points for tracking history
  const [sectionsData, setSectionsData] = useState({
    Cardiovascular: [
      {
        name: "Heart Rate",
        current: "68 bpm",
        reference: "60-100 bpm",
        trend: "improving",
        change: "-3 bpm",
        status: "normal",
        data: [
          { date: new Date("2022-11-15"), value: 74 },
          { date: new Date("2023-01-15"), value: 71 },
          { date: new Date("2023-04-15"), value: 68 },
          { date: new Date("2023-07-15"), value: 66 },
          { date: new Date("2023-10-15"), value: 65 },
        ],
      },
      {
        name: "Blood Pressure Systolic",
        current: "132 mmHg",
        reference: "90-120 mmHg",
        trend: "improving",
        change: "-13 mmHg",
        status: "abnormal",
        data: [
          { date: new Date("2022-11-15"), value: 150 },
          { date: new Date("2023-01-15"), value: 145 },
          { date: new Date("2023-04-15"), value: 132 },
          { date: new Date("2023-07-15"), value: 128 },
          { date: new Date("2023-10-15"), value: 125 },
        ],
      },
      {
        name: "Blood Pressure Diastolic",
        current: "85 mmHg",
        reference: "60-80 mmHg",
        trend: "improving",
        change: "-7 mmHg",
        status: "abnormal",
        data: [
          { date: new Date("2022-11-15"), value: 95 },
          { date: new Date("2023-01-15"), value: 92 },
          { date: new Date("2023-04-15"), value: 85 },
          { date: new Date("2023-07-15"), value: 82 },
          { date: new Date("2023-10-15"), value: 80 },
        ],
      },
    ],
    Respiratory: [
      {
        name: "Oxygen Saturation",
        current: "98%",
        reference: "95-100%",
        trend: "improving",
        change: "+1%",
        status: "normal",
        data: [
          { date: new Date("2022-11-15"), value: 96 },
          { date: new Date("2023-01-15"), value: 97 },
          { date: new Date("2023-04-15"), value: 98 },
          { date: new Date("2023-07-15"), value: 98 },
          { date: new Date("2023-10-15"), value: 99 },
        ],
      },
      {
        name: "Respiratory Rate",
        current: "14 breaths/min",
        reference: "12-20 breaths/min",
        trend: "stable",
        change: "0 breaths/min",
        status: "normal",
        data: [
          { date: new Date("2022-11-15"), value: 14 },
          { date: new Date("2023-01-15"), value: 14 },
          { date: new Date("2023-04-15"), value: 14 },
          { date: new Date("2023-07-15"), value: 15 },
          { date: new Date("2023-10-15"), value: 14 },
        ],
      },
    ],
    Temperature: [
      {
        name: "Body Temperature",
        current: "98.6°F",
        reference: "97.8-99.1°F",
        trend: "stable",
        change: "0°F",
        status: "normal",
        data: [
          { date: new Date("2022-11-15"), value: 98.6 },
          { date: new Date("2023-01-15"), value: 98.6 },
          { date: new Date("2023-04-15"), value: 98.6 },
          { date: new Date("2023-07-15"), value: 98.7 },
          { date: new Date("2023-10-15"), value: 98.5 },
        ],
      },
    ],
  })

  const renderTrendIcon = (status: string) => {
    if (status === "improving") {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (status === "declining" || status === "needs improvement") {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    } else {
      return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  // Get all available metrics for current section (don't filter out existing ones)
  const getAvailableMetrics = (sectionName: string) => {
    return predefinedSections[sectionName as keyof typeof predefinedSections] || []
  }

  // Handle metric selection
  const handleMetricSelect = (metricName: string, sectionName: string) => {
    setSelectedMetric(metricName)
    const sectionMetrics = predefinedSections[sectionName as keyof typeof predefinedSections] || []
    const metric = sectionMetrics.find((m) => m.name === metricName)
    if (metric) {
      setUnit(metric.unit)
      setMinThreshold(metric.min)
      setMaxThreshold(metric.max)
    }
    setOpenMetricCombobox(false)
  }

  // Handle section selection
  const handleSectionSelect = (sectionName: string) => {
    setSelectedSection(sectionName)
    setOpenSectionCombobox(false)
  }

  // Handle adding new metric data point
  const handleAddMetric = () => {
    if (!selectedMetric || !metricValue || !unit || !metricDate || !minThreshold || !maxThreshold) {
      alert("Please fill in all required fields")
      return
    }

    const newDataPoint = {
      date: new Date(metricDate),
      value: Number.parseFloat(metricValue),
    }

    setSectionsData((prevData) => {
      const updatedData = { ...prevData }
      const sectionData = updatedData[currentSection as keyof typeof updatedData] || []

      // Find existing metric or create new one
      const existingMetricIndex = sectionData.findIndex((m) => m.name === selectedMetric)

      if (existingMetricIndex >= 0) {
        // Add new data point to existing metric
        const updatedMetric = { ...sectionData[existingMetricIndex] }
        updatedMetric.data = [...updatedMetric.data, newDataPoint].sort((a, b) => a.date.getTime() - b.date.getTime())
        updatedMetric.current = `${metricValue} ${unit}`

        // Calculate trend (simple comparison with previous value)
        if (updatedMetric.data.length > 1) {
          const lastValue = updatedMetric.data[updatedMetric.data.length - 2].value
          const currentValue = Number.parseFloat(metricValue)
          const change = currentValue - lastValue
          updatedMetric.change = `${change > 0 ? "+" : ""}${change.toFixed(1)} ${unit}`
          updatedMetric.trend = change > 0 ? "improving" : change < 0 ? "declining" : "stable"
        }

        sectionData[existingMetricIndex] = updatedMetric
      } else {
        // Create new metric
        const newMetric = {
          name: selectedMetric,
          current: `${metricValue} ${unit}`,
          reference: `${minThreshold}-${maxThreshold} ${unit}`,
          trend: "stable",
          change: "New",
          status: "normal",
          data: [newDataPoint],
        }
        sectionData.push(newMetric)
      }

      updatedData[currentSection as keyof typeof updatedData] = sectionData
      return updatedData
    })

    alert(`Metric "${selectedMetric}" data point added successfully!`)

    // Reset form
    setSelectedMetric("")
    setMetricValue("")
    setUnit("")
    setMinThreshold("")
    setMaxThreshold("")
    setMetricDate(new Date().toISOString().split("T")[0])
  }

  // Render metric box
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

              <div className="flex justify-between items-center mt-1">
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
                <Badge variant="outline" className="text-xs">
                  {metric.data.length} entries
                </Badge>
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {metric.name} History ({metric.data.length} entries)
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
              <HealthMetricsChart
                data={metric.data.map((item: any) => ({
                  date: item.date,
                  value: item.value,
                }))}
                metricName={metric.name}
              />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Latest: {metric.data[metric.data.length - 1]?.value} on{" "}
                {metric.data[metric.data.length - 1]?.date.toLocaleDateString()}
              </p>
              <p>
                First: {metric.data[0]?.value} on {metric.data[0]?.date.toLocaleDateString()}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
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
                  <span>New Section</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Section</DialogTitle>
                  <DialogDescription>Create a new section for organizing your vital sign metrics.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="section-name">Section Name</Label>
                    <Popover open={openSectionCombobox} onOpenChange={setOpenSectionCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openSectionCombobox}
                          className="justify-between bg-transparent"
                        >
                          {selectedSection || "Select or type section name..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search or type section name..."
                            value={selectedSection}
                            onValueChange={setSelectedSection}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {selectedSection && (
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => handleSectionSelect(selectedSection)}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create "{selectedSection}"
                                  </Button>
                                </div>
                              )}
                            </CommandEmpty>
                            <CommandGroup heading="Predefined Sections">
                              {Object.keys(predefinedSections)
                                .filter((section) => !Object.keys(sectionsData).includes(section))
                                .map((section) => (
                                  <CommandItem
                                    key={section}
                                    value={section}
                                    onSelect={() => handleSectionSelect(section)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedSection === section ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    {section}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={() => {
                      if (selectedSection) {
                        alert(`Section "${selectedSection}" created successfully!`)
                        setSelectedSection("")
                      }
                    }}
                    disabled={!selectedSection}
                  >
                    Create Section
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-4">
            {Object.entries(sectionsData).map(([sectionName, metrics]) => (
              <AccordionItem key={sectionName} value={sectionName} className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-left">{sectionName}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {metrics.length} metrics
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 bg-transparent"
                            onClick={() => setCurrentSection(sectionName)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>New Metric</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Add New Metric to {sectionName}</DialogTitle>
                            <DialogDescription>
                              Add a new data point to track your {sectionName.toLowerCase()} metrics over time.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="metric-name">Metric Name</Label>
                              <Popover open={openMetricCombobox} onOpenChange={setOpenMetricCombobox}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openMetricCombobox}
                                    className="justify-between bg-transparent"
                                  >
                                    {selectedMetric || "Select metric..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                  <Command>
                                    <CommandInput placeholder="Search metrics..." />
                                    <CommandList>
                                      <CommandEmpty>No metrics found.</CommandEmpty>
                                      <CommandGroup>
                                        {getAvailableMetrics(currentSection).map((metric) => (
                                          <CommandItem
                                            key={metric.name}
                                            value={metric.name}
                                            onSelect={() => handleMetricSelect(metric.name, currentSection)}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedMetric === metric.name ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            {metric.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="metric-value">Value</Label>
                              <Input
                                id="metric-value"
                                type="number"
                                step="0.1"
                                placeholder="Enter value"
                                value={metricValue}
                                onChange={(e) => setMetricValue(e.target.value)}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="metric-unit">Unit</Label>
                              <Input
                                id="metric-unit"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                placeholder="Unit"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="min-threshold">Normal Range Min</Label>
                                <Input
                                  id="min-threshold"
                                  type="number"
                                  step="0.1"
                                  value={minThreshold}
                                  onChange={(e) => setMinThreshold(e.target.value)}
                                  placeholder="Min"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="max-threshold">Normal Range Max</Label>
                                <Input
                                  id="max-threshold"
                                  type="number"
                                  step="0.1"
                                  value={maxThreshold}
                                  onChange={(e) => setMaxThreshold(e.target.value)}
                                  placeholder="Max"
                                />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="metric-date">Date</Label>
                              <Input
                                id="metric-date"
                                type="date"
                                value={metricDate}
                                onChange={(e) => setMetricDate(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="submit"
                              onClick={handleAddMetric}
                              disabled={!selectedMetric || !metricValue || !unit}
                            >
                              Add Metric
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {metrics.map((metric) => renderMetricBox(metric))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
