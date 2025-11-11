import { Suspense } from "react"
import type { Metadata } from "next"
import MessagesClientPage from "./messages-client-page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Messages | Saluso",
  description: "Communicate with your healthcare providers",
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" />}>
      <MessagesClientPage />
    </Suspense>
  )
}
