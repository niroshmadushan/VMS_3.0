# OTP Not Working - Troubleshooting Guide

## Problem
The login form is not asking for OTP after entering email and password.

## Debugging Steps

### 1. Check Backend Status
Visit `/test-backend` to test your backend API directly:
- Test health endpoint
- Test login endpoint with your credentials
- Check environment variables

### 2. Check Browser Console
Open browser developer tools (F12) and look for:
- Login request logs
- API response logs
- Any error messages

### 3. Common Issues & Solutions

#### Issue 1: Backend Not Running
**Symptoms:** Network errors, connection refused
**Solution:** 
- Start your backend server on `http://localhost:3000`
- Check if the server is running: `curl http://localhost:3000/health`

#### Issue 2: Wrong Environment Variables
**Symptoms:** API calls failing, 401/403 errors
**Solution:**
- Check `.env.local` file has correct values:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=your_unique_app_id_here
NEXT_PUBLIC_SERVICE_KEY=your_service_key_here
```

#### Issue 3: Backend Response Format
**Symptoms:** Login succeeds but no OTP prompt
**Solution:**
- Backend should return:
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

#### Issue 4: CORS Issues
**Symptoms:** CORS errors in console
**Solution:**
- Backend needs to allow CORS from your frontend
- Add CORS headers in backend

#### Issue 5: Rate Limiting
**Symptoms:** "Too many authentication attempts" error
**Solution:**
- Wait a few minutes before trying again
- Check backend rate limiting settings

## Expected Flow

1. **Enter email/password** → Click "Sign In"
2. **Backend responds** with `otpRequired: true`
3. **Form shows OTP input** → "Verification code sent to your email"
4. **Enter OTP** → Click "Verify"
5. **Login completes** → Redirect to dashboard

## Debug Information Added

I've added console logging to help debug:
- Login request details
- API response details
- OTP requirement check

## Test Your Backend

1. Go to `/test-backend`
2. Test health endpoint first
3. Test login with your credentials
4. Check the response format

## Quick Fixes

### If Backend Returns Wrong Format:
Update your backend to return:
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

### If Environment Variables Missing:
Create/update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=your_unique_app_id_here
NEXT_PUBLIC_SERVICE_KEY=your_service_key_here
```

### If Backend Not Running:
Start your backend server and ensure it's accessible at `http://localhost:3000`
