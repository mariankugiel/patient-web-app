"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { HealthRecordMetric } from "@/lib/api/health-records-api"

interface AddHealthTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (taskData: {
    name: string
    healthGoals: string[]
    metric: string
    frequency: string
    time: string
    targetDays: number
    targetOperator: string
    targetValue: string
    targetUnit: string
  }) => Promise<void>
  isLoading: boolean
  healthGoals: any[]
  availableMetrics: HealthRecordMetric[]
  isLoadingGoals: boolean
  isLoadingMetrics: boolean
  onLoadHealthGoals: () => Promise<void>
  onLoadAvailableMetrics: () => Promise<void>
}

export default function AddHealthTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  healthGoals,
  availableMetrics,
  isLoadingGoals,
  isLoadingMetrics,
  onLoadHealthGoals,
  onLoadAvailableMetrics
}: AddHealthTaskDialogProps) {
  const { t } = useLanguage()
  
  const [taskForm, setTaskForm] = useState({
    name: "",
    healthGoals: [] as string[],
    metric: "none",
    frequency: "",
    time: "morning", // Default to morning
    targetDays: 1, // Add this field for weekly/monthly tasks
    targetOperator: "", // Target operator (below, above)
    targetValue: "", // Target value (e.g., "3")
    targetUnit: "", // Target unit (e.g., "times per week")
  })
  
  const [taskFormErrors, setTaskFormErrors] = useState<{[key: string]: string}>({})

  // Helper function to get grid column classes - operator select is smaller, value input is wider
  const getTargetGridClasses = () => {
    return "grid-cols-[auto_1fr_auto]"
  }

  // Validation function
  const validateTaskForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!taskForm.name.trim()) {
      errors.name = t("healthPlan.taskNameRequired")
    }
    if (!taskForm.metric || taskForm.metric === "none") {
      errors.metric = t("healthPlan.metricRequired")
    }
    if (!taskForm.frequency) {
      errors.frequency = t("healthPlan.frequencyRequired")
    }
    if ((taskForm.frequency === "weekly" || taskForm.frequency === "monthly") && !taskForm.targetDays) {
      errors.targetDays = t("healthPlan.targetDaysRequired")
    }
    if (!taskForm.targetOperator.trim()) {
      errors.targetOperator = t("healthPlan.targetOperatorRequired")
    }
    if (!taskForm.targetValue.trim()) {
      errors.targetValue = t("healthPlan.targetValueRequired")
    } else if (isNaN(Number(taskForm.targetValue))) {
      errors.targetValue = t("healthPlan.targetValueInvalid")
    }
    if (!taskForm.targetUnit.trim()) {
      errors.targetUnit = t("healthPlan.targetUnitRequired")
    }
    
    setTaskFormErrors(errors)
    return Object.keys(errors).length === 0 ? null : "Validation errors"
  }

  const handleSubmit = async () => {
    const validationError = validateTaskForm()
    if (validationError) {
      return // Errors are already set in state
    }
    
    await onSubmit(taskForm)
  }

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      // Reset form when dialog closes
      setTaskForm({ name: "", healthGoals: [], metric: "none", frequency: "", time: "morning", targetDays: 1, targetOperator: "", targetValue: "", targetUnit: "" })
      setTaskFormErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("healthPlan.addTask")}</DialogTitle>
          <DialogDescription>{t("healthPlan.addNewTask")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="task-name" className="text-right">
              <span className="text-red-500">*</span> {t("healthPlan.taskName")}
            </Label>
            <Input
              id="task-name"
              value={taskForm.name}
              onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
              className="col-span-2"
              placeholder="e.g., 30 min walk"
              required
            />
          </div>
          
          {/* Health Goals Row */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="task-health-goals" className="text-right">
              {t("healthPlan.taskHealthGoals")}
            </Label>
            <div className="col-span-2">
              <Select
                onOpenChange={async (open) => {
                  if (open && healthGoals.length === 0) {
                    // Load health goals only when dropdown opens and goals are not already loaded
                    await onLoadHealthGoals()
                  }
                }}
                onValueChange={(value) => {
                  if (value && value !== "loading") {
                    if (value === "none") {
                      // Clear all selected goals when "No linked goals" is selected
                      setTaskForm({ 
                        ...taskForm, 
                        healthGoals: [] 
                      })
                    } else if (!taskForm.healthGoals.includes(value)) {
                      // Add the selected goal to the array
                      setTaskForm({ 
                        ...taskForm, 
                        healthGoals: [...taskForm.healthGoals, value] 
                      })
                    }
                  }
                }}
              >
                <SelectTrigger className={taskFormErrors.metric ? "border-red-500" : ""}>
                  {isLoadingGoals ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading goals...
                    </div>
                  ) : (
                    <SelectValue placeholder={t("healthPlan.selectHealthGoalsOptional")} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {isLoadingGoals ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading goals...
                      </div>
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none">{t("healthPlan.noLinkedGoals")}</SelectItem>
                      {healthGoals.filter(goal => !taskForm.healthGoals.includes(goal.id)).map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {String(goal.name || "Unnamed Goal")}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>  
          </div>

          {/* Selected Health Goals Tags Row */}
          {taskForm.healthGoals.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div></div> {/* Empty space for label alignment */}
              <div className="col-span-2">
                <div className="flex flex-wrap gap-2">
                  {taskForm.healthGoals.map((goalId) => {
                    const goal = healthGoals.find(g => g.id === goalId)
                    return (
                      <div key={goalId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        <span>{goal ? String(goal.name || "Unnamed Goal") : goalId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskForm({ 
                              ...taskForm, 
                              healthGoals: taskForm.healthGoals.filter(id => id !== goalId) 
                            })
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="task-metric" className="text-right">
              <span className="text-red-500">*</span> {t("healthPlan.taskMetric")}
            </Label>
            <Select
              value={taskForm.metric}
              onOpenChange={async (open) => {
                if (open && availableMetrics.length === 0) {
                  // Load metrics only when dropdown opens and metrics are not already loaded
                  await onLoadAvailableMetrics()
                }
              }}
              onValueChange={(value) => {
                setTaskForm({ ...taskForm, metric: value })
                if (taskFormErrors.metric) {
                  setTaskFormErrors({ ...taskFormErrors, metric: "" })
                }
              }}
            >
              <SelectTrigger className={`col-span-2 ${taskFormErrors.metric ? "border-red-500" : ""}`}>
                {isLoadingMetrics ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading metrics...
                  </div>
                ) : (
                  <SelectValue placeholder="Select metric (optional)" />
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
                    <SelectItem value="none">No metric</SelectItem>
                    {availableMetrics.map((metric) => (
                      <SelectItem key={metric.id} value={metric.id.toString()}>
                        {metric.display_name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {taskFormErrors.metric && (
              <p className="col-span-2 text-sm text-red-500">{taskFormErrors.metric}</p>
            )}
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="task-target" className="text-right">
              <span className="text-red-500">*</span> {t("healthPlan.goalTarget")}
            </Label>
            <div className="col-span-2 space-y-1">
              <div className="grid grid-cols-2 gap-2 items-center">
                {/* Target Operator Select */}
                <div>
                  <Select
                    value={taskForm.targetOperator}
                    onValueChange={(value) => {
                      setTaskForm({ ...taskForm, targetOperator: value })
                      if (taskFormErrors.targetOperator) {
                        setTaskFormErrors({ ...taskFormErrors, targetOperator: "" })
                      }
                    }}
                  >
                    <SelectTrigger className={taskFormErrors.targetOperator ? "border-red-500" : ""}>
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
                    id="task-target-value"
                    type="number"
                    step="any"
                    value={taskForm.targetValue}
                    onChange={(e) => {
                      setTaskForm({ ...taskForm, targetValue: e.target.value })
                      if (taskFormErrors.targetValue) {
                        setTaskFormErrors({ ...taskFormErrors, targetValue: "" })
                      }
                    }}
                    className={taskFormErrors.targetValue ? "border-red-500" : ""}
                    placeholder="e.g., 3"
                  />
                </div>
              </div>
              {(taskFormErrors.targetOperator || taskFormErrors.targetValue) && (
                <div className="space-y-1">
                  {taskFormErrors.targetOperator && (
                    <p className="text-sm text-red-500">{taskFormErrors.targetOperator}</p>
                  )}
                  {taskFormErrors.targetValue && (
                    <p className="text-sm text-red-500">{taskFormErrors.targetValue}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Unit Input as separate row */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="task-target-unit" className="text-right">
              {t("healthPlan.goalUnit")}
            </Label>
            <div className="col-span-2">
              <Input
                id="task-target-unit"
                value={taskForm.targetUnit}
                onChange={(e) => {
                  setTaskForm({ ...taskForm, targetUnit: e.target.value })
                  if (taskFormErrors.targetUnit) {
                    setTaskFormErrors({ ...taskFormErrors, targetUnit: "" })
                  }
                }}
                className={taskFormErrors.targetUnit ? "border-red-500" : ""}
                placeholder="e.g., times per week"
              />
              {taskFormErrors.targetUnit && (
                <p className="text-sm text-red-500 mt-1">{taskFormErrors.targetUnit}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="task-frequency" className="text-right">
              <span className="text-red-500">*</span> {t("healthPlan.taskFrequency")}
            </Label>
            <Select
              value={taskForm.frequency}
              onValueChange={(value) => setTaskForm({ ...taskForm, frequency: value })}
            >
              <SelectTrigger className={`col-span-2 ${taskFormErrors.metric ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {taskFormErrors.metric && (
              <p className="col-span-2 text-sm text-red-500">{taskFormErrors.metric}</p>
            )}
          </div>
          
          {(taskForm.frequency === "weekly" || taskForm.frequency === "monthly") && (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="task-target-days" className="text-right">
                <span className="text-red-500">*</span> {t("healthPlan.taskTargetDays")}
            </Label>
            <Input
                id="task-target-days"
                type="number"
                min="1"
                max={taskForm.frequency === "weekly" ? "7" : "31"}
                value={taskForm.targetDays}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, targetDays: Number.parseInt(e.target.value) || 1 })
                }
                className="col-span-2"
                placeholder={
                  taskForm.frequency === "weekly" ? "Days per week (1-7)" : "Days per month (1-31)"
                }
                required
              />
            </div>
          )}
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="task-time" className="text-right">
              {t("healthPlan.taskTime")}
            </Label>
            <Select
              value={taskForm.time}
              onValueChange={(value) => setTaskForm({ ...taskForm, time: value })}
            >
              <SelectTrigger className={`col-span-2 ${taskFormErrors.metric ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">{t("dashboard.morning")}</SelectItem>
                <SelectItem value="afternoon">{t("dashboard.afternoon")}</SelectItem>
                <SelectItem value="evening">{t("dashboard.evening")}</SelectItem>
              </SelectContent>
            </Select>
            {taskFormErrors.metric && (
              <p className="col-span-2 text-sm text-red-500">{taskFormErrors.metric}</p>
            )}
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
              t("healthPlan.addTask")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
