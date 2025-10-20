import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TaskItemProps {
  task: {
    id: string
    name: string
    time_of_day: string
    goal_id?: string | null
    metric?: string
    frequency?: string
  }
  completed: number
  total: number
  onEdit: (task: any, type: string) => void
  onDelete: (taskId: string) => void
  getHealthGoalNames: (goalIds: string[]) => string
  t: (key: string) => string
}

export function TaskItem({ 
  task, 
  completed, 
  total, 
  onEdit, 
  onDelete, 
  getHealthGoalNames, 
  t 
}: TaskItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    onDelete(task.id)
    setShowDeleteDialog(false)
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{task.name}</p>
        <p className="text-sm text-muted-foreground">
          {task.goal_id ? (
            <>
              {getHealthGoalNames([task.goal_id.toString()])} - {task.frequency || task.time_of_day}
              <span className="ml-2 text-xs px-2 py-1 rounded" style={{
                backgroundColor: task.metric && task.metric !== "none" ? '#dbeafe' : '#f3f4f6',
                color: task.metric && task.metric !== "none" ? '#1e40af' : '#6b7280'
              }}>
                📊 {task.metric && task.metric !== "none" ? task.metric : "No metric"}
              </span>
            </>
          ) : (
            <>
              {t("healthPlan.noLinkedGoals")}
              <span className="ml-2 text-xs px-2 py-1 rounded" style={{
                backgroundColor: task.metric && task.metric !== "none" ? '#dbeafe' : '#f3f4f6',
                color: task.metric && task.metric !== "none" ? '#1e40af' : '#6b7280'
              }}>
                📊 {task.metric && task.metric !== "none" ? task.metric : "No metric"}
              </span>
            </>
          )}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{task.time_of_day}</span>
        </div>
        <Badge variant="outline">
          {completed}/{total}
        </Badge>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task, "task")}
            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("healthPlan.confirmDeleteTask")}</DialogTitle>
            <DialogDescription>
              {t("healthPlan.confirmDeleteTaskDesc").replace("{taskName}", task.name)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
