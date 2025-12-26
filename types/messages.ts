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

// Message attachment types
export interface MessageAttachment {
  id: number
  message_id: number
  file_name: string
  original_file_name: string
  file_type: string
  file_size: number
  file_extension: string
  s3_bucket: string
  s3_key: string
  s3_url?: string
  uploaded_by: number
  created_at: string
  updated_at?: string
}

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
  conversation_id: string
  sender_id: number  // Simplified: just sender ID, no full sender object
  attachments?: MessageAttachment[]  // Add attachments support
  file_attachments?: any[]  // Add file attachments support
  content: string
  message_type: MessageType
  priority: MessagePriority
  status: MessageStatus
  created_at: string
  updated_at?: string
  read_at?: string
  message_metadata?: {
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
  user_id: number
  contact_id: number
  contact_supabase_user_id?: string  // Supabase UUID for direct bucket access
  contact_name?: string
  contact_role?: string
  contact_avatar?: string
  contact_initials?: string
  current_user_name?: string
  current_user_role?: string
  current_user_avatar?: string
  current_user_initials?: string
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
  conversation_id?: string
  recipient_id?: string
  content: string
  message_type: MessageType
  priority: MessagePriority
  attachments?: MessageAttachment[]  // Add attachments support
  message_metadata?: Record<string, any>
}

export interface SendMessageResponse {
  message: Message
  conversation: Conversation
}

export interface MessagesResponse {
  conversations: Conversation[]
  total_count: number
  unread_count: number
  has_more: boolean
  current_user_id: number  // Add actual database user ID from backend
}

// AI Chat types for Saluso Support
export const SALUSO_SUPPORT_CONVERSATION_ID = 'saluso-support'

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AIChatRequest {
  message: string
  conversation_history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

export interface AIChatResponse {
  response: string
}

// Virtual bot conversation for UI
export interface BotConversation extends Omit<Conversation, 'id' | 'contact_id'> {
  id: typeof SALUSO_SUPPORT_CONVERSATION_ID
  contact_id: 0  // Special ID for bot
  contact_name: 'Saluso Support'
  contact_role: 'AI Assistant'
  contact_avatar?: string
  contact_initials: 'SS'
  isBot: true
}
