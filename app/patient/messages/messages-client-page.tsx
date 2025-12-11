"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSelector } from "react-redux"
import { 
  PlusCircle, Send, Filter, Search, Bell, MessageSquare, 
  Mic, Paperclip, Smile, MoreVertical,
  X, Pin, Archive, Trash2, Star, User, Clock, CheckCheck,
  CheckCircle, AlertCircle
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { RootState } from "@/lib/store"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
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
import { WebSocketProvider } from "@/contexts/websocket-context"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useMessages } from "@/hooks/use-messages"
import { useGlobalConversations } from "@/hooks/use-global-conversations"
import { useRealtimeMessages } from "@/hooks/use-realtime-messages"
import { ConversationList } from "@/components/messages/conversation-list"
import { FileUploadDialog } from "@/components/messages/file-upload-dialog"
import { UploadProgressItem } from "@/components/messages/upload-progress-item"
import { PermissionGuard } from "@/components/patient/permission-guard"
import { FileMessageItem } from "@/components/messages/file-message-item"
import { MessageAttachments } from "@/components/messages/message-attachments"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EnhancedMessageInput } from "@/components/messages/enhanced-message-input"
import { UserInfoPanel } from "@/components/messages/user-info-panel"
import { RecipientAutocomplete, type Contact } from "@/components/messages/recipient-autocomplete"
import { GlobalHeader } from "@/components/layout/global-header"
import type { MessageFilters, MessageType, MessageAttachment, Message, MessagePriority, MessageStatus } from "@/types/messages"
import type { FileUploadItem } from "@/types/files"
import { messagesApiService } from "@/lib/api/messages-api"
import { s3UploadService } from "@/lib/api/s3-upload-api"
import { usePatientContext } from "@/hooks/use-patient-context"
import { useSwitchedPatient } from "@/contexts/patient-context"

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
  const user = useSelector((state: RootState) => state.auth.user)
  const userId = user?.id ? parseInt(String(user.id)) : null

  return (
    <PermissionGuard requiredPermission="can_view_messages">
      <WebSocketProvider userId={userId}>
        <MessagesClientPageContent />
      </WebSocketProvider>
    </PermissionGuard>
  )
}

