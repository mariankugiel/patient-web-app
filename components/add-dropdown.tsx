"use client"

import { useState } from "react"
import { Plus, FileText, Heart, ImageIcon, Dna, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

// Sample metrics data
const metrics = [
  { id: 1, name: "Blood Pressure", units: ["mmHg"], type: "blood-pressure" },
  { id: 2, name: "Blood Sugar", units: ["mg/dL", "mmol/L"], type: "standard" },
  { id: 3, name: "Cholesterol", units: ["mg/dL", "mmol/L"], type: "cholesterol" },
  { id: 4, name: "Heart Rate", units: ["bpm"], type: "standard" },
  { id: 5, name: "Weight", units: ["kg", "lb"], type: "standard" },
  { id: 6, name: "Temperature", units: ["°C", "°F"], type: "standard" },
  { id: 7, name: "Oxygen Saturation", units: ["%"], type: "standard" },
  { id: 8, name: "Workout", units: ["minutes"], type: "workout" },
  { id: 9, name: "Steps", units: ["steps"], type: "standard" },
  { id: 10, name: "Sleep", units: ["hours"], type: "standard" },
]

// Workout types
const workoutTypes = [
  "Running",
  "Walking",
  "Cycling",
  "Swimming",
  "Strength Training",
  "Yoga",
  "HIIT",
  "Pilates",
  "Elliptical",
  "Rowing",
  "Other",
]

// Cholesterol types
const cholesterolTypes = ["Total", "LDL", "HDL", "Total/HDL Ratio"]

export function AddDropdown() {
  const { t } = useLanguage()
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false)
  const [openValueDialog, setOpenValueDialog] = useState(false)
  const [documentType, setDocumentType] = useState("")
  const [selectedMetric, setSelectedMetric] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const [value, setValue] = useState("")
  const [systolic, setSystolic] = useState("")
  const [diastolic, setDiastolic] = useState("")
  const [cholesterolType, setCholesterolType] = useState("Total")
  const [workoutType, setWorkoutType] = useState("Running")
  const [workoutMinutes, setWorkoutMinutes] = useState("")
  const [heartRate, setHeartRate] = useState("")
  const [calories, setCalories] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [availableUnits, setAvailableUnits] = useState<string[]>([])
  const [providerName, setProviderName] = useState("")
  const [metricType, setMetricType] = useState("standard")

  const handleAddDocument = (type: string) => {
    setDocumentType(type)
    setOpenDocumentDialog(true)
  }

  const handleAddValue = () => {
    setOpenValueDialog(true)
  }

  const handleMetricChange = (metricName: string) => {
    setSelectedMetric(metricName)
    const metric = metrics.find((m) => m.name === metricName)
    if (metric) {
      setAvailableUnits(metric.units)
      setSelectedUnit(metric.units[0])
      setMetricType(metric.type)
    }
  }

  const handleDocumentSubmit = () => {
    // In a real app, this would submit the document to an API
    alert(`Document of type ${documentType} added successfully from provider ${providerName}!`)
    setOpenDocumentDialog(false)
    setDocumentType("")
    setProviderName("")
  }

  const handleValueSubmit = () => {
    // In a real app, this would submit the value to an API
    let message = ""

    if (metricType === "blood-pressure") {
      message = `Blood Pressure added: ${systolic}/${diastolic} mmHg on ${date ? format(date, "PPP") : "today"}`
    } else if (metricType === "cholesterol") {
      message = `${cholesterolType} Cholesterol added: ${value} ${selectedUnit} on ${date ? format(date, "PPP") : "today"}`
    } else if (metricType === "workout") {
      message = `Workout added: ${workoutType} for ${workoutMinutes} minutes with ${heartRate} bpm avg heart rate and ${calories} calories on ${date ? format(date, "PPP") : "today"}`
    } else {
      message = `${selectedMetric} added: ${value} ${selectedUnit} on ${date ? format(date, "PPP") : "today"}`
    }

    alert(message)
    setOpenValueDialog(false)
    resetForm()
  }

  const resetForm = () => {
    setSelectedMetric("")
    setSelectedUnit("")
    setValue("")
    setSystolic("")
    setDiastolic("")
    setCholesterolType("Total")
    setWorkoutType("Running")
    setWorkoutMinutes("")
    setHeartRate("")
    setCalories("")
    setDate(new Date())
    setMetricType("standard")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">{t("action.add")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleAddValue}>
            <LineChart className="mr-2 h-4 w-4" />
            <span>{t("dropdown.addValue")}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileText className="mr-2 h-4 w-4" />
              <span>{t("dropdown.addDocument")}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleAddDocument("Analysis")}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{t("dropdown.analysis")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddDocument("Cardio")}>
                  <Heart className="mr-2 h-4 w-4" />
                  <span>{t("dropdown.cardio")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddDocument("Images")}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>{t("dropdown.images")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddDocument("Genetics")}>
                  <Dna className="mr-2 h-4 w-4" />
                  <span>{t("dropdown.genetics")}</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Document Dialog */}
      <Dialog open={openDocumentDialog} onOpenChange={setOpenDocumentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {t("health.uploadDocument")} - {documentType}
            </DialogTitle>
            <DialogDescription>{t("health.uploadLabDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document-name" className="text-right">
                {t("health.metric")}
              </Label>
              <Input id="document-name" className="col-span-3" placeholder="Document name" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider-name" className="text-right">
                {t("health.provider")}
              </Label>
              <Input
                id="provider-name"
                className="col-span-3"
                placeholder="Healthcare provider name"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document-date" className="text-right">
                {t("health.date")}
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>{t("health.date")}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document-file" className="text-right">
                {t("health.file")}
              </Label>
              <Input id="document-file" type="file" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleDocumentSubmit}>
              {t("health.uploadDocument")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Value Dialog */}
      <Dialog open={openValueDialog} onOpenChange={setOpenValueDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("health.addValue")}</DialogTitle>
            <DialogDescription>{t("health.addMetric", { category: "" })}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="metric" className="text-right">
                {t("health.metric")}
              </Label>
              <div className="col-span-3">
                <Select onValueChange={handleMetricChange} value={selectedMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics.map((metric) => (
                      <SelectItem key={metric.id} value={metric.name}>
                        {metric.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Standard metric input */}
            {metricType === "standard" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                  {t("health.value")}
                </Label>
                <Input
                  id="value"
                  type="number"
                  className="col-span-3"
                  placeholder="Enter value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            )}

            {/* Blood Pressure specific inputs */}
            {metricType === "blood-pressure" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="systolic" className="text-right">
                    Systolic
                  </Label>
                  <Input
                    id="systolic"
                    type="number"
                    className="col-span-3"
                    placeholder="Systolic (top number)"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="diastolic" className="text-right">
                    Diastolic
                  </Label>
                  <Input
                    id="diastolic"
                    type="number"
                    className="col-span-3"
                    placeholder="Diastolic (bottom number)"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Cholesterol specific inputs */}
            {metricType === "cholesterol" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cholesterol-type" className="text-right">
                    Type
                  </Label>
                  <div className="col-span-3">
                    <Select onValueChange={setCholesterolType} value={cholesterolType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cholesterol type" />
                      </SelectTrigger>
                      <SelectContent>
                        {cholesterolTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cholesterol-value" className="text-right">
                    Value
                  </Label>
                  <Input
                    id="cholesterol-value"
                    type="number"
                    className="col-span-3"
                    placeholder="Enter value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Workout specific inputs */}
            {metricType === "workout" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="workout-type" className="text-right">
                    Type
                  </Label>
                  <div className="col-span-3">
                    <Select onValueChange={setWorkoutType} value={workoutType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workout type" />
                      </SelectTrigger>
                      <SelectContent>
                        {workoutTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="workout-minutes" className="text-right">
                    Minutes
                  </Label>
                  <Input
                    id="workout-minutes"
                    type="number"
                    className="col-span-3"
                    placeholder="Duration in minutes"
                    value={workoutMinutes}
                    onChange={(e) => setWorkoutMinutes(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="heart-rate" className="text-right">
                    Heart Rate
                  </Label>
                  <Input
                    id="heart-rate"
                    type="number"
                    className="col-span-3"
                    placeholder="Average heart rate (bpm)"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="calories" className="text-right">
                    Calories
                  </Label>
                  <Input
                    id="calories"
                    type="number"
                    className="col-span-3"
                    placeholder="Calories burned"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Unit selection for applicable metrics */}
            {(metricType === "standard" || metricType === "cholesterol") && availableUnits.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">
                  {t("health.unit")}
                </Label>
                <div className="col-span-3">
                  <Select onValueChange={setSelectedUnit} value={selectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Date picker for all metrics */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="metric-date" className="text-right">
                {t("health.date")}
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>{t("health.date")}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              onClick={handleValueSubmit}
              disabled={
                !selectedMetric ||
                (metricType === "standard" && !value) ||
                (metricType === "blood-pressure" && (!systolic || !diastolic)) ||
                (metricType === "cholesterol" && !value) ||
                (metricType === "workout" && (!workoutMinutes || !heartRate || !calories))
              }
            >
              {t("health.addValue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
