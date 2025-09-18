"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Check, ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Language, getTranslation } from "@/lib/translations"
import Image from "next/image"

interface Step {
  id: number
  title: string
  icon: any
}

interface OnboardingLayoutProps {
  currentStep: number
  totalSteps: number
  completedSteps: Set<number>
  language: Language
  onLanguageChange: (language: Language) => void
  onStepClick: (stepId: number) => void
  onPrevious: () => void
  onNext: () => void
  onSkip: () => void
  isSkipping?: boolean
  showBackButton?: boolean
  children: React.ReactNode
  stepTitle: string
}

const getSteps = (language: Language): Step[] => [
  { id: 1, title: getTranslation(language, "steps.personalInfo"), icon: require("lucide-react").Users },
  { id: 2, title: getTranslation(language, "steps.medicalCondition"), icon: require("lucide-react").Heart },
  { id: 3, title: getTranslation(language, "steps.familyHistory"), icon: require("lucide-react").Users },
  { id: 4, title: getTranslation(language, "steps.healthRecords"), icon: require("lucide-react").FileText },
  { id: 5, title: getTranslation(language, "steps.healthPlan"), icon: require("lucide-react").Calendar },
  { id: 6, title: getTranslation(language, "steps.appointments"), icon: require("lucide-react").Calendar },
  { id: 7, title: getTranslation(language, "steps.permissions"), icon: require("lucide-react").Settings },
  { id: 8, title: getTranslation(language, "steps.settings"), icon: require("lucide-react").Settings },
]

export function OnboardingLayout({
  currentStep,
  totalSteps,
  completedSteps,
  language,
  onLanguageChange,
  onStepClick,
  onPrevious,
  onNext,
  onSkip,
  isSkipping = false,
  showBackButton = true,
  children,
  stepTitle,
}: OnboardingLayoutProps) {
  const steps = getSteps(language)
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-card to-background">
      {/* Header */}
      <div className="text-white p-4" style={{ backgroundColor: "rgb(230, 247, 247)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/images/saluso-logo-horizontal.png" alt="Saluso" width={120} height={40} className="h-8 w-auto" />
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-teal-600" />
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-40 bg-white text-teal-600 border-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">{getTranslation(language, "languages.en-US")}</SelectItem>
                <SelectItem value="es-ES">{getTranslation(language, "languages.es-ES")}</SelectItem>
                <SelectItem value="pt-PT">{getTranslation(language, "languages.pt-PT")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-teal-600">
            {getTranslation(language, "navigation.step")} {currentStep} {getTranslation(language, "navigation.of")}{" "}
            {totalSteps}
          </div>
        </div>
      </div>

      {/* Progress Bar and Steps */}
      <div className="bg-teal-700 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="w-full h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step) => {
              const Icon = step.icon
              const isCompleted = completedSteps.has(step.id)
              const isCurrent = step.id === currentStep
              const isAccessible = step.id <= currentStep || isCompleted

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center space-y-2 text-xs cursor-pointer transition-colors",
                    isAccessible ? "text-white hover:text-white/80" : "text-white/60",
                  )}
                  onClick={() => isAccessible && onStepClick(step.id)}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                          ? "bg-white border-white text-teal-700"
                          : isAccessible
                            ? "border-white text-white"
                            : "border-white/60 text-white/60",
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-center text-balance leading-tight">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-balance">{stepTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {showBackButton ? (
            <Button variant="outline" onClick={onPrevious} disabled={currentStep === 1}>
              {getTranslation(language, "navigation.previous")}
            </Button>
          ) : (
            <div></div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSkip()
              }}
              disabled={isSkipping}
              type="button"
            >
              {isSkipping ? "Skipping..." : getTranslation(language, "navigation.skip")}
            </Button>
            <Button
              onClick={onNext}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              {currentStep === totalSteps ? (
                <>
                  <Check className="w-4 h-4" />
                  {getTranslation(language, "navigation.complete")}
                </>
              ) : (
                <>
                  {getTranslation(language, "navigation.next")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
