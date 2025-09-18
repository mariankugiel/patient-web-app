"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"

interface HealthGoal {
  id: string
  name: string
  targetFigure: string
  deadline: string
  comments: string
}

interface HealthTask {
  id: string
  name: string
  frequency: string
  comments: string
}

interface HealthPlanData {
  goals: HealthGoal[]
  tasks: HealthTask[]
}

interface HealthPlanStepProps {
  formData: { healthPlan: HealthPlanData }
  updateFormData: (data: Partial<HealthPlanData>) => void
  language: Language
}

const frequencyOptions = [
  "Daily",
  "Weekly", 
  "Bi-weekly",
  "Monthly",
  "Quarterly",
  "As needed"
]

export function HealthPlanStep({ formData, updateFormData, language }: HealthPlanStepProps) {
  const t = getTranslation(language, "steps.healthPlan")

  // Health Goals functions
  const addHealthGoal = () => {
    const newGoal: HealthGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      targetFigure: "",
      deadline: "",
      comments: ""
    }
    updateFormData({
      goals: [...(formData.healthPlan?.goals || []), newGoal]
    })
  }

  const removeHealthGoal = (goalId: string) => {
    updateFormData({
      goals: (formData.healthPlan?.goals || []).filter(goal => goal.id !== goalId)
    })
  }

  const updateHealthGoal = (goalId: string, field: keyof HealthGoal, value: string) => {
    updateFormData({
      goals: (formData.healthPlan?.goals || []).map(goal => 
        goal.id === goalId ? { ...goal, [field]: value } : goal
      )
    })
  }

  // Health Tasks functions
  const addHealthTask = () => {
    const newTask: HealthTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      frequency: "",
      comments: ""
    }
    updateFormData({
      tasks: [...(formData.healthPlan?.tasks || []), newTask]
    })
  }

  const removeHealthTask = (taskId: string) => {
    updateFormData({
      tasks: (formData.healthPlan?.tasks || []).filter(task => task.id !== taskId)
    })
  }

  const updateHealthTask = (taskId: string, field: keyof HealthTask, value: string) => {
    updateFormData({
      tasks: (formData.healthPlan?.tasks || []).map(task => 
        task.id === taskId ? { ...task, [field]: value } : task
      )
    })
  }

  return (
    <div className="space-y-8">
      {/* Health Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Health Goals
            <span className="text-sm font-normal text-gray-500">
              ({(formData.healthPlan?.goals || []).length} goals)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.healthPlan?.goals || []).map((goal) => (
            <div key={goal.id} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`goalName-${goal.id}`}>Goal Name</Label>
                  <Input
                    id={`goalName-${goal.id}`}
                    value={goal.name}
                    onChange={(e) => updateHealthGoal(goal.id, 'name', e.target.value)}
                    placeholder="e.g., Lose weight, Lower blood pressure"
                  />
                </div>
                <div>
                  <Label htmlFor={`goalTarget-${goal.id}`}>Target Figure</Label>
                  <Input
                    id={`goalTarget-${goal.id}`}
                    value={goal.targetFigure}
                    onChange={(e) => updateHealthGoal(goal.id, 'targetFigure', e.target.value)}
                    placeholder="e.g., 10 lbs, 120/80 mmHg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`goalDeadline-${goal.id}`}>Deadline</Label>
                  <Input
                    id={`goalDeadline-${goal.id}`}
                    type="date"
                    value={goal.deadline}
                    onChange={(e) => updateHealthGoal(goal.id, 'deadline', e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeHealthGoal(goal.id)}
                    className="text-red-600 hover:text-red-700 w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Goal
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor={`goalComments-${goal.id}`}>Comments</Label>
                <Textarea
                  id={`goalComments-${goal.id}`}
                  value={goal.comments}
                  onChange={(e) => updateHealthGoal(goal.id, 'comments', e.target.value)}
                  placeholder="Additional notes about this goal"
                  rows={3}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addHealthGoal}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Health Goal
          </Button>
        </CardContent>
      </Card>

      {/* Health Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Health Tasks
            <span className="text-sm font-normal text-gray-500">
              ({(formData.healthPlan?.tasks || []).length} tasks)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.healthPlan?.tasks || []).map((task) => (
            <div key={task.id} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`taskName-${task.id}`}>Task Name</Label>
                  <Input
                    id={`taskName-${task.id}`}
                    value={task.name}
                    onChange={(e) => updateHealthTask(task.id, 'name', e.target.value)}
                    placeholder="e.g., Take medication, Exercise, Check blood sugar"
                  />
                </div>
                <div>
                  <Label htmlFor={`taskFrequency-${task.id}`}>Frequency</Label>
                  <Select
                    value={task.frequency}
                    onValueChange={(value) => updateHealthTask(task.id, 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((frequency) => (
                        <SelectItem key={frequency} value={frequency.toLowerCase().replace(' ', '-')}>
                          {frequency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor={`taskComments-${task.id}`}>Comments</Label>
                  <Textarea
                    id={`taskComments-${task.id}`}
                    value={task.comments}
                    onChange={(e) => updateHealthTask(task.id, 'comments', e.target.value)}
                    placeholder="Additional notes about this task"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeHealthTask(task.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Task
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addHealthTask}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Health Task
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}