# API Configuration Guide

## Centralized API Configuration

All backend API URLs are now managed from a single location: `lib/api-config.ts`

### Default Backend URL

The default backend URL is set to: **`http://192.168.12.230:3000`**

### How to Change the Backend URL

You have two options:

#### Option 1: Update the Config File (Recommended for Quick Changes)

Edit `lib/api-config.ts` and change the default value:

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.12.230:3000'
```

Change `'http://192.168.12.230:3000'` to your desired backend URL.

#### Option 2: Use Environment Variable (Recommended for Production)

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://192.168.12.230:3000
NEXT_PUBLIC_APP_ID=your_app_id
NEXT_PUBLIC_SERVICE_KEY=your_service_key
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

The environment variable will override the default value in the config file.

### Files Updated

All API calls now use the centralized configuration:

- ✅ `lib/api-config.ts` - Central configuration file
- ✅ `lib/place-management-api.ts` - Main API client
- ✅ `lib/custom-auth.ts` - Authentication API
- ✅ `lib/logout-manager.ts` - Logout functionality
- ✅ `components/admin/admin-overview.tsx` - Admin dashboard
- ✅ `components/staff/admin-overview.tsx` - Staff dashboard
- ✅ `components/admin/user-management.tsx` - User management
- ✅ `components/admin/admin-settings.tsx` - Admin settings
- ✅ `app/smart-assistant/page.tsx` - Smart assistant
- ✅ `app/api/booking-email/send-from-frontend/route.ts` - Email API
- ✅ `app/api/booking-email/[bookingId]/send-details/route.ts` - Email details
- ✅ `app/api/booking-email/[bookingId]/history/route.ts` - Email history
- ✅ `app/api/booking-email/[bookingId]/send-reminder/route.ts` - Email reminders
- ✅ `app/api/booking-email/[bookingId]/participants/route.ts` - Participants API
- ✅ `app/api/admin/send-meeting-invitations/route.ts` - Meeting invitations

### Usage

All files import from the centralized config:

```typescript
import { API_BASE_URL, getBackendApiUrl, SITE_URL } from '@/lib/api-config'

// Use API_BASE_URL directly
const url = `${API_BASE_URL}/api/endpoint`

// Or use helper function
const url = getBackendApiUrl('endpoint')
```

### Benefits

1. **Single Source of Truth**: Change the backend URL in one place
2. **Easy Updates**: No need to search and replace across multiple files
3. **Environment Support**: Can use environment variables for different environments
4. **Type Safety**: TypeScript ensures correct usage
5. **Maintainability**: Easier to maintain and update

### Testing

After changing the backend URL, test the following:

1. Login functionality
2. Booking creation/editing
3. Email sending
4. Dashboard data loading
5. User management operations

All API calls should now point to your new backend URL.

