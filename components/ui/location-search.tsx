"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Declare Google Maps types
declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

interface LocationResult {
  id: string
  display_name: string
  address: {
    city?: string
    state?: string
    country?: string
    country_code?: string
  }
  lat: string
  lon: string
}

interface LocationSearchProps {
  value: string
  onChange: (location: string, details?: LocationResult) => void
  placeholder?: string
  label?: string
  className?: string
  error?: string
  required?: boolean
}

export function LocationSearch({
  value,
  onChange,
  placeholder = "Search for a location...",
  label = "Location",
  className,
  error,
  required = false
}: LocationSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<LocationResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)

  // Debug: Log when value prop changes
  useEffect(() => {
    console.log("LocationSearch value prop changed to:", value)
  }, [value])

  // Load Google Maps SDK
  useEffect(() => {
    const loadGoogleMaps = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
      
      if (!apiKey || apiKey === "your_google_places_api_key_here") {
        return
      }

      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true)
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        )
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        setIsGoogleMapsLoaded(true)
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        )
      }
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  // Debounced search function
  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    
    try {
      // Try Google Places API first (if loaded)
      if (isGoogleMapsLoaded && autocompleteServiceRef.current) {
        const googleResults = await searchGooglePlaces(query)
        if (googleResults.length > 0) {
          setResults(googleResults)
          setIsLoading(false)
          return
        }
      }
    } catch (error) {
      // Fallback to Nominatim on error
    }

    try {
      // Fallback to OpenStreetMap Nominatim (free)
      const nominatimResults = await searchNominatim(query)
      setResults(nominatimResults)
    } catch (error) {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Google Places API search using JavaScript SDK
  const searchGooglePlaces = async (query: string): Promise<LocationResult[]> => {
    return new Promise((resolve, reject) => {
      if (!autocompleteServiceRef.current) {
        reject(new Error("Google Places service not initialized"))
        return
      }

      const request = {
        input: query,
        types: ['geocode']
      }

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions: any[], status: any) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          reject(new Error(`Google Places API error: ${status}`))
          return
        }

        // Get detailed place information for each prediction
        const detailedResults = predictions.slice(0, 5).map((prediction: any) => {
          return new Promise<LocationResult>((resolveDetail) => {
            if (!placesServiceRef.current) {
              resolveDetail({
                id: prediction.place_id,
                display_name: prediction.description,
                address: {},
                lat: "0",
                lon: "0"
              })
              return
            }

            const detailsRequest = {
              placeId: prediction.place_id,
              fields: ['geometry', 'address_components', 'formatted_address']
            }

            placesServiceRef.current.getDetails(detailsRequest, (place: any, detailStatus: any) => {
              if (detailStatus !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
                resolveDetail({
                  id: prediction.place_id,
                  display_name: prediction.description,
                  address: {},
                  lat: "0",
                  lon: "0"
                })
                return
              }

              const location = place.geometry?.location
              
              // Parse address components
              const addressComponents = place.address_components || []
              const address = {
                city: addressComponents.find((comp: any) => 
                  comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
                )?.long_name,
                state: addressComponents.find((comp: any) => 
                  comp.types.includes('administrative_area_level_1')
                )?.long_name,
                country: addressComponents.find((comp: any) => 
                  comp.types.includes('country')
                )?.long_name,
                country_code: addressComponents.find((comp: any) => 
                  comp.types.includes('country')
                )?.short_name
              }

              resolveDetail({
                id: prediction.place_id,
                display_name: prediction.description,
                address,
                lat: location?.lat?.toString() || "0",
                lon: location?.lng?.toString() || "0"
              })
            })
          })
        })

        Promise.all(detailedResults).then(results => {
          resolve(results.filter(result => result.lat !== "0" && result.lon !== "0"))
        }).catch(reject)
      })
    })
  }

  // OpenStreetMap Nominatim search (free fallback)
  const searchNominatim = async (query: string): Promise<LocationResult[]> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&extratags=1`
    )
    
    if (!response.ok) {
      throw new Error("Nominatim API request failed")
    }

    const data = await response.json()
    
    return data.map((item: any, index: number) => ({
      id: `nominatim_${index}`,
      display_name: item.display_name,
      address: {
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
        country_code: item.address?.country_code?.toUpperCase()
      },
      lat: item.lat,
      lon: item.lon
    }))
  }

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    onChange(query)

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    // Set new timeout for search
    debounceRef.current = setTimeout(() => {
      searchLocations(query)
    }, 300)
  }

  // Handle result selection
  const handleResultSelect = (result: LocationResult) => {
    console.log("Selecting result:", result.display_name)
    console.log("Current value before selection:", value)
    onChange(result.display_name, result)
    console.log("onChange called with:", result.display_name)
    setIsOpen(false)
    setResults([])
    setSelectedIndex(-1)
    
    // Clear any pending search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideInput = inputRef.current && inputRef.current.contains(target)
      const isInsideDropdown = listRef.current && listRef.current.contains(target)
      
      if (!isInsideInput && !isInsideDropdown) {
        console.log("Click outside detected, closing dropdown")
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" })
      }
    }
  }, [selectedIndex])

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="location">
        {label} {required && "*"}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="location"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "border-2 pr-10",
            error ? "border-red-500" : "border-gray-300"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (results.length > 0 || isLoading) && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Searching locations...
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={result.id}
                className={cn(
                  "p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50",
                  index === selectedIndex && "bg-blue-50"
                )}
                onClick={(e) => {
                  console.log("Result clicked:", result.display_name)
                  e.preventDefault()
                  e.stopPropagation()
                  handleResultSelect(result)
                }}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {result.display_name}
                    </div>
                    {result.address.city && (
                      <div className="text-sm text-gray-500">
                        {result.address.city}
                        {result.address.state && `, ${result.address.state}`}
                        {result.address.country && `, ${result.address.country}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
