import React from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface CircleDateButtonProps {
  isCompleted: boolean
  isLoading?: boolean
  onClick: () => void
  dateLabel?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CircleDateButton({ 
  isCompleted, 
  isLoading = false, 
  onClick, 
  dateLabel,
  size = 'md' 
}: CircleDateButtonProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const loaderSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} border-2 border-gray-200 flex items-center justify-center bg-gray-50 rounded-full`}>
        <Loader2 className={`${loaderSizes[size]} animate-spin text-gray-400`} />
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} border-2 border-gray-300 flex items-center justify-center transition-colors rounded-full ${
        isCompleted ? "bg-teal-100 border-teal-500" : "bg-white hover:bg-gray-50"
      }`}
      title={dateLabel}
    >
      {isCompleted && <CheckCircle2 className={`${iconSizes[size]} text-teal-600`} />}
    </button>
  )
}
