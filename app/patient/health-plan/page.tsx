"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSwitchedPatient } from "@/contexts/patient-context"

export default function HealthPlanPage() {
  const router = useRouter()
  const { patientToken } = useSwitchedPatient()

  useEffect(() => {
    const targetUrl = patientToken 
      ? `/patient/health-plan/overview?patientToken=${encodeURIComponent(patientToken)}`
      : "/patient/health-plan/overview"
    router.replace(targetUrl)
  }, [router, patientToken])

  return null
}
