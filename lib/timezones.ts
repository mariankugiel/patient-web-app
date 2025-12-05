export type TimezoneItem = { value: string; label: string; group: string }

/**
 * Comprehensive list of IANA timezone identifiers organized by region
 * These are the standard timezone identifiers used by browsers and timezone libraries
 */
export const timezones: TimezoneItem[] = [
  // North America
  { value: "America/New_York", label: "Eastern Time (ET)", group: "North America" },
  { value: "America/Chicago", label: "Central Time (CT)", group: "North America" },
  { value: "America/Denver", label: "Mountain Time (MT)", group: "North America" },
  { value: "America/Phoenix", label: "Mountain Time - Arizona (MST)", group: "North America" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", group: "North America" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", group: "North America" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)", group: "North America" },
  { value: "America/Toronto", label: "Eastern Time - Toronto", group: "North America" },
  { value: "America/Vancouver", label: "Pacific Time - Vancouver", group: "North America" },
  { value: "America/Mexico_City", label: "Central Time - Mexico City", group: "North America" },
  
  // South America
  { value: "America/Sao_Paulo", label: "Brasília Time (BRT)", group: "South America" },
  { value: "America/Buenos_Aires", label: "Argentina Time (ART)", group: "South America" },
  { value: "America/Lima", label: "Peru Time (PET)", group: "South America" },
  { value: "America/Bogota", label: "Colombia Time (COT)", group: "South America" },
  { value: "America/Santiago", label: "Chile Time (CLT)", group: "South America" },
  { value: "America/Caracas", label: "Venezuela Time (VET)", group: "South America" },
  
  // Europe
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)", group: "Europe" },
  { value: "Europe/Dublin", label: "Irish Standard Time (IST)", group: "Europe" },
  { value: "Europe/Paris", label: "Central European Time - Paris (CET)", group: "Europe" },
  { value: "Europe/Berlin", label: "Central European Time - Berlin (CET)", group: "Europe" },
  { value: "Europe/Rome", label: "Central European Time - Rome (CET)", group: "Europe" },
  { value: "Europe/Madrid", label: "Central European Time - Madrid (CET)", group: "Europe" },
  { value: "Europe/Amsterdam", label: "Central European Time - Amsterdam (CET)", group: "Europe" },
  { value: "Europe/Brussels", label: "Central European Time - Brussels (CET)", group: "Europe" },
  { value: "Europe/Vienna", label: "Central European Time - Vienna (CET)", group: "Europe" },
  { value: "Europe/Zurich", label: "Central European Time - Zurich (CET)", group: "Europe" },
  { value: "Europe/Stockholm", label: "Central European Time - Stockholm (CET)", group: "Europe" },
  { value: "Europe/Oslo", label: "Central European Time - Oslo (CET)", group: "Europe" },
  { value: "Europe/Copenhagen", label: "Central European Time - Copenhagen (CET)", group: "Europe" },
  { value: "Europe/Helsinki", label: "Eastern European Time - Helsinki (EET)", group: "Europe" },
  { value: "Europe/Athens", label: "Eastern European Time - Athens (EET)", group: "Europe" },
  { value: "Europe/Bucharest", label: "Eastern European Time - Bucharest (EET)", group: "Europe" },
  { value: "Europe/Warsaw", label: "Central European Time - Warsaw (CET)", group: "Europe" },
  { value: "Europe/Prague", label: "Central European Time - Prague (CET)", group: "Europe" },
  { value: "Europe/Budapest", label: "Central European Time - Budapest (CET)", group: "Europe" },
  { value: "Europe/Lisbon", label: "Western European Time - Lisbon (WET)", group: "Europe" },
  { value: "Europe/Moscow", label: "Moscow Time (MSK)", group: "Europe" },
  { value: "Europe/Kiev", label: "Eastern European Time - Kyiv (EET)", group: "Europe" },
  { value: "Europe/Istanbul", label: "Turkey Time (TRT)", group: "Europe" },
  
  // Africa
  { value: "Africa/Cairo", label: "Eastern European Time - Cairo (EET)", group: "Africa" },
  { value: "Africa/Johannesburg", label: "South Africa Standard Time (SAST)", group: "Africa" },
  { value: "Africa/Lagos", label: "West Africa Time (WAT)", group: "Africa" },
  { value: "Africa/Nairobi", label: "East Africa Time (EAT)", group: "Africa" },
  { value: "Africa/Casablanca", label: "Western European Time - Casablanca (WET)", group: "Africa" },
  
  // Middle East
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)", group: "Middle East" },
  { value: "Asia/Riyadh", label: "Arabia Standard Time (AST)", group: "Middle East" },
  { value: "Asia/Tehran", label: "Iran Standard Time (IRST)", group: "Middle East" },
  { value: "Asia/Jerusalem", label: "Israel Standard Time (IST)", group: "Middle East" },
  { value: "Asia/Kuwait", label: "Arabia Standard Time - Kuwait (AST)", group: "Middle East" },
  { value: "Asia/Doha", label: "Arabia Standard Time - Doha (AST)", group: "Middle East" },
  
  // Asia
  { value: "Asia/Kolkata", label: "India Standard Time (IST)", group: "Asia" },
  { value: "Asia/Karachi", label: "Pakistan Standard Time (PKT)", group: "Asia" },
  { value: "Asia/Dhaka", label: "Bangladesh Standard Time (BST)", group: "Asia" },
  { value: "Asia/Colombo", label: "Sri Lanka Time (SLT)", group: "Asia" },
  { value: "Asia/Kathmandu", label: "Nepal Time (NPT)", group: "Asia" },
  { value: "Asia/Bangkok", label: "Indochina Time (ICT)", group: "Asia" },
  { value: "Asia/Jakarta", label: "Western Indonesia Time (WIB)", group: "Asia" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)", group: "Asia" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia Time (MYT)", group: "Asia" },
  { value: "Asia/Manila", label: "Philippine Time (PHT)", group: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong Time (HKT)", group: "Asia" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)", group: "Asia" },
  { value: "Asia/Taipei", label: "Taiwan Time (TWT)", group: "Asia" },
  { value: "Asia/Seoul", label: "Korea Standard Time (KST)", group: "Asia" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)", group: "Asia" },
  { value: "Asia/Vladivostok", label: "Vladivostok Time (VLAT)", group: "Asia" },
  
  // Australia & Pacific
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)", group: "Australia & Pacific" },
  { value: "Australia/Melbourne", label: "Australian Eastern Time - Melbourne (AET)", group: "Australia & Pacific" },
  { value: "Australia/Brisbane", label: "Australian Eastern Time - Brisbane (AET)", group: "Australia & Pacific" },
  { value: "Australia/Adelaide", label: "Australian Central Time (ACT)", group: "Australia & Pacific" },
  { value: "Australia/Perth", label: "Australian Western Time (AWT)", group: "Australia & Pacific" },
  { value: "Australia/Darwin", label: "Australian Central Time - Darwin (ACT)", group: "Australia & Pacific" },
  { value: "Pacific/Auckland", label: "New Zealand Time (NZST)", group: "Australia & Pacific" },
  { value: "Pacific/Fiji", label: "Fiji Time (FJT)", group: "Australia & Pacific" },
  
  // UTC
  { value: "UTC", label: "Coordinated Universal Time (UTC)", group: "UTC" },
]

/**
 * Get timezone by value
 */
export function getTimezoneByValue(value: string): TimezoneItem | undefined {
  return timezones.find(tz => tz.value === value)
}

/**
 * Get timezone label by value
 */
export function getTimezoneLabel(value: string): string {
  const tz = getTimezoneByValue(value)
  return tz ? tz.label : value
}

/**
 * Group timezones by region
 */
export function getTimezonesByGroup(): Record<string, TimezoneItem[]> {
  return timezones.reduce((acc, tz) => {
    if (!acc[tz.group]) {
      acc[tz.group] = []
    }
    acc[tz.group].push(tz)
    return acc
  }, {} as Record<string, TimezoneItem[]>)
}
