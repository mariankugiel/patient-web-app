"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  PlusCircle, Send, Filter, Search, Bell, MessageSquare, 
  Mic, Paperclip, Smile, MoreVertical,
  X, Pin, Archive, Trash2, Star, User, Clock, CheckCheck
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/language-context"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useMessages } from "@/hooks/use-messages"
import { useRealtimeMessages } from "@/hooks/use-realtime-messages"
import { ConversationList } from "@/components/messages/conversation-list"
import { MessageItem } from "@/components/messages/message-item"
import { EnhancedMessageInput } from "@/components/messages/enhanced-message-input"
import { UserInfoPanel } from "@/components/messages/user-info-panel"
import { RecipientAutocomplete, type Contact } from "@/components/messages/recipient-autocomplete"
import { GlobalHeader } from "@/components/layout/global-header"
import type { MessageFilters, MessageType } from "@/types/messages"
import { messagesApiService } from "@/lib/api/messages-api"

// Sample conversation data
const conversations = [
  {
    id: "1",
    contact: {
      name: "Dr. Johnson",
      avatar: "/compassionate-doctor-consultation.png",
      role: "Primary Care Physician",
      email: "dr.johnson@healthcare.com",
      phone: "+1 (555) 123-4567",
      specialty: "Internal Medicine",
      experience: "15 years",
      rating: 4.9,
      isOnline: true,
      lastSeen: "2023-05-15T17:30:00Z"
    },
    messages: [
      {
        id: "1-1",
        sender: "doctor",
        content: "Hello! How are you feeling after our last appointment?",
        timestamp: "2023-05-15T14:30:00Z",
        isRead: true,
      },
      {
        id: "1-2",
        sender: "patient",
        content: "I'm feeling much better, thank you. The new medication seems to be working well.",
        timestamp: "2023-05-15T15:45:00Z",
        isRead: true,
      },
      {
        id: "1-3",
        sender: "doctor",
        content: "That's great to hear! Any side effects that you've noticed?",
        timestamp: "2023-05-15T16:20:00Z",
        isRead: true,
      },
      {
        id: "1-4",
        sender: "patient",
        content: "Just a bit of drowsiness in the morning, but it goes away after breakfast.",
        timestamp: "2023-05-15T17:05:00Z",
        isRead: true,
      },
      {
        id: "1-5",
        sender: "doctor",
        content:
          "That's a common side effect and should diminish over time. Let's continue with the current dosage and review in two weeks.",
        timestamp: "2023-05-15T17:30:00Z",
        isRead: true,
      },
    ],
    unreadCount: 0,
    lastMessageTime: "2023-05-15T17:30:00Z",
    isPinned: true,
    isArchived: false,
  },
  {
    id: "2",
    contact: {
      name: "Dr. Smith",
      avatar: "/compassionate-heart-care.png",
      role: "Cardiologist",
      email: "dr.smith@cardiology.com",
      phone: "+1 (555) 234-5678",
      specialty: "Cardiology",
      experience: "12 years",
      rating: 4.8,
      isOnline: false,
      lastSeen: "2023-05-10T11:00:00Z"
    },
    messages: [
      {
        id: "2-1",
        sender: "doctor",
        content: "I've reviewed your latest ECG results and everything looks normal.",
        timestamp: "2023-05-10T09:15:00Z",
        isRead: true,
      },
      {
        id: "2-2",
        sender: "patient",
        content: "That's a relief! I was worried about those chest pains I mentioned.",
        timestamp: "2023-05-10T10:30:00Z",
        isRead: true,
      },
      {
        id: "2-3",
        sender: "doctor",
        content:
          "The pains are likely muscular rather than cardiac. I'd recommend some gentle stretching exercises and to avoid heavy lifting for a week.",
        timestamp: "2023-05-10T11:00:00Z",
        isRead: true,
      },
    ],
    unreadCount: 0,
    lastMessageTime: "2023-05-10T11:00:00Z",
    isPinned: false,
    isArchived: false,
  },
  {
    id: "3",
    contact: {
      name: "Dr. Patel",
      avatar: "/doctor-explaining-endocrine-system.png",
      role: "Endocrinologist",
      email: "dr.patel@endocrinology.com",
      phone: "+1 (555) 345-6789",
      specialty: "Endocrinology",
      experience: "18 years",
      rating: 4.9,
      isOnline: true,
      lastSeen: "2023-05-05T16:50:00Z"
    },
    messages: [
      {
        id: "3-1",
        sender: "doctor",
        content: "Based on your latest blood work, we need to adjust your insulin dosage.",
        timestamp: "2023-05-05T16:45:00Z",
        isRead: false,
      },
      {
        id: "3-2",
        sender: "doctor",
        content:
          "Please reduce your morning dose to 10 units instead of 12 units. Continue monitoring your blood glucose levels and send me your readings at the end of the week.",
        timestamp: "2023-05-05T16:50:00Z",
        isRead: false,
      },
    ],
    unreadCount: 2,
    lastMessageTime: "2023-05-05T16:50:00Z",
    isPinned: false,
    isArchived: false,
  },
  {
    id: "4",
    contact: {
      name: "Health Plan Support",
      avatar: "/diverse-healthy-lifestyle.png",
      role: "Health Plan Team",
      email: "support@healthplan.com",
      phone: "+1 (555) 456-7890",
      specialty: "Health Plan Management",
      experience: "8 years",
      rating: 4.7,
      isOnline: true,
      lastSeen: "2023-05-02T16:15:00Z"
    },
    messages: [
      {
        id: "4-1",
        sender: "system",
        content: "Your new health plan 'Weight Management' has been created.",
        timestamp: "2023-05-01T11:00:00Z",
        isRead: true,
      },
      {
        id: "4-2",
        sender: "patient",
        content: "I'm finding it difficult to meet the daily step goal. Can we adjust it?",
        timestamp: "2023-05-02T14:20:00Z",
        isRead: true,
      },
      {
        id: "4-3",
        sender: "system",
        content: "Your health plan has been updated. Daily step goal changed from 10,000 to 7,500.",
        timestamp: "2023-05-02T15:30:00Z",
        isRead: true,
      },
      {
        id: "4-4",
        sender: "patient",
        content: "Thank you! This seems more achievable for me right now.",
        timestamp: "2023-05-02T16:15:00Z",
        isRead: true,
      },
    ],
    unreadCount: 0,
    lastMessageTime: "2023-05-02T16:15:00Z",
    isPinned: false,
    isArchived: false,
  },
  {
    id: "5",
    contact: {
      name: "Medication Reminders",
      avatar: "/diverse-medication-display.png",
      role: "Medication System",
      email: "medications@healthcare.com",
      phone: "System",
      specialty: "Medication Management",
      experience: "Automated",
      rating: 4.6,
      isOnline: true,
      lastSeen: "2023-04-29T13:15:00Z"
    },
    messages: [
      {
        id: "5-1",
        sender: "system",
        content: "Your prescription for Lisinopril has been renewed. You can pick it up from your pharmacy.",
        timestamp: "2023-04-28T09:00:00Z",
        isRead: true,
      },
      {
        id: "5-2",
        sender: "patient",
        content: "I'm experiencing some side effects with the new medication. Who should I contact?",
        timestamp: "2023-04-29T10:15:00Z",
        isRead: true,
      },
      {
        id: "5-3",
        sender: "system",
        content:
          "Please contact Dr. Johnson regarding side effects. A message has been forwarded to your primary care physician.",
        timestamp: "2023-04-29T10:20:00Z",
        isRead: true,
      },
      {
        id: "5-4",
        sender: "doctor",
        content: "This is Dr. Johnson. What side effects are you experiencing with Lisinopril?",
        timestamp: "2023-04-29T11:30:00Z",
        isRead: true,
      },
      {
        id: "5-5",
        sender: "patient",
        content: "I've been having a dry cough and feeling dizzy occasionally.",
        timestamp: "2023-04-29T12:45:00Z",
        isRead: true,
      },
      {
        id: "5-6",
        sender: "doctor",
        content:
          "Those are known side effects of Lisinopril. Let's schedule an appointment to discuss alternatives. In the meantime, make sure you're staying hydrated.",
        timestamp: "2023-04-29T13:15:00Z",
        isRead: false,
      },
    ],
    unreadCount: 1,
    lastMessageTime: "2023-04-29T13:15:00Z",
    isPinned: false,
    isArchived: false,
  },
]

