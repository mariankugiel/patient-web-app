"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Plus, Target, CheckCircle, Edit, Trash2, Loader2 } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"
import AddHealthGoalDialog from "@/components/health-records/add-health-goal-dialog"
import AddHealthTaskDialog from "@/components/health-records/add-health-task-dialog"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { HealthPlanApiService } from "@/lib/api/health-plan-api"
import { HealthRecordsApiService, HealthRecordMetric } from "@/lib/api/health-records-api"
import { useToast } from "@/hooks/use-toast"

interface HealthPlanStepProps {
  language: Language
}

export function HealthPlanStep({ language }: HealthPlanStepProps) {
  const { toast } = useToast()
  
  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'Not specified'
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  // State for dialogs
  const [showHealthGoalDialog, setShowHealthGoalDialog] = useState(false)
  const [showHealthTaskDialog, setShowHealthTaskDialog] = useState(false)
  
  // State for editing
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  
  // State for delete confirmation
  const [deleteGoalDialogOpen, setDeleteGoalDialogOpen] = useState(false)
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  
  // State for checkboxes
  const [showHealthGoals, setShowHealthGoals] = useState(false)
  const [showHealthTasks, setShowHealthTasks] = useState(false)
  
  // State for data
  const [healthGoals, setHealthGoals] = useState<any[]>([])
  const [healthTasks, setHealthTasks] = useState<any[]>([])
  const [availableMetrics, setAvailableMetrics] = useState<HealthRecordMetric[]>([])
  
  // Loading states
  const [isLoadingGoals, setIsLoadingGoals] = useState(false)
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false)
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  
  const loadHealthGoals = useCallback(async () => {
    try {
      setIsLoadingGoals(true)
      const goals = await HealthPlanApiService.getHealthGoals()
      setHealthGoals(goals || [])
      
      // Auto-enable checkbox if there are existing goals
      if (goals && goals.length > 0) {
        setShowHealthGoals(true)
      }
    } catch (error) {
      console.error('Failed to load health goals:', error)
      setHealthGoals([])
    } finally {
      setIsLoadingGoals(false)
    }
  }, [])

  const loadHealthTasks = useCallback(async () => {
    try {
      setIsLoadingTasks(true)
      const tasks = await HealthPlanApiService.getHealthTasks()
      setHealthTasks(tasks || [])
      
      // Auto-enable checkbox if there are existing tasks
      if (tasks && tasks.length > 0) {
        setShowHealthTasks(true)
      }
    } catch (error) {
      console.error('Failed to load health tasks:', error)
      setHealthTasks([])
    } finally {
      setIsLoadingTasks(false)
    }
  }, [])

  const loadAvailableMetrics = useCallback(async () => {
    try {
      setIsLoadingMetrics(true)
      const metrics = await HealthRecordsApiService.getAllUserMetrics()
      setAvailableMetrics(metrics || [])
    } catch (error) {
      console.error('Failed to load available metrics:', error)
      setAvailableMetrics([])
    } finally {
      setIsLoadingMetrics(false)
    }
  }, [])

  const handleGoalSubmit = async (goalData: any) => {
    try {
      setIsSubmittingGoal(true)
      
      // Transform goalData to match API expectations
      const apiGoalData = {
        name: goalData.name,
        target: {
          operator: goalData.targetOperator,
          value: goalData.targetValue
        },
        start_date: goalData.startDate,
        end_date: goalData.endDate,
        metric_id: goalData.metric !== "none" ? parseInt(goalData.metric) : undefined
      }
      
      if (editingGoal) {
        // Update existing goal
        await HealthPlanApiService.updateHealthGoal(editingGoal.id, apiGoalData)
      } else {
        // Create new goal
        await HealthPlanApiService.createHealthGoal(apiGoalData)
      }
      await loadHealthGoals() // Refresh the list
      setShowHealthGoalDialog(false)
      setEditingGoal(null) // Clear editing state
    } catch (error) {
      console.error('Failed to save health goal:', error)
    } finally {
      setIsSubmittingGoal(false)
    }
  }

  const handleTaskSubmit = async (taskData: any) => {
    try {
      setIsSubmittingTask(true)
      
      // Transform taskData to match API expectations
      const selectedMetric = availableMetrics.find(m => m.id.toString() === taskData.metric)
      const targetUnit = selectedMetric?.default_unit || (taskData.frequency === "daily" ? "times" : "days")

      const apiTaskData = {
        name: taskData.name,
        goal_id: taskData.healthGoals.length > 0 ? parseInt(taskData.healthGoals[0]) : null,
        frequency: taskData.frequency,
        time_of_day: taskData.time, // Transform 'time' to 'time_of_day'
        target_operator: taskData.targetOperator,
        target_value: taskData.targetValue,
        target_unit: targetUnit,
        metric_id: taskData.metric !== "none" ? parseInt(taskData.metric) : undefined
      }
      
      if (editingTask) {
        // Update existing task
        await HealthPlanApiService.updateHealthTask(editingTask.id, apiTaskData)
      } else {
        // Create new task
        await HealthPlanApiService.createHealthTask(apiTaskData)
      }
      await loadHealthTasks() // Refresh the list
      setShowHealthTaskDialog(false)
      setEditingTask(null) // Clear editing state
    } catch (error) {
      console.error('Failed to save health task:', error)
    } finally {
      setIsSubmittingTask(false)
    }
  }

  const handleWantsHealthGoalsChange = (checked: boolean) => {
    setShowHealthGoals(checked)
  }

  const handleWantsHealthTasksChange = (checked: boolean) => {
    setShowHealthTasks(checked)
  }

  // Edit and delete handlers
  const handleEditGoal = (goal: any) => {
    // Map goal data to the format expected by the dialog
    const mappedGoal = {
      ...goal,
      originalTarget: {
        operator: goal.target?.operator || '',
        value: goal.target?.value || '',
        unit: goal.target?.unit || ''
      },
      originalStartDate: goal.start_date,
      originalEndDate: goal.end_date,
      metric_id: goal.metric_id
    }
    setEditingGoal(mappedGoal)
    setShowHealthGoalDialog(true)
  }

  const handleDeleteGoal = (goal: any) => {
    setItemToDelete(goal)
    setDeleteGoalDialogOpen(true)
  }

  const confirmDeleteGoal = async () => {
    if (!itemToDelete) return
    try {
      await HealthPlanApiService.deleteHealthGoal(itemToDelete.id)
      await loadHealthGoals() // Refresh the list
      
      // Show success notification
      toast({
        title: "Success",
        description: "Health goal deleted successfully",
        variant: "default",
      })
    } catch (error) {
      console.error('Failed to delete health goal:', error)
      toast({
        title: "Error",
        description: "Failed to delete health goal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteGoalDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const handleEditTask = (task: any) => {
    // Map task data to the format expected by the dialog
    const mappedTask = {
      ...task,
      originalHealthGoals: task.goal_id ? [task.goal_id.toString()] : [],
      originalMetricId: task.metric_id,
      originalFrequency: task.frequency,
      originalTimeOfDay: task.time_of_day,
      originalTargetOperator: task.target_operator,
      originalTargetValue: task.target_value,
      originalTargetUnit: task.target_unit,
      originalTargetDays: task.target_days
    }
    setEditingTask(mappedTask)
    setShowHealthTaskDialog(true)
  }

  const handleDeleteTask = (task: any) => {
    setItemToDelete(task)
    setDeleteTaskDialogOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!itemToDelete) return
    try {
      await HealthPlanApiService.deleteHealthTask(itemToDelete.id)
      await loadHealthTasks() // Refresh the list
      
      // Show success notification
      toast({
        title: "Success",
        description: "Health task deleted successfully",
        variant: "default",
      })
    } catch (error) {
      console.error('Failed to delete health task:', error)
      toast({
        title: "Error",
        description: "Failed to delete health task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteTaskDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadHealthGoals()
    loadHealthTasks()
    loadAvailableMetrics()
  }, [loadHealthGoals, loadHealthTasks, loadAvailableMetrics])

  return (
    <div className="space-y-8">
      {/* Health Goals Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Health Goals
              <Badge variant="secondary">
                {healthGoals.length} goals
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wantsHealthGoals"
                checked={showHealthGoals}
                onCheckedChange={handleWantsHealthGoalsChange}
              />
              <Label htmlFor="wantsHealthGoals">Set health goals?</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showHealthGoals ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">My Health Goals</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowHealthGoalDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </div>

              {isLoadingGoals ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading health goals...</span>
                </div>
              ) : healthGoals.length > 0 ? (
                <div className="space-y-3">
                  {healthGoals.map((goal) => (
                    <div key={goal.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{goal.name}</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Target:</span> {goal.target?.operator || 'Not set'} {goal.target?.value || 'Not set'} {goal.target?.unit || ''}
                            </div>
                            <div>
                              <span className="font-medium">Period:</span> {formatDateRange(goal.start_date, goal.end_date)}
                            </div>
                            {goal.metric && (
                              <div>
                                <span className="font-medium">Metric:</span> {typeof goal.metric === 'string' ? goal.metric : goal.metric.display_name || goal.metric.name || 'Unknown'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteGoal(goal)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No health goals added yet</p>
                  <p className="text-sm">Click "Add Goal" to get started</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Health goals are optional</p>
              <p className="text-sm">Check the box above to set your health goals</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Health Tasks
              <Badge variant="secondary">
                {healthTasks.length} tasks
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wantsHealthTasks"
                checked={showHealthTasks}
                onCheckedChange={handleWantsHealthTasksChange}
              />
              <Label htmlFor="wantsHealthTasks">Set health tasks?</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showHealthTasks ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">My Health Tasks</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowHealthTaskDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {isLoadingTasks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading health tasks...</span>
                </div>
              ) : healthTasks.length > 0 ? (
                <div className="space-y-3">
                  {healthTasks.map((task) => (
                    <div key={task.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{task.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {task.frequency}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {task.time_of_day || task.time || 'Not specified'}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            {/* Target Information */}
                            {task.target_operator && task.target_value && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Target:</span>
                                <Badge variant="outline" className="text-xs">
                                  {task.target_operator} {task.target_value} {task.frequency === 'daily' ? 'times' : 'days'}
                                </Badge>
                              </div>
                            )}
                            {/* Metric Information */}
                            {task.metric && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Metric:</span>
                                <span className="text-blue-600">
                                  {typeof task.metric === 'string' ? task.metric : task.metric.display_name || task.metric.name || 'Unknown'}
                                </span>
                              </div>
                            )}
                            {/* Goal Information */}
                            {task.goal_id && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Linked Goal:</span>
                                <span className="text-green-600">Goal #{task.goal_id}</span>
                              </div>
                            )}
                            {/* Target Days for Weekly/Monthly */}
                            {task.target_days && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Target Days:</span>
                                <span className="text-purple-600">{task.target_days} days</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteTask(task)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No health tasks added yet</p>
                  <p className="text-sm">Click "Add Task" to get started</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Health tasks are optional</p>
              <p className="text-sm">Check the box above to set your health tasks</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddHealthGoalDialog
        open={showHealthGoalDialog}
        onOpenChange={(open) => {
          setShowHealthGoalDialog(open)
          if (!open) {
            setEditingGoal(null)
          }
        }}
        onSubmit={handleGoalSubmit}
        isLoading={isSubmittingGoal}
        availableMetrics={availableMetrics}
        isLoadingMetrics={isLoadingMetrics}
        onLoadAvailableMetrics={loadAvailableMetrics}
        editingGoal={editingGoal}
      />

      <AddHealthTaskDialog
        open={showHealthTaskDialog}
        onOpenChange={(open) => {
          setShowHealthTaskDialog(open)
          if (!open) {
            setEditingTask(null)
          }
        }}
        onSubmit={handleTaskSubmit}
        isLoading={isSubmittingTask}
        healthGoals={healthGoals}
        availableMetrics={availableMetrics}
        isLoadingGoals={isLoadingGoals}
        isLoadingMetrics={isLoadingMetrics}
        onLoadHealthGoals={loadHealthGoals}
        onLoadAvailableMetrics={loadAvailableMetrics}
        editingTask={editingTask}
      />

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialog
        open={deleteGoalDialogOpen}
        onOpenChange={setDeleteGoalDialogOpen}
        onConfirm={confirmDeleteGoal}
        title="Delete Health Goal"
        itemName={itemToDelete?.name}
      />

      <DeleteConfirmationDialog
        open={deleteTaskDialogOpen}
        onOpenChange={setDeleteTaskDialogOpen}
        onConfirm={confirmDeleteTask}
        title="Delete Health Task"
        itemName={itemToDelete?.name}
      />
    </div>
  )
}