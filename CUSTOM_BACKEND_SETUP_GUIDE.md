# Custom Backend Authentication Setup Guide

## 🚀 Migration from Supabase to Custom Backend

This guide helps you migrate from Supabase authentication to your custom backend authentication system.

## 📋 What's Been Updated

### ✅ Files Created/Updated:

1. **`lib/custom-auth.ts`** - Complete custom authentication system
2. **`lib/auth-context.tsx`** - React context for authentication state
3. **`components/auth/login-form.tsx`** - Updated login form with OTP support
4. **`app/layout.tsx`** - Added AuthProvider wrapper
5. **`API_INTEGRATION_GUIDE.txt`** - Your backend API documentation

### ✅ Features Implemented:

- **Two-step authentication** (password + OTP)
- **Email verification** for new accounts
- **Password reset** with OTP verification
- **Role-based access control**
- **Session management**
- **Token-based authentication**
- **Admin functions**

## 🔧 Environment Configuration

Create a `.env.local` file in your project root with:

```env
# Custom Backend Authentication Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=your_unique_app_id_here
NEXT_PUBLIC_SERVICE_KEY=your_service_key_here
```

### Get Your Credentials:

1. **API URL**: Your backend server URL (default: `http://localhost:3000`)
2. **App ID**: Your unique app identifier from backend
3. **Service Key**: Your service key from backend

## 🎯 Authentication Flow

### 1. **Sign Up Process:**
```
User fills form → Backend creates account → Email verification sent → User clicks link → Account activated
```

### 2. **Sign In Process:**
```
User enters credentials → Backend sends OTP → User enters OTP → JWT token issued → User logged in
```

### 3. **Password Reset:**
```
User requests reset → OTP sent to email → User enters OTP → New password set
```

## 🔑 API Integration

### Required Headers (All API calls):
```
Content-Type: application/json
X-App-ID: your_unique_app_id_here
X-Service-Key: your_service_key_here
Authorization: Bearer <jwt-token> (for authenticated endpoints)
```

### Key Endpoints:

- **POST** `/api/auth/signup` - User registration
- **POST** `/api/auth/login` - User login (sends OTP)
- **POST** `/api/auth/verify-otp` - Complete login with OTP
- **POST** `/api/auth/verify-email` - Email verification
- **POST** `/api/auth/password-reset` - Request password reset
- **POST** `/api/auth/logout` - Sign out

## 🎨 Updated Components

### Login Form Features:
- ✅ **Two-step authentication** (password + OTP)
- ✅ **Email verification** for signup
- ✅ **Role selection** (admin, employee, reception)
- ✅ **Error handling** and success messages
- ✅ **Loading states** and form validation

### Authentication Context:
- ✅ **Global state management**
- ✅ **Automatic token handling**
- ✅ **Role-based access control**
- ✅ **Session persistence**

## 🚀 Getting Started

### 1. **Start Your Backend Server:**
```bash
# Make sure your backend is running on port 3000
# Check: http://localhost:3000/health
```

### 2. **Configure Environment Variables:**
```bash
# Create .env.local file with your backend credentials
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=your_app_id
NEXT_PUBLIC_SERVICE_KEY=your_service_key
```

### 3. **Start Your Frontend:**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### 4. **Test Authentication:**
- Visit your login page
- Try signing up a new user
- Test the OTP verification flow
- Verify role-based redirects

## 🔧 Customization

### Update API URL:
```typescript
// In lib/custom-auth.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
```

### Add New Roles:
```typescript
// In components/auth/login-form.tsx
type UserRole = "admin" | "reception" | "employee" | "your_new_role"
```

### Customize Authentication Flow:
```typescript
// In lib/custom-auth.ts
// Modify the signIn function to handle different flows
```

## 🎯 Role-Based Routing

The system automatically redirects users based on their role:

- **Admin** → `/admin`
- **Employee** → `/employee`
- **Reception** → `/reception`
- **User** → `/user` (or default)

## 🔒 Security Features

- ✅ **JWT token authentication**
- ✅ **OTP-based login verification**
- ✅ **Email verification required**
- ✅ **Password reset with OTP**
- ✅ **Session management**
- ✅ **Role-based access control**
- ✅ **Secure token storage**

## 🧪 Testing

### Test Sign Up:
1. Go to login page
2. Click "Sign Up" tab
3. Fill in the form
4. Check email for verification link

### Test Sign In:
1. Enter email and password
2. Check email for OTP code
3. Enter OTP code
4. Verify redirect to correct dashboard

### Test Password Reset:
1. Use the password reset functionality
2. Check email for OTP
3. Enter OTP and new password

## 🚨 Troubleshooting

### Common Issues:

1. **"Network error"** - Check if backend is running
2. **"Invalid credentials"** - Verify APP_ID and SERVICE_KEY
3. **"OTP not received"** - Check email spam folder
4. **"Token expired"** - Re-login or refresh token

### Debug Steps:

1. **Check backend health**: `http://localhost:3000/health`
2. **Verify environment variables** in `.env.local`
3. **Check browser console** for errors
4. **Verify backend logs** for API calls

## 📚 API Documentation

Your complete API documentation is in `API_INTEGRATION_GUIDE.txt` with:
- All endpoint details
- Request/response examples
- Error codes
- Testing examples
- Security features

## 🎉 You're All Set!

Your application now uses your custom backend authentication system with:
- ✅ **Complete Supabase removal**
- ✅ **Custom backend integration**
- ✅ **OTP-based authentication**
- ✅ **Email verification**
- ✅ **Role-based access**
- ✅ **Session management**

Start your backend server, configure your environment variables, and test the authentication flow! 🚀
