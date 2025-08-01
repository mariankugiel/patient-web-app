"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  AlertCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Pill,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"

export default function PatientDashboardClient() {
  const { t, language } = useLanguage()

  // Sample data
  const upcomingAppointments = [
    {
      id: "1",
      doctor: "Dr. Sarah Johnson",
      specialty: "Primary Care",
      date: "May 15, 2023",
      time: "10:30 AM",
      status: "confirmed",
    },
    {
      id: "2",
      doctor: "Dr. Michael Chen",
      specialty: "Cardiologist",
      date: "May 22, 2023",
      time: "2:15 PM",
      status: "confirmed",
    },
  ]

  const medications = [
    {
      id: "1",
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      time: "Morning",
      refillDate: "June 5, 2023",
      forgotten: false,
    },
    {
      id: "2",
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      time: "Morning and Evening",
      refillDate: "May 28, 2023",
      forgotten: true,
      lastTaken: "2 days ago",
    },
    {
      id: "3",
      name: "Atorvastatin",
      dosage: "20mg",
      frequency: "Once daily",
      time: "Evening",
      refillDate: "June 15, 2023",
      forgotten: false,
    },
  ]

  const messages = [
    {
      id: "1",
      sender: "Dr. Sarah Johnson",
      subject: "Follow-up Appointment",
      preview: "I'd like to schedule a follow-up to discuss your recent test results...",
      date: "2023-05-15T10:30:00",
      isRead: false,
    },
    {
      id: "2",
      sender: "Lab Results",
      subject: "Your Test Results Are Ready",
      preview: "Your recent laboratory test results are now available for review...",
      date: "2023-05-14T14:45:00",
      isRead: true,
    },
    {
      id: "3",
      sender: "Dr. Michael Chen",
      subject: "Medication Adjustment",
      preview: "Based on your latest blood pressure readings, I recommend adjusting your dosage...",
      date: "2023-05-13T09:15:00",
      isRead: true,
    },
  ]

  const healthRecords = [
    {
      id: "1",
      name: t("dashboard.bloodPressure"),
      value: "132/85 mmHg",
      previousValue: "138/88 mmHg",
      trend: "improving",
      status: "abnormal",
      reference: t("dashboard.normalBP"),
      date: "May 15, 2023",
      category: "health",
    },
    {
      id: "2",
      name: t("dashboard.bloodGlucose"),
      value: "98 mg/dL",
      previousValue: "105 mg/dL",
      trend: "improving",
      status: "normal",
      reference: t("dashboard.normalGlucose"),
      date: "May 15, 2023",
      category: "health",
    },
    {
      id: "3",
      name: t("dashboard.totalCholesterol"),
      value: "195 mg/dL",
      previousValue: "210 mg/dL",
      trend: "improving",
      status: "normal",
      reference: t("dashboard.normalCholesterol"),
      date: "May 10, 2023",
      category: "health",
    },
    {
      id: "4",
      name: t("dashboard.dailySteps"),
      value: "8,450 steps",
      previousValue: "7,200 steps",
      trend: "improving",
      status: "fair",
      reference: t("dashboard.targetSteps"),
      date: "May 15, 2023",
      category: "wellness",
    },
    {
      id: "5",
      name: t("dashboard.sleepDuration"),
      value: "6.5 hours",
      previousValue: "6.2 hours",
      trend: "improving",
      status: "fair",
      reference: t("dashboard.targetSleep"),
      date: "May 15, 2023",
      category: "wellness",
    },
    {
      id: "6",
      name: t("dashboard.stressLevel"),
      value: t("dashboard.medium"),
      previousValue: t("dashboard.high"),
      trend: "improving",
      status: "fair",
      reference: t("dashboard.targetStress"),
      date: "May 14, 2023",
      category: "wellness",
    },
  ]

  const healthPlanKeyMetrics = [
    {
      id: "1",
      name: t("dashboard.bloodPressure"),
      currentValue: 132,
      targetValue: 120,
      unit: "mmHg",
      progress: 75,
      trend: "improving",
      status: "fair",
    },
    {
      id: "2",
      name: t("dashboard.physicalActivity"),
      currentValue: 25,
      targetValue: 30,
      unit: "min/day",
      progress: 83,
      trend: "stable",
      status: "good",
    },
  ]

  // Calculate overall health score (0-100)
  const healthScore = 72 // This would be calculated based on various metrics
  const planProgress = 85 // Overall plan progress percentage

  const healthAssessment = t("dashboard.healthAssessment")
  const planAssessment = t("dashboard.planAssessment")

  const planStrengths = t("dashboard.planStrengths")
  const planImprovements = t("dashboard.planImprovements")

  // Determine overall plan grade based on progress percentage
  const getPlanGrade = (progress) => {
    if (progress >= 90) return t("dashboard.greatProgress")
    if (progress >= 80) return t("dashboard.doingWell")
    if (progress >= 70) return t("dashboard.improvingNeedPush")
    if (progress >= 50) return t("dashboard.needImprove")
    return t("dashboard.gettingWorse")
  }

  const planGrade = getPlanGrade(planProgress)

  const getPlanGradeColor = (grade) => {
    switch (grade) {
      case t("dashboard.greatProgress"):
        return "bg-green-600 text-white"
      case t("dashboard.doingWell"):
        return "bg-green-500 text-white"
      case t("dashboard.improvingNeedPush"):
        return "bg-amber-500 text-white"
      case t("dashboard.needImprove"):
        return "bg-amber-600 text-white"
      case t("dashboard.gettingWorse"):
        return "bg-red-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-amber-500"
    return "bg-red-500"
  }

  const getTrendIcon = (trend) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  const getStatusBadge = (status, category) => {
    // Different badge styles based on category
    if (category === "health") {
      const variants = {
        normal: "border-green-500 text-green-500",
        abnormal: "border-red-500 text-red-500",
      }
      return (
        <Badge variant="outline" className={variants[status] || "border-gray-500 text-gray-500"}>
          {t(`dashboard.status.${status}`)}
        </Badge>
      )
    } else {
      // For wellness or other categories
      const variants = {
        good: "border-green-500 text-green-500",
        fair: "border-amber-500 text-amber-500",
        poor: "border-red-500 text-red-500",
      }
      return (
        <Badge variant="outline" className={variants[status] || "border-gray-500 text-gray-500"}>
          {t(`dashboard.status.${status}`)}
        </Badge>
      )
    }
  }

  const unreadMessages = messages.filter((msg) => !msg.isRead).length
  const forgottenMeds = medications.filter((med) => med.forgotten).length

  // Filter records by category
  const healthMetrics = healthRecords.filter((record) => record.category === "health")
  const wellnessMetrics = healthRecords.filter((record) => record.category === "wellness")

  // Get health status based on score
  const getHealthStatus = (score) => {
    if (score >= 80) return t("dashboard.status.good")
    if (score >= 60) return t("dashboard.status.fair")
    return t("dashboard.status.poor")
  }

  // Get plan status based on progress
  const getPlanStatus = (progress) => {
    if (progress >= 80) return t("dashboard.ahead")
    if (progress >= 60) return t("dashboard.onTrack")
    return t("dashboard.behind")
  }

  const healthStatus = getHealthStatus(healthScore)
  const planStatus = getPlanStatus(planProgress)

  // Function to get the medication alert message based on language
  const getMedicationAlertMessage = (count) => {
    switch (language) {
      case "es":
        return `Tienes ${count} medicamento(s) que necesitan atención`
      case "pt":
        return `Você tem ${count} medicamento(s) que precisam de atenção`
      default:
        return `You have ${count} medication(s) that need attention`
    }
  }

  return (
    <div className="container py-6">
      <header className="mb-6 flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary">
          <img src="/middle-aged-man-profile.png" alt="John's profile" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-2xl font-bold text-primary">{t("greeting.morning")}, John!</p>
          <p className="text-muted-foreground">{t("dashboard.overview")}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Main content - left side (spans 3 columns on large screens) */}
        <div className="space-y-6 md:col-span-2 lg:col-span-3">
          {/* Health Summary with Ring Visualizations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("dashboard.healthSummary")}</CardTitle>
              <CardDescription>{t("dashboard.healthSummaryDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Overall Health Ring */}
                <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">{t("dashboard.overallHealth")}</div>
                  <div className="relative h-28 w-28 flex items-center justify-center mb-4">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle
                        className="text-muted stroke-current"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      />
                      <circle
                        className={`${
                          healthScore >= 80 ? "text-green-500" : healthScore >= 60 ? "text-amber-500" : "text-red-500"
                        } stroke-current`}
                        strokeWidth="10"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray={`${healthScore * 2.51} 251`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${getScoreColor(healthScore)}`}>{healthScore}</span>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      healthScore >= 80
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : healthScore >= 60
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                    } text-sm py-1 px-3`}
                  >
                    {healthStatus}
                  </Badge>
                  <p className="mt-4 text-center text-sm text-muted-foreground">{healthAssessment}</p>
                </div>

                {/* Plan Progress Ring */}
                <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">{t("dashboard.planProgress")}</div>
                  <div className="relative h-28 w-28 flex items-center justify-center mb-4">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle
                        className="text-muted stroke-current"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      />
                      <circle
                        className={`${
                          planProgress >= 80 ? "text-green-500" : planProgress >= 60 ? "text-amber-500" : "text-red-500"
                        } stroke-current`}
                        strokeWidth="10"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray={`${planProgress * 2.51} 251`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${getScoreColor(planProgress)}`}>{planProgress}%</span>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      planProgress >= 80
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : planProgress >= 60
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                    } text-sm py-1 px-3`}
                  >
                    {planStatus}
                  </Badge>
                  <p className="mt-4 text-center text-sm text-muted-foreground">{planAssessment}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest Health Records */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>{t("dashboard.latestHealthRecords")}</CardTitle>
              <CardDescription>{t("dashboard.latestHealthRecordsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold">{t("dashboard.healthMetrics")}</h3>
                <div className="space-y-4">
                  {healthMetrics.map((record) => (
                    <div key={record.id} className="flex flex-wrap items-center justify-between rounded-lg border p-4">
                      <div className="mb-2 w-full sm:mb-0 sm:w-1/4">
                        <div className="font-medium">{record.name}</div>
                        <div className="text-sm text-muted-foreground">{record.date}</div>
                      </div>
                      <div className="mb-2 flex items-center space-x-2 sm:mb-0 sm:w-1/4">
                        <div className="text-lg font-semibold">{record.value}</div>
                        {getTrendIcon(record.trend)}
                      </div>
                      <div className="mb-2 flex items-center space-x-2 sm:mb-0 sm:w-1/4">
                        <div className="text-sm text-muted-foreground">
                          {t("dashboard.previous")}: {record.previousValue}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 sm:w-1/4 sm:items-end">
                        {getStatusBadge(record.status, "health")}
                        <div className="text-xs text-muted-foreground">{record.reference}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">{t("dashboard.wellnessMetrics")}</h3>
                <div className="space-y-4">
                  {wellnessMetrics.map((record) => (
                    <div key={record.id} className="flex flex-wrap items-center justify-between rounded-lg border p-4">
                      <div className="mb-2 w-full sm:mb-0 sm:w-1/4">
                        <div className="font-medium">{record.name}</div>
                        <div className="text-sm text-muted-foreground">{record.date}</div>
                      </div>
                      <div className="mb-2 flex items-center space-x-2 sm:mb-0 sm:w-1/4">
                        <div className="text-lg font-semibold">{record.value}</div>
                        {getTrendIcon(record.trend)}
                      </div>
                      <div className="mb-2 flex items-center space-x-2 sm:mb-0 sm:w-1/4">
                        <div className="text-sm text-muted-foreground">
                          {t("dashboard.previous")}: {record.previousValue}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 sm:w-1/4 sm:items-end">
                        {getStatusBadge(record.status, "wellness")}
                        <div className="text-xs text-muted-foreground">{record.reference}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/patient/health-records" className="w-full">
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  {t("dashboard.viewAllHealthRecords")}
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Health Plan Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("dashboard.healthPlanProgress")}</CardTitle>
              <CardDescription>{t("dashboard.healthPlanProgressDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border p-4">
                <div className="flex flex-col items-center justify-between gap-2 mb-3">
                  <h3 className="font-medium text-lg">{t("dashboard.overallAssessment")}</h3>
                  <Badge className={`text-lg py-1 px-4 ${getPlanGradeColor(planGrade)}`}>{planGrade}</Badge>
                </div>
                <p className="mb-4 text-sm text-muted-foreground text-center">{planAssessment}</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-green-600">{t("dashboard.positive")}</h4>
                      <p className="text-sm">{planStrengths}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <ArrowUpCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-amber-600">{t("dashboard.improvement")}</h4>
                      <p className="text-sm">{planImprovements}</p>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="mb-3 text-lg font-semibold">{t("dashboard.keyMetrics")}</h3>
              <div className="space-y-4">
                {healthPlanKeyMetrics.map((metric) => (
                  <div key={metric.id} className="flex flex-wrap items-center justify-between rounded-lg border p-4">
                    <div className="mb-2 w-full sm:mb-0 sm:w-1/4">
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {t("dashboard.target")}: {metric.targetValue} {metric.unit}
                      </div>
                    </div>
                    <div className="mb-2 flex items-center space-x-2 sm:mb-0 sm:w-1/4">
                      <div className="text-lg font-semibold">
                        {metric.currentValue} {metric.unit}
                      </div>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="mb-2 sm:mb-0 sm:w-1/4">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(metric.progress)}`}
                          style={{ width: `${metric.progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-right">
                        {metric.progress}% {t("dashboard.complete")}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 sm:w-1/4 sm:items-end">
                      {getStatusBadge(metric.status, "wellness")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/patient/health-plan" className="w-full">
                <Button variant="outline" className="w-full">
                  <Activity className="mr-2 h-4 w-4" />
                  {t("dashboard.viewFullHealthPlan")}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Right sidebar (1 column) */}
        <div className="space-y-6">
          {/* Medications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Pill className="mr-2 h-5 w-5" />
                  {t("nav.medications")}
                </div>
                {forgottenMeds > 0 && <Badge className="bg-red-500 hover:bg-red-600">{forgottenMeds}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              {forgottenMeds > 0 && (
                <Alert className="mb-3 border-red-200 bg-red-50 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{getMedicationAlertMessage(forgottenMeds)}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                {medications.map((medication) => (
                  <div
                    key={medication.id}
                    className={cn(
                      "rounded-lg border p-3",
                      medication.forgotten && "border-l-4 border-l-red-500 bg-red-50",
                    )}
                  >
                    <div className="font-medium">{medication.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {medication.dosage} - {medication.frequency}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {medication.time}
                      </div>
                      {medication.forgotten && (
                        <Badge variant="outline" className="border-red-500 text-red-500">
                          {t("dashboard.lastTaken")}: {medication.lastTaken}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/patient/medications" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  {t("dashboard.viewAll")}
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  {t("nav.messages")}
                </div>
                {unreadMessages > 0 && <Badge className="bg-red-500 hover:bg-red-600">{unreadMessages}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("rounded-lg border p-3", !message.isRead && "border-l-4 border-l-teal-600")}
                  >
                    <div className="font-medium">{message.sender}</div>
                    <div className="text-sm font-medium">{message.subject}</div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-1">{message.preview}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.date), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/patient/messages" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  {t("dashboard.viewAll")}
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                {t("dashboard.upcomingAppointments")}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border p-3">
                    <div className="font-medium">{appointment.doctor}</div>
                    <div className="text-sm text-muted-foreground">{appointment.specialty}</div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{appointment.date}</span>
                      <span>{appointment.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/patient/appointments" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  {t("dashboard.viewAll")}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
