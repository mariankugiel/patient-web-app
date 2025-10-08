/**
 * Date utility functions for the frontend application
 */

/**
 * Format a date string for HTML date input (YYYY-MM-DD)
 * @param dateStr - Date string in various formats
 * @returns Formatted date string for HTML input or empty string
 */
export const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return ''
  
  try {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    
    // If it's in DD-MM-YYYY format, convert to YYYY-MM-DD
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
      const [day, month, year] = dateStr.split('-')
      const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      return formatted
    }
    
    // Try to parse as a date and format
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      const formatted = date.toISOString().split('T')[0]
      return formatted
    }
    
    return ''
  } catch (e) {
    console.warn('Failed to format date:', dateStr, e)
    return ''
  }
}

/**
 * Format a date object for display
 * @param date - Date object or date string
 * @param format - Display format ('short', 'long', 'iso')
 * @returns Formatted date string
 */
export const formatDateForDisplay = (date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return ''
    }
    
    switch (format) {
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      case 'iso':
        return dateObj.toISOString().split('T')[0]
      case 'short':
      default:
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
    }
  } catch (e) {
    console.warn('Failed to format date for display:', date, e)
    return ''
  }
}

/**
 * Check if a date string is valid
 * @param dateStr - Date string to validate
 * @returns True if valid, false otherwise
 */
export const isValidDateString = (dateStr: string): boolean => {
  if (!dateStr) return false
  
  try {
    const date = new Date(dateStr)
    return !isNaN(date.getTime())
  } catch (e) {
    return false
  }
}

/**
 * Parse a date string and return a Date object
 * @param dateStr - Date string to parse
 * @returns Date object or null if invalid
 */
export const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null
  
  try {
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch (e) {
    return null
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Add days to a date
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get the difference in days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Difference in days (positive if date1 is later)
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const timeDiff = date1.getTime() - date2.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}
