"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Trash2, CalendarIcon, Target, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { type Language, getTranslation } from "@/lib/translations"

interface HealthGoal {
  id: string
  goal: string
  targetDate: Date | undefined
}

interface HealthTask {
  id: string
  name: string
  frequency: string
  comments: string
}

interface HealthPlanStepProps {
  formData: {
    wantsHealthGoals: boolean
    healthGoals: HealthGoal[]
    healthTasks: HealthTask[]
  }
  updateFormData: (field: string, value: any) => void
  language: Language
  onValidationChange?: (isValid: boolean, errors: string[]) => void
}

export function HealthPlanStep({ formData, updateFormData, language, onValidationChange }: HealthPlanStepProps) {
  // Ensure we have default values to prevent undefined errors
  const safeFormData = {
    wantsHealthGoals: formData?.wantsHealthGoals || false,
    healthGoals: formData?.healthGoals || [],
    healthTasks: formData?.healthTasks || []
  }

  const [showHealthGoals, setShowHealthGoals] = useState(safeFormData.wantsHealthGoals)
  const [showHealthTasks, setShowHealthTasks] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Sync state when formData changes
  useEffect(() => {
    setShowHealthGoals(safeFormData.wantsHealthGoals)
  }, [safeFormData.wantsHealthGoals])

  // Validation logic
  const validateForm = () => {
    const errors: string[] = []
    
    if (showHealthGoals && safeFormData.healthGoals.length === 0) {
      errors.push("Please add at least one health goal or uncheck the 'Set health goals' option.")
    }
    
    if (showHealthTasks && safeFormData.healthTasks.length === 0) {
      errors.push("Please add at least one health task or uncheck the 'Set health tasks' option.")
    }

    const isValid = errors.length === 0
    setValidationErrors(errors)
    
    if (onValidationChange) {
      onValidationChange(isValid, errors)
    }
    
    return { isValid, errors }
  }

  // Run validation whenever relevant data changes
  useEffect(() => {
    validateForm()
  }, [showHealthGoals, showHealthTasks, safeFormData.healthGoals.length, safeFormData.healthTasks.length])

  const handleWantsHealthGoalsChange = (checked: boolean) => {
    updateFormData("wantsHealthGoals", checked)
    setShowHealthGoals(checked)
  }

  const handleWantsHealthTasksChange = (checked: boolean) => {
    setShowHealthTasks(checked)
  }

  const addHealthGoal = () => {
    const newGoal = { id: `goal-${Date.now()}`, goal: "", targetDate: undefined }
    updateFormData("healthGoals", [...safeFormData.healthGoals, newGoal])
  }

  const updateHealthGoal = (index: number, field: string, value: any) => {
    const updatedGoals = [...safeFormData.healthGoals]
    updatedGoals[index] = { ...updatedGoals[index], [field]: value }
    updateFormData("healthGoals", updatedGoals)
  }

  const removeHealthGoal = (index: number) => {
    const updatedGoals = safeFormData.healthGoals.filter((_, i) => i !== index)
    updateFormData("healthGoals", updatedGoals)
  }

  const addHealthTask = () => {
    const newTask = { id: `task-${Date.now()}`, name: "", frequency: "", comments: "" }
    updateFormData("healthTasks", [...safeFormData.healthTasks, newTask])
  }

  const updateHealthTask = (index: number, field: string, value: any) => {
    const updatedTasks = [...safeFormData.healthTasks]
    updatedTasks[index] = { ...updatedTasks[index], [field]: value }
    updateFormData("healthTasks", updatedTasks)
  }

  const removeHealthTask = (index: number) => {
    const updatedTasks = safeFormData.healthTasks.filter((_, i) => i !== index)
    updateFormData("healthTasks", updatedTasks)
  }

  return (
    <div className="space-y-8">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-medium mb-2">Please complete the following:</h4>
          <ul className="text-red-700 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-red-500">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Health Goals Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Health Goals
              <Badge variant="secondary">
                {safeFormData.healthGoals.length} goals
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
                <Button type="button" variant="outline" size="sm" onClick={addHealthGoal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </div>

              {safeFormData.healthGoals.length > 0 ? (
                safeFormData.healthGoals.map((goal, index) => (
                <Card key={goal.id} className="border-2 border-gray-300">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Goal</Label>
                        <Input
                          value={goal.goal}
                          onChange={(e) => updateHealthGoal(index, "goal", e.target.value)}
                          placeholder="e.g., Lose weight, Exercise more"
                          className="border-2 border-gray-300"
                        />
                      </div>
                      <div>
                        <Label>Target Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !goal.targetDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {goal.targetDate ? format(goal.targetDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="center" side="bottom">
                            <Calendar
                              mode="single"
                              selected={goal.targetDate}
                              onSelect={(date) => updateHealthGoal(index, "targetDate", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeHealthGoal(index)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </CardContent>
                </Card>
                ))
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
                {safeFormData.healthTasks.length} tasks
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
                <Button type="button" variant="outline" size="sm" onClick={addHealthTask}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {safeFormData.healthTasks.length > 0 ? (
                safeFormData.healthTasks.map((task, index) => (
                <Card key={task.id} className="border-2 border-gray-300">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Task Name</Label>
                        <Input
                          value={task.name}
                          onChange={(e) => updateHealthTask(index, "name", e.target.value)}
                          placeholder="e.g., Take medication, Exercise"
                          className="border-2 border-gray-300"
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={task.frequency}
                          onValueChange={(value) => updateHealthTask(index, "frequency", value)}
                        >
                          <SelectTrigger className="border-2 border-gray-300">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="as-needed">As Needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <Label>Comments</Label>
                      <Textarea
                        value={task.comments}
                        onChange={(e) => updateHealthTask(index, "comments", e.target.value)}
                        placeholder="Additional notes"
                        className="border-2 border-gray-300"
                      />
                    </div>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeHealthTask(index)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </CardContent>
                </Card>
                ))
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
    </div>
  )
}