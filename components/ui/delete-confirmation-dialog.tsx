'use client'

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  itemName?: string
  loading?: boolean
  variant?: 'default' | 'destructive'
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Delete Item',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName,
  loading = false,
  variant = 'destructive'
}: DeleteConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const displayTitle = itemName ? `${title} "${itemName}"` : title
  const displayDescription = itemName 
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : description

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              variant === 'destructive' 
                ? 'bg-red-100 text-red-600' 
                : 'bg-orange-100 text-orange-600'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                {displayTitle}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left pt-2">
            {displayDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant={variant}
              onClick={handleConfirm}
              disabled={loading}
              className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}