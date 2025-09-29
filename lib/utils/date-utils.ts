/**
 * Utility functions for date handling and conversion
 */

/**
 * Converts a date string to ISO format (YYYY-MM-DD) with time component
 * Handles various input formats including US date format (MM/DD/YYYY)
 * 
 * @param dateString - The date string to convert
 * @param timeComponent - The time component to append (default: "T00:00:00")
 * @returns ISO formatted datetime string or null if invalid
 */
export function convertToISODateTime(dateString: string, timeComponent: string = "T00:00:00"): string | null {
  if (!dateString || !dateString.trim()) {
    return null;
  }

  try {
    // Create a Date object from the input string
    const date = new Date(dateString.trim());
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateString);
      return null;
    }

    // Convert to ISO date format (YYYY-MM-DD)
    const isoDate = date.toISOString().split('T')[0];
    
    // Return the ISO date with time component
    return `${isoDate}${timeComponent}`;
  } catch (error) {
    console.warn('Error converting date:', dateString, error);
    return null;
  }
}

/**
 * Converts a date string to ISO date format (YYYY-MM-DD) only
 * 
 * @param dateString - The date string to convert
 * @returns ISO formatted date string or null if invalid
 */
export function convertToISODate(dateString: string): string | null {
  if (!dateString || !dateString.trim()) {
    return null;
  }

  try {
    const date = new Date(dateString.trim());
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateString);
      return null;
    }

    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error converting date:', dateString, error);
    return null;
  }
}

/**
 * Formats a date for display in the UI
 * 
 * @param dateString - The date string to format
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted date string or empty string if invalid
 */
export function formatDateForDisplay(dateString: string, locale: string = 'en-US'): string {
  if (!dateString || !dateString.trim()) {
    return '';
  }

  try {
    const date = new Date(dateString.trim());
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format for display:', dateString);
      return '';
    }

    return date.toLocaleDateString(locale);
  } catch (error) {
    console.warn('Error formatting date for display:', dateString, error);
    return '';
  }
}

/**
 * Validates if a date string is in a valid format
 * 
 * @param dateString - The date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString || !dateString.trim()) {
    return false;
  }

  try {
    const date = new Date(dateString.trim());
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
}
