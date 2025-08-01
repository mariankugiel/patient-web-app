import type { Metadata } from "next"
import MessagesClientPage from "./messages-client-page"

export const metadata: Metadata = {
  title: "Messages | Saluso",
  description: "Communicate with your healthcare providers",
}

export default function MessagesPage() {
  return <MessagesClientPage />
}
