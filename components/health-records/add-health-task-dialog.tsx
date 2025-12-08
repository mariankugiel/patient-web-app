"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { HealthRecordMetric } from "@/lib/api/health-records-api"
import { Tip } from "@/components/ui/tip"

interface AddHealthTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (taskData: {
    name: string
    healthGoals: string[]
    metric: string
    frequency: string
    time: string
    targetOperator: string
    targetValue: string
  }) => Promise<void>
  isLoading: boolean
  healthGoals: any[]
  availableMetrics: HealthRecordMetric[]
  isLoadingGoals: boolean
  isLoadingMetrics: boolean
  onLoadHealthGoals: () => Promise<void>
  onLoadAvailableMetrics: () => Promise<void>
  editingTask?: any
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
  onLoadAvailableMetrics,
  editingTask
}: AddHealthTaskDialogProps) {
  const { t } = useLanguage()
  
  const [taskForm, setTaskForm] = useState({
    name: "",
    healthGoals: [] as string[],
    metric: "none",
    frequency: "",
    time: "morning", // Default to morning
    targetOperator: "", // Target operator (below, above)
    targetValue: "", // Target value (e.g., "3")
  })
  
  const [taskFormErrors, setTaskFormErrors] = useState<{[key: string]: string}>({})

  // Populate form when editing
  // Load metrics when dialog opens (health goals are loaded by parent component)
  useEffect(() => {
    if (open) {
      if (availableMetrics.length === 0) {
        onLoadAvailableMetrics()
      }
      // Health goals are now loaded by the parent component, so we don't need to load them here
    }
  }, [open, availableMetrics.length, onLoadAvailableMetrics])

  useEffect(() => {
    if (editingTask) {
      console.log("Editing task data:", editingTask)
      setTaskForm({
        name: editingTask.name || "",
        healthGoals: editingTask.originalHealthGoals || [],
        metric: editingTask.originalMetricId?.toString() || "none",
        frequency: editingTask.originalFrequency || "",
        time: editingTask.originalTimeOfDay || "morning",
        targetOperator: editingTask.originalTargetOperator || "",
        targetValue: editingTask.originalTargetValue?.toString() || "",
      })
    } else {
      // Reset form for new task
      setTaskForm({
        name: "",
        healthGoals: [],
        metric: "none",
        frequency: "",
        time: "morning",
        targetOperator: "",
        targetValue: "",
      })
    }
  }, [editingTask, open])

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
    // Metric is optional for onboarding
    // if (!taskForm.metric || taskForm.metric === "none") {
    //   errors.metric = t("healthPlan.metricRequired")
    // }
    if (!taskForm.frequency) {
      errors.frequency = t("healthPlan.frequencyRequired")
    }
    if (!taskForm.targetOperator.trim()) {
      errors.targetOperator = t("healthPlan.targetOperatorRequired")
    }
    if (!taskForm.targetValue.trim()) {
      errors.targetValue = t("healthPlan.targetValueRequired")
    } else if (isNaN(Number(taskForm.targetValue))) {
      errors.targetValue = t("healthPlan.targetValueInvalid")
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
      setTaskForm({ name: "", healthGoals: [], metric: "none", frequency: "", time: "morning", targetOperator: "", targetValue: "" })
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
                      {t('health.loadingGoals')}
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
                        {t('health.loadingGoals')}
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
                    {t('health.loadingMetrics')}
                  </div>
                ) : (
                  <SelectValue placeholder={t('health.selectMetricOptional')} />
                )}
              </SelectTrigger>
              <SelectContent>
                {isLoadingMetrics ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('health.loadingMetrics')}
                    </div>
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="none">{t('health.noMetric')}</SelectItem>
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
          
          {/* Frequency Field - moved above target field */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="task-frequency" className="text-right">
              <span className="text-red-500">*</span> {t("healthPlan.taskFrequency")}
            </Label>
            <Select
              value={taskForm.frequency}
              onValueChange={(value) => setTaskForm({ ...taskForm, frequency: value })}
            >
              <SelectTrigger className={`col-span-2 ${taskFormErrors.frequency ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {taskFormErrors.frequency && (
              <p className="col-span-2 text-sm text-red-500">{taskFormErrors.frequency}</p>
            )}
          </div>

       <div className="grid grid-cols-3 items-center gap-4">
         <div className="text-right flex items-center justify-end gap-2">
           <Tip content={
             taskForm.frequency === "daily" 
               ? "For Daily task:\n• Set how many times you want to complete this task each day\n• The total for the week will be calculated automatically (target × 7 days)"
               : "For Weekly/Monthly task:\n• Set how many days you want to complete this task within the period\n• This is the total number of days you need to complete"
           } />
           <Label htmlFor="task-target">
             <span className="text-red-500">*</span> {t("healthPlan.goalTarget")}
           </Label>
         </div>
            <div className="col-span-2 space-y-1">
              <div className={`grid ${getTargetGridClasses()} gap-2 items-center`}>
                {/* Target Operator Select */}
                <div className="flex items-center gap-2">
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
                    min="1"
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

                {/* Unit Display - based on frequency */}
                <div className="flex items-center h-10 px-2 text-sm text-muted-foreground whitespace-nowrap">
                  {taskForm.frequency === "daily" ? "times" : "days"}
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
                {editingTask ? "Updating..." : "Adding..."}
              </>
            ) : (
              editingTask ? t("healthPlan.updateTask") : t("healthPlan.addTask")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
