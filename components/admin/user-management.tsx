"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  User as UserIcon,
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  RotateCcw,
  Eye,
  TrendingUp,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Building2,
  Phone,
  MapPin,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  EyeOff,
  Eye as EyeIcon,
  Loader2,
  UserCircle,
  Lock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/auth-context'

interface User {
  id: string
  email: string
  role: string
  is_email_verified: boolean
  login_attempts: number
  locked_until: string | null
  last_login: string | null
  user_created_at: string
  user_updated_at: string
  profile_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  date_of_birth: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  social_links: any
  preferences: any
  custom_fields: any
  profile_created_at: string
  profile_updated_at: string
  status: string
}

interface UserStatistics {
  overview: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    recentRegistrations: number
    recentActiveLogins: number
  }
  roleDistribution: Array<{ role: string; count: number }>
  recentUsers: Array<{
    id: string
    email: string
    role: string
    first_name: string | null
    last_name: string | null
    created_at: string
  }>
  mostActiveUsers: Array<{
    id: string
    email: string
    role: string
    first_name: string | null
    last_name: string | null
    last_login: string
  }>
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

import { API_BASE_URL } from '@/lib/api-config'

const API_BASE = API_BASE_URL

const getAuthHeaders = () => {
  // Get token from localStorage (same as placeManagementAPI)
  const token = localStorage.getItem('authToken') || localStorage.getItem('jwt_token')
  
  // Get App ID and Service Key from environment variables (same as placeManagementAPI)
  const appId = process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'
  const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key'
  
  console.log('🔑 User Management - Getting auth headers...')
  console.log('🔑 Token exists:', !!token)
  console.log('🔑 App ID:', appId)
  console.log('🔑 Service Key:', serviceKey ? 'Set' : 'Missing')
  
  if (!token) {
    console.error('❌ No authentication token found!')
    throw new Error('No authentication token found. Please login first.')
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-App-Id': appId,
    'X-Service-Key': serviceKey
  }
}

