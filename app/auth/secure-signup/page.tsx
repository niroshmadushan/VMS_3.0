"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle, CheckCircle, Key } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { secureSignupAPI, validateForm, type SignupFormData } from "@/lib/secure-signup-api"

export default function SecureSignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    secretCode: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateFormData = () => {
    // Use the utility function for validation
    const validation = validateForm({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      secretCode: formData.secretCode
    })

    // Add confirm password validation
    if (formData.password !== formData.confirmPassword) {
      validation.errors.confirmPassword = "Passwords do not match"
      validation.valid = false
    }

    setErrors(validation.errors)
    return validation.valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateFormData()) {
      toast.error('Please fix the validation errors')
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Note: role field is NOT sent - backend automatically assigns 'user' role
      // To create admin/staff accounts, use User Management API after signup
      const result = await secureSignupAPI.signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        secretCode: formData.secretCode
        // role field is intentionally excluded
      })

      if (result.success) {
        // Success response (201 Created) - user must verify email
        const successMessage = result.message || 'Account created successfully. Please check your email for verification.'
        toast.success(successMessage)
        router.push('/login?message=signup-success')
      } else {
        // Handle validation errors from API
        if (result.errors && Array.isArray(result.errors)) {
          const validationErrors: Record<string, string> = {}
          result.errors.forEach((error: any) => {
            // API returns 'path' field for the field name (e.g., 'password', 'email')
            const field = error.path || error.param || error.field || 'submit'
            validationErrors[field] = error.msg || error.message || result.message
          })
          setErrors(validationErrors)
          toast.error(result.message || 'Please fix the validation errors')
        } else {
          toast.error(result.message || 'Signup failed')
          setErrors({ submit: result.message || 'Signup failed' })
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during signup. Please try again.'
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm dark:bg-card dark:border-border">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold dark:text-foreground">Create Account</CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Sign up with your company email and secret code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.submit && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Secret Code */}
            <div className="space-y-2">
              <Label htmlFor="secretCode" className="text-sm font-medium dark:text-foreground">
                Secret Code <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="secretCode"
                  type="text"
                  placeholder="Enter your secret code"
                  value={formData.secretCode}
                  onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })}
                  className={`pl-10 h-11 bg-background/50 dark:bg-card dark:border-border dark:text-foreground ${
                    errors.secretCode ? 'border-red-500' : ''
                  }`}
                  required
                />
              </div>
              {errors.secretCode && (
                <p className="text-xs text-red-500">{errors.secretCode}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Contact your administrator to obtain a secret code
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium dark:text-foreground">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your company email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`pl-10 h-11 bg-background/50 dark:bg-card dark:border-border dark:text-foreground ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Only emails from {secureSignupAPI.getAllowedDomains().join(', ')} are allowed
              </p>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium dark:text-foreground">
                First Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`pl-10 h-11 bg-background/50 dark:bg-card dark:border-border dark:text-foreground ${
                    errors.firstName ? 'border-red-500' : ''
                  }`}
                  required
                />
              </div>
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium dark:text-foreground">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`pl-10 h-11 bg-background/50 dark:bg-card dark:border-border dark:text-foreground ${
                    errors.lastName ? 'border-red-500' : ''
                  }`}
                  required
                />
              </div>
              {errors.lastName && (
                <p className="text-xs text-red-500">{errors.lastName}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium dark:text-foreground">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`pl-10 pr-10 h-11 bg-background/50 dark:bg-card dark:border-border dark:text-foreground ${
                    errors.password ? 'border-red-500' : ''
                  }`}
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
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium dark:text-foreground">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`pl-10 pr-10 h-11 bg-background/50 dark:bg-card dark:border-border dark:text-foreground ${
                    errors.confirmPassword ? 'border-red-500' : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}









