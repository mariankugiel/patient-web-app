"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { FileText, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SectionTemplate {
  id: number
  name: string
  display_name: string
  description?: string
  health_record_type_id: number
  is_default: boolean
}

interface SectionAutocompleteProps {
  value: string
  onChange: (value: string, selectedTemplate?: SectionTemplate | null) => void
  templates: SectionTemplate[]
  placeholder?: string
  className?: string
  error?: string
  isLoading?: boolean
  onNewSection?: (sectionName: string) => void
}

export function SectionAutocomplete({
  value,
  onChange,
  templates,
  placeholder = "Search or type a section name...",
  className,
  error,
  isLoading = false,
  onNewSection,
}: SectionAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredTemplates, setFilteredTemplates] = useState<SectionTemplate[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showNewOption, setShowNewOption] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Filter templates based on search query
  useEffect(() => {
    if (!value.trim()) {
      setFilteredTemplates(templates)
      setShowNewOption(false)
      return
    }

    const query = value.toLowerCase().trim()
    const filtered = templates.filter(template =>
      template.display_name.toLowerCase().includes(query) ||
      template.name.toLowerCase().includes(query)
    )

    setFilteredTemplates(filtered)

    // Show "Create new" option if:
    // 1. User has typed something
    // 2. No exact match exists in templates
    // 3. The typed value is different from all template display names
    const exactMatch = templates.find(
      t => t.display_name.toLowerCase() === query
    )
    setShowNewOption(!exactMatch && query.length > 0)
  }, [value, templates])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue, null) // Clear selected template when typing
    setIsOpen(true)
    setSelectedIndex(-1)
  }

  // Handle template selection
  const handleTemplateSelect = (template: SectionTemplate) => {
    onChange(template.display_name, template)
    setIsOpen(false)
    setSelectedIndex(-1)
    
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }

  // Handle creating new section
  const handleCreateNew = () => {
    if (value.trim() && onNewSection) {
      onNewSection(value.trim())
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true)
      }
      return
    }

    const totalOptions = filteredTemplates.length + (showNewOption ? 1 : 0)

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < totalOptions - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < filteredTemplates.length) {
            handleTemplateSelect(filteredTemplates[selectedIndex])
          } else if (showNewOption) {
            handleCreateNew()
          }
        } else if (showNewOption && value.trim()) {
          // If no selection but new option is available, create new
          handleCreateNew()
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
      <div className="relative">
        <Input
          ref={inputRef}
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
            <FileText className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (filteredTemplates.length > 0 || showNewOption || isLoading) && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading sections...
            </div>
          ) : (
            <>
              {filteredTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className={cn(
                    "p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700",
                    index === selectedIndex && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleTemplateSelect(template)
                  }}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {template.display_name}
                      </div>
                      {template.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {template.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {showNewOption && (
                <div
                  className={cn(
                    "p-3 cursor-pointer border-t border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20",
                    selectedIndex === filteredTemplates.length && "bg-green-50 dark:bg-green-900/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCreateNew()
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-green-700 dark:text-green-300">
                        Create new: "{value.trim()}"
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        This will create a new section
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}

