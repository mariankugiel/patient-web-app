import { redirect } from "next/navigation"

export default function ProfileSettingsRedirect() {
  redirect("/patient/profile?tab=settings")
}
