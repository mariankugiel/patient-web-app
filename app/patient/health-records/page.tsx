"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HealthRecordsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/patient/health-records/summary")
  }, [router])

  return null
}
