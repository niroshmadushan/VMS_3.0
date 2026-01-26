# 🔐 Secure Signup Frontend Integration Guide

## Overview

The Secure Signup frontend integrates with your external backend API that provides:
- Secret code validation from database
- Email domain restriction (only allowed company domains)
- Stronger password requirements (12+ characters with complexity)
- Enhanced input validation

---

## 📋 **Prerequisites**

1. External backend API running at `http://localhost:3000` (or configured via `NEXT_PUBLIC_API_URL`)
2. Environment variables set up

---

## ⚙️ **Environment Variables**

Add these to your `.env.local` file:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# API Security Headers (Required)
NEXT_PUBLIC_APP_ID=your_unique_app_id_here
NEXT_PUBLIC_SERVICE_KEY=your_service_key_here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

---

## 📦 **Install Dependencies**

Install the required MySQL package:

```bash
npm install mysql2
```

---

## 🚀 **API Endpoint**

**POST** `/api/auth/secure-signup`

**Base URL:** `http://localhost:3001/api/auth/secure-signup`

---

## 📝 **Frontend Implementation**

The frontend signup page (`app/auth/secure-signup/page.tsx`) automatically:
- Calls the external backend API
- Includes required headers (`X-App-ID`, `X-Service-Key`)
- Handles validation errors
- Shows success/error messages

**Access the signup page:** `/auth/secure-signup`

---

## ✅ **Validation Rules**

### **Email Domain**
Only emails from these domains are allowed:
- `connexit.biz`
- `connexcodeworks.biz`
- `connex360.biz` (note: double 'n')
- `connexvectra.biz`

### **Password Requirements**
- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&#^()_+-=[]{};\':"\\|,.<>/)

### **Name Requirements**
- First name: 2-50 characters, letters/spaces/hyphens/apostrophes only
- Last name: 2-50 characters, letters/spaces/hyphens/apostrophes only

### **Secret Code**
- Must exist in `secret_tbl` table
- Must be active (`is_active = TRUE`)
- Must not be expired (if `expires_at` is set)
- Must not exceed max uses (if `max_uses` is set)

---

## 📤 **Response Examples**

### **Success (201 Created)**

```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@connexit.biz",
    "role": "user",
    "verificationRequired": true,
    "emailDomain": "connexit.biz"
  }
}
```

### **Error - Invalid Secret Code (403 Forbidden)**

```json
{
  "success": false,
  "message": "Invalid or inactive secret code"
}
```

### **Error - Validation Failed (400 Bad Request)**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Password must be at least 12 characters long",
      "param": "password",
      "location": "body"
    }
  ]
}
```

---

## 🔧 **Secret Code Management**

### **Add New Secret Code**

```sql
INSERT INTO secret_tbl (secret_code, code_name, is_active, max_uses, expires_at) 
VALUES ('NEWCODE2024', 'New Signup Code', TRUE, 100, '2024-12-31 23:59:59');
```

### **Deactivate Secret Code**

```sql
UPDATE secret_tbl SET is_active = FALSE WHERE secret_code = 'OLDCODE';
```

### **Check Secret Code Usage**

```sql
SELECT secret_code, used_count, max_uses, expires_at, is_active 
FROM secret_tbl 
WHERE secret_code = 'CONNEX2024';
```

### **Update Secret Code**

```sql
UPDATE secret_tbl 
SET max_uses = 200, expires_at = '2025-12-31 23:59:59' 
WHERE secret_code = 'CONNEX2024';
```

---

## 🧪 **Testing**

1. **Test with valid data:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/secure-signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@connexit.biz",
       "password": "SecurePass123!@#",
       "firstName": "Test",
       "lastName": "User",
       "secretCode": "CONNEX2024"
     }'
   ```

2. **Test with invalid email domain:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/secure-signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@gmail.com",
       "password": "SecurePass123!@#",
       "firstName": "Test",
       "lastName": "User",
       "secretCode": "CONNEX2024"
     }'
   ```

3. **Test with weak password:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/secure-signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@connexit.biz",
       "password": "weak",
       "firstName": "Test",
       "lastName": "User",
       "secretCode": "CONNEX2024"
     }'
   ```

---

## 🔐 **Security Features**

1. ✅ **Secret Code Validation** - Prevents unauthorized signups
2. ✅ **Email Domain Restriction** - Only company emails allowed
3. ✅ **Strong Password Policy** - 12+ characters with complexity
4. ✅ **Input Sanitization** - Names validated to prevent injection
5. ✅ **Usage Tracking** - Secret code usage counted and limited
6. ✅ **Expiration Support** - Secret codes can expire
7. ✅ **Email Verification** - Required before account activation

---

## 📊 **Database Schema**

The `secret_tbl` table includes:

- `id` - Auto-increment primary key
- `secret_code` - Unique code string (VARCHAR 100)
- `code_name` - Description/name (VARCHAR 255)
- `is_active` - Whether code is active (BOOLEAN)
- `max_uses` - Maximum signups allowed (INT, NULL = unlimited)
- `used_count` - Current usage count (INT)
- `expires_at` - Expiration date (DATETIME, NULL = never)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `created_by` - Creator identifier
- `notes` - Additional notes (TEXT)

---

## ⚠️ **Important Notes**

1. **Email Domain:** Only emails from allowed domains can sign up
2. **Secret Code:** Must be provided and valid in database
3. **Password:** Minimum 12 characters with strong complexity
4. **Verification:** Email verification is required after signup
5. **Role:** Default is 'user'. Only 'user', 'staff', 'assistant' allowed (admin cannot be set via signup)
6. **Headers:** X-App-ID and X-Service-Key are logged but not strictly validated (add validation in production)

---

## 🔄 **Next Steps After Signup**

1. User receives verification email with token
2. User verifies email through Supabase
3. After verification, user can login with `POST /api/auth/login` or use the login page

---

**Last Updated:** 2025-01-15











