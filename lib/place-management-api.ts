/**
 * Place Management API Client
 * Integrates with the secure-select API backend
 */

// JWT Token Manager
class TokenManager {
  private token: string | null = null
  private userRole: string | null = null
  private userId: string | null = null

  constructor() {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken') || localStorage.getItem('jwt_token')
      this.userRole = localStorage.getItem('user_role')
      this.userId = localStorage.getItem('user_id')
    }
  }

  // Get current token
  getToken() {
    // Refresh from localStorage on each call (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken') || localStorage.getItem('jwt_token')
    }
    return this.token
  }

  // Get user role
  getUserRole() {
    if (typeof window !== 'undefined') {
      this.userRole = localStorage.getItem('user_role')
    }
    return this.userRole
  }

  // Get user ID
  getUserId() {
    if (typeof window !== 'undefined') {
      this.userId = localStorage.getItem('user_id')
    }
    return this.userId
  }

  // Check if token exists and is valid
  isAuthenticated() {
    return !!this.getToken() && !!this.getUserRole() && !!this.getUserId()
  }

  // Clear stored data (logout)
  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
    }
    this.token = null
    this.userRole = null
    this.userId = null
  }

  // Set new token
  setToken(token: string, userRole: string, userId: string) {
    this.token = token
    this.userRole = userRole
    this.userId = userId
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
      localStorage.setItem('user_role', userRole)
      localStorage.setItem('user_id', userId)
    }
  }
}

// Secure API Client for Place Management
class PlaceManagementAPI {
  private baseURL: string
  private tokenManager: TokenManager

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') {
    // Remove /api/secure-select from baseURL if it's included
    this.baseURL = baseURL.replace(/\/api\/secure-select$/, '')
    this.tokenManager = new TokenManager()
    