export default function MessagesClientPage() {
  const { t } = useLanguage()
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<Contact | null>(null)
  const [newMessageContent, setNewMessageContent] = useState("")
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false)
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [loadingMoreContacts, setLoadingMoreContacts] = useState(false)
  const [hasMoreContacts, setHasMoreContacts] = useState(false)
  const [contactsOffset, setContactsOffset] = useState(0)
  const [currentSearchQuery, setCurrentSearchQuery] = useState("")
  const contactsLimit = 20 // Load 20 contacts at a time

  // Get WebSocket context for real-time updates
  const { onUserStatusChange } = useWebSocketContext()

  // Use the messages hook
  const {
    conversations,
    selectedConversation,
    messages,
    unreadCount,
    unreadCountByType,
    loading,
    error,
    selectConversation,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    archiveConversation,
    togglePin,
    handleMedicationAction,
    handleAppointmentAction,
    handleLabResultAction,
    filterConversations,
    clearFilters,
    currentFilters,
    refreshConversations
  } = useMessages()

  // Use real-time messaging hook
  const {
    typingUsers,
    onlineUsers,
    isTyping,
    isConnected,
    sendRealtimeMessage,
    sendVoiceMessage,
    sendFileMessage,
    handleTyping,
    typingUsersForCurrentConversation,
    isUserOnline
  } = useRealtimeMessages()

  // Toggle filter
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters([])
  }

  // Filter conversations based on selected filters
  const filteredConversations = conversations.filter((conv) => {
    // If no filters selected, show all
    if (selectedFilters.length === 0) return true
    
    // Check if conversation matches any selected filter
    if (selectedFilters.includes("doctors")) {
      if (conv.contact.role.includes("Physician") ||
          conv.contact.role.includes("Cardiologist") ||
          conv.contact.role.includes("Endocrinologist") ||
          conv.contact.role.includes("Doctor")) {
        return true
      }
    }
    
    if (selectedFilters.includes("system")) {
      if (conv.contact.role.includes("System") ||
          conv.contact.role.includes("Team") ||
          conv.contact.role.includes("Support") ||
          conv.contact.role.includes("Admin")) {
        return true
      }
    }
    
    if (selectedFilters.includes("unread")) {
      if (conv.unreadCount > 0) {
        return true
      }
    }
    
    return false
  })

  // Handle message action clicks
  const handleMessageAction = async (messageId: string, action: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    switch (message.type) {
      case 'medication_reminder':
        await handleMedicationAction(messageId, action as 'taken' | 'snooze')
        break
      case 'appointment_reminder':
        await handleAppointmentAction(messageId, action as 'confirm' | 'reschedule' | 'cancel')
        break
      case 'lab_results':
        await handleLabResultAction(messageId, action as 'view' | 'schedule_followup')
        break
      default:
        console.log('Action not implemented for message type:', message.type)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      await sendRealtimeMessage(newMessage.trim())
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }


  const loadAvailableContacts = useCallback(async (reset = false, searchQuery = "") => {
    try {
      const isInitialLoad = reset || contactsOffset === 0
      if (isInitialLoad) {
        setLoadingContacts(true)
        setContactsOffset(0)
      } else {
        setLoadingMoreContacts(true)
      }
      
      const offset = reset ? 0 : contactsOffset
      const contacts = await messagesApiService.getAvailableContacts({
        search: searchQuery || undefined,
        offset,
        limit: contactsLimit
      })
      
      // Check if there are more contacts to load
      const hasMore = contacts.length >= contactsLimit
      setHasMoreContacts(hasMore)
      
      if (isInitialLoad) {
        setAvailableContacts(contacts)
        setContactsOffset(contacts.length)
      } else {
        setAvailableContacts(prev => [...prev, ...contacts])
        setContactsOffset(prev => prev + contacts.length)
      }
    } catch (error) {
      console.error("Failed to load contacts:", error)
      // Show empty list on error
      if (reset || contactsOffset === 0) {
        setAvailableContacts([])
      }
      setHasMoreContacts(false)
    } finally {
      setLoadingContacts(false)
      setLoadingMoreContacts(false)
    }
  }, [contactsOffset, contactsLimit])

  const handleSearchContacts = useCallback((query: string) => {
    setCurrentSearchQuery(query)
    // Reset and load with search query
    loadAvailableContacts(true, query)
  }, [loadAvailableContacts])

  const loadMoreContacts = useCallback(async () => {
    if (loadingMoreContacts || !hasMoreContacts) return
    await loadAvailableContacts(false, currentSearchQuery)
  }, [loadingMoreContacts, hasMoreContacts, currentSearchQuery, loadAvailableContacts])

  const handleNewMessageDialogOpenChange = (open: boolean) => {
    setNewMessageDialogOpen(open)
    if (open) {
      // Reset and load initial contacts
      setCurrentSearchQuery("")
      loadAvailableContacts(true, "")
    } else {
      // Clear inputs when closing
      setSelectedRecipient(null)
      setNewMessageContent("")
      setCurrentSearchQuery("")
    }
  }

  // Listen for WebSocket status changes to update contacts in real-time
  useEffect(() => {
    if (!newMessageDialogOpen) return

    const handleUserStatusChange = (userId: number, status: 'online' | 'offline') => {
      console.log(`👤 User ${userId} is now ${status}`)
      
      // Update contacts list
      setAvailableContacts(prev => 
        prev.map(contact => 
          contact.id === userId.toString() 
            ? { ...contact, isOnline: status === 'online' }
            : contact
        )
      )
    }

    // Register callback with WebSocket context
    const cleanup = onUserStatusChange?.(handleUserStatusChange)
    
    return cleanup
  }, [newMessageDialogOpen, onUserStatusChange])

  const handleCreateNewMessage = async () => {
    if (!selectedRecipient || !newMessageContent.trim()) {
      return
    }

    try {
      // Create a new conversation and send the first message
      const conversation = await messagesApiService.createConversation(
        selectedRecipient.id,
        newMessageContent.trim()
      )

      // Clear the inputs and close dialog
      setSelectedRecipient(null)
      setNewMessageContent("")
      setNewMessageDialogOpen(false)
      
      // Refresh conversations to show the new one
      await refreshConversations()
      
      // Optionally select the new conversation
      if (conversation) {
        selectConversation(conversation.id)
      }
    } catch (error) {
      console.error("Failed to create new message:", error)
    }
  }


  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Global Header */}
      <GlobalHeader
        title="Messages"
        subtitle="Communicate with your healthcare team"
        showNotification={true}
        unreadCount={unreadCount}
        showFilters={true}
        onFilterClick={() => setShowFilters(!showFilters)}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Left Panel - User List */}
        <div className="w-80 min-w-80 max-w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
          {/* Search with Filter Button */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filter Button */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className={selectedFilters.length > 0 ? "bg-blue-50 border-blue-300" : ""}
                  >
                    <Filter className="h-4 w-4" />
                    {selectedFilters.length > 0 && (
                      <Badge 
                        variant="default" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-600"
                      >
                        {selectedFilters.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end" sideOffset={5}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Filters</h4>
                      {selectedFilters.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                          onClick={clearAllFilters}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {/* Doctors Filter */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-doctors"
                          checked={selectedFilters.includes("doctors")}
                          onCheckedChange={() => toggleFilter("doctors")}
                        />
                        <label
                          htmlFor="filter-doctors"
                          className="text-sm leading-none cursor-pointer flex-1"
                        >
                          Doctors
                        </label>
                        <span className="text-xs text-gray-500">
                          {conversations.filter(c => c.contact.role.includes("Doctor") || c.contact.role.includes("Physician")).length}
                        </span>
                      </div>
                      
                      {/* System Filter */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-system"
                          checked={selectedFilters.includes("system")}
                          onCheckedChange={() => toggleFilter("system")}
                        />
                        <label
                          htmlFor="filter-system"
                          className="text-sm leading-none cursor-pointer flex-1"
                        >
                          System
                        </label>
                        <span className="text-xs text-gray-500">
                          {conversations.filter(c => c.contact.role.includes("System") || c.contact.role.includes("Support")).length}
                        </span>
                      </div>
                      
                      {/* Unread Filter */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-unread"
                          checked={selectedFilters.includes("unread")}
                          onCheckedChange={() => toggleFilter("unread")}
                        />
                        <label
                          htmlFor="filter-unread"
                          className="text-sm leading-none cursor-pointer flex-1"
                        >
                          Unread
                        </label>
                        <span className="text-xs text-gray-500">
                          {conversations.filter(c => c.unreadCount > 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              <ConversationList
                conversations={filteredConversations}
                selectedConversationId={selectedConversation?.id || null}
                onSelectConversation={selectConversation}
                onArchiveConversation={archiveConversation}
                onTogglePin={togglePin}
                onMarkAsRead={markConversationAsRead}
              />
            </div>
          </ScrollArea>

          {/* New Message Button */}
          <div className="p-4 border-t border-gray-200">
            <Dialog open={newMessageDialogOpen} onOpenChange={handleNewMessageDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                  <DialogDescription>Start a new conversation</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Recipient Autocomplete */}
                  <div className="space-y-2">
                    <Label htmlFor="recipient">To</Label>
                    <RecipientAutocomplete
                      selectedRecipient={selectedRecipient}
                      onSelectRecipient={setSelectedRecipient}
                      onSearch={handleSearchContacts}
                      contacts={availableContacts}
                      loading={loadingContacts}
                      loadingMore={loadingMoreContacts}
                      hasMore={hasMoreContacts}
                      onLoadMore={loadMoreContacts}
                      placeholder="Search for a doctor or team member..."
                    />
                  </div>
                  
                  {/* Message Content */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={newMessageContent}
                      onChange={(e) => setNewMessageContent(e.target.value)}
                      placeholder="Type your message here..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setNewMessageDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateNewMessage}
                    disabled={!selectedRecipient || !newMessageContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Middle Panel - Conversation View */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      className="cursor-pointer"
                      onClick={() => setShowUserInfo(!showUserInfo)}
                    >
                      <AvatarImage
                        src={selectedConversation.contact.avatar || "/placeholder.svg"}
                        alt={selectedConversation.contact.name}
                      />
                      <AvatarFallback>{selectedConversation.contact.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">{selectedConversation.contact.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        {selectedConversation.contact.isOnline ? (
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {selectedConversation.contact.lastSeen ? 
                              `Last seen ${formatDistanceToNow(new Date(selectedConversation.contact.lastSeen))} ago` :
                              'Offline'
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePin(selectedConversation.id)}>
                          <Pin className="h-4 w-4 mr-2" />
                          {selectedConversation.isPinned ? 'Unpin' : 'Pin'} Conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => archiveConversation(selectedConversation.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isOwn={message.sender.type === 'user'}
                      onActionClick={handleMessageAction}
                    />
                  ))}
                  
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Typing Indicator */}
              {typingUsersForCurrentConversation.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {typingUsersForCurrentConversation.map(u => u.userName).join(', ')} {typingUsersForCurrentConversation.length === 1 ? 'is' : 'are'} typing...
                  </div>
                </div>
              )}

              {/* Enhanced Message Input */}
              <EnhancedMessageInput
                value={newMessage}
                onChange={(value) => {
                  setNewMessage(value)
                  handleTyping()
                }}
                onSend={handleSendMessage}
                onFileUpload={sendFileMessage}
                onVoiceRecord={sendVoiceMessage}
                placeholder="Type a message..."
                disabled={!isConnected}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - User Info (Optional) */}
        {showUserInfo && selectedConversation && (
          <UserInfoPanel
            contact={selectedConversation.contact}
            onClose={() => setShowUserInfo(false)}
            onViewProfile={() => console.log('View profile clicked')}
            onSendMessage={() => setShowUserInfo(false)}
          />
        )}
      </div>
    </div>
  )
}