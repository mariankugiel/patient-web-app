"use client"

import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AIDisclaimer() {
  return (
    <Alert className="mt-4 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-sm text-amber-800">
        <strong>AI-generated health summaries are for general informational purposes only and do not constitute medical advice, diagnosis, or treatment.</strong> Always consult your qualified healthcare professional for personalized medical guidance.
      </AlertDescription>
    </Alert>
  )
}
