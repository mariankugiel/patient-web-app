"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function HealthPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')

  useEffect(() => {
    const targetUrl = patientId 
      ? `/patient/health-plan/overview?patientId=${patientId}`
      : "/patient/health-plan/overview"
    router.replace(targetUrl)
  }, [router, patientId])

  return null
}
