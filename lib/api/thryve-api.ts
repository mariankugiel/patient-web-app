import apiClient from './axios-config'

// Types for Thryve API
export interface ThryveDataSource {
  id: number
  name: string
  data_source_type: string
  retrieval_method: string
  historic_data: boolean
  shared_oauth_client: string
}

export interface ThryveConnectionRequest {
  data_source_id: number
  redirect_uri?: string
}

export interface ThryveConnectionResponse {
  url: string
  connection_session_token: string
}

export interface ThryveIntegrationStatus {
  data_source_id: number
  data_source_name: string
  connected: boolean
  connected_at?: string | null
}

// Thryve API Service
export class ThryveApiService {
  /**
   * Get all available Thryve data sources
   */
  static async getDataSources(): Promise<ThryveDataSource[]> {
    try {
      const response = await apiClient.get('/integrations/thryve/data-sources')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get Thryve data sources')
    }
  }

  /**
   * Get connection URL for a data source
   */
  static async getConnectionUrl(
    dataSourceId: number,
    redirectUri?: string
  ): Promise<ThryveConnectionResponse> {
    try {
      const params = new URLSearchParams()
      params.append('data_source_id', dataSourceId.toString())
      if (redirectUri) {
        params.append('redirect_uri', redirectUri)
      }

      const response = await apiClient.get(
        `/integrations/thryve/connection-url?${params.toString()}`
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get connection URL')
    }
  }

  /**
   * Get disconnection URL for a data source
   */
  static async getDisconnectionUrl(
    dataSourceId: number,
    redirectUri?: string
  ): Promise<ThryveConnectionResponse> {
    try {
      const params = new URLSearchParams()
      params.append('data_source_id', dataSourceId.toString())
      if (redirectUri) {
        params.append('redirect_uri', redirectUri)
      }

      const response = await apiClient.get(
        `/integrations/thryve/disconnection-url?${params.toString()}`
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get disconnection URL')
    }
  }

  /**
   * Connect to a data source (POST endpoint)
   */
  static async connect(dataSourceId: number, redirectUri?: string): Promise<ThryveConnectionResponse> {
    try {
      const response = await apiClient.post('/integrations/thryve/connect', {
        data_source_id: dataSourceId,
        redirect_uri: redirectUri
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to connect data source')
    }
  }

  /**
   * Disconnect from a data source (POST endpoint)
   */
  static async disconnect(dataSourceId: number, redirectUri?: string): Promise<ThryveConnectionResponse> {
    try {
      const response = await apiClient.post('/integrations/thryve/disconnect', {
        data_source_id: dataSourceId,
        redirect_uri: redirectUri
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to disconnect data source')
    }
  }

  /**
   * Get integration status for all connected data sources
   */
  static async getStatus(): Promise<ThryveIntegrationStatus[]> {
    try {
      const response = await apiClient.get('/integrations/thryve/status')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get integration status')
    }
  }
}

