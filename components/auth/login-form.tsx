"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Mail, Lock, UserCircle, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from '@/lib/auth-context'

type UserRole = "admin" | "staff" | "reception" | "assistant"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState<UserRole>("staff")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [otpRequired, setOtpRequired] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const router = useRouter()
  const { signIn, verifyOTP, signUp, isAuthenticated, user } = useAuth()

  // Check if user is already logged in and redirect
  useEffect(() => {
    console.log('useEffect triggered - isAuthenticated:', isAuthenticated, 'user:', user)
    if (isAuthenticated && user) {
      console.log('User is authenticated, redirecting to:', `/${user.role}`)
      router.push(`/${user.role}`)
    }
  }, [isAuthenticated, user, router])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    console.log('=== LOGIN DEBUG START ===')
    console.log('Email:', email)
    console.log('Password:', password ? '***' : 'empty')

    try {
      console.log('Calling signIn function...')
      const result = await signIn(email, password)
      console.log('SignIn result:', result)

      if (result.success) {
        console.log('Login successful!')
        console.log('OTP Required:', result.data?.otpRequired)
        
        if (result.data?.otpRequired) {
          console.log('Setting OTP required to true')
          setOtpRequired(true)
          setSuccess('Verification code sent to your email. Please check your inbox.')
        } else {
          console.log('Direct login success - auth state should be updated')
          setSuccess('Login successful! Redirecting to dashboard...')
          // Get user role from the response data
          const userRole = result.data?.user?.role || 'staff'
          console.log('User role from response:', userRole)
          console.log('User data stored in AuthManager, redirecting...')
          
          // Small delay to ensure auth state is propagated
          setTimeout(() => {
            console.log('Redirecting to:', `/${userRole}`)
            router.push(`/${userRole}`)
          }, 500)
        }
      } else {
        console.log('Login failed:', result.error)
        setError(result.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Error during login:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      console.log('=== LOGIN DEBUG END ===')
      setIsLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await verifyOTP(email, otpCode)

      if (result.success) {
        setSuccess('OTP verified! Login successful! Redirecting to dashboard...')
        // Get user role from the response data
        const userRole = result.data?.user?.role || 'employee'
        setTimeout(() => {
          router.push(`/${userRole}`)
        }, 1500)
      } else {
        setError(result.error || 'Invalid verification code. Please try again.')
      }
    } catch (error) {
      console.error('Error during OTP verification:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await signUp({
        email,
        password,
        firstName,
        lastName,
        role: role as 'admin' | 'employee' | 'reception' | 'user'
      })

      if (result.success) {
        setSuccess('Account created successfully! Please check your email to verify your account.')
        // Reset form
        setEmail('')
        setPassword('')
        setFirstName('')
        setLastName('')
        setRole('admin')
      } else {
        setError(result.error || 'Sign up failed. Please try again.')
      }
    } catch (error) {
      console.error('Error during signup:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center justify-center w-full">
          <div className="w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-500 text-center bg-green-50 p-2 rounded">
            {success}
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            {!otpRequired ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOTPSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-foreground">
                    Verification Code
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code from email"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    We sent a verification code to {email}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOtpRequired(false)
                      setOtpCode('')
                      setError('')
                      setSuccess('')
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading || otpCode.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignupSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-role" className="text-sm font-medium text-foreground">
                  Access Level
                </Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                    <SelectTrigger className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200">
                      <SelectValue placeholder="Select your access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="reception">Reception Desk</SelectItem>
                      <SelectItem value="assistant">Smart Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Demo Credentials</span>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/30">
          <p className="text-sm font-medium text-foreground">Quick Access:</p>
          <div className="grid gap-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/30">
              <span className="font-medium text-primary">Administrator</span>
              <span className="text-muted-foreground">admin@smartvisitor.com</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/30">
              <span className="font-medium text-secondary">Reception</span>
              <span className="text-muted-foreground">reception@smartvisitor.com</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/30">
              <span className="font-medium text-accent">Employee</span>
              <span className="text-muted-foreground">employee@smartvisitor.com</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Password: <span className="font-mono">password</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}