"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Check, ArrowLeft, ArrowRight, Shield, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Language as TranslationLanguage } from "@/lib/translations"
import { useLanguage } from "@/contexts/language-context"
import Image from "next/image"

interface Step {
  id: number
  title: string
  icon: any
}

interface OnboardingLayoutProps {
  currentStep: number
  totalSteps: number
  completedSteps: number[]
  onStepClick: (stepId: number) => void
  onPrevious: () => void
  onNext: () => void
  onSkip: () => void
  isSkipping?: boolean
  isLoading?: boolean
  showBackButton?: boolean
  children: React.ReactNode
  stepTitle: string
}

// Map context language to translation language format
const contextToTranslationMap: Record<"en" | "es" | "pt", TranslationLanguage> = {
  "en": "en-US",
  "es": "es-ES",
  "pt": "pt-PT"
}

// Map translation language to context language format
const translationToContextMap: Record<TranslationLanguage, "en" | "es" | "pt"> = {
  "en-US": "en",
  "es-ES": "es",
  "pt-PT": "pt"
}

export function OnboardingLayout({
  currentStep,
  totalSteps,
  completedSteps,
  onStepClick,
  onPrevious,
  onNext,
  onSkip,
  isSkipping = false,
  isLoading = false,
  showBackButton = true,
  children,
  stepTitle,
}: OnboardingLayoutProps) {
  const { language: contextLanguage, setLanguage: setContextLanguage, t } = useLanguage()
  
  // Convert context language to translation format for display
  const displayLanguage = contextToTranslationMap[contextLanguage]
  
  const steps = [
    { id: 1, title: t("steps.personalInfo"), icon: require("lucide-react").Users },
    { id: 2, title: t("steps.medicalCondition"), icon: require("lucide-react").Heart },
    { id: 3, title: t("steps.familyHistory"), icon: require("lucide-react").Users },
    { id: 4, title: t("steps.healthRecords"), icon: require("lucide-react").FileText },
    { id: 5, title: t("steps.permissions") || "Permissions", icon: require("lucide-react").Shield },
    { id: 6, title: t("steps.integrations") || "Integrations", icon: require("lucide-react").Activity },
    { id: 7, title: t("steps.payment") || "Payment", icon: require("lucide-react").CreditCard },
  ]
  
  const progress = (currentStep / totalSteps) * 100
  
  // Handle language change - convert from translation format to context format
  const handleLanguageChange = (newLanguage: TranslationLanguage) => {
    const contextLang = translationToContextMap[newLanguage]
    if (contextLang) {
      setContextLanguage(contextLang)
    }
  }

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
            <Select value={displayLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40 bg-white text-teal-600 border-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">{t("languages.en-US")}</SelectItem>
                <SelectItem value="es-ES">{t("languages.es-ES")}</SelectItem>
                <SelectItem value="pt-PT">{t("languages.pt-PT")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-teal-600">
            {t("navigation.step")} {currentStep} {t("navigation.of")}{" "}
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
              const isCompleted = completedSteps.includes(step.id)
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
      <div className={cn(
        "mx-auto p-6",
        currentStep === 7 ? "max-w-full" : "max-w-2xl"
      )}>
        {currentStep === 7 ? (
          <div className="space-y-6">
            {children}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-balance">{stepTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {children}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {showBackButton ? (
            <Button variant="outline" onClick={onPrevious} disabled={currentStep === 1}>
              {t("navigation.previous")}
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
              {isSkipping ? "Skipping..." : t("navigation.skip")}
            </Button>
            <Button
              onClick={onNext}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("navigation.saving")}
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <Check className="w-4 h-4" />
                  {t("navigation.complete")}
                </>
              ) : (
                <>
                  {t("navigation.next")}
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
