"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { usePathname, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Loader2,
  Plus,
  Trash2,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HealthRecordsApiService, HealthRecordMetric } from "@/lib/api/health-records-api"
import { HealthPlanApiService } from "@/lib/api/health-plan-api"
import AddHealthGoalDialog from "@/components/health-records/add-health-goal-dialog"
import AddHealthTaskDialog from "@/components/health-records/add-health-task-dialog"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { CircleDateButton } from "@/components/ui/circle-date-button"
import { TaskItem } from "@/components/health-records/task-item"

export default function HealthPlanClientPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  
  // Memoize active tab calculation
  const activeTab = useMemo(() => {
    if (pathname.includes('/goals')) return 'goals'
    if (pathname.includes('/tasks')) return 'tasks'
    return 'overview'
  }, [pathname])

  // Memoize tab navigation handler
  const handleTabChange = useCallback((tab: string) => {
    const routes = {
      overview: '/patient/health-plan/overview',
      goals: '/patient/health-plan/goals',
      tasks: '/patient/health-plan/tasks'
    }
    router.push(routes[tab as keyof typeof routes] || routes.overview)
  }, [router])

  // Dialog states
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // Delete confirmation states
  const [deleteGoalDialogOpen, setDeleteGoalDialogOpen] = useState(false)
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)

  // Loading states
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  const [isLoadingGoals, setIsLoadingGoals] = useState(false)
  const [goalsLoadError, setGoalsLoadError] = useState(false)

  // State for available metrics from health records
  const [availableMetrics, setAvailableMetrics] = useState<HealthRecordMetric[]>([])

  // State for health goals (to replace sample data)
  const [healthGoals, setHealthGoals] = useState<any[]>([])

  // State for health tasks (to replace template data)
  const [healthTasks, setHealthTasks] = useState<any[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [tasksLoadError, setTasksLoadError] = useState(false)
  const [isLoadingTaskCompletions, setIsLoadingTaskCompletions] = useState(false)

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Helper function to format date as "October 21, 2025"
  const formatDisplayDate = (dateString: string) => {
    if (!dateString || dateString === "Ongoing") return dateString

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Form states
  const [goalForm, setGoalForm] = useState({
    name: "",
    targetOperator: "",
    targetValue: "",
    startDate: getTodayDate(),
    endDate: "",
    metric: "none",
  })

  // Error states for form validation
  const [goalFormErrors, setGoalFormErrors] = useState<{ [key: string]: string }>({})

  // State for tracking completed days for each task
  const [taskCompletedDays, setTaskCompletedDays] = useState<{ [taskId: string]: boolean[] }>({})
  
  // State for daily task values (for number mode)
  const [dailyTaskValues, setDailyTaskValues] = useState<{ [taskId: string]: number[] }>({})
  

  // State for weekly tasks (tracking days of the week)
  const [weeklyTaskCompletedDays, setWeeklyTaskCompletedDays] = useState<{ [taskId: string]: boolean[] }>({})

  // State for monthly tasks (tracking days of the month)
  const [monthlyTaskCompletedDays, setMonthlyTaskCompletedDays] = useState<{ [taskId: string]: boolean[] }>({})

  // Initialize currentWeekStart to show the last 7 days (ending today)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 6) // Go back 6 days to show last 7 days ending today
    return weekStart
  })

  // Load available metrics from health records (only when dialog opens)
  const loadAvailableMetrics = useCallback(async () => {
    if (isLoadingMetrics) return // Prevent multiple simultaneous requests

    setIsLoadingMetrics(true)
    try {
      // Use the comprehensive API to get all user metrics
      const allMetrics = await HealthRecordsApiService.getAllUserMetrics()
      setAvailableMetrics(allMetrics)
    } catch (error) {
      console.error("Failed to load available metrics:", error)
      // Fallback to the previous method if the new API doesn't exist yet
      try {
        const sections = await HealthRecordsApiService.getSections()
        const allMetrics: HealthRecordMetric[] = []

        for (const section of sections) {
          try {
            const metrics = await HealthRecordsApiService.getMetrics(section.id)
            allMetrics.push(...metrics)
          } catch (error) {
            console.error(`Failed to load metrics for section ${section.id}:`, error)
          }
        }

        setAvailableMetrics(allMetrics)
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError)
      }
    } finally {
      setIsLoadingMetrics(false)
    }
  }, [isLoadingMetrics])

  // Filter tasks by frequency from real data
  const dailyTasks = healthTasks.filter(task => task.frequency === "daily")
  const weeklyTasks = healthTasks.filter(task => task.frequency === "weekly")
  const monthlyTasks = healthTasks.filter(task => task.frequency === "monthly")

  // Helper function to get week dates
  const getWeekDates = (startDate: Date) => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  // Helper function to format date
  const formatDate = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}`
  }

  // Helper function to get health goal names by IDs
  const getHealthGoalNames = (goalIds: string[]) => {
    return goalIds
      .map((id) => {
        const goal = healthGoals.find((g) => g.id === id)
        return goal ? String(goal.name || "Unnamed Goal") : ""
      })
      .filter(Boolean)
      .join(", ")
  }

  // Helper function to calculate completed and total for a task
  const getTaskStats = (taskId: string) => {
    // Find the task to get its frequency
    const task = healthTasks.find(t => t.id === taskId)
    
    if (task?.frequency === "daily") {
      // For daily tasks: use the sum of all daily values
      const dailyValues = dailyTaskValues[taskId] || [0, 0, 0, 0, 0, 0, 0]
      const completed = dailyValues.reduce((sum, value) => sum + value, 0)
      // For daily tasks, total should be target_value × 7 (weekly target)
      const targetValue = parseFloat(task.target_value || "0")
      const total = targetValue * 7
      return { completed, total }
    } else {
      // For weekly/monthly tasks: use boolean completion
      const completedDays = taskCompletedDays[taskId] || [false, false, false, false, false, false, false]
      const completed = completedDays.filter(Boolean).length
      
      let total = 7 // Default fallback
      if (task) {
        // For weekly/monthly tasks: target value is the number of days
        const targetValue = parseFloat(task.target_value || "0")
        total = Math.round(targetValue)
      }
      
      return { completed, total }
    }
  }

  // Helper function to calculate completed and total for weekly tasks
  const getWeeklyTaskStats = (taskId: string) => {
    const completedDays = weeklyTaskCompletedDays[taskId] || [false, false, false, false, false, false, false]
    const completed = completedDays.filter(Boolean).length
    const task = weeklyTasks.find((t) => t.id === taskId)
    
    let total = 7 // Default fallback
    if (task) {
      // For weekly tasks: target value is the number of days
      const targetValue = parseFloat(task.target_value || "0")
      total = Math.round(targetValue)
    }
    
    return { completed, total }
  }

  // Helper function to calculate completed and total for monthly tasks
  const getMonthlyTaskStats = (taskId: string) => {
    const completedDays = monthlyTaskCompletedDays[taskId] || [false, false, false, false, false, false, false]
    const completed = completedDays.filter(Boolean).length
    const task = monthlyTasks.find((t) => t.id === taskId)
    
    let total = 7 // Default fallback
    if (task) {
      // For monthly tasks: target value is the number of days
      const targetValue = parseFloat(task.target_value || "0")
      total = Math.round(targetValue)
    }
    
    return { completed, total }
  }

  // Helper function to toggle day completion
  const toggleDayCompletion = async (taskId: string, dayIndex: number, decrease = false) => {
    try {
      const weekDates = getWeekDates(currentWeekStart)
      const targetDate = weekDates[dayIndex]
      const dateString = targetDate.toISOString().split('T')[0]

      // Find the task to determine its frequency
      const task = healthTasks.find(t => t.id === taskId)
      const isDailyTask = task?.frequency === "daily"

      if (isDailyTask) {
        // For daily tasks, handle number mode
        const currentValue = dailyTaskValues[taskId]?.[dayIndex] || 0
        const targetValue = parseFloat(task?.target_value || "1")
        let newValue = currentValue

        if (decrease) {
          // Double click: decrease by 1 (minimum 0)
          newValue = Math.max(0, currentValue - 1)
        } else {
          // Single click: increase by 1 (no maximum limit for daily tasks)
          newValue = currentValue + 1
        }


        // Update local state immediately for UI responsiveness
        setDailyTaskValues((prev) => {
          const currentDays = prev[taskId] || [0, 0, 0, 0, 0, 0, 0]
          return {
            ...prev,
            [taskId]: currentDays.map((value, index) => (index === dayIndex ? newValue : value)),
          }
        })
        
        // Also update the boolean state for consistency
        setTaskCompletedDays((prev) => {
          const currentDays = prev[taskId] || [false, false, false, false, false, false, false]
          return {
            ...prev,
            [taskId]: currentDays.map((completed, index) => (index === dayIndex ? newValue > 0 : completed)),
          }
        })

        // Save to backend
        await HealthPlanApiService.createTaskCompletion(parseInt(taskId), {
          completion_date: dateString,
          completed: newValue > 0,
          progress_count: newValue
        })
      } else {
        // For weekly/monthly tasks, handle check mode
      const currentState = taskCompletedDays[taskId]?.[dayIndex] || false
      const newState = !currentState

      // Update local state immediately for UI responsiveness
      setTaskCompletedDays((prev) => {
        const currentDays = prev[taskId] || [false, false, false, false, false, false, false]
        return {
          ...prev,
          [taskId]: currentDays.map((completed, index) => (index === dayIndex ? newState : completed)),
        }
      })

      // Save to backend
      await HealthPlanApiService.createTaskCompletion(parseInt(taskId), {
        completion_date: dateString,
        completed: newState
      })
      }
    } catch (error) {
      console.error("Failed to update task completion:", error)
      // Revert local state on error
      setTaskCompletedDays((prev) => {
        const currentDays = prev[taskId] || [false, false, false, false, false, false, false]
        return {
          ...prev,
          [taskId]: currentDays.map((completed, index) => (index === dayIndex ? !currentDays[dayIndex] : completed)),
        }
      })
    }
  }

  // Helper function to toggle weekly task day completion
  const toggleWeeklyDayCompletion = async (taskId: string, dayIndex: number) => {
    try {
      const weekDates = getWeekDates(currentWeekStart)
      const targetDate = weekDates[dayIndex]
      const dateString = targetDate.toISOString().split('T')[0]

      const currentState = weeklyTaskCompletedDays[taskId]?.[dayIndex] || false
      const newState = !currentState

      // Update local state immediately for UI responsiveness
      setWeeklyTaskCompletedDays((prev) => {
        const currentDays = prev[taskId] || [false, false, false, false, false, false, false]
        return {
          ...prev,
          [taskId]: currentDays.map((completed, index) => (index === dayIndex ? newState : completed)),
        }
      })

      // Save to backend
      await HealthPlanApiService.createTaskCompletion(parseInt(taskId), {
        completion_date: dateString,
        completed: newState
      })
    } catch (error) {
      console.error("Error toggling weekly task completion:", error)
      // Revert the state change on error
      setWeeklyTaskCompletedDays((prev) => {
        const currentDays = prev[taskId] || [false, false, false, false, false, false, false]
        return {
          ...prev,
          [taskId]: currentDays.map((completed, index) => (index === dayIndex ? !completed : completed)),
        }
      })
    }
  }

  // Helper function to toggle monthly task day completion
  const toggleMonthlyDayCompletion = async (taskId: string, dayIndex: number) => {
    try {
      const weekDates = getWeekDates(currentWeekStart)
      const targetDate = weekDates[dayIndex]
      const dateString = targetDate.toISOString().split('T')[0]

      const currentState = monthlyTaskCompletedDays[taskId]?.[dayIndex] || false
      const newState = !currentState

      // Update local state immediately for UI responsiveness
      setMonthlyTaskCompletedDays((prev) => {
        const currentDays = prev[taskId] || [false, false, false, false, false, false, false]
        return {
          ...prev,
          [taskId]: currentDays.map((completed, index) => (index === dayIndex ? newState : completed)),
        }
      })

      // Save to backend
      await HealthPlanApiService.createTaskCompletion(parseInt(taskId), {
        completion_date: dateString,
        completed: newState
      })
    } catch (error) {
      console.error("Error toggling monthly task completion:", error)
      // Revert the state change on error
      setMonthlyTaskCompletedDays((prev) => {
        const currentDays = prev[taskId] || [false, false, false, false, false, false, false]
        return {
          ...prev,
          [taskId]: currentDays.map((completed, index) => (index === dayIndex ? !completed : completed)),
        }
      })
    }
  }

  // Helper function to navigate weeks
  const navigateWeek = async (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(currentWeekStart.getDate() + (direction === "next" ? 7 : -7))
    setCurrentWeekStart(newDate)
    
    // Reload task completions for the new week
    if (healthTasks.length > 0) {
      await loadTaskCompletions(healthTasks)
    }
  }

  // Helper function to generate target operator and value from metric reference range
  const generateTargetFromMetric = (metricValue: string) => {
    if (metricValue === "none") return { operator: "", value: "" }

    const metric = availableMetrics.find(m => m.id.toString() === metricValue)
    if (!metric || !metric.reference_data) return { operator: "", value: "" }

    // Handle different reference data formats
    let refData = metric.reference_data.normal || metric.reference_data

    // If reference_data is a string, try to parse it
    if (typeof metric.reference_data === 'string') {
      const refStr = metric.reference_data
      if (refStr.includes('-')) {
        const [min, max] = refStr.split('-').map(s => parseFloat(s.trim()))
        if (!isNaN(min) && !isNaN(max)) {
          refData = { min, max }
        }
      } else if (refStr.includes('<')) {
        const max = parseFloat(refStr.replace(/[^\d.]/g, ''))
        if (!isNaN(max)) {
          refData = { max }
        }
      } else if (refStr.includes('>')) {
        const min = parseFloat(refStr.replace(/[^\d.]/g, ''))
        if (!isNaN(min)) {
          refData = { min }
        }
      }
    }

    if (refData && typeof refData === 'object') {
      if (refData.min !== undefined && refData.max !== undefined) {
        // For range values, default to "below" with max value (removed "equal" case)
        return { operator: "below", value: refData.max.toString() }
      } else if (refData.min !== undefined) {
        return { operator: "above", value: refData.min.toString() }
      } else if (refData.max !== undefined) {
        return { operator: "below", value: refData.max.toString() }
      }
    }

    return { operator: "", value: "" }
  }

  // Helper function to get the selected metric's unit
  const getSelectedMetricUnit = () => {
    if (goalForm.metric === "none") return ""
    const metric = availableMetrics.find(m => m.id.toString() === goalForm.metric)
    return metric?.default_unit || metric?.unit || ""
  }

  // Helper function to get grid column classes - operator select is smaller, value input is wider
  const getTargetGridClasses = () => {
    return "grid-cols-[auto_1fr_auto]"
  }

  // Helper function to get unit for a metric ID
  const getUnitForMetric = (metricId: number | null): string => {
    if (!metricId) return ""

    const metric = availableMetrics.find(m => m.id === metricId)
    return metric?.default_unit || metric?.unit || ""
  }

  // Helper function to format value with unit
  const formatValueWithUnit = (value: string, unit: string): string => {
    if (!value || value === t("health.noCurrentValue") || value === "No target set") {
      return value
    }

    if (!unit) return value

    // Handle target values like "Below 120" or "Above 100"
    if (value.toLowerCase().includes('below') || value.toLowerCase().includes('above')) {
      // Extract the number and add unit after it
      const match = value.match(/(.*?)(\d+(?:\.\d+)?)(.*)/)
      if (match) {
        const [, prefix, number, suffix] = match
        return `${prefix}${number}${unit}${suffix}`.trim()
      }
    }

    // For simple numeric values or current values
    return `${value} ${unit}`
  }




  // Comprehensive progress calculation system
  interface ProgressCalculationConfig {
    metricType: string
    targetOperator: 'below' | 'above' | 'equal' | 'between' | 'maintain'
    targetValue: number
    targetMin?: number // For 'between' operator
    targetMax?: number // For 'between' operator
    baselineValue?: number // Starting value when goal was created
    improvementDirection: 'increase' | 'decrease' | 'maintain' // What direction is considered improvement
  }

  const calculateProgress = (current: any, target: any, metricId?: number, baselineValue?: number): number => {
    // If no current value or target, return 0
    if (!current || !target || current === "No current value" || target === "No target set") {
      return 0
    }

    // Parse target value and operator
    let targetValue: number
    let targetOperator: 'below' | 'above' | 'equal' | 'between' | 'maintain' = 'equal'
    let targetMin: number | undefined
    let targetMax: number | undefined

    if (typeof target === 'object' && target.value !== undefined) {
      targetValue = parseFloat(target.value || 0)
      targetOperator = (target.operator?.toLowerCase() || 'equal') as any
      
      // Handle range targets (e.g., "between 120-140")
      if (targetOperator === 'between' && target.range) {
        const rangeMatch = target.range.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/)
        if (rangeMatch) {
          targetMin = parseFloat(rangeMatch[1])
          targetMax = parseFloat(rangeMatch[2])
        }
      }
    } else if (typeof target === 'string') {
      // Parse string targets like "Below 90kg", "Above 120", "120-140"
      const belowMatch = target.match(/below\s+(\d+(?:\.\d+)?)/i)
      const aboveMatch = target.match(/above\s+(\d+(?:\.\d+)?)/i)
      const betweenMatch = target.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/)
      const exactMatch = target.match(/(\d+(?:\.\d+)?)/)
      
      if (belowMatch) {
        targetOperator = 'below'
        targetValue = parseFloat(belowMatch[1])
      } else if (aboveMatch) {
        targetOperator = 'above'
        targetValue = parseFloat(aboveMatch[1])
      } else if (betweenMatch) {
        targetOperator = 'between'
        targetMin = parseFloat(betweenMatch[1])
        targetMax = parseFloat(betweenMatch[2])
        targetValue = (targetMin + targetMax) / 2 // Use midpoint for calculations
      } else if (exactMatch) {
        targetOperator = 'equal'
        targetValue = parseFloat(exactMatch[1])
      } else {
        return 0
      }
    } else {
      return 0
    }

    // Parse current value
    let currentValue: number
    if (typeof current === 'object' && current !== null) {
      currentValue = parseFloat(current.value || 0)
    } else if (typeof current === 'string') {
      const match = current.match(/\d+(?:\.\d+)?/)
      currentValue = match ? parseFloat(match[0]) : 0
    } else {
      currentValue = 0
    }

    if (targetValue === 0 && !targetMin && !targetMax) return 0

    // Determine improvement direction based on metric type and target operator
    const getImprovementDirection = (metricType: string, operator: string): 'increase' | 'decrease' | 'maintain' => {
      // Weight-related metrics: decrease is usually better
      if (['weight', 'body_weight', 'bmi'].includes(metricType.toLowerCase())) {
        return operator === 'below' ? 'decrease' : 'increase'
      }
      
      // Performance metrics: increase is usually better
      if (['steps', 'distance', 'duration', 'repetitions', 'sets', 'calories_burned'].includes(metricType.toLowerCase())) {
        return 'increase'
      }
      
      // Blood pressure: depends on the specific value
      if (['blood_pressure_systolic', 'blood_pressure_diastolic'].includes(metricType.toLowerCase())) {
        return operator === 'below' ? 'decrease' : 'increase'
      }
      
      // Heart rate: depends on context (resting vs max)
      if (['heart_rate', 'resting_heart_rate'].includes(metricType.toLowerCase())) {
        return operator === 'below' ? 'decrease' : 'increase'
      }
      
      // Default based on operator
      return operator === 'below' ? 'decrease' : operator === 'above' ? 'increase' : 'maintain'
    }

    const improvementDirection = getImprovementDirection(
      metricId?.toString() || 'unknown', 
      targetOperator
    )

    // Calculate progress based on target type and improvement direction
    switch (targetOperator) {
      case 'below':
        // Progress is better when current is lower than target
        if (currentValue <= targetValue) {
          // Goal achieved or exceeded
          return 100
        } else {
          // Calculate progress based on how much we've moved toward the target
          const baseline = baselineValue || (currentValue + targetValue) // Estimate baseline if not provided
          const totalDistance = Math.abs(baseline - targetValue)
          const currentDistance = Math.abs(currentValue - targetValue)
          const progress = Math.max(0, Math.min(100, (totalDistance - currentDistance) / totalDistance * 100))
          return Math.round(progress)
        }

      case 'above':
        // Progress is better when current is higher than target
        if (currentValue >= targetValue) {
          // Goal achieved or exceeded
          return 100
        } else {
          // Calculate progress based on how much we've moved toward the target
          const baseline = baselineValue || Math.max(0, currentValue - targetValue) // Estimate baseline if not provided
          const totalDistance = Math.abs(targetValue - baseline)
          const currentDistance = Math.abs(targetValue - currentValue)
          const progress = Math.max(0, Math.min(100, (totalDistance - currentDistance) / totalDistance * 100))
          return Math.round(progress)
        }

      case 'between':
        // Progress is better when current is within the target range
        if (targetMin !== undefined && targetMax !== undefined) {
          if (currentValue >= targetMin && currentValue <= targetMax) {
            // Within target range - 100% progress
            return 100
          } else {
            // Calculate progress based on distance from the nearest range boundary
            const distanceFromRange = Math.min(
              Math.abs(currentValue - targetMin),
              Math.abs(currentValue - targetMax)
            )
            const rangeSize = targetMax - targetMin
            const progress = Math.max(0, Math.min(95, (1 - distanceFromRange / (rangeSize * 2)) * 100))
            return Math.round(progress)
          }
        }
        return 0

      case 'maintain':
        // Progress is based on consistency within a small range
        const tolerance = targetValue * 0.05 // 5% tolerance
        if (Math.abs(currentValue - targetValue) <= tolerance) {
          return 100
        } else {
          const deviation = Math.abs(currentValue - targetValue)
          const progress = Math.max(0, Math.min(95, (1 - deviation / (tolerance * 2)) * 100))
          return Math.round(progress)
        }

      case 'equal':
      default:
        // Progress is better when current is closer to target
        if (currentValue === targetValue) {
          return 100
        } else {
          const baseline = baselineValue || (currentValue + targetValue) / 2
          const totalDistance = Math.abs(baseline - targetValue)
          const currentDistance = Math.abs(currentValue - targetValue)
          const progress = Math.max(0, Math.min(95, (totalDistance - currentDistance) / totalDistance * 100))
          return Math.round(progress)
        }
    }
  }

  // Helper function to safely convert current value to string with comprehensive handling
  const safeToString = (val: any): string => {
    if (val === null || val === undefined) return t("health.noCurrentValue")

    if (typeof val === 'string') return val
    if (typeof val === 'number') return val.toString()

    if (typeof val === 'object') {
      // Handle new structure: {value: number, status: string, recorded_at: string}
      if (val.value !== undefined && val.value !== null) {
        if (typeof val.value === 'number') {
          // Add unit if available from metric
          const value = val.value.toString()
          return value
        }
        return val.value.toString()
      }

      // If object is empty or malformed
      if (Object.keys(val).length === 0) return t("health.noCurrentValue")
      return t("health.noCurrentValue")
    }

    return String(val)
  }


  // Load health goals and tasks on component mount
  useEffect(() => {
    loadHealthGoals()
    loadHealthTasks()
    // Note: Metrics are loaded only when dialog opens for better performance
  }, [])

  // Refresh health goals when page becomes visible (to get latest current data)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh goals and tasks to get the latest current data when user returns to the page
        loadHealthGoals()
        loadHealthTasks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Reload task completions when week changes
  useEffect(() => {
    if (healthTasks.length > 0) {
      loadTaskCompletions(healthTasks)
    }
  }, [currentWeekStart, healthTasks])

  // Load health goals from API
  const loadHealthGoals = useCallback(async () => {
    setIsLoadingGoals(true)
    setGoalsLoadError(false)
    try {
      const goals = await HealthPlanApiService.getHealthGoals()
      // Map backend data to frontend format and calculate progress
      const mappedGoals = goals.map((goal: any) => {

        // Ensure target is always a string with proper capitalization and unit
        let targetString: string
        if (typeof goal.target === 'object' && goal.target !== null) {
          const operator = goal.target.operator || ''
          const value = goal.target.value || ''
          const unit = goal.target.unit || ''
          // Capitalize first letter of operator
          const capitalizedOperator = operator.charAt(0).toUpperCase() + operator.slice(1)
          const valueWithUnit = unit ? `${value} ${unit}` : value
          targetString = `${capitalizedOperator} ${valueWithUnit}`.trim() || "No target set"
        } else {
          targetString = goal.target ? String(goal.target) : "No target set"
        }

        // Ensure current is always a string
        const currentString = safeToString(goal.current)

        return {
          id: goal.id.toString(),
          name: String(goal.name || "Unnamed Goal"),
          target: targetString,
          current: currentString,
          progress: calculateProgress(goal.current, goal.target, goal.metric_id, goal.baseline_value), // Use original data for calculation
          startDate: String(goal.startDate || goal.start_date || ""),
          endDate: String(goal.endDate || goal.end_date || "Ongoing"),
          created_at: goal.created_at || goal.createdAt,
          metric_id: goal.metric_id,
          // Preserve original data for editing
          originalTarget: goal.target, // Keep original target object
          originalStartDate: goal.start_date, // Keep original start_date
          originalEndDate: goal.end_date, // Keep original end_date
        }
      })
      setHealthGoals(mappedGoals)
    } catch (error) {
      console.error("Failed to load health goals:", error)
      setGoalsLoadError(true)
      setHealthGoals([])
    } finally {
      setIsLoadingGoals(false)
    }
  }, [])

  const loadHealthTasks = async () => {
    setIsLoadingTasks(true)
    setTasksLoadError(false)
    try {
      const tasks = await HealthPlanApiService.getHealthTasks()
      
      
      // Map backend data to frontend format
      const mappedTasks = tasks.map((task: any) => {
        
        const mappedTask = {
        id: task.id.toString(),
        name: String(task.name || "Unnamed Task"),
        description: String(task.description || ""),
        frequency: String(task.frequency || "daily"),
        target_days: task.target_days || null,
        time_of_day: String(task.time_of_day || "morning"),
        goal_id: task.goal_id || null,
        metric_id: task.metric_id || null,
        created_at: task.created_at,
        // Add target data for UI display
        target_operator: task.target_operator,
        target_value: task.target_value,
        target_unit: task.target_unit,
        // Add metric name if available
        metric: task.metric ? task.metric.display_name || task.metric.name : "none",
        // Preserve original data for editing
        originalTargetOperator: task.target_operator,
        originalTargetValue: task.target_value,
        originalTargetUnit: task.target_unit,
        originalHealthGoals: task.health_goals,
        originalMetricId: task.metric_id,
        originalFrequency: task.frequency,
        originalTimeOfDay: task.time_of_day,
        originalTargetDays: task.target_days,
        }
        
        
        return mappedTask
      })
      setHealthTasks(mappedTasks)

      // Load task completion data for each task
      await loadTaskCompletions(mappedTasks)
    } catch (error) {
      console.error("Failed to load health tasks:", error)
      setTasksLoadError(true)
      setHealthTasks([])
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const loadTaskCompletions = async (tasks: any[]) => {
    setIsLoadingTaskCompletions(true)
    try {
      const weekDates = getWeekDates(currentWeekStart)
      const completions: { [taskId: string]: boolean[] } = {}
      const dailyValues: { [taskId: string]: number[] } = {}
      const weeklyCompletions: { [taskId: string]: boolean[] } = {}
      const monthlyCompletions: { [taskId: string]: boolean[] } = {}

      // Initialize all tasks with empty completion arrays
      tasks.forEach(task => {
        if (task.frequency === "daily") {
          completions[task.id] = [false, false, false, false, false, false, false]
          dailyValues[task.id] = [0, 0, 0, 0, 0, 0, 0]
        } else if (task.frequency === "weekly") {
          weeklyCompletions[task.id] = [false, false, false, false, false, false, false]
        } else if (task.frequency === "monthly") {
          monthlyCompletions[task.id] = [false, false, false, false, false, false, false]
        }
      })

      // Load completion data for each task
      for (const task of tasks) {
        try {
          const startDate = weekDates[0].toISOString().split('T')[0]
          const endDate = weekDates[6].toISOString().split('T')[0]
          
          const completionData = await HealthPlanApiService.getTaskCompletions(parseInt(task.id), startDate, endDate)

          // Map completion data to week days
          completionData.forEach((completion: any) => {
            const completionDate = new Date(completion.completion_date)
            // Use YYYY-MM-DD format for reliable comparison
            const completionDateStr = completionDate.toISOString().split('T')[0]
            
            const dayIndex = weekDates.findIndex(date => {
              const weekDateStr = date.toISOString().split('T')[0]
              return weekDateStr === completionDateStr
            })
            
            if (dayIndex >= 0 && dayIndex < 7) {
              if (task.frequency === "daily") {
                // For daily tasks, store the progress count and update boolean state
                dailyValues[task.id][dayIndex] = completion.progress_count || 0
                completions[task.id][dayIndex] = (completion.progress_count || 0) > 0
              } else if (task.frequency === "weekly") {
                // For weekly tasks, use boolean completion
                weeklyCompletions[task.id][dayIndex] = completion.completed || false
              } else if (task.frequency === "monthly") {
                // For monthly tasks, use boolean completion
                monthlyCompletions[task.id][dayIndex] = completion.completed || false
              }
            }
          })
        } catch (error) {
          console.error(`Failed to load completions for task ${task.id}:`, error)
        }
      }

      
      // Update all state variables
      setTaskCompletedDays(completions)
      setDailyTaskValues(dailyValues)
      setWeeklyTaskCompletedDays(weeklyCompletions)
      setMonthlyTaskCompletedDays(monthlyCompletions)
    } catch (error) {
      console.error("Failed to load task completions:", error)
    } finally {
      setIsLoadingTaskCompletions(false)
    }
  }

  // Handle task deletion
  const handleDeleteTask = (task: any) => {
    setItemToDelete(task)
    setDeleteTaskDialogOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!itemToDelete) return
    
    try {
      await HealthPlanApiService.deleteHealthTask(parseInt(itemToDelete.id))
      // Remove the task from the local state
      setHealthTasks(prev => prev.filter(task => task.id !== itemToDelete.id))
      // Remove task completion data
      setTaskCompletedDays(prev => {
        const newState = { ...prev }
        delete newState[itemToDelete.id]
        return newState
      })
      setWeeklyTaskCompletedDays(prev => {
        const newState = { ...prev }
        delete newState[itemToDelete.id]
        return newState
      })
      setMonthlyTaskCompletedDays(prev => {
        const newState = { ...prev }
        delete newState[itemToDelete.id]
        return newState
      })
      
      // Show success notification
      toast({
        title: t("common.success"),
        description: t("healthPlan.taskDeletedSuccessfully"),
        variant: "default",
      })
    } catch (error) {
      console.error("Failed to delete task:", error)
      // Show error notification
      toast({
        title: t("common.error"),
        description: t("common.errorDeletingTask"),
        variant: "destructive",
      })
    } finally {
      setDeleteTaskDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Handle form submissions
  const handleAddGoal = async (goalData: {
    name: string
    targetOperator: string
    targetValue: string
    startDate: string
    endDate: string
    metric: string
  }) => {
    setIsAddingGoal(true)
    try {
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

      await HealthPlanApiService.createHealthGoal(apiGoalData)

      // Close dialog
    setIsAddGoalOpen(false)

      // Reload goals to show the new one
      await loadHealthGoals()
    } catch (error) {
      console.error("Failed to add goal:", error)
      // Keep dialog open on error
    } finally {
      setIsAddingGoal(false)
    }
  }

  const handleAddTask = async (taskData: {
    name: string
    healthGoals: string[]
    metric: string
    frequency: string
    time: string
    targetOperator: string
    targetValue: string
  }) => {
    setIsAddingTask(true)
    try {
      // Get the selected metric to determine the target unit
      const selectedMetric = availableMetrics.find(m => m.id.toString() === taskData.metric)
      const targetUnit = selectedMetric?.default_unit || (taskData.frequency === "daily" ? "times" : "days")

      const apiTaskData = {
        name: taskData.name,
        goal_id: taskData.healthGoals.length > 0 ? parseInt(taskData.healthGoals[0]) : null,
        frequency: taskData.frequency,
        time_of_day: taskData.time,
        target_operator: taskData.targetOperator,
        target_value: taskData.targetValue,
        target_unit: targetUnit,
        metric_id: taskData.metric !== "none" ? parseInt(taskData.metric) : undefined
      }

      await HealthPlanApiService.createHealthTask(apiTaskData)

      // Close dialog
      setIsAddTaskOpen(false)

      // Reload tasks to show the new one
      await loadHealthTasks()
    } catch (error) {
      console.error("Failed to add task:", error)
      // Keep dialog open on error
    } finally {
      setIsAddingTask(false)
    }
  }

  const handleEdit = (item: any, type: string) => {
    console.log("Edit item data:", item)
    if (type === "goal") {
      setEditingItem({ ...item, type })
      setIsEditOpen(true)
    } else {
      // Map task data to the format expected by the dialog
      const mappedTask = {
        ...item,
        originalHealthGoals: item.goal_id ? [item.goal_id.toString()] : [],
        originalMetricId: item.metric_id,
        originalFrequency: item.frequency,
        originalTimeOfDay: item.time_of_day,
        originalTargetOperator: item.target_operator,
        originalTargetValue: item.target_value,
        originalTargetUnit: item.target_unit,
        originalTargetDays: item.target_days
      }
      setEditingItem({ ...mappedTask, type })
      setIsEditOpen(true)
    }
  }

  const handleEditGoal = async (goalData: any) => {
    if (!editingItem) return

    try {
      setIsEditingGoal(true)

        // Prepare goal data for update
      const updateData = {
        name: goalData.name,
        target: {
          operator: goalData.targetOperator,
          value: goalData.targetValue
        },
        start_date: goalData.startDate,
        end_date: goalData.endDate,
        metric_id: goalData.metric !== "none" ? parseInt(goalData.metric) : null
      }

      await HealthPlanApiService.updateHealthGoal(editingItem.id, updateData)
      
      // Refresh goals list
        await loadHealthGoals()

      // Close dialog and reset state
      setIsAddGoalOpen(false)
      setEditingItem(null)
      
        toast({
        title: t("healthPlan.goalUpdated"),
        description: t("healthPlan.goalUpdatedDescription")
      })
    } catch (error) {
      console.error('Failed to update health goal:', error)
      toast({
        title: t("healthPlan.error"),
        description: t("healthPlan.goalUpdateError")
      })
    } finally {
      setIsEditingGoal(false)
    }
  }

  const handleEditTask = async (taskData: any) => {
    if (!editingItem) return

    try {
      setIsAddingTask(true)
      
      // Get the selected metric to determine the target unit
      const selectedMetric = availableMetrics.find(m => m.id.toString() === taskData.metric)
      const targetUnit = selectedMetric?.default_unit || (taskData.frequency === "daily" ? "times" : "days")

      // Prepare task data for update
      const updateData = {
        name: taskData.name,
        goal_id: taskData.healthGoals.length > 0 ? parseInt(taskData.healthGoals[0]) : null,
        metric_id: taskData.metric !== "none" ? parseInt(taskData.metric) : null,
        frequency: taskData.frequency,
        time_of_day: taskData.time,
        target_operator: taskData.targetOperator,
        target_value: taskData.targetValue,
        target_unit: targetUnit
      }

      await HealthPlanApiService.updateHealthTask(editingItem.id, updateData)
      
      // Refresh tasks list
      await loadHealthTasks()
      
      // Close dialog and reset state
      setIsAddTaskOpen(false)
      setEditingItem(null)
      
      toast({
        title: t("healthPlan.taskUpdated"),
        description: t("healthPlan.taskUpdatedDescription")
      })
    } catch (error) {
      console.error('Failed to update health task:', error)
        toast({
        title: t("healthPlan.error"),
        description: t("healthPlan.taskUpdateError")
        })
      } finally {
      setIsAddingTask(false)
    }
  }


  const handleDeleteGoal = (goal: any) => {
    setItemToDelete(goal)
    setDeleteGoalDialogOpen(true)
  }

  const confirmDeleteGoal = async () => {
    if (!itemToDelete) return

    try {
      setIsEditingGoal(true)
      await HealthPlanApiService.deleteHealthGoal(parseInt(itemToDelete.id))

      // Reload goals to reflect the deletion
      await loadHealthGoals()

      toast({
        title: t("healthPlan.goalDeleted"),
        description: t("healthPlan.goalDeletedDescription")
      })
    } catch (error) {
      console.error('Failed to delete health goal:', error)
      toast({
        title: t("healthPlan.error"),
        description: t("healthPlan.goalDeleteError")
      })
    } finally {
      setIsEditingGoal(false)
      setDeleteGoalDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Get user data from Redux store
  const { user } = useSelector((state: RootState) => state.auth)
  const userName = user?.user_metadata?.full_name || "User"
  const firstName = userName.split(' ')[0] || "User"

  return (
    <div className="container py-6">

      <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("health.summary")}</TabsTrigger>
          <TabsTrigger value="goals">{t("nav.healthGoals")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("health.tasks")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Progress Ring Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("healthPlan.weeklyProgress")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-4">
                <div className="relative h-40 w-40">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    {/* Outer ring - Goals Progress (76%) */}
                    <circle
                      className="stroke-gray-200" 
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="8" 
                      fill="none" 
                    />
                    <circle
                      className="stroke-teal-500 transition-all duration-500 ease-in-out"
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="251.2"
                      strokeDashoffset="60.3"
                      transform="rotate(-90 50 50)"
                    />
                    
                    {/* Middle ring - Tasks Progress (84%) */}
                    <circle 
                      className="stroke-gray-200" 
                      cx="50" 
                      cy="50" 
                      r="32" 
                      strokeWidth="8" 
                      fill="none" 
                    />
                    <circle
                      className="stroke-blue-500 transition-all duration-500 ease-in-out"
                      cx="50"
                      cy="50"
                      r="32"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="201"
                      strokeDashoffset="32.2"
                      transform="rotate(-90 50 50)"
                    />
                    
                    {/* Inner ring - Daily Activities (92%) */}
                    <circle 
                      className="stroke-gray-200" 
                      cx="50" 
                      cy="50" 
                      r="24" 
                      strokeWidth="8" 
                      fill="none" 
                    />
                    <circle
                      className="stroke-purple-500 transition-all duration-500 ease-in-out"
                      cx="50"
                      cy="50"
                      r="24"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="150.8"
                      strokeDashoffset="12.1"
                      transform="rotate(-90 50 50)"
                    />
                    
                    {/* Center text */}
                  </svg>
                </div>
                <div className="mt-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("healthPlan.greatProgress")}! {t("healthPlan.weeklyProgressDescription")}
                  </p>
                  <div className="flex justify-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                      <span className="text-muted-foreground">Goals 76%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-muted-foreground">Tasks 84%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-muted-foreground">Daily 92%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Goals Card - Merged content */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("nav.healthGoals")}</CardTitle>
                    <CardDescription>{t("healthPlan.currentHealthGoals")}</CardDescription>
                  </div>
                  <div className="flex items-center">
                    <Target className="mr-2 h-4 w-4 text-muted-foreground" />
                    {isLoadingGoals ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : goalsLoadError ? (
                      <span className="text-lg font-bold text-muted-foreground">-</span>
                    ) : (
                    <span className="text-lg font-bold">{healthGoals.length}</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingGoals ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p>{t("health.loadingGoals")}</p>
                      </div>
                    </div>
                  ) : goalsLoadError ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="font-medium text-destructive">{t("health.failedToLoadGoals")}</p>
                      <p className="text-sm mt-1">{t("health.failedToLoadGoalsDesc")}</p>
                    </div>
                  ) : healthGoals.length > 0 ? (
                    healthGoals.slice(0, 3).map((goal) => {
                      const currentValue = goal.current === t("health.noCurrentValue") ? t("health.noCurrentValue") : String(goal.current || t("health.noCurrentValue"))
                      return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                              <p className="font-medium">{String(goal.name || "Unnamed Goal")}</p>
                          <p className="text-sm text-muted-foreground">
                                {t("dashboard.target")}: {goal.target || "No target set"} | {t("health.current")}: {formatValueWithUnit(currentValue, getUnitForMetric(goal.metric_id))}
                          </p>
                              {currentValue === t("health.noCurrentValue") && (
                                <p className="text-xs text-muted-foreground italic">
                                  {t("health.noCurrentValueDesc")}
                                </p>
                              )}
                        </div>
                            <Badge variant="outline">{Number(goal.progress || 0)}%</Badge>
                      </div>
                          <Progress value={Number(goal.progress || 0)} />
                    </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="font-medium">{t("health.noGoalsYet")}</p>
                      <p className="text-sm mt-1">{t("health.noGoalsYetDesc")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => handleTabChange("goals")}>
                  <Target className="mr-2 h-4 w-4" />
                  {t("health.viewAllGoals")}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Daily Tasks Card - Merged content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("health.dailyTasks")}</CardTitle>
                  <CardDescription>{t("health.dailyActivities")}</CardDescription>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold">
                    {dailyTasks.reduce((acc, task) => acc + getTaskStats(task.id).completed, 0)}/
                    {dailyTasks.reduce((acc, task) => acc + getTaskStats(task.id).total, 0)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">{t("common.loading")}</span>
                    </div>
                ) : dailyTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t("health.noTasksFound")}</p>
                    <Button onClick={() => setIsAddTaskOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("healthPlan.addTask")}
                    </Button>
                    </div>
                ) : (
                  dailyTasks.map((task) => {
                  const weekDates = getWeekDates(currentWeekStart)
                  const completedDays = (dailyTaskValues[task.id] || [0, 0, 0, 0, 0, 0, 0]).map(value => value > 0)
                  const { completed, total } = getTaskStats(task.id)

                  return (
                    <div key={task.id} className="rounded-md border p-4 space-y-3">
                      <TaskItem
                        task={task}
                        completed={completed}
                        total={total}
                        onEdit={handleEdit}
                        onDelete={handleDeleteTask}
                        getHealthGoalNames={getHealthGoalNames}
                        t={t}
                      />

                      {/* Week navigation and day tracking */}
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => navigateWeek("prev")} className="p-1 h-8 w-8">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center space-x-1">
                          <div className="flex items-center space-x-1">
                            {weekDates.map((date, index) => (
                              <div key={index} className="flex flex-col items-center space-y-1">
                                <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
                                <CircleDateButton
                                  isCompleted={task.frequency === "daily" ? false : completedDays[index]}
                                  isLoading={isLoadingTaskCompletions}
                                  onClick={() => toggleDayCompletion(task.id, index)}
                                  onDoubleClick={() => toggleDayCompletion(task.id, index, true)} // Decrease on double click
                                  dateLabel={formatDate(date)}
                                  mode={task.frequency === "daily" ? "number" : "check"}
                                  currentValue={task.frequency === "daily" ? (dailyTaskValues[task.id]?.[index] || 0) : 0}
                                  maxValue={task.frequency === "daily" ? Infinity : 1}
                                  targetOperator={task.frequency === "daily" ? task.target_operator : undefined}
                                  targetValue={task.frequency === "daily" ? parseFloat(task.target_value || "0") : undefined}
                                />
                  </div>
                ))}
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => navigateWeek("next")} className="p-1 h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                  })
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => handleTabChange("tasks")}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("health.viewAllTasks")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex flex-col items-start">
                <CardTitle>{t("nav.healthGoals")}</CardTitle>
                <CardDescription>{t("health.personalizedTargets")}</CardDescription>
              </div>
              <Button
                className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
                onClick={() => setIsAddGoalOpen(true)}
              >
                    <Plus className="mr-2 h-4 w-4" />
                {t("healthPlan.addNewGoal")}
                  </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isLoadingGoals ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <p className="text-lg">{t("health.loadingGoals")}</p>
                    </div>
                  </div>
                ) : goalsLoadError ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg font-medium text-destructive mb-2">{t("health.failedToLoadGoals")}</p>
                    <p className="text-sm">{t("health.failedToLoadGoalsDesc")}</p>
                  </div>
                ) : healthGoals.length > 0 ? (
                  healthGoals.map((goal) => (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                          <CardTitle>{String(goal.name || "Unnamed Goal")}</CardTitle>
                          <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(goal, "goal")}>
                          <Edit className="h-4 w-4" />
                        </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteGoal(goal)}
                              disabled={isEditingGoal}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isEditingGoal ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                        </Button>
                          </div>
                      </div>
                      <CardDescription>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatDisplayDate(goal.startDate)} - {formatDisplayDate(goal.endDate)}
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("dashboard.target")}</p>
                              <p className="text-lg font-medium">
                                {goal.target || "No target set"}
                              </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("health.current")}</p>
                              <div className="space-y-1">
                                <p className="text-lg font-medium">
                                  {formatValueWithUnit(
                                    goal.current === t("health.noCurrentValue") ? t("health.noCurrentValue") : String(goal.current || t("health.noCurrentValue")),
                                    getUnitForMetric(goal.metric_id)
                                  )}
                                </p>
                                {goal.current === t("health.noCurrentValue") && (
                                  <p className="text-xs text-muted-foreground italic">
                                    {t("health.noCurrentValueDesc")}
                                  </p>
                                )}
                              </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{t("health.progress")}</p>
                              <p className="text-sm font-medium">{Number(goal.progress || 0)}%</p>
                          </div>
                            <Progress value={Number(goal.progress || 0)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg font-medium mb-2">{t("health.noGoalsYet")}</p>
                    <p className="text-sm">{t("health.noGoalsYetDesc")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.dailyTasks")}</CardTitle>
                <CardDescription>{t("health.activitiesDaily")}</CardDescription>
              </div>
              {dailyTasks.length > 0 && (
              <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => setIsAddTaskOpen(true)}
                  >
                      <Plus className="mr-2 h-4 w-4" />
                    {t("healthPlan.addTask")}
                    </Button>
                      </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span>{t("common.loading")}</span>
                      </div>
                ) : tasksLoadError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{t("common.errorLoadingData")}</p>
                    <Button onClick={() => loadHealthTasks()}>
                      {t("common.retry")}
                    </Button>
                      </div>
                ) : dailyTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t("health.noTasksFound")}</p>
                    <Button onClick={() => setIsAddTaskOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("healthPlan.addTask")}
                      </Button>
              </div>
                ) : (
                  dailyTasks.map((task) => {
                    
                    const weekDates = getWeekDates(currentWeekStart)
                    const completedDays = (dailyTaskValues[task.id] || [0, 0, 0, 0, 0, 0, 0]).map(value => value > 0)
                    const { completed, total } = getTaskStats(task.id)

                    return (
                      <div key={task.id} className="rounded-md border p-4 space-y-3">
                        <TaskItem
                          task={task}
                          completed={completed}
                          total={total}
                          onEdit={handleEdit}
                          onDelete={handleDeleteTask}
                          getHealthGoalNames={getHealthGoalNames}
                          t={t}
                        />

                        {/* Week navigation and day tracking */}
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => navigateWeek("prev")} className="p-1 h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center space-x-1">
                            {weekDates.map((date, index) => (
                              <div key={index} className="flex flex-col items-center space-y-1">
                                <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
                                <CircleDateButton
                                  isCompleted={task.frequency === "daily" ? false : completedDays[index]}
                                  isLoading={isLoadingTaskCompletions}
                                  onClick={() => toggleDayCompletion(task.id, index)}
                                  onDoubleClick={() => toggleDayCompletion(task.id, index, true)} // Decrease on double click
                                  dateLabel={formatDate(date)}
                                  mode={task.frequency === "daily" ? "number" : "check"}
                                  currentValue={task.frequency === "daily" ? (dailyTaskValues[task.id]?.[index] || 0) : 0}
                                  maxValue={task.frequency === "daily" ? Infinity : 1}
                                  targetOperator={task.frequency === "daily" ? task.target_operator : undefined}
                                  targetValue={task.frequency === "daily" ? parseFloat(task.target_value || "0") : undefined}
                        />
                      </div>
                            ))}
                    </div>

                          <Button variant="ghost" size="sm" onClick={() => navigateWeek("next")} className="p-1 h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                      </Button>
              </div>
                    </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.weeklyTasks")}</CardTitle>
                <CardDescription>{t("health.activitiesWeekly")}</CardDescription>
              </div>
              {weeklyTasks.length > 0 && (
              <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => setIsAddTaskOpen(true)}
                  >
                      <Plus className="mr-2 h-4 w-4" />
                    {t("healthPlan.addTask")}
                    </Button>
              </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Update the Tasks tab to include day tracking for all task types and show health goals: */}
                {weeklyTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t("health.noWeeklyTasksFound")}</p>
                    <Button onClick={() => setIsAddTaskOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("healthPlan.addTask")}
                    </Button>
                  </div>
                ) : (
                  weeklyTasks.map((task) => {
                  const weekDates = getWeekDates(currentWeekStart)
                  const completedDays = weeklyTaskCompletedDays[task.id] || [
                    false,
                    false,
                    false,
                    false,
                    false,
                    false,
                    false,
                  ]
                  const { completed, total } = getWeeklyTaskStats(task.id)

                  return (
                    <div key={task.id} className="rounded-md border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                    <div>
                          <div className="flex items-center space-x-2">
                      <p className="font-medium">{task.name}</p>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(task, "task")}
                                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTask(task)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                      <p className="text-sm text-muted-foreground">
                            {task.goal_id ? (
                              <>
                                {getHealthGoalNames([task.goal_id.toString()])} - {task.frequency}
                                <span className="ml-2 text-xs px-2 py-1 rounded" style={{
                                  backgroundColor: task.metric && task.metric !== "none" ? '#dbeafe' : '#f3f4f6',
                                  color: task.metric && task.metric !== "none" ? '#1e40af' : '#6b7280'
                                }}>
                                  📊 {task.metric && task.metric !== "none" ? task.metric : "No metric"}
                                </span>
                              </>
                            ) : (
                              <>
                                {t("healthPlan.noLinkedGoals")}
                                <span className="ml-2 text-xs px-2 py-1 rounded" style={{
                                  backgroundColor: task.metric && task.metric !== "none" ? '#dbeafe' : '#f3f4f6',
                                  color: task.metric && task.metric !== "none" ? '#1e40af' : '#6b7280'
                                }}>
                                  📊 {task.metric && task.metric !== "none" ? task.metric : "No metric"}
                                </span>
                              </>
                            )}
                      </p>
                    </div>
                    <Badge variant="outline">
                          {completed}/{total}
                    </Badge>
                      </div>

                      {/* Week navigation and day tracking */}
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => navigateWeek("prev")} className="p-1 h-8 w-8">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center space-x-1">
                          {weekDates.map((date, index) => (
                            <div key={index} className="flex flex-col items-center space-y-1">
                              <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
                              <CircleDateButton
                                isCompleted={completedDays[index]}
                                isLoading={isLoadingTaskCompletions}
                                onClick={() => toggleWeeklyDayCompletion(task.id, index)}
                                dateLabel={formatDate(date)}
                                mode="check"
                                currentValue={completed}
                                targetOperator={task.target_operator}
                                targetValue={parseFloat(task.target_value || "0")}
                              />
                  </div>
                ))}
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => navigateWeek("next")} className="p-1 h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.monthlyTasks")}</CardTitle>
                <CardDescription>{t("health.activitiesMonthly")}</CardDescription>
              </div>
              {monthlyTasks.length > 0 && (
              <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => setIsAddTaskOpen(true)}
                  >
                      <Plus className="mr-2 h-4 w-4" />
                    {t("healthPlan.addTask")}
                    </Button>
              </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Monthly Tasks section - add day tracking */}
                {monthlyTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t("health.noMonthlyTasksFound")}</p>
                    <Button onClick={() => setIsAddTaskOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("healthPlan.addTask")}
                    </Button>
                    </div>
                ) : (
                  monthlyTasks.map((task) => {
                  const weekDates = getWeekDates(currentWeekStart)
                  const completedDays = monthlyTaskCompletedDays[task.id] || [
                    false,
                    false,
                    false,
                    false,
                    false,
                    false,
                    false,
                  ]
                  const { completed, total } = getMonthlyTaskStats(task.id)

                  return (
                    <div key={task.id} className="rounded-md border p-4 space-y-3">
                      <TaskItem
                        task={task}
                        completed={completed}
                        total={total}
                        onEdit={handleEdit}
                        onDelete={handleDeleteTask}
                        getHealthGoalNames={getHealthGoalNames}
                        t={t}
                      />

                      {/* Week navigation and day tracking */}
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => navigateWeek("prev")} className="p-1 h-8 w-8">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center space-x-1">
                          {weekDates.map((date, index) => (
                            <div key={index} className="flex flex-col items-center space-y-1">
                              <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
                              <CircleDateButton
                                isCompleted={completedDays[index]}
                                isLoading={isLoadingTaskCompletions}
                                onClick={() => toggleMonthlyDayCompletion(task.id, index)}
                                dateLabel={formatDate(date)}
                                mode="check"
                                currentValue={completed}
                                targetOperator={task.target_operator}
                                targetValue={parseFloat(task.target_value || "0")}
                              />
                  </div>
                ))}
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => navigateWeek("next")} className="p-1 h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>






      {/* Add/Edit Health Goal Dialog */}
      <AddHealthGoalDialog
        open={isAddGoalOpen || (isEditOpen && editingItem?.type === 'goal')}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddGoalOpen(false)
            setIsEditOpen(false)
            setEditingItem(null)
          }
        }}
        onSubmit={isEditOpen && editingItem?.type === 'goal' ? handleEditGoal : handleAddGoal}
        isLoading={isAddingGoal || isEditingGoal}
        availableMetrics={availableMetrics}
        isLoadingMetrics={isLoadingMetrics}
        onLoadAvailableMetrics={loadAvailableMetrics}
        editingGoal={isEditOpen && editingItem?.type === 'goal' ? (() => {
          console.log("Passing editingGoal to dialog:", editingItem)
          return editingItem
        })() : null}
      />

      {/* Add/Edit Health Task Dialog */}
      <AddHealthTaskDialog
        open={isAddTaskOpen || (isEditOpen && editingItem?.type === 'task')}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddTaskOpen(false)
            setIsEditOpen(false)
            setEditingItem(null)
          }
        }}
        onSubmit={isEditOpen && editingItem?.type === 'task' ? handleEditTask : handleAddTask}
        isLoading={isAddingTask}
        healthGoals={healthGoals}
        availableMetrics={availableMetrics}
        isLoadingGoals={isLoadingGoals}
        isLoadingMetrics={isLoadingMetrics}
        onLoadHealthGoals={loadHealthGoals}
        onLoadAvailableMetrics={loadAvailableMetrics}
        editingTask={isEditOpen && editingItem?.type === 'task' ? editingItem : null}
      />

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialog
        open={deleteGoalDialogOpen}
        onOpenChange={setDeleteGoalDialogOpen}
        onConfirm={confirmDeleteGoal}
        title="Delete Health Goal"
        itemName={itemToDelete?.name}
        loading={isEditingGoal}
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
