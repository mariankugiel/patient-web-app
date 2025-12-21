"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Lock,
  CheckCircle2,
  Sparkles,
  Crown,
  Zap,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentStepOnboardingProps {
  formData: any
  updateFormData: (data: any) => void
  onValidationChange?: (isValid: boolean) => void
}

type SubscriptionPlan = {
  id: string
  name: string
  price: number
  yearlyPrice: number
  description: string
  features: string[]
  popular?: boolean
  icon: any
  color: string
}

const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    description: "Basic features to get started",
    features: [
      "Basic health records",
      "Up to 3 appointments",
      "Basic messaging",
      "Mobile app access",
    ],
    icon: Sparkles,
    color: "text-gray-600",
  },
  {
    id: "basic",
    name: "Basic",
    price: 9.99,
    yearlyPrice: 99.99,
    description: "Perfect for regular health tracking",
    features: [
      "All Free features",
      "Unlimited appointments",
      "Advanced health records",
      "Priority support",
      "Wearable device sync",
      "Health insights",
    ],
    icon: Zap,
    color: "text-blue-600",
  },
  {
    id: "premium",
    name: "Premium",
    price: 19.99,
    yearlyPrice: 199.99,
    description: "Complete health management solution",
    features: [
      "All Basic features",
      "AI-powered health insights",
      "Advanced analytics",
      "24/7 priority support",
      "Family health tracking",
      "Custom health plans",
      "Telemedicine integration",
      "Prescription management",
    ],
    popular: true,
    icon: Crown,
    color: "text-amber-600",
  },
]

