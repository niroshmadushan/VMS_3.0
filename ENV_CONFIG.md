# 🔐 ENVIRONMENT CONFIGURATION

## Required Environment Variables

Create a `.env.local` file in the root of your project with:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# API Security Headers (Required for all API calls)
NEXT_PUBLIC_APP_ID=default_app_id
NEXT_PUBLIC_SERVICE_KEY=default_service_key

# Backend API Configuration (Required for email sending)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=default_app_id
NEXT_PUBLIC_SERVICE_KEY=default_service_key
```

## How to Create .env.local

1. Create a new file named `.env.local` in the project root
2. Copy the content above
3. Save the file
4. Restart your dev server

## Important Notes

- These headers are required for ALL API calls (login, signup, secure-select, etc.)
- The `X-App-Id` and `X-Service-Key` headers are sent automatically
- Values are loaded from environment variables
- Never commit `.env.local` to git (it's in .gitignore)

## Email Service Setup (Using Your Backend API)

Your email service is already set up and working for login emails:

✅ **Backend API**: Running on `http://localhost:3000`  
✅ **NodeMailer**: Configured in your backend for OTP emails  
✅ **Authentication**: Uses `X-App-Id` and `X-Service-Key` headers  

**Meeting invitation emails** now use the same backend API as login OTP emails, so they should work immediately without any additional setup.

**How it works:**
1. Frontend calls `/api/admin/send-meeting-invitations`
2. This calls your backend `/api/send-email` endpoint
3. Backend uses NodeMailer to send the email
4. Same service as login OTP emails
