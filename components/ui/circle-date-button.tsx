import React, { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface CircleDateButtonProps {
  isCompleted: boolean
  isLoading?: boolean
  onClick: () => void
  onDoubleClick?: () => void
  dateLabel?: string
  size?: 'sm' | 'md' | 'lg'
  mode?: 'check' | 'number'
  currentValue?: number
  maxValue?: number
  targetOperator?: string
  targetValue?: number
}

export function CircleDateButton({ 
  isCompleted, 
  isLoading = false, 
  onClick, 
  onDoubleClick,
  dateLabel,
  size = 'md',
  mode = 'check',
  currentValue = 0,
  maxValue = 1,
  targetOperator,
  targetValue
}: CircleDateButtonProps) {
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)
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

  const handleClick = () => {
    if (clickTimeout) {
      // Double click detected
      clearTimeout(clickTimeout)
      setClickTimeout(null)
      onDoubleClick?.()
    } else {
      // Single click - set timeout to detect double click
      const timeout = setTimeout(() => {
        onClick()
        setClickTimeout(null)
      }, 200) // Increased delay for better double-click detection
      setClickTimeout(timeout)
    }
  }

  const getDisplayValue = () => {
    if (mode === 'number') {
      return currentValue
    }
    return null
  }

  const getBackgroundColor = () => {
    if (mode === 'number') {
      // For unlimited daily tasks (maxValue = Infinity), check target matching
      if (maxValue === Infinity) {
        if (currentValue === 0) return "bg-white border-gray-300"
        
        // Check if current value matches target criteria
        if (targetOperator && targetValue !== undefined) {
          const matchesTarget = checkTargetMatch(currentValue, targetOperator, targetValue)
          if (matchesTarget) {
            return "bg-green-100 border-green-500" // Success color
          } else {
            return "bg-yellow-100 border-yellow-500" // Warning color
          }
        }
        
        // Default blue if no target criteria
        return "bg-blue-100 border-blue-500"
      }
      // For limited tasks, use progress percentage
      const progress = maxValue > 0 ? currentValue / maxValue : 0
      if (progress >= 1) return "bg-green-100 border-green-500"
      if (progress > 0) return "bg-blue-100 border-blue-500"
      return "bg-white border-gray-300"
    }
    
    // For check mode (weekly/monthly tasks), check target matching when completed
    if (mode === 'check') {
      if (isCompleted && targetOperator && targetValue !== undefined) {
        // For weekly/monthly tasks, we need to pass the total completed count
        // This will be handled by the parent component passing currentValue
        if (currentValue > 0) {
          const matchesTarget = checkTargetMatch(currentValue, targetOperator, targetValue)
          if (matchesTarget) {
            return "bg-green-100 border-green-500" // Success color
          } else {
            return "bg-yellow-100 border-yellow-500" // Warning color
          }
        }
      }
      return isCompleted ? "bg-teal-100 border-teal-500" : "bg-white border-gray-300"
    }
    
    return isCompleted ? "bg-teal-100 border-teal-500" : "bg-white border-gray-300"
  }

  const checkTargetMatch = (current: number, operator: string, target: number): boolean => {
    switch (operator) {
      case 'below':
        return current < target
      case 'above':
        return current > target
      case 'equal':
        return current === target
      default:
        return false
    }
  }

  const getIconColor = () => {
    if (mode === 'check' && isCompleted) {
      // For check mode, check target matching when completed
      if (targetOperator && targetValue !== undefined && currentValue > 0) {
        const matchesTarget = checkTargetMatch(currentValue, targetOperator, targetValue)
        return matchesTarget ? 'text-green-600' : 'text-yellow-600'
      }
      // Default teal for completed items without target criteria
      return 'text-teal-600'
    }
    return 'text-teal-600'
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
      onClick={handleClick}
      className={`${sizeClasses[size]} border-2 flex items-center justify-center transition-colors rounded-full hover:bg-gray-50 ${getBackgroundColor()}`}
      title={dateLabel}
    >
      {mode === 'check' && isCompleted && <CheckCircle2 className={`${iconSizes[size]} ${getIconColor()}`} />}
      {mode === 'number' && (
        <span className={`text-xs font-medium ${
          maxValue === Infinity && targetOperator && targetValue !== undefined ? 
            (checkTargetMatch(currentValue, targetOperator, targetValue) ? 'text-green-600' : 'text-yellow-600') :
          maxValue !== Infinity && currentValue >= maxValue ? 'text-green-600' : 
          currentValue > 0 ? 'text-blue-600' : 'text-gray-500'
        }`}>
          {getDisplayValue()}
        </span>
      )}
    </button>
  )
}
