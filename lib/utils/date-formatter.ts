/**
 * Format a date string or Date object to a readable format
 * @param date - Date string (ISO format) or Date object
 * @param format - Format type: 'long' (April 15, 2023) or 'short' (4/15/2023)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | null | undefined, format: 'long' | 'short' = 'long'): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    if (format === 'long') {
      // Format: "April 15, 2023"
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } else {
      // Format: "4/15/2023"
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
    }
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

/**
 * Format a date string or Date object to a short format with time
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date and time string (e.g., "April 15, 2023, 3:30 PM")
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch (error) {
    console.error('Error formatting date time:', error)
    return 'Invalid Date'
  }
}

/**
 * Format a date string or Date object to relative time
 * @param date - Date string (ISO format) or Date object
 * @returns Relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return 'Invalid Date'
  }
}

