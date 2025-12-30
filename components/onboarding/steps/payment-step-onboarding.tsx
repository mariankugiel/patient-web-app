"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
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

const MONTHLY_PRICE = 7.99
const YEARLY_PRICE = 59.99
const SAVINGS_PERCENTAGE = 37 // (7.99 * 12 - 59.99) / (7.99 * 12) * 100 ≈ 37%

const BENEFITS = [
  "Centralize all your health records and synchronize the information from your wearables",
  "Get personalized insights and recommendations",
  "Set your own Health Plan with Goals and Tasks or reminders for Medication",
  "Share your records with Doctors and Family and Make Appointments",
]

export function PaymentStepOnboarding({ formData, updateFormData, onValidationChange }: PaymentStepOnboardingProps) {
  const { t } = useLanguage()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    formData?.payment?.billingCycle || "monthly"
  )
  const [acceptTerms, setAcceptTerms] = useState(formData?.payment?.acceptTerms || false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const updatePaymentData = (field: string, value: any) => {
    const updatedData = {
      payment: {
        ...formData?.payment,
        [field]: value,
        billingCycle,
        acceptTerms,
        price: billingCycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE,
      },
    }
    updateFormData(updatedData)
  }

  const handleBillingCycleChange = (cycle: "monthly" | "yearly") => {
    setBillingCycle(cycle)
    updatePaymentData("billingCycle", cycle)
  }

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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-balance">Subscription</CardTitle>
        <p className="text-base text-muted-foreground mt-2">
          Choose your plan and start your health journey
        </p>
      </CardHeader>
      <CardContent className="space-y-8">

        {/* Benefits Section */}
        <Card className="border-2" style={{ borderColor: "#e6fffa", backgroundColor: "#f0fdfa" }}>
          <CardContent className="p-6">
            <p className="font-bold text-gray-800 mb-4">
              With your Saluso subscription, you get:
            </p>
            <ul className="space-y-3">
              {BENEFITS.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Choose Your Plan Section */}
        <div className="space-y-4">
          <h4 className="text-xl font-semibold text-gray-800">Choose Your Plan</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Plan */}
            <Card
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg",
                billingCycle === "monthly" && "ring-2 ring-teal-500 shadow-lg",
                billingCycle === "monthly" ? "border-teal-500" : "border-gray-300"
              )}
              onClick={() => handleBillingCycleChange("monthly")}
            >
              {billingCycle === "monthly" && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                </div>
              )}
              <CardContent className="p-6">
                <h5 className="text-lg font-bold text-gray-800 mb-4">Monthly</h5>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-800">€{MONTHLY_PRICE.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">per month</div>
                </div>
              </CardContent>
            </Card>

            {/* Annually Plan */}
            <Card
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg",
                billingCycle === "yearly" && "ring-2 ring-teal-500 shadow-lg",
                billingCycle === "yearly" ? "border-teal-500" : "border-gray-300"
              )}
              onClick={() => handleBillingCycleChange("yearly")}
            >
              {billingCycle === "yearly" && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                  Save {SAVINGS_PERCENTAGE}%
                </Badge>
              </div>
              <CardContent className="p-6">
                <h5 className="text-lg font-bold text-gray-800 mb-4">Annually</h5>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-800">€{YEARLY_PRICE.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">per year</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Terms and Subscribe Section */}
        <Card className="bg-gray-50">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
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
                <Label htmlFor="acceptTerms" className="text-sm cursor-pointer leading-relaxed text-gray-700">
                  {t("payment.acceptTerms") || "I accept the"}{" "}
                  <a href="/terms" target="_blank" className="text-teal-600 hover:underline font-medium">
                    {t("payment.termsAndConditions") || "Terms and Conditions"}
                  </a>{" "}
                  {t("payment.and") || "and"}{" "}
                  <a href="/privacy" target="_blank" className="text-teal-600 hover:underline font-medium">
                    {t("payment.privacyPolicy") || "Privacy Policy"}
                  </a>
                  <span className="text-red-500 ml-1">*</span>
                </Label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600 flex items-center gap-1 ml-8">
                  <AlertCircle className="h-4 w-4" />
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Subscribe Button */}
            <Button
              onClick={handleSubscribe}
              disabled={!acceptTerms || isProcessing}
              className="w-full h-12 text-base font-semibold bg-teal-600 hover:bg-teal-700 text-white"
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
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
