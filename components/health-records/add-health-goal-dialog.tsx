"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { HealthRecordsApiService, HealthRecordMetric } from "@/lib/api/health-records-api"

interface AddHealthGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (goalData: {
    name: string
    targetOperator: string
    targetValue: string
    startDate: string
    endDate: string
    metric: string
  }) => Promise<void>
  isLoading: boolean
  availableMetrics: HealthRecordMetric[]
  isLoadingMetrics: boolean
  onLoadAvailableMetrics: () => Promise<void>
}

export default function AddHealthGoalDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  availableMetrics,
  isLoadingMetrics,
  onLoadAvailableMetrics
}: AddHealthGoalDialogProps) {
  const { t } = useLanguage()
  
  const [goalForm, setGoalForm] = useState({
    name: "",
    targetOperator: "",
    targetValue: "",
    startDate: "",
    endDate: "",
    metric: "none",
  })
  
  const [goalFormErrors, setGoalFormErrors] = useState<{[key: string]: string}>({})

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Helper function to get grid column classes - operator select is smaller, value input is wider
  const getTargetGridClasses = () => {
    return "grid-cols-[auto_1fr_auto]"
  }

  // Helper function to generate target from metric reference data
  const generateTargetFromMetric = (metricValue: string) => {
    if (metricValue === "none") return { operator: "", value: "" }
    
    const metric = availableMetrics.find(m => m.id.toString() === metricValue)
    if (!metric || !metric.reference_data) return { operator: "", value: "" }

    // Handle different reference data formats
    let refData = metric.reference_data.normal || metric.reference_data
    
    // If refData is a string, try to parse it
    if (typeof refData === 'string') {
      // Example: "70-99 mg/dL", "<25%", ">100"
      if (refData.includes('-')) {
        const [min, max] = refData.split('-').map(s => parseFloat(s.trim()))
        if (!isNaN(min) && !isNaN(max)) {
          refData = { min, max }
        }
      } else if (refData.startsWith('<')) {
        const value = parseFloat(refData.substring(1).trim())
        if (!isNaN(value)) {
          return { operator: "below", value: value.toString() }
        }
      } else if (refData.startsWith('>')) {
        const value = parseFloat(refData.substring(1).trim())
        if (!isNaN(value)) {
          return { operator: "above", value: value.toString() }
        }
      }
    }
    
    if (refData && typeof refData === 'object') {
      if (refData.min !== undefined && refData.max !== undefined) {
        // For range values, default to "below" with max value
        return { operator: "below", value: refData.max.toString() }
      } else if (refData.min !== undefined) {
        return { operator: "above", value: refData.min.toString() }
      } else if (refData.max !== undefined) {
        return { operator: "below", value: refData.max.toString() }
      }
    }
    
    return { operator: "", value: "" }
  }

  // Validation function
  const validateGoalForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!goalForm.name.trim()) {
      errors.name = t("healthPlan.goalNameRequired")
    }
    if (!goalForm.metric || goalForm.metric === "none") {
      errors.metric = t("healthPlan.metricRequired")
    }
    if (!goalForm.targetOperator.trim()) {
      errors.targetOperator = t("healthPlan.targetOperatorRequired")
    }
    if (!goalForm.targetValue.trim()) {
      errors.targetValue = t("healthPlan.targetValueRequired")
    } else if (isNaN(Number(goalForm.targetValue))) {
      errors.targetValue = t("healthPlan.targetValueInvalid")
    }
    if (!goalForm.startDate) {
      errors.startDate = t("healthPlan.startDateRequired")
    }
    if (!goalForm.endDate) {
      errors.endDate = t("healthPlan.endDateRequired")
    }
    // Check if end date is after start date
    if (goalForm.startDate && goalForm.endDate && new Date(goalForm.endDate) <= new Date(goalForm.startDate)) {
      errors.endDate = t("healthPlan.endDateMustBeAfterStartDate")
    }
    
    setGoalFormErrors(errors)
    return Object.keys(errors).length === 0 ? null : "Validation errors"
  }

  const handleSubmit = async () => {
    const validationError = validateGoalForm()
    if (validationError) {
      return // Errors are already set in state
    }
    
    await onSubmit(goalForm)
  }

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      // Reset form when dialog closes
      setGoalForm({ name: "", targetOperator: "", targetValue: "", startDate: getTodayDate(), endDate: "", metric: "none" })
      setGoalFormErrors({})
    }
  }

  // Set default start date when dialog opens
  useEffect(() => {
    if (open && !goalForm.startDate) {
      setGoalForm(prev => ({ ...prev, startDate: getTodayDate() }))
    }
  }, [open, goalForm.startDate])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("healthPlan.addNewGoal")}</DialogTitle>
          <DialogDescription>{t("healthPlan.createNewGoal")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="goal-name" className="text-right pt-2">
              <span className="text-red-500">*</span> {t("healthPlan.goalName")}
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="goal-name"
                value={goalForm.name}
                onChange={(e) => {
                  setGoalForm({ ...goalForm, name: e.target.value })
                  if (goalFormErrors.name) {
                    setGoalFormErrors({ ...goalFormErrors, name: "" })
                  }
                }}
                className={goalFormErrors.name ? "border-red-500" : ""}
                placeholder={t("healthPlan.goalNamePlaceholder")}
              />
              {goalFormErrors.name && (
                <p className="text-sm text-red-500">{goalFormErrors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="goal-metric" className="text-right pt-2">
              <span className="text-red-500">*</span> {t("healthPlan.goalMetric")}
            </Label>
            <div className="col-span-3 space-y-1">
              <Select
                value={goalForm.metric}
                onOpenChange={async (open) => {
                  if (open && availableMetrics.length === 0) {
                    await onLoadAvailableMetrics()
                  }
                }}
                onValueChange={(value) => {
                  setGoalForm({ ...goalForm, metric: value })
                  if (goalFormErrors.metric) {
                    setGoalFormErrors({ ...goalFormErrors, metric: "" })
                  }
                  
                  // Auto-populate target from metric reference data
                  const target = generateTargetFromMetric(value)
                  setGoalForm(prev => ({
                    ...prev,
                    targetOperator: target.operator,
                    targetValue: target.value
                  }))
                }}
              >
                <SelectTrigger className={goalFormErrors.metric ? "border-red-500" : ""}>
                  {isLoadingMetrics ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading metrics...
                    </div>
                  ) : (
                    <SelectValue placeholder={t("healthPlan.selectMetric")} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {isLoadingMetrics ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading metrics...
                      </div>
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none">{t("healthPlan.noMetric")}</SelectItem>
                      {availableMetrics.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id.toString()}>
                          {metric.display_name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              {goalFormErrors.metric && (
                <p className="text-sm text-red-500">{goalFormErrors.metric}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              <span className="text-red-500">*</span> {t("healthPlan.goalTarget")}
            </Label>
            <div className="col-span-3 space-y-1">
              <div className={`grid ${getTargetGridClasses()} gap-2 items-center`}>
                {/* Target Operator Select */}
                <div>
                  <Select
                    value={goalForm.targetOperator}
                    onValueChange={(value) => {
                      setGoalForm({ ...goalForm, targetOperator: value })
                      if (goalFormErrors.targetOperator) {
                        setGoalFormErrors({ ...goalFormErrors, targetOperator: "" })
                      }
                    }}
                  >
                    <SelectTrigger className={goalFormErrors.targetOperator ? "border-red-500" : ""}>
                      <SelectValue placeholder={t("healthPlan.selectTargetOperator")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below">{t("healthPlan.targetOperatorBelow")}</SelectItem>
                      <SelectItem value="above">{t("healthPlan.targetOperatorAbove")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Target Value Input */}
                <div>
                  <Input
                    id="goal-target-value"
                    type="number"
                    step="any"
                    value={goalForm.targetValue}
                    onChange={(e) => {
                      setGoalForm({ ...goalForm, targetValue: e.target.value })
                      if (goalFormErrors.targetValue) {
                        setGoalFormErrors({ ...goalFormErrors, targetValue: "" })
                      }
                    }}
                    className={goalFormErrors.targetValue ? "border-red-500" : ""}
                    placeholder="e.g., 100"
                  />
                </div>
                
                {/* Unit Display */}
                <div className="flex items-center px-2 text-sm text-muted-foreground whitespace-nowrap">
                  {goalForm.metric !== "none" ? (availableMetrics.find(m => m.id.toString() === goalForm.metric)?.default_unit || "") : ""}
                </div>
              </div>
              
              {(goalFormErrors.targetOperator || goalFormErrors.targetValue) && (
                <div className="space-y-1">
                  {goalFormErrors.targetOperator && (
                    <p className="text-sm text-red-500">{goalFormErrors.targetOperator}</p>
                  )}
                  {goalFormErrors.targetValue && (
                    <p className="text-sm text-red-500">{goalFormErrors.targetValue}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="goal-start-date" className="text-right pt-2">
              <span className="text-red-500">*</span> {t("healthPlan.goalStartDate")}
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="goal-start-date"
                type="date"
                value={goalForm.startDate}
                onChange={(e) => {
                  setGoalForm({ ...goalForm, startDate: e.target.value })
                  if (goalFormErrors.startDate) {
                    setGoalFormErrors({ ...goalFormErrors, startDate: "" })
                  }
                }}
                className={goalFormErrors.startDate ? "border-red-500" : ""}
              />
              {goalFormErrors.startDate && (
                <p className="text-sm text-red-500">{goalFormErrors.startDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="goal-end-date" className="text-right pt-2">
              <span className="text-red-500">*</span> {t("healthPlan.goalEndDate")}
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="goal-end-date"
                type="date"
                value={goalForm.endDate}
                onChange={(e) => {
                  setGoalForm({ ...goalForm, endDate: e.target.value })
                  if (goalFormErrors.endDate) {
                    setGoalFormErrors({ ...goalFormErrors, endDate: "" })
                  }
                }}
                className={goalFormErrors.endDate ? "border-red-500" : ""}
              />
              {goalFormErrors.endDate && (
                <p className="text-sm text-red-500">{goalFormErrors.endDate}</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              t("healthPlan.addNewGoal")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