function MessagesClientPageContent() {
  // Use patientId from PatientProvider context (more stable than useSearchParams)
  const { patientId: contextPatientId, isViewingOtherPatient: contextIsViewingOtherPatient } = useSwitchedPatient()
  // Fallback to usePatientContext if context doesn't have it (for backwards compatibility)
  const { legacyPatientId: urlPatientId, isViewingOtherPatient: urlIsViewingOtherPatient } = usePatientContext()
  
  // Use patientId from context first, fallback to URL patientId
  const patientId = contextPatientId ?? urlPatientId
  const isViewingOtherPatient = contextIsViewingOtherPatient ?? urlIsViewingOtherPatient
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 [MessagesClientPage] patientId:', {
      fromContext: contextPatientId,
      fromURL: urlPatientId,
      final: patientId,
      isViewingOtherPatient
    })
  }, [contextPatientId, urlPatientId, patientId, isViewingOtherPatient])
  
  // Get current user from Redux state
  const { user } = useSelector((state: RootState) => state.auth)
  
  // Get participants from Redux state
  const participants = useSelector((state: RootState) => {
    const messageParticipants = state.messageParticipants as any
    return messageParticipants?.participants || {}
  })
  
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
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

  // File upload state
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false)
  const [dialogFiles, setDialogFiles] = useState<FileUploadItem[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<FileUploadItem[]>([])
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map())

  // Ref for messages container to handle auto-scroll
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Get WebSocket context for real-time updates
  const { onUserStatusChange } = useWebSocketContext()

  // Use the messages hook with patientId
  const {
    selectedConversation,
    messages,
    loadingConversations, // Add loadingConversations
    loadingMessages, // Add loadingMessages
    sendingMessage,
    error,
    currentUserId,  // Add actual database user ID from backend
    typingUsers, // Add typingUsers from useMessages
    selectConversation,
    sendMessage,
    markConversationAsRead,
    archiveConversation,
    togglePin,
    deleteConversation,
    setMessages,
    handleMedicationAction,
    handleAppointmentAction,
    handleLabResultAction,
    refreshConversations,
    sendTypingIndicator, // Add sendTypingIndicator for typing indicators
    conversations: conversationsFromHook  // Get conversations directly from hook
  } = useMessages(patientId)
  
  // Use conversations from useMessages hook (which respects patientId)
  // ALWAYS use conversations from the hook, not from global state
  // The hook properly filters by patientId and clears old data when switching
  // Global conversations are only used as a fallback if hook hasn't loaded yet
  const { conversations: globalConversations, unreadCount } = useGlobalConversations()
  
  // Prioritize conversations from hook - these are filtered by the current patientId
  // Show loading state while loading, otherwise show hook conversations (even if empty)
  // Only fallback to global conversations if we're not loading and hook is empty AND global has data
  // This prevents showing stale global data when switching patients
  const conversations = loadingConversations 
    ? [] // Show empty while loading
    : (conversationsFromHook || []) // Use hook conversations (will be empty array if no data, which is correct)
  
  // Filter conversations based on selected filters
  const filteredConversations = conversations.filter((conv) => {
    // If no filters selected, show all
    if (selectedFilters.length === 0) return true
    
    // Check if conversation matches any selected filter
    if (selectedFilters.includes("doctors")) {
      if (conv.contact_role?.includes("Physician") ||
          conv.contact_role?.includes("Cardiologist") ||
          conv.contact_role?.includes("Endocrinologist") ||
          conv.contact_role?.includes("Doctor")) {
        return true
      }
    }
    
    if (selectedFilters.includes("system")) {
      if (conv.contact_role?.includes("System") ||
          conv.contact_role?.includes("Team") ||
          conv.contact_role?.includes("Support") ||
          conv.contact_role?.includes("Admin")) {
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
  
  // Debug logging with detailed contact information
  useEffect(() => {
    console.log('💬 ========== [MessagesPage] CONVERSATIONS STATE ==========')
    console.log('💬 Patient ID:', patientId)
    console.log('💬 Is Viewing Other Patient:', isViewingOtherPatient)
    console.log('💬 Loading Conversations:', loadingConversations)
    console.log('💬 Error:', error)
    console.log('💬 Conversations from hook:', conversationsFromHook?.length || 0)
    console.log('💬 Conversations from global:', globalConversations?.length || 0)
    console.log('💬 Final conversations count:', conversations.length)
    console.log('💬 Filtered conversations count:', filteredConversations.length)
    console.log('💬 Refresh conversations function exists:', typeof refreshConversations === 'function')
    
    // Force a manual refresh if we have patientId but no conversations and not loading
    if (patientId && !loadingConversations && conversations.length === 0 && !error) {
      console.log('⚠️ [MessagesPage] Detected patientId but no conversations - attempting manual refresh')
      console.log('⚠️ [MessagesPage] Calling refreshConversations()')
      setTimeout(() => {
        refreshConversations().catch((err: any) => {
          console.error('❌ [MessagesPage] Error in manual refresh:', err)
        })
      }, 100)
    }
    
    if (conversationsFromHook && conversationsFromHook.length > 0) {
      console.log('💬 ========== CONTACTS FROM HOOK ==========')
      conversationsFromHook.forEach((conv, index) => {
        console.log(`💬 Contact ${index + 1} from hook:`, {
          id: conv.id,
          contactName: conv.contact_name,
          contactId: conv.contact_id,
          contactRole: conv.contact_role,
          contactAvatar: conv.contact_avatar,
          userId: conv.user_id,
          unreadCount: conv.unreadCount
        })
      })
      console.log('💬 ========== END CONTACTS FROM HOOK ==========')
    } else {
      console.log('⚠️ No conversations from hook!')
    }
    
    if (conversations && conversations.length > 0) {
      console.log('💬 ========== FINAL CONTACTS LIST ==========')
      conversations.forEach((conv, index) => {
        console.log(`💬 Final Contact ${index + 1}:`, {
          id: conv.id,
          contactName: conv.contact_name,
          contactId: conv.contact_id,
          contactRole: conv.contact_role,
          contactAvatar: conv.contact_avatar,
          userId: conv.user_id
        })
      })
      console.log('💬 ========== END FINAL CONTACTS LIST ==========')
    } else {
      console.log('⚠️ Final conversations array is empty!')
    }
    
    if (filteredConversations && filteredConversations.length > 0) {
      console.log('💬 ========== FILTERED CONTACTS LIST ==========')
      filteredConversations.forEach((conv, index) => {
        console.log(`💬 Filtered Contact ${index + 1}:`, {
          id: conv.id,
          contactName: conv.contact_name,
          contactRole: conv.contact_role
        })
      })
      console.log('💬 ========== END FILTERED CONTACTS LIST ==========')
    } else {
      console.log('⚠️ Filtered conversations array is empty!')
      console.log('💬 Selected filters:', selectedFilters)
    }
    
    console.log('💬 ========== END [MessagesPage] CONVERSATIONS STATE ==========')
  }, [patientId, isViewingOtherPatient, conversationsFromHook, globalConversations, conversations, filteredConversations, loadingConversations, error, selectedFilters])

  // Use real-time messaging hook
  const {
    onlineUsers,
    isTyping,
    isConnected,
    sendRealtimeMessage,
    sendVoiceMessage,
    sendFileMessage,
    typingUsersForCurrentConversation,
    isUserOnline
  } = useRealtimeMessages()
  
  // Create debounced typing handler using sendTypingIndicator from useMessages
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  
  const handleTyping = useCallback(() => {
    if (!selectedConversation || !isConnected) return
    
    // Send typing start if not already typing
    if (!isTypingRef.current) {
      isTypingRef.current = true
      sendTypingIndicator(true)
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        sendTypingIndicator(false)
      }
    }, 2000)
  }, [selectedConversation, isConnected, sendTypingIndicator])
  
  // Cleanup typing indicator when conversation changes or component unmounts
  useEffect(() => {
    return () => {
      // Stop typing when component unmounts or conversation changes
      if (isTypingRef.current) {
        sendTypingIndicator(false)
        isTypingRef.current = false
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [selectedConversation?.id, sendTypingIndicator])

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
  // Debug logging for conversations filtering
  useEffect(() => {
    console.log('🔍 [MessagesPage] Filtering conversations:', {
      totalConversations: conversations.length,
      selectedFilters: selectedFilters,
      filteredCount: filteredConversations.length,
      conversationDetails: conversations.map(c => ({
        id: c.id,
        contact_name: c.contact_name,
        contact_role: c.contact_role,
        unreadCount: c.unreadCount
      }))
    })
  }, [conversations, selectedFilters, filteredConversations.length])

  // Handle message action clicks
  const handleMessageAction = async (messageId: string, action: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    switch (message.message_type) {
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
        console.log('Action not implemented for message type:', message.message_type)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    console.log('📤 handleSendMessage called with:', newMessage.trim())
    console.log('📤 Selected conversation:', selectedConversation)

    try {
      await sendMessage(newMessage.trim())
      setNewMessage("")
      console.log('📤 Message sent successfully')
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (error) {
      console.error("📤 Failed to send message:", error)
    }
  }


  // Wrapper for voice messages with auto-scroll
  const handleVoiceMessage = async (audioBlob: Blob) => {
    try {
      await sendVoiceMessage(audioBlob)
      console.log('📤 Voice message sent successfully')
      
      // Scroll to bottom after sending voice message
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (error) {
      console.error("📤 Failed to send voice message:", error)
    }
  }

  // File upload handlers
  const handleFileUpload = (files: FileList) => {
    // Convert FileList to FileUploadItem[]
    const fileItems = Array.from(files).map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      extension: file.name.split('.').pop()?.toLowerCase() || '',
      status: 'pending' as const,
      progress: 0
    }))
    
    // Set files for dialog and show dialog
    setDialogFiles(fileItems)
    setFileUploadDialogOpen(true)
  }

  const handleFileUploadDialogSend = (files: FileUploadItem[], message: string) => {
    if (!selectedConversation || !currentUserId) return

    console.log('📎 Starting file upload:', files.length, 'files')
    
    // Close dialog
    setFileUploadDialogOpen(false)
    
    // Create optimistic message with upload progress immediately
    const messageContent = message.trim() || `Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`
    
    // Create optimistic message for immediate display
    const optimisticMessage: Message = {
      id: `temp_upload_${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      content: messageContent,
      message_type: 'general' as MessageType,
      priority: 'normal' as MessagePriority,
      status: 'sending' as MessageStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_metadata: {},
      attachments: [],
      file_attachments: files.map(file => ({
        id: file.id,
        message_id: 0,
        file_name: file.name,
        original_file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_extension: file.extension,
        s3_bucket: '',
        s3_key: '',
        s3_url: '',
        uploaded_by: currentUserId,
        created_at: new Date().toISOString(),
        updated_at: null
      }))
    }
    
    // Add optimistic message to state immediately
    setMessages(prev => [...prev, optimisticMessage])
    
    // Set files to uploading status for progress display
    setUploadingFiles(files.map(file => ({ ...file, status: 'uploading' as const, progress: 0 })))
    
    // Start actual upload process
    uploadFiles(files, message, optimisticMessage.id)
  }

  const uploadFiles = async (files: FileUploadItem[], message: string, optimisticMessageId?: string) => {
    if (!selectedConversation || !currentUserId) return

    try {
      console.log('📎 Starting file upload for', files.length, 'files')
      
      // Update uploading files with progress tracking
      const uploadingFiles = files.map(file => ({ ...file, status: 'uploading' as const, progress: 0 }))
      setUploadingFiles(uploadingFiles)
      console.log('📎 Set files to uploading status:', uploadingFiles.length)
      
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100))

      // Upload files to S3
      const uploadedFiles = await s3UploadService.uploadMultipleFiles(
        files,
        currentUserId,
        {
          maxFileSize: 50 * 1024 * 1024, // 50MB
          allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'mp4', 'mp3', 'zip'],
          maxFiles: 10
        },
        (fileId, progress) => {
          console.log('📎 Upload progress for', fileId, ':', progress + '%')
          setUploadProgress(prev => new Map(prev).set(fileId, progress))
          // Also update the file status in uploadingFiles
          setUploadingFiles(prev => prev.map(file => 
            file.id === fileId 
              ? { ...file, progress }
              : file
          ))
          
          // Update optimistic message progress if it exists
          if (optimisticMessageId) {
            setMessages(prev => prev.map(msg => 
              msg.id === optimisticMessageId 
                ? { ...msg, content: `Uploading... ${progress}%` }
                : msg
            ))
          }
        },
        (fileId, s3Data) => {
          console.log('📎 File uploaded successfully:', fileId)
          setUploadingFiles(prev => prev.map(file => 
            file.id === fileId 
              ? { ...file, status: 'uploaded' as const, progress: 100 }
              : file
          ))
        },
        (fileId, error) => {
          console.error('📎 File upload failed:', fileId, error)
          setUploadingFiles(prev => prev.map(file => 
            file.id === fileId 
              ? { ...file, status: 'failed' as const, error }
              : file
          ))
        }
      )

      // Update uploading files with the results
      setUploadingFiles(uploadedFiles)

      // Send message with file attachments
      const successfulFiles = uploadedFiles.filter(file => file.status === 'uploaded' && file.attachment)
      if (successfulFiles.length > 0) {
        // Use attachments directly from upload response
        const attachments = successfulFiles.map(file => file.attachment!)
        
        // Send message with file attachments (even if no text content)
        const messageContent = message.trim() || `Sent ${successfulFiles.length} file${successfulFiles.length > 1 ? 's' : ''}`
        await sendMessage(messageContent, 'general', attachments)
        console.log('📎 Message with files sent successfully')
        
        // Remove optimistic message and uploading files
        if (optimisticMessageId) {
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessageId))
        }
        setUploadingFiles([])
        setUploadProgress(new Map())
      } else {
        // If no successful uploads, update optimistic message to show error
        if (optimisticMessageId) {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessageId 
              ? { ...msg, status: 'failed', content: 'Upload failed' }
              : msg
          ))
        }
        setUploadingFiles([])
        setUploadProgress(new Map())
      }

    } catch (error) {
      console.error('📎 File upload failed:', error)
      setUploadingFiles(prev => prev.map(file => ({ ...file, status: 'failed' as const })))
    }
  }

  const handleCancelFileUpload = (fileId: string) => {
    console.log('📎 Cancelling file upload:', fileId)
    
    // Cancel S3 upload
    s3UploadService.cancelUpload(fileId)
    
    // Update file status
    setUploadingFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status: 'cancelled' as const }
        : file
    ))
  }

  const handleRetryFileUpload = (fileId: string) => {
    console.log('📎 Retrying file upload:', fileId)

    const file = uploadingFiles.find(f => f.id === fileId)
    if (file) {
      // Reset file status and retry
      setUploadingFiles(prev => prev.map(f =>
        f.id === fileId
          ? { ...f, status: 'pending' as const, progress: 0, error: undefined }
          : f
      ))

      // Retry upload for this specific file
      uploadFiles([file], newMessage)
    }
  }

  // Message action handlers
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      // TODO: Implement delete message API call
      console.log('🗑️ Deleting message:', messageId)
      // await deleteMessage(messageId)
    } catch (error) {
      console.error('🗑️ Failed to delete message:', error)
    }
  }

  const handleReplyToMessage = (messageId: string, messageContent: string) => {
    // TODO: Implement reply functionality
    console.log('💬 Replying to message:', messageId, messageContent)
    setNewMessage(`Replying to: ${messageContent.substring(0, 50)}... `)
  }

  const handlePinMessage = async (messageId: string) => {
    try {
      // TODO: Implement pin message API call
      console.log('📌 Pinning message:', messageId)
      // await pinMessage(messageId)
    } catch (error) {
      console.error('📌 Failed to pin message:', error)
    }
  }

  const handleUnpinMessage = async (messageId: string) => {
    try {
      // TODO: Implement unpin message API call
      console.log('📌 Unpinning message:', messageId)
      // await unpinMessage(messageId)
    } catch (error) {
      console.error('📌 Failed to unpin message:', error)
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

  // Helper function to scroll to bottom with width and length consideration
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      // Try multiple selectors for ScrollArea
      const selectors = [
        '[data-radix-scroll-area-viewport]',
        '.scroll-area-viewport',
        '[data-scroll-area-viewport]',
        'div[style*="overflow"]'
      ]
      
      let scrollableElement = null
      for (const selector of selectors) {
        scrollableElement = messagesContainerRef.current.querySelector(selector)
        if (scrollableElement) {
          break
        }
      }
      
      // If no specific element found, try the container itself
      if (!scrollableElement) {
        scrollableElement = messagesContainerRef.current
      }
      
      if (scrollableElement) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          // First, scroll to the very bottom
          scrollableElement.scrollTop = scrollableElement.scrollHeight
          
          // Then check if the last message is fully visible
          const lastMessage = messagesContainerRef.current?.querySelector('[data-message-item]:last-child')
          if (lastMessage) {
            const lastMessageRect = lastMessage.getBoundingClientRect()
            const containerRect = scrollableElement.getBoundingClientRect()
            
            // Calculate how much of the last message is visible
            const visibleHeight = Math.min(lastMessageRect.bottom, containerRect.bottom) - Math.max(lastMessageRect.top, containerRect.top)
            const messageHeight = lastMessageRect.height
            
            // If less than 80% of the last message is visible, scroll more
            if (visibleHeight < messageHeight * 0.8) {
              const additionalScroll = messageHeight - visibleHeight + 50 // Extra padding
              scrollableElement.scrollTop = scrollableElement.scrollTop + additionalScroll
            }
          }
        })
      }
    }
  }, [messages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Add a small delay to ensure DOM is fully updated
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [messages, scrollToBottom])

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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Left Panel - User List */}
        <div className="w-80 min-w-80 max-w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
          {/* Search with Filter Button */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
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
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversations.filter(c => c.contact_role?.includes("Doctor") || c.contact_role?.includes("Physician")).length}
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
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversations.filter(c => c.contact_role?.includes("System") || c.contact_role?.includes("Support")).length}
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
                        <span className="text-xs text-gray-500 dark:text-gray-400">
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
          <ScrollArea className="flex-1 w-full max-w-full overflow-hidden">
            <div className="p-2">
              {loadingConversations ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading conversations...</span>
                  </div>
                </div>
              ) : (
              <ConversationList
                conversations={filteredConversations}
                selectedConversationId={selectedConversation?.id || null}
                  typingUsers={typingUsers} // Use typingUsers directly from useMessages
                onSelectConversation={selectConversation}
                onArchiveConversation={archiveConversation}
                onTogglePin={togglePin}
                onMarkAsRead={markConversationAsRead}
              />
              )}
            </div>
          </ScrollArea>

          {/* New Message Button - Hide when viewing another patient's messages */}
          {!isViewingOtherPatient && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
          )}
        </div>

        {/* Middle Panel - Conversation View */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      className="cursor-pointer"
                      onClick={() => setShowUserInfo(!showUserInfo)}
                    >
                      <AvatarImage
                        src={selectedConversation.contact_avatar || "/placeholder.svg"}
                        alt={selectedConversation.contact_name || "Unknown"}
                      />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {selectedConversation.contact_initials || selectedConversation.contact_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{selectedConversation.contact_name || "Unknown"}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Online
                          </span>
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
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteConversation(selectedConversation.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 bg-white dark:bg-gray-900" ref={messagesContainerRef}>
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading messages...</span>
                    </div>
                  </div>
                ) : (
                    <div className="space-y-2 w-full max-w-full overflow-hidden">
                      {/* Upload Progress */}
                      {(() => {
                        console.log('📎 Uploading files count:', uploadingFiles.length)
                        return null
                      })()}
                      {uploadingFiles.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Uploading files...
                          </div>
                          {uploadingFiles.map((file) => (
                            <UploadProgressItem
                              key={file.id}
                              file={file}
                              onCancel={handleCancelFileUpload}
                              onRetry={handleRetryFileUpload}
                    />
                  ))}
                        </div>
                      )}
                      
                      {(() => {
                        console.log('📱 Total messages to render:', messages.length)
                        return null
                      })()}
                      {messages.map((message) => {
                      // Use current user ID from backend (actual database ID)
                      if (!currentUserId) {
                        console.error('❌ No current user ID found from backend')
                        return null
                      }
                      
                      console.log('📱 Rendering message:', message.id, 'with attachments:', message.file_attachments?.length || 0)
                      
                      // Proper message alignment logic: compare sender ID with current user ID
                      // Both are now actual database IDs (numbers)
                      const isOwn = message.sender_id === currentUserId
                      
                      // Get sender info from participants
                      const senderInfo = participants[message.sender_id]
                      
                      return (
                        <div key={message.id} className={`flex items-end gap-2 w-full max-w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {/* Avatar for received messages */}
                          {!isOwn && senderInfo && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={senderInfo.avatar} alt={senderInfo.name || "Unknown"} />
                              <AvatarFallback className="bg-blue-600 text-white">
                                {senderInfo.initials || senderInfo.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          {/* Message bubble */}
                          <div className={`max-w-[50%] min-w-0 p-3 rounded-lg ${
                            isOwn 
                              ? 'bg-blue-500 text-white dark:bg-blue-600' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          }`}>
                            {/* Message content - only show if no file attachments or if there's meaningful text */}
                            {message.content && (!message.file_attachments || message.file_attachments.length === 0 || !message.content.startsWith('Sent ')) && (
                              <div 
                                className="text-sm break-words overflow-wrap-anywhere hyphens-auto" 
                                style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
                              >
                                {message.content}
                              </div>
                            )}
                            
                            {/* Message attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2">
                                <MessageAttachments
                                  attachments={message.attachments}
                                  isOwn={isOwn}
                                />
                              </div>
                            )}
                            
                            {/* Time and status */}
                            <div className={`text-xs mt-1 flex items-center justify-between ${
                              isOwn ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <span>
                                {message.created_at ? new Date(message.created_at).toLocaleTimeString() : 'Unknown time'}
                              </span>
                              {isOwn && (
                                <div className="ml-2">
                                  {message.status === 'sent' && <CheckCircle className="h-3 w-3" />}
                                  {message.status === 'delivered' && <CheckCircle className="h-3 w-3" />}
                                  {message.status === 'read' && <CheckCircle className="h-3 w-3 text-blue-300" />}
                                  {message.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-300" />}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Avatar for sent messages */}
                          {isOwn && senderInfo && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={senderInfo.avatar} alt={senderInfo.name || "Unknown"} />
                              <AvatarFallback className="bg-blue-600 text-white">
                                {senderInfo.initials || senderInfo.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )
                  })}
                  
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  )}
                </div>
                )}
              </ScrollArea>

              {/* Typing Indicator */}
              {(() => {
                // Get typing user names from selected conversation
                const typingUserNames: string[] = []
                if (selectedConversation && typingUsers.size > 0) {
                  typingUsers.forEach((userId) => {
                    // Check if it's the contact typing
                    if (selectedConversation.contact_id === userId) {
                      typingUserNames.push(selectedConversation.contact_name || 'Someone')
                    }
                    // Check if it's the current user typing (shouldn't happen, but handle it)
                    else if (selectedConversation.user_id === userId) {
                      typingUserNames.push(selectedConversation.current_user_name || 'You')
                    }
                  })
                }
                
                return typingUserNames.length > 0 ? (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span>{typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing...</span>
                    </div>
                  </div>
                ) : null
              })()}

              {/* Enhanced Message Input */}
              <EnhancedMessageInput
                value={newMessage}
                onChange={(value) => {
                  setNewMessage(value)
                }}
                onTyping={handleTyping}
                onSend={handleSendMessage}
                onFileUpload={handleFileUpload}
                onVoiceRecord={handleVoiceMessage}
                placeholder={isViewingOtherPatient ? "Viewing another patient's messages. You cannot send messages." : "Type a message..."}
                disabled={!isConnected || isViewingOtherPatient}
                loading={sendingMessage}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Select a conversation</h3>
                <p className="text-gray-500 dark:text-gray-400">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - User Info (Optional) */}
        {showUserInfo && selectedConversation && (
          <UserInfoPanel
            contact={{
              id: selectedConversation.contact_id.toString(),
              name: selectedConversation.contact_name || "Unknown",
              avatar: selectedConversation.contact_avatar,
              role: selectedConversation.contact_role || "Unknown",
              type: "user" as const,
              isOnline: true,
              lastSeen: new Date().toISOString()
            }}
            onClose={() => setShowUserInfo(false)}
            onViewProfile={() => console.log('View profile clicked')}
            onSendMessage={() => setShowUserInfo(false)}
          />
        )}

        {/* File Upload Dialog */}
        <FileUploadDialog
          isOpen={fileUploadDialogOpen}
          onClose={() => {
            setFileUploadDialogOpen(false)
            setDialogFiles([]) // Clear dialog files when closing
          }}
          onSend={handleFileUploadDialogSend}
          maxFiles={10}
          maxFileSize={50 * 1024 * 1024} // 50MB
          initialFiles={dialogFiles}
        />
      </div>
    </div>
  )
}