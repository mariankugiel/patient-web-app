import apiClient from './axios-config'

export interface MedicationReminder {
  id: number
  medication_id: number
  user_id: number
  reminder_time: string // "08:00:00"
  user_timezone: string
  days_of_week: string[]
  enabled: boolean
  next_scheduled_at?: string
  last_sent_at?: string
  status: 'active' | 'paused' | 'deleted'
  created_at: string
  updated_at?: string
  medication_name?: string
  medication_dosage?: string
}

export interface CreateReminderRequest {
  medication_id: number
  reminder_time: string // "08:00:00"
  days_of_week: string[]
  enabled?: boolean
}

export interface UpdateReminderRequest {
  reminder_time?: string
  days_of_week?: string[]
  enabled?: boolean
}

export interface Notification {
  id: number
  user_id: number
  notification_type: string
  title: string
  message: string
  priority: string
  medication_id?: number
  appointment_id?: number
  data?: any
  status: string
  scheduled_at?: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  display_until?: string
  created_at: string
  updated_at?: string
}

export interface NotificationChannel {
  id: number
  user_id: number
  email_enabled: boolean
  sms_enabled: boolean
  websocket_enabled: boolean
  web_push_enabled: boolean
  email_address?: string
  phone_number?: string
  quiet_hours_start?: string
  quiet_hours_end?: string
  created_at: string
  updated_at?: string
}

class MedicationRemindersApiService {
  async createReminder(reminder: CreateReminderRequest): Promise<MedicationReminder> {
    const response = await apiClient.post('/medication-reminders', reminder)
    return response.data
  }

  async getReminders(medicationId?: number): Promise<MedicationReminder[]> {
    const url = medicationId 
      ? `/medication-reminders/medications/${medicationId}/reminders`
      : '/medication-reminders'

    const response = await apiClient.get(url)
    return response.data
  }

  async getReminder(reminderId: number): Promise<MedicationReminder> {
    const response = await apiClient.get(`/medication-reminders/${reminderId}`)
    return response.data
  }

  async updateReminder(reminderId: number, update: UpdateReminderRequest): Promise<MedicationReminder> {
    const response = await apiClient.put(`/medication-reminders/${reminderId}`, update)
    return response.data
  }

  async deleteReminder(reminderId: number): Promise<void> {
    await apiClient.delete(`/medication-reminders/${reminderId}`)
  }

  async toggleReminder(reminderId: number): Promise<MedicationReminder> {
    const response = await apiClient.post(`/medication-reminders/${reminderId}/toggle`)
    return response.data
  }

  // Notification-related methods
  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get('/notifications')
    return response.data
  }

  async getNotification(notificationId: number): Promise<Notification> {
    const response = await apiClient.get(`/notifications/${notificationId}`)
    return response.data
  }

  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`)
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all')
  }

  async dismissNotification(notificationId: number): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/dismiss`)
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get('/notifications/unread-count')
    return response.data
  }

  // Notification channel preferences
  async getNotificationChannels(): Promise<NotificationChannel> {
    const response = await apiClient.get('/notification-channels')
    return response.data
  }

  async updateNotificationChannels(channels: Partial<NotificationChannel>): Promise<NotificationChannel> {
    const response = await apiClient.put('/notification-channels', channels)
    return response.data
  }

  // WebSocket connection management
  async connectWebSocket(userId: number): Promise<{ connection_id: string }> {
    const response = await apiClient.post('/websocket/connect', { user_id: userId })
    return response.data
  }

  async disconnectWebSocket(connectionId: string): Promise<void> {
    await apiClient.post('/websocket/disconnect', { connection_id: connectionId })
  }

  // Web Push subscription management
  async subscribeWebPush(subscription: any): Promise<void> {
    await apiClient.post('/web-push/subscribe', subscription)
  }

  async unsubscribeWebPush(subscriptionId: number): Promise<void> {
    await apiClient.delete(`/web-push/subscribe/${subscriptionId}`)
  }
}

// Export singleton instance
export const medicationRemindersApiService = new MedicationRemindersApiService()

// Also export the class for testing
export { MedicationRemindersApiService }

// Export notifications API service for convenience
export const notificationsApiService = {
  getNotifications: () => medicationRemindersApiService.getNotifications(),
  getNotification: (id: number) => medicationRemindersApiService.getNotification(id),
  markAsRead: (id: number) => medicationRemindersApiService.markAsRead(id),
  markAllAsRead: () => medicationRemindersApiService.markAllAsRead(),
  dismissNotification: (id: number) => medicationRemindersApiService.dismissNotification(id),
  getUnreadCount: () => medicationRemindersApiService.getUnreadCount(),
}