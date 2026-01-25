# ✅ Login API Setup Complete - Backend Integration Guide

## 📋 **What Was Configured**

### **1. Next.js API Routes Created**

#### **✅ `/app/api/auth/login/route.ts`**
- Proxies login requests to backend at `http://localhost:3000/api/auth/login`
- Validates email and password
- Uses correct headers: `x-app-id`, `x-service-key`, `Origin`
- Handles non-JSON responses (MD files, HTML) gracefully
- Returns proper error messages

#### **✅ `/app/api/auth/verify-otp/route.ts`**
- Proxies OTP verification to backend at `http://localhost:3000/api/auth/verify-otp`
- Validates email and 6-digit OTP code
- Uses correct headers matching backend specification
- Returns JWT tokens and user data on success

### **2. Updated Configuration Files**

#### **✅ `lib/api-config.ts`**
- Already configured with correct headers:
  - `x-app-id`: `uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123`
  - `x-service-key`: `dfsdsda345Bdchvbjhbh456`
  - `Origin`: `http://localhost:6001` (development)
- `getApiHeaders()` function returns headers in correct format

#### **✅ `lib/custom-auth.ts`**
- Updated to use lowercase headers (`x-app-id`, `x-service-key`)
- Added Origin header for client-side requests
- Improved error handling for non-JSON responses
- Uses Next.js API routes for client-side requests

### **3. Login Flow Components**

#### **✅ `components/auth/login-form.tsx`**
- Already implements two-step login flow:
  1. Step 1: Submit email/password → Shows OTP input
  2. Step 2: Submit OTP code → Completes login
- Handles errors gracefully
- Stores tokens automatically after successful login

---

## 🚀 **How the Login Flow Works**

### **Step 1: Initial Login Request**

**Frontend → Next.js API Route → Backend API**

```
POST /api/auth/login
Headers:
  Content-Type: application/json
  x-app-id: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123
  x-service-key: dfsdsda345Bdchvbjhbh456
  Origin: http://localhost:6001

Body:
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Backend Response:**
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

**Frontend Action:**
- Shows OTP input form
- Displays success message

### **Step 2: OTP Verification**

**Frontend → Next.js API Route → Backend API**

```
POST /api/auth/verify-otp
Headers:
  Content-Type: application/json
  x-app-id: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123
  x-service-key: dfsdsda345Bdchvbjhbh456
  Origin: http://localhost:6001

Body:
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Backend Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "session": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2026-01-22T10:00:00.000Z"
    }
  }
}
```

**Frontend Action:**
- Stores tokens in localStorage:
  - `authToken`: JWT access token
  - `refreshToken`: Refresh token
  - `userData`: User information
- Redirects to dashboard based on user role

---

## 🔧 **Backend Requirements**

### **Required Endpoints:**

1. **POST** `http://localhost:3000/api/auth/login`
   - Accepts: `{ email, password }`
   - Returns: `{ success, message, data: { email, otpRequired } }`

2. **POST** `http://localhost:3000/api/auth/verify-otp`
   - Accepts: `{ email, otpCode }`
   - Returns: `{ success, message, data: { user, session } }`

### **Required Headers (Backend Must Accept):**
- `Content-Type: application/json`
- `x-app-id: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123`
- `x-service-key: dfsdsda345Bdchvbjhbh456`
- `Origin: http://localhost:6001` (for CORS)

### **Response Format:**
All responses **MUST** be JSON with this structure:
```json
{
  "success": boolean,
  "message": string,
  "data": object (optional),
  "errors": array (optional)
}
```

---

## ✅ **Testing the Setup**

### **1. Test Backend Connection**

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-app-id: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "x-service-key: dfsdsda345Bdchvbjhbh456" \
  -H "Origin: http://localhost:6001" \
  -d '{"email": "test@example.com", "password": "TestPass123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "data": {
    "email": "test@example.com",
    "otpRequired": true
  }
}
```

### **2. Test Frontend Login**

1. Start your Next.js dev server: `npm run dev`
2. Navigate to: `http://localhost:6001/login`
3. Enter email and password
4. Check email for OTP code
5. Enter OTP code
6. Should redirect to dashboard

### **3. Check Browser Console**

Open browser DevTools → Network tab:
- Should see `POST /api/auth/login` → 200 OK
- Should see `POST /api/auth/verify-otp` → 200 OK
- Check request headers match specification
- Check response is JSON (not MD/HTML)

