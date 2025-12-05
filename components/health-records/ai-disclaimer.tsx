"use client"

import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"

export function AIDisclaimer() {
  const { t } = useLanguage()
  
  return (
    <Alert className="mt-4 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-sm text-amber-800">
        <strong>{t("health.aiDisclaimerText")}</strong> {t("health.aiDisclaimerConsult")}
      </AlertDescription>
    </Alert>
  )
}
