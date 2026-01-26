/**
 * Secure Signup API Client
 * Integrates with the external secure signup backend API
 */

import { API_BASE_URL, APP_ID, SERVICE_KEY, getApiHeaders } from './api-config'

export interface SignupFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  secretCode: string
  role?: 'user' | 'staff' | 'assistant'
}

export interface SignupResponse {
  success: boolean
  message: string
  data?: {
    userId: string | number
    email: string
    role: string
    verificationRequired: boolean
    emailDomain: string
  }
  errors?: Array<{
    field?: string
    param?: string
    msg?: string
    message?: string
    location?: string
  }>
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

// Allowed email domains
const ALLOWED_DOMAINS = [
  'connexit.biz',
  'connexcodeworks.biz',
  'connex360.biz',
  'connexvectra.biz'
]

/**
 * Validate email domain
 */
export function validateEmailDomain(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    return {
      valid: false,
      error: `Email must be from one of the allowed domains: ${ALLOWED_DOMAINS.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!password) {
    errors.push('Password is required')
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    if (!/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&#^()_+-=[]{};\':"\\|,.<>/)')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Check password strength (for UI feedback)
 */
export function checkPasswordStrength(password: string): {
  strength: number
  checks: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
  isValid: boolean
} {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password)
  }

  const strength = Object.values(checks).filter(Boolean).length

  return {
    strength, // 0-5
    checks,
    isValid: strength === 5
  }
}

/**
 * Validate name
 */
export function validateName(name: string, fieldName: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: `${fieldName} is required` }
  }

  const trimmed = name.trim()
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters long` }
  }

  if (trimmed.length > 50) {
    return { valid: false, error: `${fieldName} must be no more than 50 characters long` }
  }

  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` }
  }

  return { valid: true }
}

/**
 * Validate entire form
 */
export function validateForm(formData: SignupFormData): ValidationResult {
  const errors: Record<string, string> = {}

  // Email validation
  const emailValidation = validateEmailDomain(formData.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error!
  }

  // Password validation
  const passwordValidation = validatePassword(formData.password)
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors[0] // Show first error
  }

  // First name validation
  const firstNameValidation = validateName(formData.firstName, 'First name')
  if (!firstNameValidation.valid) {
    errors.firstName = firstNameValidation.error!
  }

  // Last name validation
  const lastNameValidation = validateName(formData.lastName, 'Last name')
  if (!lastNameValidation.valid) {
    errors.lastName = lastNameValidation.error!
  }

  // Secret code validation
  if (!formData.secretCode || !formData.secretCode.trim()) {
    errors.secretCode = 'Secret code is required'
  } else if (formData.secretCode.trim().length < 5) {
    errors.secretCode = 'Secret code must be at least 5 characters'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Get allowed email domains
 */
export function getAllowedDomains(): string[] {
  return [...ALLOWED_DOMAINS]
}

/**
 * Sanitize form data
 * Note: role field is NOT included as backend assigns 'user' role automatically
 */
export function sanitizeFormData(formData: SignupFormData): Omit<SignupFormData, 'role'> {
  return {
    email: formData.email.trim().toLowerCase(),
    password: formData.password, // Don't trim password
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    secretCode: formData.secretCode.trim()
    // role field is intentionally excluded - backend assigns 'user' role automatically
  }
}

/**
 * Secure Signup API Service
 */
export class SecureSignupAPI {
  private baseURL: string
  private appId: string
  private serviceKey: string

  constructor(config?: {
    baseURL?: string
    appId?: string
    serviceKey?: string
  }) {
    this.baseURL = config?.baseURL || API_BASE_URL
    this.appId = config?.appId || APP_ID
    this.serviceKey = config?.serviceKey || SERVICE_KEY
  }

  /**
   * Sign up a new user
   * Note: The role field is NOT sent - backend automatically assigns 'user' role
   * To create admin/staff accounts, create as 'user' first, then update via User Management API
   */
  async signup(formData: SignupFormData): Promise<SignupResponse> {
    try {
      // Sanitize input (role field is excluded - backend assigns 'user' automatically)
      const sanitizedData = sanitizeFormData(formData)

      // Use the correct endpoint: /api/auth/signup
      // Headers include x-app-id and x-service-key for authentication
      const response = await fetch(`${this.baseURL}/api/auth/signup`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(sanitizedData)
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific status codes
        let errorMessage = data.message || 'Signup failed'

        // Provide more specific messages based on status code
        if (response.status === 403) {
          errorMessage = data.message || 'Invalid secret code provided'
        } else if (response.status === 409) {
          errorMessage = data.message || 'Email address already registered'
        } else if (response.status === 400) {
          errorMessage = data.message || 'Validation failed'
        }

        return {
          success: false,
          message: errorMessage,
          errors: data.errors || []
        }
      }

      return data
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error. Please try again.',
        errors: []
      }
    }
  }

  /**
   * Validate form data
   */
  validateForm(formData: SignupFormData): ValidationResult {
    return validateForm(formData)
  }

  /**
   * Validate email domain
   */
  validateEmailDomain(email: string): { valid: boolean; error?: string } {
    return validateEmailDomain(email)
  }

  /**
   * Validate password
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    return validatePassword(password)
  }

  /**
   * Check password strength
   */
  checkPasswordStrength(password: string) {
    return checkPasswordStrength(password)
  }

  /**
   * Get allowed domains
   */
  getAllowedDomains(): string[] {
    return getAllowedDomains()
  }
}

// Export default instance
export const secureSignupAPI = new SecureSignupAPI()









