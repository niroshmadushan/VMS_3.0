/**
 * Comprehensive Input Validation and Sanitization
 * Protects against SQL Injection, XSS, and other security threats
 */

// XSS Protection - Remove potentially dangerous HTML/Script tags
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onerror, etc)
    .replace(/<embed\b[^<]*>/gi, '') // Remove embed tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .trim()
}

// SQL Injection Protection - Escape dangerous characters
export function sanitizeForSQL(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, '') // Remove multi-line comment end
    .replace(/xp_/gi, '') // Remove extended stored procedures
    .replace(/DROP/gi, '') // Remove DROP statements
    .replace(/DELETE/gi, '') // Remove DELETE statements
    .replace(/TRUNCATE/gi, '') // Remove TRUNCATE statements
    .replace(/EXEC/gi, '') // Remove EXEC statements
    .replace(/UNION/gi, '') // Remove UNION statements
    .trim()
}

// Email Validation
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeInput(email)
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!sanitized) {
    return { isValid: false, error: 'Email is required' }
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email is too long' }
  }
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format' }
  }
  
  return { isValid: true }
}

// Phone Number Validation
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeInput(phone)
  const phoneRegex = /^\+?[\d\s-()]{10,20}$/
  
  if (!sanitized) {
    return { isValid: false, error: 'Phone number is required' }
  }
  
  if (!phoneRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid phone format' }
  }
  
  return { isValid: true }
}

// Name Validation (letters, spaces, hyphens only)
export function validateName(name: string, fieldName: string = 'Name'): { isValid: boolean; error?: string } {
  const sanitized = sanitizeInput(name)
  const nameRegex = /^[a-zA-Z\s-'.]{2,100}$/
  
  if (!sanitized) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` }
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: `${fieldName} must be less than 100 characters` }
  }
  
  if (!nameRegex.test(sanitized)) {
    return { isValid: false, error: `${fieldName} contains invalid characters` }
  }
  
  return { isValid: true }
}

// Title/Description Validation
export function validateText(
  text: string, 
  fieldName: string = 'Text',
  minLength: number = 3,
  maxLength: number = 500,
  required: boolean = true
): { isValid: boolean; error?: string } {
  const sanitized = sanitizeInput(text)
  
  if (!sanitized && required) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  if (!sanitized && !required) {
    return { isValid: true }
  }
  
  if (sanitized.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` }
  }
  
  if (sanitized.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` }
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /eval\(/i,
    /expression\(/i
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { isValid: false, error: `${fieldName} contains invalid content` }
    }
  }
  
  return { isValid: true }
}

// Date Validation
export function validateDate(dateString: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeInput(dateString)
  
  if (!sanitized) {
    return { isValid: false, error: 'Date is required' }
  }
  
  const date = new Date(sanitized)
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' }
  }
  
  // Check if date is not too far in past or future
  const minDate = new Date('2020-01-01')
  const maxDate = new Date('2100-12-31')
  
  if (date < minDate || date > maxDate) {
    return { isValid: false, error: 'Date is out of valid range' }
  }
  
  return { isValid: true }
}

// Time Validation (HH:MM format)
export function validateTime(timeString: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeInput(timeString)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  
  if (!sanitized) {
    return { isValid: false, error: 'Time is required' }
  }
  
  if (!timeRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid time format (HH:MM)' }
  }
  
  return { isValid: true }
}

// Number Validation
export function validateNumber(
  value: string | number,
  fieldName: string = 'Number',
  min?: number,
  max?: number
): { isValid: boolean; error?: string } {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` }
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` }
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` }
  }
  
  return { isValid: true }
}

// UUID Validation
export function validateUUID(uuid: string): { isValid: boolean; error?: string } {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  if (!uuid) {
    return { isValid: false, error: 'ID is required' }
  }
  
  if (!uuidRegex.test(uuid)) {
    return { isValid: false, error: 'Invalid ID format' }
  }
  
  return { isValid: true }
}

// Sanitize Object - recursively sanitize all string values
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key])
    }
    return sanitized
  }
  
  return obj
}

// Validate Booking Data
export function validateBookingData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate title
  const titleValidation = validateText(data.title, 'Title', 3, 200, true)
  if (!titleValidation.isValid) errors.push(titleValidation.error!)
  
  // Validate description (optional)
  if (data.description) {
    const descValidation = validateText(data.description, 'Description', 0, 1000, false)
    if (!descValidation.isValid) errors.push(descValidation.error!)
  }
  
  // Validate date
  const dateValidation = validateDate(data.date)
  if (!dateValidation.isValid) errors.push(dateValidation.error!)
  
  // Validate times
  const startTimeValidation = validateTime(data.startTime)
  if (!startTimeValidation.isValid) errors.push(startTimeValidation.error!)
  
  const endTimeValidation = validateTime(data.endTime)
  if (!endTimeValidation.isValid) errors.push(endTimeValidation.error!)
  
  // Validate place UUID
  const placeValidation = validateUUID(data.place)
  if (!placeValidation.isValid) errors.push('Invalid place selection')
  
  // Validate participant count
  if (data.estimatedCount) {
    const countValidation = validateNumber(data.estimatedCount, 'Participant count', 1, 1000)
    if (!countValidation.isValid) errors.push(countValidation.error!)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate External Participant
export function validateExternalParticipant(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate name
  const nameValidation = validateName(data.fullName, 'Full Name')
  if (!nameValidation.isValid) errors.push(nameValidation.error!)
  
  // Validate email
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) errors.push(emailValidation.error!)
  
  // Validate phone
  const phoneValidation = validatePhone(data.phone)
  if (!phoneValidation.isValid) errors.push(phoneValidation.error!)
  
  // Validate reference value (alphanumeric + some special chars)
  if (data.referenceValue) {
    const refValue = sanitizeInput(data.referenceValue)
    if (refValue.length < 5 || refValue.length > 50) {
      errors.push('Reference value must be 5-50 characters')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}


