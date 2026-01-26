"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react"
import { useAuth } from '@/lib/auth-context'

// Input validation and sanitization
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

const sanitizeInput = (input: string): string => {
  return input.trim().slice(0, 254)
}

const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email
  const [localPart, domain] = email.split('@')
  if (localPart.length <= 2) return email
  const maskedLocal = localPart.slice(0, 2) + '***' + localPart.slice(-1)
  return `${maskedLocal}@${domain}`
}

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [otpRequired, setOtpRequired] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, verifyOTP, isAuthenticated, user } = useAuth()

  // Check for success message from query params
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'signup-success') {
      setSuccess('Account created successfully. Please login with your credentials.')
    }
  }, [searchParams])

  // Check if user is already logged in and redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(`/${user.role}`)
    }
  }, [isAuthenticated, user, router])

  // Check for success message from query params (e.g. after signup)
  useEffect(() => {
    // We can't use useSearchParams directly in this component mostly because of how it's used
    // so we'll just check window.location if available or rely on parent passing it if we were to refactor
    // But simplest way in a client component: useSearchParams
  }, [])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Input validation
    const sanitizedEmail = sanitizeInput(email)
    const sanitizedPassword = password.trim()

    if (!sanitizedEmail || !sanitizedPassword) {
      setError('Please enter both email and password.')
      return
    }

    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (sanitizedPassword.length < 6 || sanitizedPassword.length > 128) {
      setError('Password must be between 6 and 128 characters.')
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn(sanitizedEmail, sanitizedPassword)

      if (result.success) {
        if (result.data?.otpRequired) {
          setOtpRequired(true)
          setSuccess('Verification code sent to your email. Please check your inbox.')
        } else {
          setSuccess('Login successful! Redirecting...')
          // Get user role from the response data
          const userRole = result.data?.user?.role || 'staff'

          // Small delay to ensure auth state is propagated
          setTimeout(() => {
            router.push(`/${userRole}`)
          }, 500)
        }
      } else {
        // Show specific error message from backend (e.g. 403 Forbidden, Account Locked, etc.)
        setError(result.message || 'Invalid credentials. Please try again.')
      }
    } catch (error: any) {
      // Show specific error if available
      setError(error.message || 'An error occurred. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Input validation
    const sanitizedOtp = otpCode.trim().replace(/\D/g, '') // Remove non-digits

    if (!sanitizedOtp || sanitizedOtp.length !== 6) {
      setError('Please enter a valid 6-digit verification code.')
      return
    }

    setIsLoading(true)

    try {
      const result = await verifyOTP(email, sanitizedOtp)

      if (result.success) {
        setSuccess('Verification successful! Redirecting...')
        // Get user role from the response data
        const userRole = result.data?.user?.role || 'employee'
        setTimeout(() => {
          router.push(`/${userRole}`)
        }, 1500)
      } else {
        // Show specific error message
        setError(result.message || 'Invalid verification code. Please try again.')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again later.')
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
        <div className="w-full">
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
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 254)
                      setEmail(value)
                    }}
                    className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                    required
                    maxLength={254}
                    autoComplete="email"
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
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 128)
                      setPassword(value)
                    }}
                    className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                    required
                    maxLength={128}
                    autoComplete="current-password"
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setOtpCode(value)
                    }}
                    className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                    maxLength={6}
                    required
                    autoComplete="one-time-code"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Verification code sent to {maskEmail(email)}
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
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Don't have an account?
          </p>
          <Link href="/auth/secure-signup">
            <Button
              type="button"
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Sign Up
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}