import ProfileClientPage from "./profile-client-page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile & Settings | Saluso",
  description: "Manage your profile and application settings",
}

export default function ProfilePage() {
  return (
    <div className="container py-6">
      <ProfileClientPage />
    </div>
  )
}
