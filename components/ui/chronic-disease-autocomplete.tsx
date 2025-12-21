"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Heart, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

// Disease keys in order (used as identifiers)
const DISEASE_KEYS = [
  "hypertension",
  "ischemicHeartDisease",
  "stroke",
  "type2Diabetes",
  "type1Diabetes",
  "cancer",
  "copd",
  "asthma",
  "arthritis",
  "backProblems",
  "chronicKidneyDisease",
  "highCholesterol",
  "obesity",
  "depression",
  "osteoporosis",
  "neurodegenerative",
  "chronicLiverDisease",
  "chronicGastrointestinal",
  "thyroidDisorders",
  "asthmaChronicBronchitis",
  "chronicSkin",
  "chronicDigestive",
  "chronicPain",
  "neurologicalBeyondDementia",
  "chronicMentalHealth",
  "chronicEyeDiseases",
  "chronicHearing",
  "chronicOralDental",
  "chronicRespiratoryAllergies",
  "chronicUrogenital",
  "chronicMetabolic",
  "others",
] as const

interface ChronicDiseaseAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: string
  disabled?: boolean
}

export function ChronicDiseaseAutocomplete({
  value,
  onChange,
  placeholder = "Search or type a chronic disease...",
  className,
  error,
  disabled = false,
}: ChronicDiseaseAutocompleteProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [filteredDiseases, setFilteredDiseases] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get translated diseases list
  const translatedDiseases = useMemo(() => {
    return DISEASE_KEYS.map(key => t(`health.chronicDiseaseList.${key}`))
  }, [t])

  // Filter diseases based on search query
  useEffect(() => {
    if (!value.trim()) {
      setFilteredDiseases(translatedDiseases)
      return
    }

    const query = value.toLowerCase().trim()
    const filtered = translatedDiseases.filter(disease =>
      disease.toLowerCase().includes(query)
    )

    setFilteredDiseases(filtered)
  }, [value, translatedDiseases])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
    setSelectedIndex(-1)
  }

  // Handle disease selection
  const handleDiseaseSelect = (disease: string) => {
    onChange(disease)
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || !isOpen || filteredDiseases.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredDiseases.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredDiseases.length) {
          handleDiseaseSelect(filteredDiseases[selectedIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listRef.current &&
        !listRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        })
      }
    }
  }, [selectedIndex])

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pr-10",
            error && "border-red-500",
            className
          )}
          disabled={disabled}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("")
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!disabled && isOpen && filteredDiseases.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredDiseases.map((disease, index) => (
            <div
              key={disease}
              className={cn(
                "p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700",
                index === selectedIndex && "bg-blue-50 dark:bg-blue-900/20"
              )}
              onClick={() => handleDiseaseSelect(disease)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-start gap-2">
                <Heart className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {disease}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}