    console.log('🏗️ PlaceManagementAPI initialized')
    console.log('🌐 Base URL:', this.baseURL)
  }

  // Get headers with JWT token and App credentials
  private getHeaders() {
    const token = this.tokenManager.getToken()
    
    console.log('🔑 Getting auth headers...')
    console.log('🔑 Token exists:', !!token)
    console.log('🔑 Token length:', token?.length)
    console.log('🔑 Token preview:', token?.substring(0, 20) + '...')
    
    if (!token) {
      console.error('❌ No authentication token found!')
      throw new Error('No authentication token found. Please login first.')
    }

    // Get App ID and Service Key from environment variables
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'
    const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key'

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-App-Id': appId,
      'X-Service-Key': serviceKey
    }
    
    console.log('✅ Headers prepared with Authorization, App-Id, and Service-Key')
    
    return headers
  }

  // Make authenticated request
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      // Handle different API endpoint types
      // /api/secure-select for SELECT operations
      // /api/secure-insert for INSERT operations
      // /api/secure-update for UPDATE operations
      const normalizedEndpoint = endpoint.startsWith('/api/') 
        ? endpoint 
        : `/api/secure-select${endpoint}`
      
      const url = `${this.baseURL}${normalizedEndpoint}`
      const headers = this.getHeaders()

      console.log('📡 Making request to:', url)
      console.log('📡 Request headers:', headers)
      console.log('📡 Request options:', options)

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)

      const data = await response.json()

      console.log('📦 Response data:', data)

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          console.error('🔐 Authentication failed (401)')
          this.tokenManager.clearToken()
          throw new Error('Authentication failed. Please login again.')
        }
        console.error('❌ API Error:', data.message || 'API request failed')
        throw new Error(data.message || 'API request failed')
      }

      return data
    } catch (error) {
      console.error('❌ API request error:', error)
      throw error
    }
  }

  // GET request
  async get(endpoint: string, params: Record<string, any> = {}) {
    // Remove undefined values from params
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)

    const queryString = new URLSearchParams(cleanParams).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    console.log(`🌐 API GET: ${this.baseURL}${url}`)
    
    return this.makeRequest(url, { method: 'GET' })
  }

  // POST request
  async post(endpoint: string, data: any = {}) {
    // For secure-insert endpoints, don't add /api/secure-select prefix
    const normalizedEndpoint = endpoint.startsWith('/api/') 
      ? endpoint 
      : `/api/secure-select${endpoint}`
    
    return this.makeRequest(normalizedEndpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT request
  async put(endpoint: string, data: any = {}) {
    // For secure-update endpoints, don't add /api/secure-select prefix
    const normalizedEndpoint = endpoint.startsWith('/api/') 
      ? endpoint 
      : `/api/secure-select${endpoint}`
    
    return this.makeRequest(normalizedEndpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE request
  async delete(endpoint: string) {
    return this.makeRequest(endpoint, { method: 'DELETE' })
  }

  // =====================================================
  // INSERT, UPDATE, DELETE METHODS
  // =====================================================

  // Insert a single record
  async insertRecord(tableName: string, data: Record<string, any>) {
    try {
      console.log(`📝 Inserting record into ${tableName}:`, data)
      
      const response = await this.post(`/api/secure-insert/${tableName}`, data)
      
      console.log(`✅ Insert successful:`, response)
      
      return response
    } catch (error) {
      console.error(`❌ Failed to insert into ${tableName}:`, error)
      throw error
    }
  }

  // Update record(s)
  async updateRecord(tableName: string, where: Record<string, any>, data: Record<string, any>) {
    try {
      console.log(`📝 Updating ${tableName} where:`, where, 'data:', data)
      
      const response = await this.put(`/api/secure-update/${tableName}`, {
        where,
        data
      })
      
      console.log(`✅ Update successful:`, response)
      
      return response
    } catch (error) {
      console.error(`❌ Failed to update ${tableName}:`, error)
      throw error
    }
  }

  // Soft delete (set is_deleted = true)
  async softDeleteRecord(tableName: string, id: string) {
    try {
      console.log(`🗑️ Soft deleting from ${tableName}, id:`, id)
      
      const response = await this.updateRecord(tableName, { id }, { is_deleted: true })
      
      console.log(`✅ Soft delete successful:`, response)
      
      return response
    } catch (error) {
      console.error(`❌ Failed to soft delete from ${tableName}:`, error)
      throw error
    }
  }

  // =====================================================
  // PLACE MANAGEMENT METHODS
  // =====================================================

  // Get allowed tables for current user role
  async getAllowedTables() {
    try {
      const response = await this.get('/tables')
      return response.data
    } catch (error) {
      console.error('Failed to get allowed tables:', error)
      throw error
    }
  }

  // Get table information and schema
  async getTableInfo(tableName: string) {
    try {
      const response = await this.get(`/${tableName}/info`)
      return response.data
    } catch (error) {
      console.error(`Failed to get info for table ${tableName}:`, error)
      throw error
    }
  }

  // Get data from a table with basic parameters
  async getTableData(tableName: string, options: {
    limit?: number
    page?: number
    filters?: any[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    try {
      const params: Record<string, any> = {
        limit: options.limit || 20,
        page: options.page || 1
      }

      // Only add sortBy and sortOrder if they're provided
      if (options.sortBy) {
        params.sortBy = options.sortBy
      }
      if (options.sortOrder) {
        params.sortOrder = options.sortOrder
      }

      // Convert filters array to JSON string if provided
      if (options.filters && options.filters.length > 0) {
        params.filters = JSON.stringify(options.filters)
      }

      console.log(`🔍 Fetching ${tableName} with params:`, params)

      const response = await this.get(`/${tableName}`, params)
      
      console.log(`✅ Response from ${tableName}:`, response)

      // Check if response has data property
      if (response && response.data) {
        console.log(`📦 Returning ${response.data.length} records from ${tableName}`)
        return response.data
      } else if (Array.isArray(response)) {
        // If response is directly an array
        console.log(`📦 Response is array, returning ${response.length} records`)
        return response
      } else {
        console.warn(`⚠️ Unexpected response structure from ${tableName}:`, response)
        return []
      }
    } catch (error) {
      console.error(`❌ Failed to get data from ${tableName}:`, error)
      throw error
    }
  }

  // =====================================================
  // PLACES SPECIFIC METHODS
  // =====================================================

  // Get all places with optional filtering
  async getPlaces(options: {
    limit?: number
    page?: number
    city?: string
    placeType?: string
    isActive?: boolean
    search?: string
  } = {}) {
    const filters: any[] = []

    if (options.city) {
      filters.push({
        column: 'city',
        operator: 'equals',
        value: options.city
      })
    }

    if (options.placeType) {
      filters.push({
        column: 'place_type',
        operator: 'equals',
        value: options.placeType
      })
    }

    if (options.isActive !== undefined) {
      filters.push({
        column: 'is_active',
        operator: options.isActive ? 'is_true' : 'is_false',
        value: options.isActive
      })
    }

    if (options.search) {
      filters.push({
        column: 'name',
        operator: 'contains',
        value: options.search
      })
    }

    return this.getTableData('places', {
      limit: options.limit || 50,
      page: options.page || 1,
      filters: filters.length > 0 ? filters : undefined
    })
  }

  // Get active places only
  async getActivePlaces() {
    return this.getPlaces({ isActive: true })
  }

  // Get deactivated places
  async getDeactivatedPlaces() {
    return this.getPlaces({ isActive: false })
  }

  // Get place by ID
  async getPlaceById(placeId: string) {
    try {
      const filters = [{
        column: 'id',
        operator: 'equals',
        value: placeId
      }]

      const response = await this.getTableData('places', { filters })
      return response.length > 0 ? response[0] : null
    } catch (error) {
      console.error(`Failed to get place ${placeId}:`, error)
      throw error
    }
  }

  // Get place status with deactivation info
  async getPlaceStatus(placeId: string) {
    try {
      const filters = [{
        column: 'place_id',
        operator: 'equals',
        value: placeId
      }]

      const response = await this.getTableData('place_status_view', { filters })
      return response.length > 0 ? response[0] : null
    } catch (error) {
      console.error(`Failed to get place status ${placeId}:`, error)
      throw error
    }
  }

  // Get deactivation history for a place
  async getPlaceDeactivationHistory(placeId: string) {
    try {
      const filters = [{
        column: 'place_id',
        operator: 'equals',
        value: placeId
      }]

      return this.getTableData('place_deactivation_reasons', { 
        filters,
        sortBy: 'deactivated_at',
        sortOrder: 'desc'
      })
    } catch (error) {
      console.error(`Failed to get deactivation history for ${placeId}:`, error)
      throw error
    }
  }

  // =====================================================
  // VISITORS SPECIFIC METHODS
  // =====================================================

  // Get all visitors with optional filtering
  async getVisitors(options: {
    limit?: number
    page?: number
    search?: string
    company?: string
    isBlacklisted?: boolean
  } = {}) {
    const filters: any[] = []

    if (options.search) {
      filters.push({
        column: 'first_name',
        operator: 'contains',
        value: options.search
      })
    }

    if (options.company) {
      filters.push({
        column: 'company',
        operator: 'equals',
        value: options.company
      })
    }

    if (options.isBlacklisted !== undefined) {
      filters.push({
        column: 'is_blacklisted',
        operator: options.isBlacklisted ? 'is_true' : 'is_false',
        value: options.isBlacklisted
      })
    }

    return this.getTableData('visitors', {
      limit: options.limit || 50,
      page: options.page || 1,
      filters: filters.length > 0 ? filters : undefined
    })
  }

  // Search visitors by name
  async searchVisitorsByName(searchTerm: string) {
    const filters = [{
      column: 'first_name',
      operator: 'contains',
      value: searchTerm
    }]

    return this.getTableData('visitors', { filters })
  }

  // Get blacklisted visitors
  async getBlacklistedVisitors() {
    return this.getVisitors({ isBlacklisted: true })
  }

  // =====================================================
  // VISITS SPECIFIC METHODS
  // =====================================================

  // Get all visits with optional filtering
  async getVisits(options: {
    limit?: number
    page?: number
    placeId?: string
    visitorId?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  } = {}) {
    const filters: any[] = []

    if (options.placeId) {
      filters.push({
        column: 'place_id',
        operator: 'equals',
        value: options.placeId
      })
    }

    if (options.visitorId) {
      filters.push({
        column: 'visitor_id',
        operator: 'equals',
        value: options.visitorId
      })
    }

    if (options.status) {
      filters.push({
        column: 'visit_status',
        operator: 'equals',
        value: options.status
      })
    }

    if (options.dateFrom && options.dateTo) {
      filters.push({
        column: 'scheduled_start_time',
        operator: 'date_between',
        value: [options.dateFrom, options.dateTo]
      })
    }

    return this.getTableData('visits', {
      limit: options.limit || 50,
      page: options.page || 1,
      filters: filters.length > 0 ? filters : undefined,
      sortBy: 'scheduled_start_time',
      sortOrder: 'desc'
    })
  }

  // Get today's visits
  async getTodaysVisits() {
    const today = new Date().toISOString().split('T')[0]
    return this.getTableData('todays_visits', {
      sortBy: 'scheduled_start_time',
      sortOrder: 'asc'
    })
  }

  // Get visits by date range
  async getVisitsByDateRange(startDate: string, endDate: string) {
    return this.getVisits({ dateFrom: startDate, dateTo: endDate })
  }

  // Get visits by place
  async getVisitsByPlace(placeId: string) {
    return this.getVisits({ placeId })
  }

  // =====================================================
  // STATISTICS METHODS
  // =====================================================

  // Get place statistics
  async getPlaceStatistics(placeId?: string) {
    try {
      const filters = placeId ? [{
        column: 'place_id',
        operator: 'equals',
        value: placeId
      }] : []

      return this.getTableData('place_statistics', { 
        filters: filters.length > 0 ? filters : undefined,
        sortBy: 'date',
        sortOrder: 'desc'
      })
    } catch (error) {
      console.error('Failed to get place statistics:', error)
      throw error
    }
  }

  // Get place statistics summary
  async getPlaceStatisticsSummary() {
    try {
      return this.getTableData('place_statistics_summary')
    } catch (error) {
      console.error('Failed to get place statistics summary:', error)
      throw error
    }
  }

  // =====================================================
  // ACCESS LOGS METHODS
  // =====================================================

  // Get access logs
  async getAccessLogs(options: {
    limit?: number
    page?: number
    placeId?: string
    visitId?: string
    accessType?: string
    dateFrom?: string
    dateTo?: string
  } = {}) {
    const filters: any[] = []

    if (options.placeId) {
      filters.push({
        column: 'place_id',
        operator: 'equals',
        value: options.placeId
      })
    }

    if (options.visitId) {
      filters.push({
        column: 'visit_id',
        operator: 'equals',
        value: options.visitId
      })
    }

    if (options.accessType) {
      filters.push({
        column: 'access_type',
        operator: 'equals',
        value: options.accessType
      })
    }

    if (options.dateFrom && options.dateTo) {
      filters.push({
        column: 'access_time',
        operator: 'date_between',
        value: [options.dateFrom, options.dateTo]
      })
    }

    return this.getTableData('place_access_logs', {
      limit: options.limit || 50,
      page: options.page || 1,
      filters: filters.length > 0 ? filters : undefined,
      sortBy: 'access_time',
      sortOrder: 'desc'
    })
  }

  // =====================================================
  // NOTIFICATIONS METHODS
  // =====================================================

  // Get notifications
  async getNotifications(options: {
    limit?: number
    page?: number
    placeId?: string
    type?: string
    priority?: string
    isRead?: boolean
  } = {}) {
    const filters: any[] = []

    if (options.placeId) {
      filters.push({
        column: 'place_id',
        operator: 'equals',
        value: options.placeId
      })
    }

    if (options.type) {
      filters.push({
        column: 'notification_type',
        operator: 'equals',
        value: options.type
      })
    }

    if (options.priority) {
      filters.push({
        column: 'priority',
        operator: 'equals',
        value: options.priority
      })
    }

    if (options.isRead !== undefined) {
      filters.push({
        column: 'is_read',
        operator: options.isRead ? 'is_true' : 'is_false',
        value: options.isRead
      })
    }

    return this.getTableData('place_notifications', {
      limit: options.limit || 20,
      page: options.page || 1,
      filters: filters.length > 0 ? filters : undefined,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }
}

// Export singleton instance
export const placeManagementAPI = new PlaceManagementAPI()
export { TokenManager }
export type { PlaceManagementAPI }
