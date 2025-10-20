"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HealthPlanPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/patient/health-plan/overview")
  }, [router])

  return null
}