export function PaymentStepOnboarding({ formData, updateFormData, onValidationChange }: PaymentStepOnboardingProps) {
  const { t } = useLanguage()
  const [selectedPlan, setSelectedPlan] = useState<string>(formData?.payment?.planId || "basic")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    formData?.payment?.billingCycle || "monthly"
  )
  const [acceptTerms, setAcceptTerms] = useState(formData?.payment?.acceptTerms || false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan) || PLANS[1]

  const updatePaymentData = (field: string, value: any) => {
    const updatedData = {
      payment: {
        ...formData?.payment,
        [field]: value,
        planId: selectedPlan,
        billingCycle,
        acceptTerms,
      },
    }
    updateFormData(updatedData)
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    updatePaymentData("planId", planId)
  }

  const handleBillingCycleChange = (cycle: "monthly" | "yearly") => {
    setBillingCycle(cycle)
    updatePaymentData("billingCycle", cycle)
  }

  const calculatePrice = () => {
    if (selectedPlanData.id === "free") return 0
    return billingCycle === "yearly" ? selectedPlanData.yearlyPrice : selectedPlanData.price
  }

  const calculateSavings = () => {
    if (selectedPlanData.id === "free" || billingCycle === "monthly") return 0
    const monthlyTotal = selectedPlanData.price * 12
    return monthlyTotal - selectedPlanData.yearlyPrice
  }

  const savings = calculateSavings()

  // Validate form - only check terms for now
  useEffect(() => {
    const isValid = acceptTerms
    if (onValidationChange) {
      onValidationChange(isValid)
    }
  }, [acceptTerms, onValidationChange])

  const handleSubscribe = async () => {
    // Validate terms
    if (!acceptTerms) {
      setErrors({ terms: t("payment.acceptTermsRequired") || "You must accept the terms and conditions" })
      return
    }

    setErrors({})
    setIsProcessing(true)

    // TODO: Integrate with Stripe Checkout
    // This will be implemented later:
    // 1. Call backend API to create checkout session
    // 2. Redirect to Stripe Checkout URL
    // 3. Handle success/cancel redirects

    // Placeholder for now
    setTimeout(() => {
      setIsProcessing(false)
      // For now, just update form data
      updatePaymentData("acceptTerms", acceptTerms)
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4">
      {/* Subscription Plans Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-semibold">{t("payment.selectPlan") || "Select Your Plan"}</h3>
          <p className="text-base text-muted-foreground">
            {t("payment.selectPlanDesc") || "Choose the plan that best fits your health management needs"}
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={cn("text-base font-medium", billingCycle === "monthly" && "text-primary")}>
            {t("payment.monthly") || "Monthly"}
          </span>
          <button
            type="button"
            onClick={() => handleBillingCycleChange(billingCycle === "monthly" ? "yearly" : "monthly")}
            className={cn(
              "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
              billingCycle === "yearly" ? "bg-primary" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
          <span className={cn("text-base font-medium", billingCycle === "yearly" && "text-primary")}>
            {t("payment.yearly") || "Yearly"}
          </span>
          {billingCycle === "yearly" && savings > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-sm px-3 py-1">
              {t("payment.saveAmount")?.replace("${amount}", savings.toFixed(2)) || `Save $${savings.toFixed(2)}`}
            </Badge>
          )}
        </div>

        {/* Plan Cards - Wider Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isSelected = selectedPlan === plan.id
            const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.price

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative cursor-pointer transition-all hover:shadow-xl",
                  isSelected && "ring-2 ring-primary shadow-xl",
                  plan.popular && "border-amber-300"
                )}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-amber-500 text-white px-3 py-1">
                      {t("payment.mostPopular") || "Most Popular"}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <div className={cn("p-4 rounded-full bg-muted", plan.color)}>
                      <Icon className={cn("h-8 w-8", plan.color)} />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mt-2">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-4xl font-bold">
                      {price === 0 ? (
                        t("payment.free") || "Free"
                      ) : (
                        <>
                          ${price}
                          <span className="text-lg font-normal text-muted-foreground">
                            /{billingCycle === "yearly" ? t("payment.year") || "year" : t("payment.month") || "month"}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full mt-6 h-11",
                      isSelected
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                    variant={isSelected ? "default" : "secondary"}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlanSelect(plan.id)
                    }}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t("payment.selected") || "Selected"}
                      </>
                    ) : (
                      t("payment.select") || "Select Plan"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Summary and Terms Section */}
      <div className="max-w-3xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="h-5 w-5" />
              {t("payment.orderSummary") || "Order Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">{t("payment.plan") || "Plan"}:</span>
                <span className="font-semibold">{selectedPlanData.name}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">{t("payment.billingCycle") || "Billing Cycle"}:</span>
                <span className="font-semibold capitalize">{billingCycle}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-base text-green-600">
                  <span>{t("payment.yearlySavings") || "Yearly Savings"}:</span>
                  <span className="font-semibold">-${savings.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>{t("payment.total") || "Total"}:</span>
                <span>
                  {calculatePrice() === 0 ? (
                    t("payment.free") || "Free"
                  ) : (
                    <>
                      ${calculatePrice().toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{billingCycle === "yearly" ? t("payment.year") || "year" : t("payment.month") || "month"}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => {
                    setAcceptTerms(checked as boolean)
                    updatePaymentData("acceptTerms", checked)
                    if (checked) {
                      setErrors({})
                    }
                  }}
                  className={cn("mt-1", errors.terms && "border-destructive")}
                />
                <Label htmlFor="acceptTerms" className="text-sm cursor-pointer leading-relaxed">
                  {t("payment.acceptTerms") || "I accept the"}{" "}
                  <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                    {t("payment.termsAndConditions") || "Terms and Conditions"}
                  </a>{" "}
                  {t("payment.and") || "and"}{" "}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                    {t("payment.privacyPolicy") || "Privacy Policy"}
                  </a>
                  <span className="text-destructive ml-1">*</span>
                </Label>
              </div>
              {errors.terms && (
                <p className="text-sm text-destructive flex items-center gap-1 ml-8">
                  <AlertCircle className="h-4 w-4" />
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Subscribe Button */}
            <div className="pt-4">
              {selectedPlan === "free" ? (
                <Button
                  onClick={handleSubscribe}
                  disabled={!acceptTerms || isProcessing}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t("payment.processing") || "Processing..."}
                    </>
                  ) : (
                    <>
                      {t("payment.continueWithFreePlan") || "Continue with Free Plan"}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={!acceptTerms || isProcessing}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t("payment.processing") || "Processing..."}
                    </>
                  ) : (
                    <>
                      {t("payment.subscribeNow") || "Subscribe Now"}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Security Badges */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>{t("payment.securePayment") || "Secure Payment"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>{t("payment.encrypted") || "256-bit SSL Encrypted"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
