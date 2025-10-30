# Supabase Authentication Setup Guide

This guide will help you set up complete authentication with automatic profile creation and email confirmation for your VM Supabase instance.

## 🚀 Quick Setup Steps

### 1. Run the SQL Scripts

Execute these SQL scripts in your Supabase VM dashboard at `https://supa.minimart.best`:

1. **First, run the main authentication setup:**
   ```sql
   -- Copy and paste the contents of supabase-auth-setup.sql
   ```

2. **Then, run the email configuration:**
   ```sql
   -- Copy and paste the contents of supabase-email-config.sql
   ```

### 2. Configure Email Settings in Supabase Dashboard

1. Go to `https://supa.minimart.best` → Authentication → Settings
2. **Enable email confirmation:**
   - Set "Enable email confirmations" to `ON`
   - Set "Enable email change confirmations" to `ON`
3. **Configure email templates:**
   - Go to Authentication → Email Templates
   - Customize the confirmation and recovery email templates
4. **Set up SMTP (if you have custom email service):**
   - Go to Authentication → Settings → SMTP Settings
   - Configure your SMTP provider

### 3. Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://supa.minimart.best
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 📋 What the Setup Includes

### ✅ Database Schema
- **Profiles table** with user information
- **Row Level Security (RLS)** policies
- **Automatic profile creation** on signup
- **Audit logging** for authentication events

### ✅ Authentication Features
- **Sign up** with automatic profile creation
- **Sign in** with role-based access
- **Email confirmation** for new accounts
- **Password reset** functionality
- **Role-based permissions** (admin, employee, reception, user)

### ✅ Helper Functions
- `signUp()` - Create new user account
- `signIn()` - Authenticate user
- `signOut()` - Sign out user
- `getUserProfile()` - Get user profile data
- `updateUserProfile()` - Update profile information
- `resetPassword()` - Send password reset email
- `isAdmin()`, `isEmployee()`, `isReception()` - Role checks

### ✅ Security Features
- **Automatic profile creation** when user signs up
- **Last login tracking**
- **Authentication audit log**
- **Email confirmation** required for new accounts
- **Role-based access control**

## 🔧 How It Works

### Sign Up Process
1. User fills out signup form
2. `signUp()` function creates auth user
3. **Trigger automatically creates profile record**
4. Email confirmation sent to user
5. User clicks confirmation link
6. Account activated

### Sign In Process
1. User enters credentials
2. `signIn()` function authenticates
3. **Last login timestamp updated**
4. User redirected to role-based dashboard
5. **Authentication event logged**

### Profile Management
- Profile automatically created on signup
- All user data stored in `profiles` table
- RLS policies ensure users only see their own data
- Admins can view all profiles

## 🎯 Testing Your Setup

1. **Test the connection:**
   - Visit `http://localhost:3000/test-supabase`
   - Verify connection to your VM

2. **Test signup:**
   - Go to your login page
   - Click "Sign Up" tab
   - Create a new account
   - Check your email for confirmation

3. **Test signin:**
   - Confirm your email
   - Sign in with your credentials
   - Verify you're redirected to the correct dashboard

## 📧 Email Configuration

### Default Email Templates
The setup includes beautiful HTML email templates for:
- **Account confirmation**
- **Password reset**

### Customizing Templates
You can customize email templates in:
1. Supabase Dashboard → Authentication → Email Templates
2. Or modify the templates in the `email_templates` table

### SMTP Setup (Optional)
If you want to use a custom email service:
1. Go to Authentication → Settings → SMTP Settings
2. Configure your SMTP provider (SendGrid, AWS SES, etc.)

## 🔒 Security Best Practices

### Row Level Security (RLS)
- Users can only view/edit their own profiles
- Admins can view all profiles
- All policies are properly configured

### Audit Logging
- All authentication events are logged
- Includes IP address and user agent
- Helps with security monitoring

### Email Confirmation
- Required for all new accounts
- Prevents fake email registrations
- Configurable confirmation timeout

## 🚨 Troubleshooting

### Common Issues

1. **"Profile not created" error:**
   - Check if the trigger function exists
   - Verify RLS policies are enabled
   - Check Supabase logs for errors

2. **Email not sending:**
   - Verify SMTP settings in dashboard
   - Check spam folder
   - Ensure email confirmation is enabled

3. **Permission denied errors:**
   - Check RLS policies
   - Verify user has correct role
   - Check if user is authenticated

### Debug Steps
1. Check Supabase logs in dashboard
2. Use the connection test page
3. Verify environment variables
4. Check browser console for errors

## 📚 API Reference

### Authentication Functions

```typescript
// Sign up new user
const result = await signUp({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'John Doe',
  role: 'employee'
})

// Sign in user
const result = await signIn({
  email: 'user@example.com',
  password: 'password123'
})

// Get user profile
const profile = await getUserProfile()

// Update profile
const result = await updateUserProfile({
  full_name: 'John Smith',
  phone: '+1234567890'
})

// Check user role
const isAdmin = await isAdmin()
const isEmployee = await isEmployee()
```

### Database Functions

```sql
-- Get current user profile
SELECT * FROM get_user_profile();

-- Log authentication event
SELECT log_auth_event('login', auth.uid(), '{"ip": "192.168.1.1"}');

-- Send custom email
SELECT send_custom_email(
  'user@example.com',
  'confirmation',
  '{"confirmation_url": "https://example.com/confirm"}'
);
```

## 🎉 You're All Set!

Your Supabase authentication system is now fully configured with:
- ✅ Automatic profile creation
- ✅ Email confirmation
- ✅ Role-based access control
- ✅ Security policies
- ✅ Audit logging
- ✅ Helper functions

Start testing your authentication system and customize it further as needed!




