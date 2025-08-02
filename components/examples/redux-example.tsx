"use client"

import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { addNotification, toggleSidebar } from "@/lib/features/ui/uiSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ReduxExample() {
  const dispatch = useAppDispatch()
  const { sidebarOpen, notifications } = useAppSelector((state) => state.ui)
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)

  const handleAddNotification = () => {
    dispatch(
      addNotification({
        type: "success",
        title: "Success!",
        message: "Redux is working correctly!",
      }),
    )
  }

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar())
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Redux State Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p>
            <strong>Sidebar Open:</strong> {sidebarOpen ? "Yes" : "No"}
          </p>
          <p>
            <strong>Notifications:</strong> {notifications.length}
          </p>
          <p>
            <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
          </p>
          {user && (
            <p>
              <strong>User:</strong> {user.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Button onClick={handleToggleSidebar} variant="outline">
            Toggle Sidebar
          </Button>
          <Button onClick={handleAddNotification}>Add Notification</Button>
        </div>
      </CardContent>
    </Card>
  )
}
