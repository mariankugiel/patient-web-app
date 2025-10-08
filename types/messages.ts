// Message Types and Interfaces for the Messages System

export type MessageType = 
  | 'health_plan_support'    // Messages from admin/health plan support
  | 'medication_reminder'    // Medication reminder notifications
  | 'appointment_reminder'   // Appointment reminders
  | 'lab_results'           // Lab results notifications
  | 'doctor_message'        // Direct messages from doctors
  | 'system_announcement'   // System-wide announcements
  | 'prescription_update'   // Prescription updates
  | 'insurance_update'      // Insurance-related messages
  | 'general'               // General messages

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent'

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface MessageSender {
  id: string
  name: string
  avatar?: string
  role: string
  type: 'user' | 'doctor' | 'admin' | 'system'
  email?: string
  phone?: string
  specialty?: string
  experience?: string
  rating?: number
  isOnline?: boolean
  lastSeen?: string
  location?: string
  bio?: string
  education?: string[]
  certifications?: string[]
  languages?: string[]
  availability?: {
    timezone: string
    workingHours: string
    nextAvailable: string
  }
  stats?: {
    totalPatients: number
    responseTime: string
    satisfactionRate: number
  }
  recentActivity?: {
    type: string
    description: string
    timestamp: string
  }[]
}

export interface Message {
  id: string
  conversationId: string
  sender: MessageSender
  content: string
  type: MessageType
  priority: MessagePriority
  status: MessageStatus
  timestamp: string
  readAt?: string
  metadata?: {
    medicationId?: number
    appointmentId?: string
    labResultId?: string
    prescriptionId?: string
    actionRequired?: boolean
    actionUrl?: string
    actionText?: string
  }
}

export interface Conversation {
  id: string
  contact: MessageSender
  messages: Message[]
  unreadCount: number
  lastMessageTime: string
  lastMessage?: Message
  isArchived: boolean
  isPinned: boolean
  tags: string[]
}

// Specific message type interfaces
export interface MedicationReminderMessage extends Message {
  type: 'medication_reminder'
  metadata: {
    medicationId: number
    medicationName: string
    dosage: string
    scheduledTime: string
    actionRequired: true
    actionUrl: string
    actionText: 'Mark as Taken' | 'Snooze'
  }
}

export interface HealthPlanSupportMessage extends Message {
  type: 'health_plan_support'
  metadata: {
    supportTicketId?: string
    category: 'billing' | 'coverage' | 'claims' | 'general'
    actionRequired?: boolean
    actionUrl?: string
    actionText?: string
  }
}

export interface AppointmentReminderMessage extends Message {
  type: 'appointment_reminder'
  metadata: {
    appointmentId: string
    appointmentDate: string
    doctorName: string
    location: string
    actionRequired: true
    actionUrl: string
    actionText: 'Confirm' | 'Reschedule' | 'Cancel'
  }
}

export interface LabResultsMessage extends Message {
  type: 'lab_results'
  metadata: {
    labResultId: string
    testName: string
    resultDate: string
    isAbnormal: boolean
    actionRequired: boolean
    actionUrl: string
    actionText: 'View Results' | 'Schedule Follow-up'
  }
}

// Message filter and search interfaces
export interface MessageFilters {
  type?: MessageType[]
  priority?: MessagePriority[]
  status?: MessageStatus[]
  dateRange?: {
    start: string
    end: string
  }
  sender?: string[]
  hasUnread?: boolean
  hasActionRequired?: boolean
}

export interface MessageSearchParams {
  query: string
  filters: MessageFilters
  sortBy: 'timestamp' | 'priority' | 'sender' | 'type'
  sortOrder: 'asc' | 'desc'
}

// WebSocket message interfaces for real-time updates
export interface WebSocketMessageEvent {
  type: 'new_message' | 'message_read' | 'conversation_updated' | 'typing_start' | 'typing_stop'
  data: {
    conversationId: string
    message?: Message
    userId?: string
    timestamp: string
  }
}

// API response interfaces
export interface MessagesResponse {
  conversations: Conversation[]
  totalCount: number
  unreadCount: number
  hasMore: boolean
}

export interface SendMessageRequest {
  conversationId?: string
  recipientId: string
  content: string
  type: MessageType
  priority: MessagePriority
  metadata?: Record<string, any>
}

export interface SendMessageResponse {
  message: Message
  conversation: Conversation
}
