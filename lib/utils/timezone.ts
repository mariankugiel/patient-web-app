/**
 * Utility functions for timezone detection and mapping
 */

/**
 * Detects the user's timezone using the browser's Intl API
 * Returns an IANA timezone identifier (e.g., "America/New_York", "Europe/Berlin")
 */
export function detectUserTimezone(): string {
  if (typeof window === 'undefined') {
    return 'UTC'
  }
  
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return timezone || 'UTC'
  } catch (error) {
    console.warn('Failed to detect timezone, defaulting to UTC:', error)
    return 'UTC'
  }
}

/**
 * Maps a detected timezone to one of our supported timezones
 * If the timezone is already in our list, returns it as-is
 * Otherwise, tries to find the closest match or returns the detected timezone
 */
export function mapToSupportedTimezone(detectedTimezone: string, supportedTimezones: string[]): string {
  // If the detected timezone is already in our supported list, use it
  if (supportedTimezones.includes(detectedTimezone)) {
    return detectedTimezone
  }
  
  // Try to find a timezone in the same region
  // For example, if detected is "Europe/Paris", we might have "Europe/Berlin"
  const detectedRegion = detectedTimezone.split('/')[0]
  const matchingRegion = supportedTimezones.find(tz => tz.startsWith(detectedRegion))
  if (matchingRegion) {
    return matchingRegion
  }
  
  // If no match found, return the detected timezone anyway
  // The backend can handle any valid IANA timezone identifier
  return detectedTimezone
}

