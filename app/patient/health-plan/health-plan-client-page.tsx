"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, Download, Edit, Plus, Target, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/contexts/language-context"
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

export default function HealthPlanClientPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const { t, language } = useLanguage()

  // Dialog states
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isAddRecommendationOpen, setIsAddRecommendationOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form states
  const [goalForm, setGoalForm] = useState({
    name: "",
    target: "",
    startDate: "",
    endDate: "",
  })

  const [taskForm, setTaskForm] = useState({
    name: "",
    category: "",
    frequency: "",
    time: "",
  })

  const [recommendationForm, setRecommendationForm] = useState({
    title: "",
    description: "",
    category: "",
  })

  // Sample data
  const healthGoals = [
    {
      id: "1",
      name: "Lower Blood Pressure",
      target: "Below 120/80 mmHg",
      current: "128/82 mmHg",
      progress: 75,
      startDate: "January 15, 2023",
      endDate: "July 15, 2023",
    },
    {
      id: "2",
      name: "Weight Management",
      target: "160 lbs",
      current: "165 lbs",
      progress: 80,
      startDate: "February 1, 2023",
      endDate: "August 1, 2023",
    },
    {
      id: "3",
      name: "Increase Physical Activity",
      target: "150 minutes per week",
      current: "120 minutes per week",
      progress: 80,
      startDate: "January 15, 2023",
      endDate: "Ongoing",
    },
  ]

  const dailyTasks = [
    {
      id: "1",
      name: "30 min walk",
      category: t("health.physicalActivity"),
      frequency: t("health.frequency.daily"),
      completed: 5,
      total: 7,
      time: t("dashboard.morning"),
    },
    {
      id: "2",
      name: "Blood pressure reading",
      category: t("health.monitoring"),
      frequency: t("health.frequency.daily"),
      completed: 7,
      total: 7,
      time: t("dashboard.evening"),
    },
    {
      id: "3",
      name: "Meditation",
      category: t("health.mentalWellness"),
      frequency: t("health.frequency.daily"),
      completed: 4,
      total: 7,
      time: t("dashboard.evening"),
    },
    {
      id: "4",
      name: "Medication adherence",
      category:
        language === "en"
          ? "Medication"
          : language === "es"
            ? "Medicación"
            : language === "pt"
              ? "Medicação"
              : t("health.metrics.medication"),
      frequency: t("health.frequency.daily"),
      completed: 7,
      total: 7,
      time: "Morning & Evening",
    },
  ]

  const weeklyTasks = [
    {
      id: "1",
      name: "Strength training",
      category: t("health.physicalActivity"),
      frequency: "3 times per week",
      completed: 2,
      total: 3,
    },
    {
      id: "2",
      name: "Grocery shopping for healthy foods",
      category: t("health.nutrition"),
      frequency: "Once per week",
      completed: 1,
      total: 1,
    },
    {
      id: "3",
      name: "Weight check-in",
      category: t("health.monitoring"),
      frequency: "Once per week",
      completed: 1,
      total: 1,
    },
  ]

  const monthlyTasks = [
    {
      id: "1",
      name: "Doctor check-in",
      category: t("health.healthcare"),
      frequency: "Once per month",
      completed: 1,
      total: 1,
      date: "May 15, 2023",
    },
    {
      id: "2",
      name: "Review health goals",
      category: t("health.planning"),
      frequency: "Once per month",
      completed: 0,
      total: 1,
      date: "May 30, 2023",
    },
  ]

  const recommendations = [
    {
      id: "1",
      title: "Reduce Sodium Intake",
      description: "Try to limit sodium to less than 2,300 mg per day to help lower blood pressure.",
      category: t("health.nutrition"),
    },
    {
      id: "2",
      title: "Increase Potassium-Rich Foods",
      description: "Eat more fruits, vegetables, and low-fat dairy products rich in potassium.",
      category: t("health.nutrition"),
    },
    {
      id: "3",
      title: "Regular Physical Activity",
      description: "Aim for at least 150 minutes of moderate-intensity exercise per week.",
      category: t("health.physicalActivity"),
    },
    {
      id: "4",
      title: "Stress Management",
      description: "Practice stress-reducing activities like meditation, deep breathing, or yoga.",
      category: t("health.mentalWellness"),
    },
  ]

  // Helper function to get properly formatted tab names based on language
  const getRecommendationsTabName = () => {
    if (language === "en") return "Recommendations"
    if (language === "es") return "Recomendaciones"
    if (language === "pt") return "Recomendações"
    return t("health.recommendations")
  }

  // Handle form submissions
  const handleAddGoal = () => {
    console.log("Adding goal:", goalForm)
    setGoalForm({ name: "", target: "", startDate: "", endDate: "" })
    setIsAddGoalOpen(false)
  }

  const handleAddTask = () => {
    console.log("Adding task:", taskForm)
    setTaskForm({ name: "", category: "", frequency: "", time: "" })
    setIsAddTaskOpen(false)
  }

  const handleAddRecommendation = () => {
    console.log("Adding recommendation:", recommendationForm)
    setRecommendationForm({ title: "", description: "", category: "" })
    setIsAddRecommendationOpen(false)
  }

  const handleEdit = (item: any, type: string) => {
    setEditingItem({ ...item, type })
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    console.log("Saving edit:", editingItem)
    setEditingItem(null)
    setIsEditOpen(false)
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src="/middle-aged-man-profile.png" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("greeting.morning")}, John!</h1>
          <p className="text-muted-foreground">{t("dashboard.healthPlanProgressDesc")}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("health.summary")}</TabsTrigger>
          <TabsTrigger value="goals">{t("nav.healthGoals")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("health.tasks")}</TabsTrigger>
          <TabsTrigger value="recommendations">{getRecommendationsTabName()}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Progress Ring Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("health.weeklyProgress")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-4">
                <div className="relative h-40 w-40">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle className="stroke-muted" cx="50" cy="50" r="40" strokeWidth="10" fill="none" />
                    {/* Progress circle - 76% of the circumference */}
                    <circle
                      className="stroke-teal-500 transition-all duration-300 ease-in-out"
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="251.2"
                      strokeDashoffset="60.3"
                      transform="rotate(-90 50 50)"
                    />
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground text-xl font-bold"
                    >
                      76%
                    </text>
                  </svg>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.greatProgress")}! {t("health.weeklyProgressDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Health Goals Card - Merged content */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("nav.healthGoals")}</CardTitle>
                    <CardDescription>{t("health.currentHealthGoals")}</CardDescription>
                  </div>
                  <div className="flex items-center">
                    <Target className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold">{healthGoals.length}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthGoals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("dashboard.target")}: {goal.target} | {t("health.current")}: {goal.current}
                          </p>
                        </div>
                        <Badge variant="outline">{goal.progress}%</Badge>
                      </div>
                      <Progress value={goal.progress} />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setActiveTab("goals")}>
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
                    {dailyTasks.reduce((acc, task) => acc + task.completed, 0)}/
                    {dailyTasks.reduce((acc, task) => acc + task.total, 0)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {dailyTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.category} - {task.time}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {task.completed}/{task.total}
                      </Badge>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setActiveTab("tasks")}>
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
              <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("health.addNewGoal")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t("health.addNewGoal")}</DialogTitle>
                    <DialogDescription>Create a new health goal to track your progress.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="goal-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="goal-name"
                        value={goalForm.name}
                        onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., Lower Blood Pressure"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="goal-target" className="text-right">
                        Target
                      </Label>
                      <Input
                        id="goal-target"
                        value={goalForm.target}
                        onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., Below 120/80 mmHg"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="goal-start" className="text-right">
                        Start Date
                      </Label>
                      <Input
                        id="goal-start"
                        type="date"
                        value={goalForm.startDate}
                        onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="goal-end" className="text-right">
                        End Date
                      </Label>
                      <Input
                        id="goal-end"
                        type="date"
                        value={goalForm.endDate}
                        onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleAddGoal}>
                      Add Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {healthGoals.map((goal) => (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{goal.name}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(goal, "goal")}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription>
                        {goal.startDate} - {goal.endDate}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("dashboard.target")}</p>
                            <p className="text-lg font-medium">{goal.target}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("health.current")}</p>
                            <p className="text-lg font-medium">{goal.current}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{t("health.progress")}</p>
                            <p className="text-sm font-medium">{goal.progress}%</p>
                          </div>
                          <Progress value={goal.progress} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(dailyTasks[0], "task")}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("action.edit")}
                </Button>
                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("health.addTask")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("health.addTask")}</DialogTitle>
                      <DialogDescription>Add a new task to your health plan.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="task-name"
                          value={taskForm.name}
                          onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                          className="col-span-3"
                          placeholder="e.g., 30 min walk"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-category" className="text-right">
                          Category
                        </Label>
                        <Select
                          value={taskForm.category}
                          onValueChange={(value) => setTaskForm({ ...taskForm, category: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="physical-activity">Physical Activity</SelectItem>
                            <SelectItem value="nutrition">Nutrition</SelectItem>
                            <SelectItem value="monitoring">Monitoring</SelectItem>
                            <SelectItem value="mental-wellness">Mental Wellness</SelectItem>
                            <SelectItem value="medication">Medication</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-frequency" className="text-right">
                          Frequency
                        </Label>
                        <Select
                          value={taskForm.frequency}
                          onValueChange={(value) => setTaskForm({ ...taskForm, frequency: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-time" className="text-right">
                          Time
                        </Label>
                        <Input
                          id="task-time"
                          value={taskForm.time}
                          onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })}
                          className="col-span-3"
                          placeholder="e.g., Morning"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddTask}>
                        Add Task
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.category} - {task.frequency}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-muted-foreground">{task.time}</p>
                      <Badge variant="outline">
                        {task.completed}/{task.total}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.weeklyTasks")}</CardTitle>
                <CardDescription>{t("health.activitiesWeekly")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(weeklyTasks[0], "task")}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("action.edit")}
                </Button>
                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("health.addTask")}
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.category} - {task.frequency}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {task.completed}/{task.total}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.monthlyTasks")}</CardTitle>
                <CardDescription>{t("health.activitiesMonthly")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(monthlyTasks[0], "task")}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("action.edit")}
                </Button>
                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("health.addTask")}
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.category} - {task.frequency}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-muted-foreground">{task.date}</p>
                      <Badge variant="outline">
                        {task.completed}/{task.total}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("health.personalizedRecommendations")}</CardTitle>
                <CardDescription>{t("health.recommendationsDesc")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(recommendations[0], "recommendation")}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("action.edit")}
                </Button>
                <Dialog open={isAddRecommendationOpen} onOpenChange={setIsAddRecommendationOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("health.addRecommendation")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("health.addRecommendation")}</DialogTitle>
                      <DialogDescription>Add a new health recommendation.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rec-title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="rec-title"
                          value={recommendationForm.title}
                          onChange={(e) => setRecommendationForm({ ...recommendationForm, title: e.target.value })}
                          className="col-span-3"
                          placeholder="e.g., Reduce Sodium Intake"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rec-description" className="text-right">
                          Description
                        </Label>
                        <Textarea
                          id="rec-description"
                          value={recommendationForm.description}
                          onChange={(e) =>
                            setRecommendationForm({ ...recommendationForm, description: e.target.value })
                          }
                          className="col-span-3"
                          placeholder="Detailed description of the recommendation..."
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rec-category" className="text-right">
                          Category
                        </Label>
                        <Select
                          value={recommendationForm.category}
                          onValueChange={(value) => setRecommendationForm({ ...recommendationForm, category: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nutrition">Nutrition</SelectItem>
                            <SelectItem value="physical-activity">Physical Activity</SelectItem>
                            <SelectItem value="mental-wellness">Mental Wellness</SelectItem>
                            <SelectItem value="monitoring">Monitoring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddRecommendation}>
                        Add Recommendation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((recommendation) => (
                  <Card key={recommendation.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <Badge>{recommendation.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>{recommendation.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700">
                <Download className="mr-2 h-4 w-4" />
                {t("health.downloadRecommendations")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.type}</DialogTitle>
            <DialogDescription>Make changes to your {editingItem?.type} here.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingItem?.type === "goal" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingItem?.name || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-target" className="text-right">
                    Target
                  </Label>
                  <Input
                    id="edit-target"
                    value={editingItem?.target || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, target: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
            {editingItem?.type === "task" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-task-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-task-name"
                    value={editingItem?.name || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-task-category" className="text-right">
                    Category
                  </Label>
                  <Input
                    id="edit-task-category"
                    value={editingItem?.category || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
            {editingItem?.type === "recommendation" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-rec-title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="edit-rec-title"
                    value={editingItem?.title || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-rec-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="edit-rec-description"
                    value={editingItem?.description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
