"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Check, Search, Loader2, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface Contact {
  id: string
  name: string
  firstName?: string
  lastName?: string
  role: string
  avatar?: string
  isOnline: boolean
  specialty?: string
}

interface RecipientAutocompleteProps {
  selectedRecipient: Contact | null
  onSelectRecipient: (recipient: Contact | null) => void
  onSearch?: (query: string) => void
  contacts: Contact[]
  loading?: boolean
  placeholder?: string
  disabled?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  loadingMore?: boolean
}

export function RecipientAutocomplete({
  selectedRecipient,
  onSelectRecipient,
  onSearch,
  contacts,
  loading = false,
  placeholder = "Search for a person...",
  disabled = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false
}: RecipientAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search - trigger backend search after user stops typing
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Only search if onSearch function is provided
    if (!onSearch) return

    // Don't search if query is empty and we already have contacts loaded
    // This prevents unnecessary API calls when clearing selection
    if (searchQuery === "" && contacts.length > 0) {
      return
    }

    // Set new timer for 300ms debounce
    debounceTimerRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(searchQuery)
      }
    }, 300)

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, onSearch, contacts.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    if (!hasMore || !onLoadMore || loadingMore || !isOpen) {
      return
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loadingMore) {
          onLoadMore()
        }
      },
      {
        root: scrollAreaRef.current,
        rootMargin: "50px", // Load more when within 50px of bottom
        threshold: 0.1
      }
    )

    // Observe the load more trigger element
    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, onLoadMore, loadingMore, isOpen, contacts])

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleSelectContact = (contact: Contact) => {
    onSelectRecipient(contact)
    setSearchQuery("")
    setIsOpen(false)
  }

  const handleClearSelection = () => {
    onSelectRecipient(null)
    setSearchQuery("")
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  return (
    <div className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        {selectedRecipient ? (
          // Selected Recipient Display
          <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedRecipient.avatar} alt={selectedRecipient.name} />
                <AvatarFallback>
                  {selectedRecipient.firstName?.charAt(0) || selectedRecipient.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {/* Status Dot */}
              {selectedRecipient.isOnline ? (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              ) : (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-400 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {selectedRecipient.firstName && selectedRecipient.lastName 
                  ? `${selectedRecipient.firstName} ${selectedRecipient.lastName}`
                  : selectedRecipient.name
                }
              </div>
              <div className="text-xs text-gray-500 truncate">
                {selectedRecipient.role}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {selectedRecipient.isOnline ? (
                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Online
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                  Offline
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                disabled={disabled}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          // Search Input
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={disabled}
              className="pl-10 pr-10"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropdown List */}
      {isOpen && !selectedRecipient && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[300px] overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {searchQuery ? "No contacts found" : "No contacts available"}
            </div>
          ) : (
            <div ref={scrollAreaRef} className="max-h-[300px] overflow-y-auto">
              <div className="p-1">
                {contacts.map((contact: Contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 transition-colors text-left",
                      "focus:outline-none focus:bg-gray-100"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar} alt={contact.name} />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {/* Status Dot */}
                      {contact.isOnline ? (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      ) : (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {contact.firstName && contact.lastName 
                          ? `${contact.firstName} ${contact.lastName}`
                          : contact.name
                        }
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {contact.role}
                        {contact.specialty && ` • ${contact.specialty}`}
                      </div>
                    </div>
                    {contact.isOnline ? (
                      <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                        Offline
                      </Badge>
                    )}
                  </button>
                ))}
                
                {/* Load More Trigger */}
                {hasMore && (
                  <div ref={loadMoreTriggerRef} className="py-4">
                    {loadingMore ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">Loading more...</span>
                      </div>
                    ) : (
                      <div className="h-4" /> // Invisible trigger element
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