export function UserManagement() {
  // State management
  const [users, setUsers] = useState<User[]>([])
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Dialog states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deactivateReason, setDeactivateReason] = useState('')

  // Create user form states
  const [createUserFormData, setCreateUserFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'staff' as 'admin' | 'staff' | 'assistant'
  })
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  
  const { signUp } = useAuth()

  // Form data
  const [userFormData, setUserFormData] = useState({
    email: '',
    role: 'employee'
  })

  const [profileFormData, setProfileFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    avatar_url: '',
    bio: '',
    website: ''
  })

  // Load data on component mount
  useEffect(() => {
    loadUsers()
    loadStatistics()
  }, [])

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (pagination.page === 1) {
        loadUsers()
      } else {
        setPagination(prev => ({ ...prev, page: 1 }))
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, roleFilter, statusFilter])

  // Load users when page changes
  useEffect(() => {
    loadUsers()
  }, [pagination.page])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await fetch(`${API_BASE}/api/user-management/users?${params}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        throw new Error(errorData.message || errorData.error || 'Failed to fetch users')
      }

      const data = await response.json()
      console.log('API Success Response:', data)
      
      if (data.success) {
        setUsers(data.data.users)
        setPagination(data.data.pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user-management/statistics`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const data = await response.json()
      
      if (data.success) {
        setStatistics(data.data)
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/api/user-management/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userFormData)
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success('User updated successfully')
        setIsUserDialogOpen(false)
        loadUsers()
      } else {
        throw new Error(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!selectedUser) return

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/api/user-management/users/${selectedUser.id}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileFormData)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success('Profile updated successfully')
        setIsProfileDialogOpen(false)
        loadUsers()
      } else {
        throw new Error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/api/user-management/users/${userId}/activate`, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to activate user')
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success('User activated successfully')
        loadUsers()
      } else {
        throw new Error(data.error || 'Failed to activate user')
      }
    } catch (error) {
      console.error('Error activating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to activate user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivateUser = async () => {
    if (!selectedUser) return

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/api/user-management/users/${selectedUser.id}/deactivate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: deactivateReason })
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate user')
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success('User deactivated successfully')
        setIsDeactivateDialogOpen(false)
        setDeactivateReason('')
        loadUsers()
      } else {
        throw new Error(data.error || 'Failed to deactivate user')
      }
    } catch (error) {
      console.error('Error deactivating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendPasswordReset = async (userId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/api/user-management/users/${userId}/send-password-reset`, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to send password reset')
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Password reset email sent to ${data.data.email}`)
      } else {
        throw new Error(data.error || 'Failed to send password reset')
      }
    } catch (error) {
      console.error('Error sending password reset:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/api/user-management/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success('User deleted successfully')
        loadUsers()
      } else {
        throw new Error(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Frontend validation
    if (!createUserFormData.firstName || !createUserFormData.firstName.trim()) {
      toast.error('First name is required')
      return
    }
    
    if (!createUserFormData.lastName || !createUserFormData.lastName.trim()) {
      toast.error('Last name is required')
      return
    }
    
    if (!createUserFormData.email || !createUserFormData.email.trim()) {
      toast.error('Email is required')
      return
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(createUserFormData.email)) {
      toast.error('Please enter a valid email address')
      return
    }
    
    if (!createUserFormData.password || createUserFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    if (!createUserFormData.role) {
      toast.error('Please select a role')
      return
    }
    
    setIsCreatingUser(true)

    try {
      console.log('📝 Creating user with data:', {
        email: createUserFormData.email,
        firstName: createUserFormData.firstName,
        lastName: createUserFormData.lastName,
        role: createUserFormData.role,
        passwordLength: createUserFormData.password.length
      })
      
      const result = await signUp({
        email: createUserFormData.email.trim(),
        password: createUserFormData.password,
        firstName: createUserFormData.firstName.trim(),
        lastName: createUserFormData.lastName.trim(),
        role: createUserFormData.role as 'admin' | 'staff' | 'assistant'
      })

      console.log('📝 SignUp result:', result)

      if (result.success) {
        toast.success('User created successfully!')
        // Reset form
        setCreateUserFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'staff'
        })
        setIsCreateUserDialogOpen(false)
        // Reload users list
        loadUsers()
      } else {
        console.error('❌ SignUp failed:', result)
        const errorMessage = result.error || result.message || 'Failed to create user. Please try again.'
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('❌ Error creating user:', error)
      const errorMessage = error?.message || error?.error || 'An unexpected error occurred. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsCreatingUser(false)
    }
  }

  const openUserDialog = (user: User) => {
    setSelectedUser(user)
    setUserFormData({
      email: user.email,
      role: user.role
    })
    setIsUserDialogOpen(true)
  }

  const openProfileDialog = (user: User) => {
    setSelectedUser(user)
    setProfileFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      postal_code: user.postal_code || '',
      avatar_url: user.avatar_url || '',
      bio: user.bio || '',
      website: user.website || ''
    })
    setIsProfileDialogOpen(true)
  }

  const openDeactivateDialog = (user: User) => {
    setSelectedUser(user)
    setDeactivateReason('')
    setIsDeactivateDialogOpen(true)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'reception': return 'secondary'
      case 'employee': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusBadge = (user: User) => {
    const isActive = user.status === 'active'
    return (
      <Badge variant={isActive ? 'default' : 'destructive'} className={isActive ? 'bg-green-500' : 'bg-red-500'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Users</p>
                  <p className="text-4xl font-bold text-blue-900 mt-2">{statistics.overview.totalUsers}</p>
                  <p className="text-xs text-blue-600 mt-1">All registered users</p>
                </div>
                <div className="p-4 bg-blue-500 rounded-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Active Users</p>
                  <p className="text-4xl font-bold text-green-900 mt-2">{statistics.overview.activeUsers}</p>
                  <p className="text-xs text-green-600 mt-1">Verified & unlocked</p>
                </div>
                <div className="p-4 bg-green-500 rounded-lg">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Recent Registrations</p>
                  <p className="text-4xl font-bold text-orange-900 mt-2">{statistics.overview.recentRegistrations}</p>
                  <p className="text-xs text-orange-600 mt-1">Last 30 days</p>
                </div>
                <div className="p-4 bg-orange-500 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Active Logins</p>
                  <p className="text-4xl font-bold text-purple-900 mt-2">{statistics.overview.recentActiveLogins}</p>
                  <p className="text-xs text-purple-600 mt-1">Last 7 days</p>
                </div>
                <div className="p-4 bg-purple-500 rounded-lg">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">👥 User Management</TabsTrigger>
          <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters and Search */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={roleFilter || "all"} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="reception">Reception</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setIsCreateUserDialogOpen(true)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 w-full sm:w-auto whitespace-nowrap"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create User</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-6 w-6 text-blue-600" />
                User Management
                <Badge className="ml-auto bg-blue-600 text-white text-base px-4 py-2">
                  {pagination.total} Users
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <p className="text-red-600 font-medium">{error}</p>
                  <Button onClick={loadUsers} className="mt-4">Retry</Button>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl font-bold text-muted-foreground mb-2">No users found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || roleFilter || statusFilter 
                      ? 'Try adjusting your search or filters' 
                      : 'No users have been registered yet'}
                  </p>
                </div>
              ) : (
                <div className="border-2 rounded-lg overflow-hidden shadow-lg">
                  <div className="relative overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
                        <TableRow>
                          <TableHead className="font-bold min-w-[200px]">User Details</TableHead>
                          <TableHead className="font-bold min-w-[150px]">Contact</TableHead>
                          <TableHead className="font-bold min-w-[100px]">Role</TableHead>
                          <TableHead className="font-bold min-w-[100px]">Status</TableHead>
                          <TableHead className="font-bold min-w-[150px]">Last Login</TableHead>
                          <TableHead className="font-bold min-w-[120px]">Created</TableHead>
                          <TableHead className="font-bold text-center min-w-[200px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <div className="max-h-[450px] overflow-y-auto">
                      <Table className="w-full">
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-blue-50 transition-colors">
                              <TableCell className="min-w-[200px]">
                                <div className="space-y-1">
                                  <p className="font-bold">
                                    {user.first_name && user.last_name 
                                      ? `${user.first_name} ${user.last_name}`
                                      : 'No Name Set'
                                    }
                                  </p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  {user.phone && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {user.phone}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[150px]">
                                <div className="space-y-1">
                                  {user.city && user.country && (
                                    <p className="text-sm flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-muted-foreground" />
                                      {user.city}, {user.country}
                                    </p>
                                  )}
                                  {user.website && (
                                    <p className="text-sm flex items-center gap-1">
                                      <Globe className="h-3 w-3 text-muted-foreground" />
                                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        Website
                                      </a>
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[100px]">
                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                  {user.role.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[100px]">
                                {getStatusBadge(user)}
                              </TableCell>
                              <TableCell className="min-w-[150px]">
                                <div className="text-sm">
                                  <p>{formatDateTime(user.last_login)}</p>
                                  {user.login_attempts > 0 && (
                                    <p className="text-red-600 text-xs">
                                      {user.login_attempts} failed attempts
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[120px]">
                                <div className="text-sm">
                                  <p>{formatDate(user.user_created_at)}</p>
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[200px]">
                                <div className="flex items-center gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openUserDialog(user)}
                                    title="Edit User"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openProfileDialog(user)}
                                    title="Edit Profile"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendPasswordReset(user.id)}
                                    title="Send Password Reset"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  {user.status === 'active' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openDeactivateDialog(user)}
                                      title="Deactivate User"
                                    >
                                      <ShieldX className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleActivateUser(user.id)}
                                      title="Activate User"
                                    >
                                      <ShieldCheck className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteUser(user.id)}
                                    title="Delete User"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {statistics && (
            <>
              {/* Role Distribution */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statistics.roleDistribution.map((role) => (
                      <div key={role.role} className="text-center p-4 border-2 rounded-lg">
                        <p className="text-2xl font-bold">{role.count}</p>
                        <p className="text-sm text-muted-foreground capitalize">{role.role}s</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Users */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : 'No Name Set'
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Active Users */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Most Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.mostActiveUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : 'No Name Set'
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(user.last_login)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* User Edit Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={userFormData.role} 
                onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsUserDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Edit Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profileFormData.first_name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, first_name: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profileFormData.last_name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, last_name: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileFormData.phone}
                onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={profileFormData.date_of_birth}
                onChange={(e) => setProfileFormData({ ...profileFormData, date_of_birth: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profileFormData.address}
                onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profileFormData.city}
                  onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profileFormData.state}
                  onChange={(e) => setProfileFormData({ ...profileFormData, state: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profileFormData.country}
                  onChange={(e) => setProfileFormData({ ...profileFormData, country: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={profileFormData.postal_code}
                onChange={(e) => setProfileFormData({ ...profileFormData, postal_code: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={profileFormData.website}
                onChange={(e) => setProfileFormData({ ...profileFormData, website: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileFormData.bio}
                onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
                disabled={isLoading}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsProfileDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile} disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Deactivate User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to deactivate this user? They will not be able to log in until reactivated.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Enter reason for deactivation..."
                disabled={isLoading}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeactivateDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeactivateUser} 
                disabled={isLoading}
              >
                {isLoading ? 'Deactivating...' : 'Deactivate User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="create-firstName"
                    type="text"
                    placeholder="First name"
                    value={createUserFormData.firstName}
                    onChange={(e) => setCreateUserFormData({ ...createUserFormData, firstName: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="create-lastName"
                    type="text"
                    placeholder="Last name"
                    value={createUserFormData.lastName}
                    onChange={(e) => setCreateUserFormData({ ...createUserFormData, lastName: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="create-email"
                  type="email"
                  placeholder="Enter email address"
                  value={createUserFormData.email}
                  onChange={(e) => setCreateUserFormData({ ...createUserFormData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="create-password"
                  type={showCreatePassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={createUserFormData.password}
                  onChange={(e) => setCreateUserFormData({ ...createUserFormData, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Validation Rules */}
              <div className="mt-2 p-3 bg-muted/50 rounded-md border border-border">
                <p className="text-xs font-semibold text-foreground mb-2">Password Requirements:</p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2">
                    {createUserFormData.password.length >= 6 ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    )}
                    <span className={`${createUserFormData.password.length >= 6 ? "text-green-700 dark:text-green-400 font-medium" : "text-muted-foreground"}`}>
                      <strong>Required:</strong> At least 6 characters long {createUserFormData.password.length > 0 && `(${createUserFormData.password.length}/6)`}
                    </span>
                  </li>
                  <li className="pt-1 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Recommended for better security:</p>
                  </li>
                  <li className="flex items-center gap-2">
                    {createUserFormData.password.length > 0 && /[a-z]/.test(createUserFormData.password) ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    ) : createUserFormData.password.length > 0 ? (
                      <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span className={`${createUserFormData.password.length > 0 && /[a-z]/.test(createUserFormData.password) ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                      Contains at least one lowercase letter
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {createUserFormData.password.length > 0 && /[A-Z]/.test(createUserFormData.password) ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    ) : createUserFormData.password.length > 0 ? (
                      <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span className={`${createUserFormData.password.length > 0 && /[A-Z]/.test(createUserFormData.password) ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                      Contains at least one uppercase letter
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {createUserFormData.password.length > 0 && /[0-9]/.test(createUserFormData.password) ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    ) : createUserFormData.password.length > 0 ? (
                      <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span className={`${createUserFormData.password.length > 0 && /[0-9]/.test(createUserFormData.password) ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                      Contains at least one number
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {createUserFormData.password.length > 0 && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(createUserFormData.password) ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    ) : createUserFormData.password.length > 0 ? (
                      <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span className={`${createUserFormData.password.length > 0 && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(createUserFormData.password) ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                      Contains at least one special character
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role" className="text-sm font-medium">
                Access Level
              </Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select 
                  value={createUserFormData.role} 
                  onValueChange={(value: 'admin' | 'staff' | 'assistant') => 
                    setCreateUserFormData({ ...createUserFormData, role: value })
                  }
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="assistant">Smart Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateUserDialogOpen(false)
                  setCreateUserFormData({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    role: 'employee'
                  })
                }}
                disabled={isCreatingUser}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                disabled={isCreatingUser}
              >
                {isCreatingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}