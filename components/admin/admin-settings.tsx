"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from '@/lib/api-config'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, Mail, Phone, Shield, Edit, Save, X, Loader2, 
  CheckCircle, Calendar, Key, Palette, Sun, Moon, Monitor
} from "lucide-react"
import toast from "react-hot-toast"

interface UserProfile {
  id: number
  email: string
  role: string
  is_email_verified: number
  last_login: string | null
  user_created_at: string
  user_updated_at: string
  profile_id: number
  first_name: string | null
  last_name: string | null
  phone: string | null
  profile_updated_at: string
}

export function AdminSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    loadCurrentUser()
    loadThemePreference()
  }, [])

  const loadThemePreference = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement
    
    if (selectedTheme === 'dark') {
      root.classList.add('dark')
    } else if (selectedTheme === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
    toast.success(`Theme changed to ${newTheme}`)
  }

  const loadCurrentUser = async () => {
    try {
      setIsLoading(true)
      
      // Get authToken from localStorage (user is already logged in)
      const token = localStorage.getItem('authToken')
      const apiBase = API_BASE_URL
      
      if (!token) {
        console.error('❌ No authToken found in localStorage')
        toast.error('Session not found. Please refresh the page.')
        setIsLoading(false)
        return
      }

      console.log('📋 Loading profile with authToken...')
      console.log('🔑 Token exists:', !!token)
      console.log('🔑 Token preview:', token.substring(0, 30) + '...')

      // Get my profile (ONLY requires JWT token)
      const response = await fetch(`${apiBase}/api/my-profile`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        toast.error('Failed to load profile')
        setIsLoading(false)
        return
      }

      const result = await response.json()
      console.log('📥 API result:', result)

      if (result.success && result.data) {
        const profileData = result.data
        console.log('📦 Profile data:', profileData)
        
        setProfile(profileData)
        setFormData({
          full_name: profileData.first_name && profileData.last_name 
            ? `${profileData.first_name} ${profileData.last_name}` 
            : '',
          email: profileData.email || '',
          phone: profileData.phone || ''
        })
        console.log('✅ Profile loaded successfully')
      } else {
        console.error('❌ Invalid response format:', result)
        toast.error('Invalid profile data received')
      }

    } catch (error) {
      console.error('❌ Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)

      if (!profile) {
        toast.error('No profile data to update')
        return
      }

      if (!formData.full_name.trim()) {
        toast.error('Full name is required')
        return
      }

      if (!formData.email.trim()) {
        toast.error('Email is required')
        return
      }

      console.log('💾 Saving profile:', formData)

      const token = localStorage.getItem('authToken')
      const apiBase = API_BASE_URL

      const nameParts = formData.full_name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const emailChanged = formData.email.trim() !== profile.email

      // Update profile (everything except email)
      const profileResponse = await fetch(`${apiBase}/api/my-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: formData.phone.trim() || null
        })
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to update profile')
      }

      const profileResult = await profileResponse.json()
      console.log('✅ Profile updated:', profileResult)

      // If email changed, send OTP to new email
      if (emailChanged) {
        console.log('📧 Email changed, sending OTP...')
        
        const emailResponse = await fetch(`${apiBase}/api/my-profile/email`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: formData.email.trim()
          })
        })

        if (!emailResponse.ok) {
          throw new Error('Failed to send OTP')
        }

        const emailResult = await emailResponse.json()
        console.log('✅ OTP sent:', emailResult)
        
        if (emailResult.success) {
          // Show OTP verification dialog
          setPendingEmail(formData.email.trim())
          setShowOtpDialog(true)
          toast.success('OTP sent to your new email! Please verify.')
        }
      } else {
        toast.success('Profile updated successfully!')
      }

      // Update local state
      setProfile({
        ...profile,
        first_name: firstName,
        last_name: lastName,
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        profile_updated_at: new Date().toISOString()
      })

      // Update localStorage userData
      const storedUserData = localStorage.getItem('userData')
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData)
          userData.firstName = firstName
          userData.lastName = lastName
          userData.email = formData.email.trim()
          localStorage.setItem('userData', JSON.stringify(userData))
        } catch (e) {
          console.error('Error updating userData:', e)
        }
      }

      setIsEditing(false)

    } catch (error) {
      console.error('❌ Error saving profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerifyEmailOtp = async () => {
    try {
      setIsVerifyingOtp(true)

      if (!otpCode || otpCode.length !== 6) {
        toast.error('Please enter the 6-digit code')
        return
      }

      console.log('🔐 Verifying OTP for email:', pendingEmail)

      const token = localStorage.getItem('authToken')
      const apiBase = API_BASE_URL

      const response = await fetch(`${apiBase}/api/my-profile/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: pendingEmail,
          otpCode: otpCode
        })
      })

      if (!response.ok) {
        throw new Error('Failed to verify OTP')
      }

      const result = await response.json()
      console.log('✅ OTP verification result:', result)

      if (result.success) {
        toast.success('Email updated and verified successfully!')
        
        // Update profile state with new email
        if (profile) {
          setProfile({
            ...profile,
            email: pendingEmail,
            is_email_verified: 1
          })
        }

        // Update localStorage
        const storedUserData = localStorage.getItem('userData')
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData)
            userData.email = pendingEmail
            localStorage.setItem('userData', JSON.stringify(userData))
          } catch (e) {
            console.error('Error updating userData:', e)
          }
        }

        // Close dialog and reset
        setShowOtpDialog(false)
        setOtpCode('')
        setPendingEmail('')
        setIsEditing(false)
        
        // Reload profile to get latest data
        setTimeout(() => loadCurrentUser(), 1000)
      } else {
        toast.error(result.message || 'Invalid OTP code')
      }

    } catch (error) {
      console.error('❌ Error verifying OTP:', error)
      toast.error('Failed to verify OTP')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleCancelOtp = () => {
    setShowOtpDialog(false)
    setOtpCode('')
    setPendingEmail('')
    setIsEditing(false)
    
    // Restore original email
    if (profile) {
      setFormData({
        ...formData,
        email: profile.email
      })
    }
  }

  const handlePasswordReset = async () => {
    if (!profile) return

    try {
      console.log('🔑 Requesting password reset for:', profile.email)

      const token = localStorage.getItem('authToken')
      const apiBase = API_BASE_URL

      // Use authenticated password reset endpoint (no body required)
      const response = await fetch(`${apiBase}/api/my-profile/request-password-reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to send password reset')
      }

      const result = await response.json()
      console.log('✅ Password reset result:', result)
      
      if (result.success) {
        toast.success(`Password reset email sent to ${result.data?.email || profile.email}!`)
      } else {
        throw new Error(result.message || 'Failed to send password reset')
      }

    } catch (error) {
      console.error('❌ Error sending password reset:', error)
      toast.error('Failed to send password reset email')
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        full_name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : '',
        email: profile.email || '',
        phone: profile.phone || ''
      })
    }
    setIsEditing(false)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500 text-white'
      case 'reception': return 'bg-blue-500 text-white'
      case 'employee': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <Card className="border-2 border-red-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <X className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-medium mb-4">Failed to load profile</p>
            <Button onClick={loadCurrentUser}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow">
                {(profile.first_name?.charAt(0) || 'U').toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {profile.first_name && profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}` 
                    : 'No Name Set'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {profile.role && (
                    <Badge className={`${getRoleBadgeColor(profile.role)} text-xs px-2 py-0.5`}>
                      {profile.role.toUpperCase()}
                    </Badge>
                  )}
                  {profile.is_email_verified ? (
                    <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                      <X className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for Settings Sections */}
      <Tabs defaultValue="profile" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="profile" className="text-sm">👤 Profile</TabsTrigger>
          <TabsTrigger value="security" className="text-sm">🔒 Security</TabsTrigger>
          <TabsTrigger value="preferences" className="text-sm">⚙️ Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-3">
          <Card className="border shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b pb-3 pt-3">
              <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-blue-600" />
              Profile Information
            </CardTitle>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} className="gap-2 h-8 text-sm" size="sm">
                    <Edit className="h-3 w-3" />
                    Edit Profile
                  </Button>
                )}
              </div>
          </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-4">
                {/* Full Name */}
            <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                      disabled={isSaving}
                      className="h-9"
                    />
                  ) : (
                    <p className="text-sm font-medium p-2 bg-gray-50 rounded border">
                      {profile.first_name && profile.last_name 
                        ? `${profile.first_name} ${profile.last_name}` 
                        : 'Not set'}
                    </p>
                  )}
            </div>

                <Separator />

                {/* Email */}
            <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      disabled={isSaving}
                      className="h-9"
                    />
                  ) : (
                    <p className="text-sm font-medium p-2 bg-gray-50 rounded border">
                      {profile.email || 'Not set'}
                    </p>
                  )}
            </div>

                <Separator />

                {/* Phone */}
            <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      disabled={isSaving}
                      className="h-9"
                    />
                  ) : (
                    <p className="text-sm font-medium p-2 bg-gray-50 rounded border">
                      {profile.phone || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex-1 gap-2 h-9 text-sm"
                        size="sm"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        variant="outline"
                        className="flex-1 gap-2 h-9 text-sm"
                        size="sm"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
            </div>
          </CardContent>
        </Card>

          {/* Account Information Card */}
          <Card className="border">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b pb-3 pt-3">
            <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-green-600" />
                Account Information
            </CardTitle>
          </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Shield className="h-3 w-3" />
                    User Role
                  </Label>
                  <Badge className={`${getRoleBadgeColor(profile.role || 'employee')} text-xs px-2 py-1`}>
                    {(profile.role || 'employee').toUpperCase()}
                  </Badge>
                </div>

            <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-muted-foreground text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Email Status
                  </Label>
                  {profile.is_email_verified ? (
                    <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                      <X className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
            </div>

            <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Calendar className="h-3 w-3" />
                    Account Created
                  </Label>
                  <p className="text-xs font-medium p-2 bg-gray-50 rounded border">
                    {formatDate(profile.user_created_at)}
                  </p>
            </div>

            <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Calendar className="h-3 w-3" />
                    Last Login
                  </Label>
                  <p className="text-xs font-medium p-2 bg-gray-50 rounded border">
                    {profile.last_login ? formatDate(profile.last_login) : 'Never'}
                  </p>
                </div>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-3">
          <Card className="border shadow">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b pb-3 pt-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 text-red-600" />
                Password Management
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900 mb-1">
                    <strong>Password Reset:</strong> Click the button below to receive a password reset link via email.
                  </p>
                  <p className="text-xs text-blue-700">
                    You will receive an email with instructions to reset your password securely.
                  </p>
      </div>

                <Button 
                  onClick={handlePasswordReset}
                  className="w-full gap-2 bg-red-600 hover:bg-red-700 h-9 text-sm"
                  size="sm"
                >
                  <Key className="h-3 w-3" />
                  Send Password Reset Email
                </Button>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> For security reasons, you cannot change your password directly here. 
                    A secure reset link will be sent to your registered email address.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-3">
          <Card className="border shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b pb-3 pt-3">
          <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-purple-600" />
                Theme Preferences
          </CardTitle>
        </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Choose Your Theme</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Light Theme */}
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 border rounded-lg transition-all hover:shadow ${
                      theme === 'light' 
                        ? 'border-blue-500 bg-blue-50 shadow' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-white rounded-full shadow">
                        <Sun className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm">Light</p>
                        <p className="text-xs text-muted-foreground">Bright and clear</p>
                      </div>
                      {theme === 'light' && (
                        <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </button>

                  {/* Dark Theme */}
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 border rounded-lg transition-all hover:shadow ${
                      theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50 shadow' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-gray-800 rounded-full shadow">
                        <Moon className="h-6 w-6 text-blue-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm">Dark</p>
                        <p className="text-xs text-muted-foreground">Easy on the eyes</p>
                      </div>
                      {theme === 'dark' && (
                        <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </button>

                  {/* System Theme */}
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`p-4 border rounded-lg transition-all hover:shadow ${
                      theme === 'system' 
                        ? 'border-blue-500 bg-blue-50 shadow' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow">
                        <Monitor className="h-6 w-6 text-white" />
            </div>
                      <div className="text-center">
                        <p className="font-bold text-sm">System</p>
                        <p className="text-xs text-muted-foreground">Match device</p>
          </div>
                      {theme === 'system' && (
                        <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                          Active
                        </Badge>
                      )}
            </div>
                  </button>
          </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-900">
                    <strong>Current Theme:</strong> {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    {theme === 'system' 
                      ? 'Theme automatically matches your device settings' 
                      : `Using ${theme} theme across the application`}
                  </p>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* OTP Verification Dialog */}
      {showOtpDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md border shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b pb-3 pt-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-blue-600" />
                Verify New Email
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900 mb-1">
                    <strong>📧 Verification Code Sent!</strong>
                  </p>
                  <p className="text-xs text-blue-700">
                    We've sent a 6-digit code to <strong>{pendingEmail}</strong>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Please check your inbox and enter the code below.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otpCode" className="text-sm">Enter 6-Digit Code</Label>
                  <Input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-xl tracking-widest font-mono h-12"
                    disabled={isVerifyingOtp}
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleVerifyEmailOtp}
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="w-full gap-2 h-9 text-sm"
                    size="sm"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Verify Code
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleCancelOtp}
                    disabled={isVerifyingOtp}
                    variant="outline"
                    className="w-full gap-2 h-9 text-sm"
                    size="sm"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </div>

                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Didn't receive the code?</strong> Check your spam folder or wait a few minutes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
