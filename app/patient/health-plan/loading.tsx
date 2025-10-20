import { Loader2 } from "lucide-react"

export default function HealthPlanLoading() {
  return (
    <div className="container py-6">
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading health plan...</span>
        </div>
      </div>
    </div>
  )
}