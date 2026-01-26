# 🔐 Login API Fix - How to Login Correctly

## ✅ **What Was Fixed**

### **Problem:**
The login API was returning an MD file instead of JSON response, causing login failures.

### **Solution:**
1. Created a Next.js API route at `/app/api/auth/login/route.ts` that properly proxies requests to the backend
2. Added validation to detect and handle non-JSON responses (MD files, HTML, etc.)
3. Updated `lib/custom-auth.ts` to use Next.js API routes for client-side requests

---

## 📋 **How to Use Login API**

### **Method 1: Using the Login Form (Recommended)**
The login form at `/login` automatically handles the login process:

1. Enter your email and password
2. Click "Sign In"
3. If OTP is required, enter the 6-digit code sent to your email
4. You'll be redirected to your dashboard based on your role

### **Method 2: Direct API Call**

#### **Step 1: Initial Login Request**
```typescript
POST /api/auth/login

Headers:
  Content-Type: application/json
  X-App-Id: your_app_id
  X-Service-Key: your_service_key

Body:
{
  "email": "user@example.com",
  "password": "YourPassword123!"
}
```

**Response (OTP Required):**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "data": {
    "email": "user@example.com",
    "otpRequired": true
  }
}
```

**Response (Direct Login - No OTP):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "staff"
    },
    "session": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-09-30T15:57:04.302Z"
    }
  }
}
```

#### **Step 2: OTP Verification (If Required)**
```typescript
POST /api/auth/verify-otp

Headers:
  Content-Type: application/json
  X-App-Id: your_app_id
  X-Service-Key: your_service_key

Body:
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "staff"
    },
    "sessionId": "session-uuid-here"
  }
}
```

---

## 🔧 **Backend Configuration**

### **Required Backend Endpoint:**
Your backend must have a login endpoint at:
```
POST http://localhost:3000/api/auth/login
```

### **Required Headers:**
- `Content-Type: application/json`
- `X-App-Id: your_app_id`
- `X-Service-Key: your_service_key`

### **Expected Response Format:**
The backend **MUST** return JSON, not MD files or HTML. The response should be:
```json
{
  "success": boolean,
  "message": string,
  "data": object
}
```

---

## ⚠️ **Troubleshooting**

### **Issue: "Backend API returned documentation instead of JSON"**
**Cause:** Backend is returning an MD file or HTML instead of JSON.

**Solution:**
1. Check if your backend server is running at `http://localhost:3000`
2. Verify the endpoint `/api/auth/login` exists and returns JSON
3. Check backend logs for errors
4. Ensure the backend is configured to return JSON responses

### **Issue: "Network error occurred"**
**Cause:** Cannot connect to backend API.

**Solution:**
1. Verify backend server is running: `http://localhost:3000`
2. Check `API_BASE_URL` in `.env.local` or `lib/api-config.ts`
3. Check network connectivity
4. Verify CORS settings on backend

### **Issue: "Invalid credentials"**
**Cause:** Email or password is incorrect.

**Solution:**
1. Verify email and password are correct
2. Check if account exists
3. Verify account is not locked
4. Check email domain is allowed (for signup)

---

## 📝 **Code Examples**

### **Using the Login Form Component:**
```tsx
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return <LoginForm />
}
```

### **Using Custom Auth Functions:**
```typescript
import { signIn, verifyOTP } from '@/lib/custom-auth'

// Step 1: Login
const result = await signIn({
  email: 'user@example.com',
  password: 'YourPassword123!'
})

if (result.success && result.data?.otpRequired) {
  // Step 2: Verify OTP
  const otpResult = await verifyOTP('user@example.com', '123456')
  
  if (otpResult.success) {
    // Login successful, tokens stored automatically
    console.log('Logged in!', otpResult.data.user)
  }
}
```

### **Using Auth Context:**
```tsx
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const { signIn, verifyOTP, isAuthenticated, user } = useAuth()
  
  const handleLogin = async () => {
    const result = await signIn(email, password)
    // Handle result...
  }
}
```

---

## ✅ **What's Working Now**

1. ✅ Next.js API route properly proxies to backend
2. ✅ Detects and handles MD/HTML responses with clear error messages
3. ✅ Proper JSON validation
4. ✅ Error handling for network issues
5. ✅ Automatic token storage after successful login
6. ✅ OTP flow support
7. ✅ Direct login support (no OTP)

---

## 🚀 **Next Steps**

1. Ensure your backend API is running at `http://localhost:3000`
2. Verify the backend `/api/auth/login` endpoint returns JSON
3. Test login using the login form at `/login`
4. Check browser console for any errors
5. Verify tokens are stored in localStorage after successful login

---

**Last Updated:** $(date)

