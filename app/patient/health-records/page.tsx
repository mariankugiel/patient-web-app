"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function HealthRecordsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')

  useEffect(() => {
    const targetUrl = patientId 
      ? `/patient/health-records/summary?patientId=${patientId}`
      : "/patient/health-records/summary"
    router.replace(targetUrl)
  }, [router, patientId])

  return null
}
