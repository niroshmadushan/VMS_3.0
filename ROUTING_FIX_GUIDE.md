# Routing Fix Guide

## Problem Fixed
The redirect loop between `/admin` and `/` (home) has been resolved by:

1. **Centralized Authentication Logic**: All role-based pages now use the `useAuth` hook from the authentication context
2. **Proper Loading States**: Pages wait for authentication state to be determined before redirecting
3. **Single Source of Truth**: The home page handles redirecting authenticated users to their dashboards
4. **No Conflicting Redirects**: Removed duplicate redirect logic from login form

## Changes Made

### 1. Home Page (`app/page.tsx`)
- Now redirects authenticated users to their role-based dashboard
- Shows loading state while checking authentication
- Only shows login form for unauthenticated users

### 2. Admin Page (`app/admin/page.tsx`)
- Uses `useAuth` hook instead of old `getCurrentUser`
- Waits for authentication state before redirecting
- Proper loading state and role validation

### 3. Employee Page (`app/employee/page.tsx`)
- Updated to use new authentication system
- Consistent with admin page pattern

### 4. Reception Page (`app/reception/page.tsx`)
- Updated to use new authentication system
- Consistent with other role-based pages

### 5. Login Form (`components/auth/login-form.tsx`)
- Removed duplicate redirect logic
- Simplified to focus on authentication only

## How It Works Now

1. **User visits home page (`/`)**:
   - If not authenticated: Shows login form
   - If authenticated: Redirects to `/{user.role}`

2. **User visits role-based page (`/admin`, `/employee`, `/reception`)**:
   - If not authenticated: Redirects to home (`/`)
   - If authenticated but wrong role: Redirects to home (`/`)
   - If authenticated with correct role: Shows dashboard

3. **User logs in successfully**:
   - Authentication state updates
   - Home page detects authenticated user
   - Redirects to appropriate dashboard

## Testing Steps

1. **Test Unauthenticated Access**:
   - Visit `/admin` → Should redirect to `/`
   - Visit `/employee` → Should redirect to `/`
   - Visit `/reception` → Should redirect to `/`

2. **Test Login Flow**:
   - Go to `/` → Should show login form
   - Login with admin credentials → Should redirect to `/admin`
   - Login with employee credentials → Should redirect to `/employee`
   - Login with reception credentials → Should redirect to `/reception`

3. **Test Role Protection**:
   - Login as admin → Try to visit `/employee` → Should redirect to `/admin`
   - Login as employee → Try to visit `/admin` → Should redirect to `/employee`

## Debug Tools

- Visit `/debug-auth` to see current authentication state
- Check browser console for redirect logs
- Use `/diagnose-rate-limit` if you encounter rate limiting issues

## Environment Variables Required

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=your_unique_app_id_here
NEXT_PUBLIC_SERVICE_KEY=your_service_key_here
```

## Backend Requirements

Your backend should be running on `http://localhost:3000` with these endpoints:
- `POST /api/auth/signin` - Initial login (returns OTP required)
- `POST /api/auth/verify-otp` - OTP verification (returns user data and token)
- `GET /api/auth/validate-token` - Token validation
- `GET /health` - Health check

The OTP verification response should include user data:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```
