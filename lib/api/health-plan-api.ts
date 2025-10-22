import apiClient from './axios-config'

// Health Plan API Service
export class HealthPlanApiService {
  // Health Goals endpoints
  static async getHealthGoals(): Promise<any[]> {
    const response = await apiClient.get('/health-plans/health-goals')
    return response.data
  }

  static async createHealthGoal(goalData: {
    name: string
    target: { operator: string, value: string }
    start_date: string
    end_date: string
    metric_id?: number
  }): Promise<any> {
    const response = await apiClient.post('/health-plans/health-goals', goalData)
    return response.data
  }

  static async updateHealthGoal(goalId: number, goalData: any): Promise<any> {
    const response = await apiClient.put(`/health-plans/health-goals/${goalId}`, goalData)
    return response.data
  }

  static async deleteHealthGoal(goalId: number): Promise<void> {
    await apiClient.delete(`/health-plans/health-goals/${goalId}`)
  }

  // Health Tasks endpoints
  static async getHealthTasks(): Promise<any[]> {
    const response = await apiClient.get('/health-plans/health-tasks')
    return response.data
  }

  static async createHealthTask(taskData: {
    name: string
    goal_id?: number | null
    metric_id?: number
    frequency: string
    time_of_day: string
    target_days?: number
    target_operator: string
    target_value: string
    target_unit: string
  }): Promise<any> {
    const response = await apiClient.post('/health-plans/health-tasks', taskData)
    return response.data
  }

  static async updateHealthTask(taskId: number, taskData: any): Promise<any> {
    const response = await apiClient.put(`/health-plans/health-tasks/${taskId}`, taskData)
    return response.data
  }

  static async deleteHealthTask(taskId: number): Promise<void> {
    await apiClient.delete(`/health-plans/health-tasks/${taskId}`)
  }

  // Task Completion endpoints
  static async getTaskCompletions(taskId: number, startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const response = await apiClient.get(`/health-plans/health-tasks/${taskId}/completions?${params.toString()}`)
    return response.data
  }

  static async createTaskCompletion(taskId: number, completionData: {
    completion_date: string
    completed: boolean
    progress_count?: number
    notes?: string
  }): Promise<any> {
    const response = await apiClient.post(`/health-plans/health-tasks/${taskId}/completions`, completionData)
    return response.data
  }

  static async updateTaskCompletion(taskId: number, completionId: number, completionData: {
    completed: boolean
    notes?: string
  }): Promise<any> {
    const response = await apiClient.put(`/health-plans/health-tasks/${taskId}/completions/${completionId}`, completionData)
    return response.data
  }

  static async deleteTaskCompletion(taskId: number, completionId: number): Promise<void> {
    await apiClient.delete(`/health-plans/health-tasks/${taskId}/completions/${completionId}`)
  }

  // Bulk task completion operations
  static async bulkUpdateTaskCompletions(taskId: number, completions: Array<{
    completion_date: string
    completed: boolean
    notes?: string
  }>): Promise<any> {
    const response = await apiClient.post(`/health-plans/health-tasks/${taskId}/completions/bulk`, {
      completions
    })
    return response.data
  }

  // Get task completion stats
  static async getTaskCompletionStats(taskId: number, period: 'week' | 'month' | 'year' = 'week'): Promise<{
    total_days: number
    completed_days: number
    completion_rate: number
    streak: number
    last_completed?: string
  }> {
    const response = await apiClient.get(`/health-plans/health-tasks/${taskId}/stats?period=${period}`)
    return response.data
  }
}

// Health Plan interfaces
export interface HealthGoal {
  id: number
  name: string
  target: {
    operator: 'below' | 'above'
    value: string
  }
  current?: {
    value: any
    status: string
    recorded_at: string
  }
  progress?: number
  startDate: string
  endDate: string
  metric_id?: number
  created_at: string
  updated_at?: string
}

export interface HealthTask {
  id: number
  name: string
  description?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  target_days?: number
  time_of_day?: 'morning' | 'afternoon' | 'evening'
  goal_id?: number
  metric_id?: number
  target_operator?: string
  target_value?: string
  target_unit?: string
  created_at: string
  updated_at?: string
  created_by: number
  updated_by?: number
  // Computed fields
  health_goals?: string[]
  metric_name?: string
}

export interface TaskCompletion {
  id: number
  task_id: number
  user_id: number
  completion_date: string
  completed: boolean
  notes?: string
  created_at: string
  updated_at?: string
}

export interface TaskCompletionStats {
  total_days: number
  completed_days: number
  completion_rate: number
  streak: number
  last_completed?: string
}
