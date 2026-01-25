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
        toast.error('Session not found. Please refresh the page.')
        setIsLoading(false)
        return
      }

      // Get my profile (ONLY requires JWT token)
      const response = await fetch(`${apiBase}/api/my-profile`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        toast.error('Failed to load profile')
        setIsLoading(false)
        return
      }

      const result = await response.json()

      if (result.success && result.data) {
        const profileData = result.data
        
        setProfile(profileData)
        setFormData({
          full_name: profileData.first_name && profileData.last_name 
            ? `${profileData.first_name} ${profileData.last_name}` 
            : '',
          email: profileData.email || '',
          phone: profileData.phone || ''
        })
      } else {
        toast.error('Invalid profile data received')
      }

    } catch (error) {
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

      // If email changed, send OTP to new email
      if (emailChanged) {
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
          // Silent fail - localStorage update is not critical
        }
      }

      setIsEditing(false)

    } catch (error) {
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
            // Silent fail - localStorage update is not critical
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
      
      if (result.success) {
        toast.success(`Password reset email sent to ${result.data?.email || profile.email}!`)
      } else {
        throw new Error(result.message || 'Failed to send password reset')
      }

    } catch (error) {
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
      <div className="flex items-center justify-center h-96 dark:bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600 dark:text-blue-400 mb-3" />
          <p className="text-muted-foreground dark:text-muted-foreground text-[13px]">Loading your settings...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <Card className="border-2 border-red-200 dark:border-red-800 dark:bg-card">
        <CardContent className="pt-4 pb-4 dark:bg-card">
          <div className="text-center">
            <X className="h-10 w-10 mx-auto text-red-500 dark:text-red-400 mb-3" />
            <p className="text-red-600 dark:text-red-400 font-medium mb-3 text-[13px]">Failed to load profile</p>
            <Button onClick={loadCurrentUser} className="h-9 px-3 text-[13px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600">Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2 px-2 sm:px-4 max-w-[98vw] mx-auto dark:bg-background">
      {/* Profile Header Card */}
      <Card className="border border-blue-200 dark:border-border bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 dark:bg-card shadow-md">
          <CardHeader className="pb-1.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-600 flex items-center justify-center text-white text-[12px] font-bold shadow">
                {(profile.first_name?.charAt(0) || 'U').toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-[13px] font-semibold dark:text-foreground">
                  {profile.first_name && profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}` 
                    : 'No Name Set'}
                </CardTitle>
                <div className="flex items-center gap-1 mt-0.5">
                  {profile.role && (
                    <Badge className={`${getRoleBadgeColor(profile.role)} text-[10px] px-1.5 py-0.5 dark:border-border`}>
                      {profile.role.toUpperCase()}
                    </Badge>
                  )}
                  {profile.is_email_verified ? (
                    <Badge className="bg-green-500 dark:bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                      <CheckCircle className="h-2 w-2 mr-0.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 dark:bg-red-600 text-white text-[10px] px-1.5 py-0.5">
                      <X className="h-2 w-2 mr-0.5" />
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
      <Tabs defaultValue="profile" className="space-y-2 w-full">
        <div className="flex justify-center">
          <TabsList className="inline-flex h-8 items-center justify-center rounded-lg bg-muted/50 dark:bg-muted p-1 border border-border/50 dark:border-border shadow-sm">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-background dark:data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary dark:data-[state=active]:text-primary px-2.5 py-1 text-[12px] h-7"
            >
              <User className="h-3 w-3 mr-1" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-background dark:data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary dark:data-[state=active]:text-primary px-2.5 py-1 text-[12px] h-7"
            >
              <Shield className="h-3 w-3 mr-1" />
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="data-[state=active]:bg-background dark:data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary dark:data-[state=active]:text-primary px-2.5 py-1 text-[12px] h-7"
            >
              <Palette className="h-3 w-3 mr-1" />
              Preferences
            </TabsTrigger>
        </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-2 w-full">
          <div className="flex justify-center">
            <div className="w-full max-w-[50%] space-y-2">
          <Card className="border shadow-md dark:bg-card dark:border-border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 dark:bg-card border-b dark:border-border/50 pb-2 pt-2.5">
              <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[13px] font-semibold dark:text-foreground">
                  <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Profile Information
            </CardTitle>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} className="gap-1.5 h-7 px-3 text-[11px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600" size="sm">
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>
          </CardHeader>
            <CardContent className="pt-3 pb-3 dark:bg-card">
              <div className="space-y-3">
                {/* Full Name */}
            <div className="space-y-1">
                  <Label htmlFor="full_name" className="flex items-center gap-1 text-[12px] dark:text-foreground">
                    <User className="h-2.5 w-2.5 text-muted-foreground dark:text-muted-foreground" />
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                      disabled={isSaving}
                      className="h-8 text-[12px] dark:bg-card dark:border-border dark:text-foreground"
                    />
                  ) : (
                    <p className="text-[12px] font-medium p-1.5 bg-gray-50 dark:bg-muted/50 rounded border dark:border-border dark:text-foreground">
                      {profile.first_name && profile.last_name 
                        ? `${profile.first_name} ${profile.last_name}` 
                        : 'Not set'}
                    </p>
                  )}
            </div>

                <Separator className="dark:bg-border my-1" />

                {/* Email */}
            <div className="space-y-1">
                  <Label htmlFor="email" className="flex items-center gap-1 text-[12px] dark:text-foreground">
                    <Mail className="h-2.5 w-2.5 text-muted-foreground dark:text-muted-foreground" />
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
                      className="h-8 text-[12px] dark:bg-card dark:border-border dark:text-foreground"
                    />
                  ) : (
                    <p className="text-[12px] font-medium p-1.5 bg-gray-50 dark:bg-muted/50 rounded border dark:border-border dark:text-foreground">
                      {profile.email || 'Not set'}
                    </p>
                  )}
            </div>

                <Separator className="dark:bg-border my-1" />

                {/* Phone */}
            <div className="space-y-1">
                  <Label htmlFor="phone" className="flex items-center gap-1 text-[12px] dark:text-foreground">
                    <Phone className="h-2.5 w-2.5 text-muted-foreground dark:text-muted-foreground" />
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
                      className="h-8 text-[12px] dark:bg-card dark:border-border dark:text-foreground"
                    />
                  ) : (
                    <p className="text-[12px] font-medium p-1.5 bg-gray-50 dark:bg-muted/50 rounded border dark:border-border dark:text-foreground">
                      {profile.phone || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <>
                    <Separator className="dark:bg-border my-1" />
                    <div className="flex gap-1.5 justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="w-auto gap-1.5 h-7 px-3 text-[11px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
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
                        className="w-auto gap-1.5 h-7 px-3 text-[11px] dark:border-border dark:text-foreground dark:hover:bg-muted"
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
          <Card className="border shadow-md dark:bg-card dark:border-border">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 dark:bg-card border-b dark:border-border/50 pb-1.5 pt-2">
            <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold dark:text-foreground">
                <Shield className="h-3 w-3 text-green-600 dark:text-green-400" />
                Account Information
            </CardTitle>
          </CardHeader>
            <CardContent className="pt-2 pb-2 dark:bg-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-muted-foreground dark:text-muted-foreground text-[11px]">
                    <Shield className="h-2.5 w-2.5" />
                    User Role
                  </Label>
                  <Badge className={`${getRoleBadgeColor(profile.role || 'employee')} text-[10px] px-1.5 py-0.5 dark:border-border`}>
                    {(profile.role || 'employee').toUpperCase()}
                  </Badge>
                </div>

            <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-muted-foreground dark:text-muted-foreground text-[11px]">
                    <CheckCircle className="h-2.5 w-2.5" />
                    Email Status
                  </Label>
                  {profile.is_email_verified ? (
                    <Badge className="bg-green-500 dark:bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                      <CheckCircle className="h-2 w-2 mr-0.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 dark:bg-red-600 text-white text-[10px] px-1.5 py-0.5">
                      <X className="h-2 w-2 mr-0.5" />
                      Not Verified
                    </Badge>
                  )}
            </div>

            <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-muted-foreground dark:text-muted-foreground text-[11px]">
                    <Calendar className="h-2.5 w-2.5" />
                    Account Created
                  </Label>
                  <p className="text-[11px] font-medium p-1.5 bg-gray-50 dark:bg-muted/50 rounded border dark:border-border dark:text-foreground">
                    {formatDate(profile.user_created_at)}
                  </p>
            </div>

            <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-muted-foreground dark:text-muted-foreground text-[11px]">
                    <Calendar className="h-2.5 w-2.5" />
                    Last Login
                  </Label>
                  <p className="text-[11px] font-medium p-1.5 bg-gray-50 dark:bg-muted/50 rounded border dark:border-border dark:text-foreground">
                    {profile.last_login ? formatDate(profile.last_login) : 'Never'}
                  </p>
                </div>
            </div>
          </CardContent>
        </Card>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-2 w-full">
          <div className="flex justify-center">
            <div className="w-full max-w-[50%]">
          <Card className="border shadow-md dark:bg-card dark:border-border">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 dark:bg-card border-b dark:border-border/50 pb-1.5 pt-2">
              <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold dark:text-foreground">
                <Key className="h-3 w-3 text-red-600 dark:text-red-400" />
                Password Management
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-2 dark:bg-card">
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-[11px] text-blue-900 dark:text-blue-300 mb-0.5">
                    <strong>Password Reset:</strong> Click the button below to receive a password reset link via email.
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    You will receive an email with instructions to reset your password securely.
                  </p>
      </div>

                    <div className="flex justify-end">
                <Button 
                  onClick={handlePasswordReset}
                        className="w-auto gap-1.5 h-7 px-3 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-[11px]"
                  size="sm"
                >
                        <Key className="h-3 w-3" />
                  Send Password Reset Email
                </Button>
                    </div>

                <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-[11px] text-yellow-800 dark:text-yellow-300">
                    <strong>Note:</strong> For security reasons, you cannot change your password directly here. 
                    A secure reset link will be sent to your registered email address.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-2 w-full">
          <div className="flex justify-center">
            <div className="w-full max-w-[50%]">
          <Card className="border shadow-md dark:bg-card dark:border-border">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 dark:bg-card border-b dark:border-border/50 pb-1.5 pt-2">
          <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold dark:text-foreground">
                <Palette className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                Theme Preferences
          </CardTitle>
        </CardHeader>
            <CardContent className="pt-2 pb-2 dark:bg-card">
              <div className="space-y-2">
                <Label className="text-[12px] font-medium dark:text-foreground">Choose Your Theme</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* Light Theme */}
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-2 border rounded-lg transition-all hover:shadow dark:border-border cursor-pointer ${
                      theme === 'light' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500 shadow' 
                        : 'border-gray-200 dark:border-border hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow">
                        <Sun className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-[12px] dark:text-foreground">Light</p>
                        <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Bright and clear</p>
                      </div>
                      {theme === 'light' && (
                        <Badge className="bg-blue-500 dark:bg-blue-600 text-white text-[10px] px-1.5 py-0.5">
                          <CheckCircle className="h-2 w-2 mr-0.5" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </button>

                  {/* Dark Theme */}
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-2 border rounded-lg transition-all hover:shadow dark:border-border cursor-pointer ${
                      theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500 shadow' 
                        : 'border-gray-200 dark:border-border hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-2 bg-gray-800 dark:bg-gray-700 rounded-full shadow">
                        <Moon className="h-4 w-4 text-blue-300 dark:text-blue-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-[12px] dark:text-foreground">Dark</p>
                        <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Easy on the eyes</p>
                      </div>
                      {theme === 'dark' && (
                        <Badge className="bg-blue-500 dark:bg-blue-600 text-white text-[10px] px-1.5 py-0.5">
                          <CheckCircle className="h-2 w-2 mr-0.5" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </button>

                  {/* System Theme */}
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`p-2 border rounded-lg transition-all hover:shadow dark:border-border cursor-pointer ${
                      theme === 'system' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500 shadow' 
                        : 'border-gray-200 dark:border-border hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-600 rounded-full shadow">
                        <Monitor className="h-4 w-4 text-white" />
            </div>
                      <div className="text-center">
                        <p className="font-bold text-[12px] dark:text-foreground">System</p>
                        <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Match device</p>
          </div>
                      {theme === 'system' && (
                        <Badge className="bg-blue-500 dark:bg-blue-600 text-white text-[10px] px-1.5 py-0.5">
                          <CheckCircle className="h-2 w-2 mr-0.5" />
                          Active
                        </Badge>
                      )}
            </div>
                  </button>
          </div>

                <div className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-[11px] text-purple-900 dark:text-purple-300">
                    <strong>Current Theme:</strong> {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </p>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                    {theme === 'system' 
                      ? 'Theme automatically matches your device settings' 
                      : `Using ${theme} theme across the application`}
                  </p>
            </div>
          </div>
        </CardContent>
      </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* OTP Verification Dialog */}
      {showOtpDialog && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <Card className="w-full max-w-md border shadow-xl dark:bg-card dark:border-border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 dark:bg-card border-b dark:border-border/50 pb-1.5 pt-2">
              <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold dark:text-foreground">
                <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                Verify New Email
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-2 dark:bg-card">
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-[11px] text-blue-900 dark:text-blue-300 mb-0.5">
                    <strong>📧 Verification Code Sent!</strong>
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    We've sent a 6-digit code to <strong>{pendingEmail}</strong>
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    Please check your inbox and enter the code below.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="otpCode" className="text-[12px] dark:text-foreground">Enter 6-Digit Code</Label>
                  <Input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-base tracking-widest font-mono h-9 dark:bg-card dark:border-border dark:text-foreground"
                    disabled={isVerifyingOtp}
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Button
                    onClick={handleVerifyEmailOtp}
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="w-full gap-1 h-8 px-2 text-[12px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
                    size="sm"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-2.5 w-2.5" />
                        Verify Code
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleCancelOtp}
                    disabled={isVerifyingOtp}
                    variant="outline"
                    className="w-full gap-1 h-8 px-2 text-[12px] dark:border-border dark:text-foreground dark:hover:bg-muted"
                    size="sm"
                  >
                    <X className="h-2.5 w-2.5" />
                    Cancel
                  </Button>
                </div>

                <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-[11px] text-yellow-800 dark:text-yellow-300">
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
