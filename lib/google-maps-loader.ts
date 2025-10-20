// Global Google Maps loader to prevent multiple script loading
let isGoogleMapsLoading = false
let isGoogleMapsLoaded = false
const loadingCallbacks: (() => void)[] = []

export const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (isGoogleMapsLoaded && window.google && window.google.maps) {
      resolve()
      return
    }

    // If currently loading, add to callbacks
    if (isGoogleMapsLoading) {
      loadingCallbacks.push(() => resolve())
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    
    if (!apiKey || apiKey === "your_google_places_api_key_here") {
      reject(new Error("Google Places API key not configured"))
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        isGoogleMapsLoaded = true
        resolve()
        loadingCallbacks.forEach(callback => callback())
        loadingCallbacks.length = 0
      })
      return
    }

    // Start loading
    isGoogleMapsLoading = true

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      isGoogleMapsLoaded = true
      isGoogleMapsLoading = false
      resolve()
      loadingCallbacks.forEach(callback => callback())
      loadingCallbacks.length = 0
    }
    
    script.onerror = () => {
      isGoogleMapsLoading = false
      reject(new Error('Failed to load Google Maps API'))
    }
    
    document.head.appendChild(script)
  })
}

export const isGoogleMapsReady = (): boolean => {
  return isGoogleMapsLoaded && window.google && window.google.maps
}
