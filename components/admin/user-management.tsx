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
    role: 'staff'
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
      case 'staff': return 'secondary'
      case 'assistant': return 'outline'
      default: return 'outline'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'staff': return 'Staff'
      case 'assistant': return 'Smart Assistant'
      default: return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }

  const getRoleShortName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin'
      case 'staff': return 'Staff'
      case 'assistant': return 'Assistant'
      default: return role.charAt(0).toUpperCase() + role.slice(1)
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
      <div className="space-y-3 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
      {/* Compact Statistics Table */}
      {statistics && (
        <Card className="border shadow-sm dark:bg-card dark:border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableBody>
                  <TableRow className="hover:bg-transparent border-b dark:border-border">
                    <TableCell className="py-2.5 px-4 font-medium text-[13px] dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                        Total Users
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-right dark:text-foreground">
                      <span className="text-xl font-bold">{statistics.overview.totalUsers}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 font-medium text-[13px] dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Active Users
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-right dark:text-foreground">
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">{statistics.overview.activeUsers}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 font-medium text-[13px] dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        Recent Registrations
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-right dark:text-foreground">
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{statistics.overview.recentRegistrations}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 font-medium text-[13px] dark:text-foreground">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Active Logins
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-right dark:text-foreground">
                      <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{statistics.overview.recentActiveLogins}</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - All in One Line */}
      <Tabs defaultValue="users" className="dark:text-foreground">
        {/* Compact Header with Search, Filters, Create Button, and Tabs in One Line */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pb-2 border-b border-border/50 dark:border-border">
          {/* Search */}
          <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground z-10" />
            <Input
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground"
            />
          </div>

          {/* Filters and Button Container */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter */}
            <Select value={roleFilter || "all"} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="dark:bg-card dark:border-border">
                <SelectItem value="all" className="dark:text-foreground dark:hover:bg-muted text-[13px]">All Roles</SelectItem>
                <SelectItem value="admin" className="dark:text-foreground dark:hover:bg-muted text-[13px]">Administrator</SelectItem>
                <SelectItem value="staff" className="dark:text-foreground dark:hover:bg-muted text-[13px]">Staff</SelectItem>
                <SelectItem value="assistant" className="dark:text-foreground dark:hover:bg-muted text-[13px]">Smart Assistant</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-[13px] dark:bg-card dark:border-border dark:text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-card dark:border-border">
                <SelectItem value="all" className="dark:text-foreground dark:hover:bg-muted text-[13px]">All Status</SelectItem>
                <SelectItem value="active" className="dark:text-foreground dark:hover:bg-muted text-[13px]">Active</SelectItem>
                <SelectItem value="inactive" className="dark:text-foreground dark:hover:bg-muted text-[13px]">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Create Button */}
            <Button
              onClick={() => setIsCreateUserDialogOpen(true)}
              className="h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 shadow-lg whitespace-nowrap"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Create User
            </Button>

            {/* Tabs */}
            <TabsList className="h-9 dark:bg-muted dark:border-border ml-auto">
              <TabsTrigger value="users" className="text-[13px] px-3 dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground">👥 Users</TabsTrigger>
              <TabsTrigger value="analytics" className="text-[13px] px-3 dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground">📊 Analytics</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-3 mt-3">

          {/* Users Table */}
          <Card className="border shadow-md dark:bg-card dark:border-border">
            <CardContent className="p-0 dark:bg-card">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 px-4">
                  <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                  <Button onClick={loadUsers} className="mt-4">Retry</Button>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Users className="h-20 w-20 mx-auto text-muted-foreground dark:text-muted-foreground mb-4" />
                  <p className="text-xl font-bold text-muted-foreground dark:text-muted-foreground mb-2">No users found</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {searchTerm || roleFilter || statusFilter 
                      ? 'Try adjusting your search or filters' 
                      : 'No users have been registered yet'}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden dark:border-border">
                  <div className="overflow-x-auto table-scroll-container">
                    <div className="inline-block min-w-full align-middle">
                      <Table className="w-full dark:bg-card" style={{ minWidth: 'max-content' }}>
                        <TableHeader className="sticky top-0 bg-background dark:bg-card z-10 shadow-sm dark:border-border">
                          <TableRow className="dark:border-border">
                            <TableHead className="font-semibold text-[13px] min-w-[180px] dark:text-foreground">User Details</TableHead>
                            <TableHead className="font-semibold text-[13px] min-w-[140px] dark:text-foreground">Contact</TableHead>
                            <TableHead className="font-semibold text-[13px] min-w-[90px] dark:text-foreground">Role</TableHead>
                            <TableHead className="font-semibold text-[13px] min-w-[90px] dark:text-foreground">Status</TableHead>
                            <TableHead className="font-semibold text-[13px] min-w-[140px] dark:text-foreground">Last Login</TableHead>
                            <TableHead className="font-semibold text-[13px] min-w-[110px] dark:text-foreground">Created</TableHead>
                            <TableHead className="font-semibold text-[13px] text-center min-w-[180px] sticky right-0 bg-background dark:bg-card z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_rgba(255,255,255,0.1)] dark:text-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                      </Table>
                    </div>
                  </div>
                  <div className="max-h-[calc(7*48px)] overflow-y-auto table-scroll-container-vertical">
                    <div className="overflow-x-auto table-scroll-container">
                      <div className="inline-block min-w-full align-middle">
                        <Table className="w-full dark:bg-card" style={{ minWidth: 'max-content' }}>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user.id} className="hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors dark:border-border">
                                <TableCell className="min-w-[180px] text-[13px] dark:text-foreground">
                                  <div className="space-y-0.5">
                                    <p className="font-semibold dark:text-foreground">
                                      {user.first_name && user.last_name 
                                        ? `${user.first_name} ${user.last_name}`
                                        : 'No Name Set'
                                      }
                                    </p>
                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">{user.email}</p>
                                    {user.phone && (
                                      <p className="text-xs text-muted-foreground dark:text-muted-foreground flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {user.phone}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="min-w-[140px] text-[13px] dark:text-foreground">
                                  <div className="space-y-0.5">
                                    {user.city && user.country && (
                                      <p className="text-xs flex items-center gap-1 dark:text-foreground">
                                        <MapPin className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                                        {user.city}, {user.country}
                                      </p>
                                    )}
                                    {user.website && (
                                      <p className="text-xs flex items-center gap-1">
                                        <Globe className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                          Website
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="min-w-[90px]">
                                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-[11px] dark:border-border">
                                    {user.role.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="min-w-[90px]">
                                  {getStatusBadge(user)}
                                </TableCell>
                                <TableCell className="min-w-[140px] text-[13px] dark:text-foreground">
                                  <div>
                                    <p className="text-xs dark:text-foreground">{formatDateTime(user.last_login)}</p>
                                    {user.login_attempts > 0 && (
                                      <p className="text-red-600 dark:text-red-400 text-[11px]">
                                        {user.login_attempts} failed attempts
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="min-w-[110px] text-[13px] dark:text-foreground">
                                  <p className="text-xs dark:text-foreground">{formatDate(user.user_created_at)}</p>
                                </TableCell>
                                <TableCell className="min-w-[180px] sticky right-0 bg-background dark:bg-card z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_rgba(255,255,255,0.1)]">
                                  <div className="flex items-center gap-1 justify-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openUserDialog(user)}
                                      title="Edit User"
                                      className="h-7 px-2 text-[11px] dark:border-border dark:hover:bg-muted"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openProfileDialog(user)}
                                      title="Edit Profile"
                                      className="h-7 px-2 text-[11px] dark:border-border dark:hover:bg-muted"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSendPasswordReset(user.id)}
                                      title="Send Password Reset"
                                      className="h-7 px-2 text-[11px] dark:border-border dark:hover:bg-muted"
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                    </Button>
                                    {user.status === 'active' ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openDeactivateDialog(user)}
                                        title="Deactivate User"
                                        className="h-7 px-2 text-[11px] dark:border-border dark:hover:bg-muted"
                                      >
                                        <ShieldX className="h-3.5 w-3.5" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleActivateUser(user.id)}
                                        title="Activate User"
                                        className="h-7 px-2 text-[11px] dark:border-border dark:hover:bg-muted"
                                      >
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteUser(user.id)}
                                      title="Delete User"
                                      className="h-7 px-2 text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:border-border dark:hover:bg-muted"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 px-2">
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="h-8 text-[12px] dark:border-border dark:hover:bg-muted"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="h-8 text-[12px] dark:border-border dark:hover:bg-muted"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {statistics && (
            <>
              {/* Role Distribution */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-4 w-4" />
                    Role Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-3">
                    {statistics.roleDistribution.map((role) => (
                      <div key={role.role} className="text-center p-3 border rounded-lg bg-muted/30">
                        <p className="text-xl font-bold">{role.count}</p>
                        <p className="text-xs text-muted-foreground mt-1">{getRoleDisplayName(role.role)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Users */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-4 w-4" />
                    Recent Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {statistics.recentUsers.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : 'No Name Set'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {getRoleShortName(user.role)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {statistics.recentUsers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent registrations</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Most Active Users */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-4 w-4" />
                    Most Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {statistics.mostActiveUsers.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : 'No Name Set'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {getRoleShortName(user.role)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(user.last_login)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {statistics.mostActiveUsers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No active users</p>
                    )}
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
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="assistant">Smart Assistant</SelectItem>
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
                    role: 'staff'
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
    </>
  )
}