---

## ⚠️ **Common Issues & Solutions**

### **Issue 1: "Backend API returned documentation instead of JSON"**

**Cause:** Backend is returning MD file or HTML instead of JSON.

**Solution:**
1. Verify backend endpoint exists: `http://localhost:3000/api/auth/login`
2. Check backend returns `Content-Type: application/json`
3. Verify backend route handler is correct
4. Check backend logs for errors

### **Issue 2: CORS Errors**

**Cause:** Backend not allowing requests from `http://localhost:6001`.

**Solution:**
1. Add CORS middleware to backend
2. Allow origin: `http://localhost:6001`
3. Allow headers: `x-app-id`, `x-service-key`, `Content-Type`
4. Allow methods: `POST`, `OPTIONS`

### **Issue 3: "Invalid credentials" (401)**

**Cause:** Email/password incorrect or account doesn't exist.

**Solution:**
1. Verify user exists in database
2. Check password is correct
3. Verify account is verified (check email)
4. Check account is not locked

### **Issue 4: "Invalid or expired OTP code" (400)**

**Cause:** OTP code is wrong or expired.

**Solution:**
1. Check email for latest OTP code
2. OTP codes expire after a few minutes
3. Request new OTP by logging in again
4. Verify OTP code is 6 digits

### **Issue 5: "Account not verified" (403)**

**Cause:** User hasn't verified their email.

**Solution:**
1. Check email for verification link
2. Click verification link
3. Or use resend verification endpoint

---

## 📝 **Code Examples**

### **Using the Login Form (Easiest)**

```tsx
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return <LoginForm />
}
```

### **Using Custom Auth Functions**

```typescript
import { signIn, verifyOTP } from '@/lib/custom-auth'

// Step 1: Login
const loginResult = await signIn({
  email: 'user@example.com',
  password: 'YourPassword123!'
})

if (loginResult.success && loginResult.data?.otpRequired) {
  // Step 2: Verify OTP
  const otpResult = await verifyOTP('user@example.com', '123456')
  
  if (otpResult.success) {
    // Tokens stored automatically
    console.log('Logged in!', otpResult.data.user)
  }
}
```

### **Using Auth Context**

```tsx
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const { signIn, verifyOTP, isAuthenticated, user } = useAuth()
  
  const handleLogin = async () => {
    const result = await signIn(email, password)
    if (result.success && result.data?.otpRequired) {
      // Show OTP input
    }
  }
  
  const handleOtp = async () => {
    const result = await verifyOtp(email, otpCode)
    if (result.success) {
      // Redirect to dashboard
    }
  }
}
```

---

## 🔐 **Security Notes**

1. **✅ Headers are correctly configured** - Using lowercase `x-app-id` and `x-service-key`
2. **✅ Origin header included** - For CORS validation
3. **✅ Tokens stored securely** - In localStorage (consider httpOnly cookies for production)
4. **✅ Error messages are generic** - Prevents information disclosure
5. **✅ Input validation** - Email and password validated before sending
6. **✅ OTP validation** - 6-digit code format enforced

---

## 🎯 **Next Steps**

1. ✅ **Backend API routes created**
2. ✅ **Headers configured correctly**
3. ✅ **Login flow implemented**
4. ⏳ **Test with real backend** - Ensure backend is running and endpoints work
5. ⏳ **Verify email sending** - Check OTP codes are sent to email
6. ⏳ **Test token storage** - Verify tokens are stored after login
7. ⏳ **Test protected routes** - Verify tokens work for authenticated requests

---

## 📞 **Files Modified/Created**

### **Created:**
- ✅ `app/api/auth/login/route.ts` - Login API route
- ✅ `app/api/auth/verify-otp/route.ts` - OTP verification route
- ✅ `LOGIN_API_SETUP_COMPLETE.md` - This documentation

### **Updated:**
- ✅ `lib/custom-auth.ts` - Updated headers to lowercase format
- ✅ `lib/api-config.ts` - Already had correct configuration

### **Already Configured:**
- ✅ `components/auth/login-form.tsx` - Two-step login flow
- ✅ `lib/auth-context.tsx` - Auth context provider

---

**Setup Status:** ✅ **COMPLETE**

All login API routes are configured according to the backend specification. The system is ready to connect to your backend API at `http://localhost:3000/api`.

