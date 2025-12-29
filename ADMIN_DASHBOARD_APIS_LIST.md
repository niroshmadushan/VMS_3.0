# 📊 Admin Dashboard APIs List

Complete list of all available API endpoints for the Admin Dashboard.

---

## 🔐 **Authentication APIs**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/resend-verification` | Resend email verification | No |

---

## 👥 **User Management APIs**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/user-management/users` | Get all users list | Yes |
| GET | `/api/user-management/users/[userId]` | Get user by ID | Yes |
| PUT | `/api/user-management/users/[userId]` | Update user details | Yes |
| DELETE | `/api/user-management/users/[userId]` | Delete user | Yes |
| POST | `/api/user-management/users/[userId]/activate` | Activate user account | Yes |
| POST | `/api/user-management/users/[userId]/deactivate` | Deactivate user account | Yes |
| PUT | `/api/user-management/users/[userId]/profile` | Update user profile | Yes |
| POST | `/api/user-management/users/[userId]/send-password-reset` | Send password reset email | Yes |
| GET | `/api/user-management/statistics` | Get user statistics and analytics | Yes |

---

## 👨‍💼 **Admin User Management APIs**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/admin/users` | Create new admin/staff/assistant user | Yes (Admin) |
| PATCH | `/api/admin/users/[id]/status` | Update user status (active/inactive) | Yes (Admin) |
| POST | `/api/admin/users/[id]/reset-password` | Reset user password | Yes (Admin) |

---

## 📧 **Email & Notification APIs**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/admin/send-email` | Send custom email notification | Yes (Admin) |
| POST | `/api/admin/send-meeting-invitations` | Send meeting invitations to recipients | Yes (Admin) |
| POST | `/api/booking-email/send-from-frontend` | Send booking details email from frontend | Yes |
| POST | `/api/booking-email/[bookingId]/send-details` | Send booking details email | Yes |
| POST | `/api/booking-email/[bookingId]/send-reminder` | Send booking reminder email | Yes |
| GET | `/api/booking-email/[bookingId]/history` | Get email sending history for booking | Yes |
| GET | `/api/booking-email/[bookingId]/participants` | Get booking participants for email | Yes |

---

## 📊 **Statistics & Analytics APIs**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/user-management/statistics` | Get user statistics (total, active, inactive, recent registrations, role distribution, recent users, most active users) | Yes |

---

## 🎯 **Dashboard APIs** (10 Endpoints)

Complete dashboard API system providing real-time statistics, analytics, and insights.

**Base URL:** `http://localhost:3000/api/dashboard`

| # | Method | Endpoint | Purpose | Access Level |
|---|--------|----------|---------|--------------|
| 1 | GET | `/api/dashboard/statistics` | Overview statistics (users, bookings, visitors, places) | Admin, Manager |
| 2 | GET | `/api/dashboard/recent-activity` | Recent system activities | Admin, Manager |
| 3 | GET | `/api/dashboard/todays-schedule` | Today's bookings schedule | All roles |
| 4 | GET | `/api/dashboard/bookings-analytics` | Booking trends and analytics | Admin, Manager |
| 5 | GET | `/api/dashboard/visitors-analytics` | Visitor statistics and trends | Admin, Manager |
| 6 | GET | `/api/dashboard/places-utilization` | Place usage and availability | All roles |
| 7 | GET | `/api/dashboard/pass-statistics` | Pass management statistics | Admin, Manager, Reception |
| 8 | GET | `/api/dashboard/alerts` | System alerts and warnings | Admin, Manager |
| 9 | GET | `/api/dashboard/performance` | System performance metrics | Admin only |
| 10 | GET | `/api/dashboard/top-statistics` | Top performers and rankings | Admin, Manager |

---

## 📋 **API Details**

### **1. User Statistics API**
**Endpoint:** `GET /api/user-management/statistics`

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 156,
      "activeUsers": 142,
      "inactiveUsers": 14,
      "recentRegistrations": 12,
      "recentActiveLogins": 45
    },
    "roleDistribution": [
      { "role": "admin", "count": 5 },
      { "role": "staff", "count": 120 },
      { "role": "assistant", "count": 31 }
    ],
    "recentUsers": [...],
    "mostActiveUsers": [...]
  }
}
```

---

### **2. Get All Users API**
**Endpoint:** `GET /api/user-management/users`

**Query Parameters:**
- `limit` (optional): Number of users to return
- `page` (optional): Page number for pagination
- `role` (optional): Filter by role (admin, staff, assistant)
- `is_active` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 156,
    "page": 1,
    "limit": 50
  }
}
```

---

### **3. Create Admin User API**
**Endpoint:** `POST /api/admin/users`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "admin",
  "is_active": true
}
```

**Response:**
```json
{
  "message": "User created successfully"
}
```

---

### **4. Update User Status API**
**Endpoint:** `PATCH /api/admin/users/[id]/status`

**Request Body:**
```json
{
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "User status updated successfully"
}
```

---

### **5. Reset User Password API**
**Endpoint:** `POST /api/admin/users/[id]/reset-password`

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

---

### **6. Send Email API**
**Endpoint:** `POST /api/admin/send-email`

**Request Body:**
```json
{
  "to": "user@example.com",
  "name": "User Name",
  "action": "manual_notification",
  "changes": ["Field 1", "Field 2"]
}
```

**Available Actions:**
- `welcome` - Welcome email
- `profile_updated` - Profile update notification
- `status_changed` - Account status change
- `password_reset` - Password reset
- `manual_notification` - Custom notification

---

### **7. Send Meeting Invitations API**
**Endpoint:** `POST /api/admin/send-meeting-invitations`

**Request Body:**
```json
{
  "booking": {
    "title": "Team Meeting",
    "date": "2025-01-15",
    "startTime": "10:00",
    "endTime": "11:00",
    "place": "Conference Room A",
    "description": "Weekly team sync",
    "responsiblePerson": "John Doe",
    "refId": "ABC123"
  },
  "recipients": ["user1@example.com", "user2@example.com"]
}
```

**Response:**
```json
{
  "message": "Meeting invitations sent successfully",
  "data": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "failedEmails": []
  }
}
```

---

### **8. Booking Email APIs**

#### **Send Booking Details**
**Endpoint:** `POST /api/booking-email/[bookingId]/send-details`

**Request Body:**
```json
{
  "participantIds": ["internal-xxx", "external-yyy"],
  "emailType": "booking_details",
  "customMessage": "Optional custom message"
}
```

#### **Send Booking Reminder**
**Endpoint:** `POST /api/booking-email/[bookingId]/send-reminder`

**Request Body:**
```json
{
  "reminderType": "24_hours",
  "customMessage": "Optional reminder message"
}
```

#### **Get Booking Participants**
**Endpoint:** `GET /api/booking-email/[bookingId]/participants`

**Response:**
```json
{
  "success": true,
  "data": {
    "participants": [...]
  }
}
```

#### **Get Email History**
**Endpoint:** `GET /api/booking-email/[bookingId]/history`

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [...]
  }
}
```

---

## 📋 **Dashboard API Details**

### **1. Dashboard Statistics**
**Endpoint:** `GET /api/dashboard/statistics`

**Access:** Admin, Manager

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 156,
      "activeUsers": 142,
      "totalPlaces": 12,
      "activePlaces": 10,
      "todaysBookings": 24,
      "ongoingBookings": 8,
      "upcomingBookings": 16,
      "todaysVisitors": 45,
      "checkedInVisitors": 28,
      "expectedVisitors": 17
    },
    "trends": {
      "usersGrowth": "+12%",
      "bookingsGrowth": "+8%",
      "visitorsGrowth": "+25%",
      "placesUtilization": "83%"
    }
  }
}
```

---

### **2. Recent Activity**
**Endpoint:** `GET /api/dashboard/recent-activity`

**Access:** Admin, Manager

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "act_123",
        "type": "booking_created",
        "title": "New booking created",
        "description": "Conference Room A - 2:00 PM",
        "user": "John Doe",
        "timestamp": "2025-10-09T14:25:00.000Z",
        "relativeTime": "5 min ago",
        "urgent": false,
        "metadata": {
          "booking_id": "123",
          "place_name": "Conference Room A"
        }
      }
    ],
    "total": 20,
    "hasMore": true
  }
}
```

**⚠️ Note:** This endpoint uses UNION queries. All string columns have been fixed with `COLLATE utf8mb4_unicode_ci` to prevent collation errors.

---

### **3. Today's Schedule**
**Endpoint:** `GET /api/dashboard/todays-schedule`

**Access:** All roles

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "id": "booking_123",
        "title": "Team Meeting",
        "place_name": "Conference Room A",
        "start_time": "10:00:00",
        "end_time": "11:00:00",
        "status": "upcoming",
        "participants_count": 5,
        "external_visitors_count": 2,
        "has_refreshments": true
      }
    ],
    "total": 24
  }
}
```

---

### **4. Bookings Analytics**
**Endpoint:** `GET /api/dashboard/bookings-analytics`

**Access:** Admin, Manager

**Query Parameters:**
- `period` (optional): `'today'` | `'week'` | `'month'` | `'year'` (default: `'week'`)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBookings": 156,
    "byStatus": {
      "pending": 12,
      "confirmed": 45,
      "upcoming": 67,
      "completed": 28,
      "cancelled": 4
    },
    "byTimeSlot": {...},
    "trends": {...}
  }
}
```

---

### **5. Visitors Analytics**
**Endpoint:** `GET /api/dashboard/visitors-analytics`

**Access:** Admin, Manager

**Query Parameters:**
- `period` (optional): `'week'` | `'month'` | `'year'` (default: `'month'`)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVisitors": 450,
    "uniqueVisitors": 320,
    "byCompany": [...],
    "byReferenceType": [...],
    "frequentVisitors": [...],
    "dailyTrend": [...]
  }
}
```

**⚠️ Note:** Fixed SQL queries to use `external_participants` table correctly (removed invalid `member_id` references).

---

### **6. Places Utilization**
**Endpoint:** `GET /api/dashboard/places-utilization`

**Access:** All roles

**Query Parameters:**
- `date` (optional): Date to check (default: today) - Format: `YYYY-MM-DD`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPlaces": 12,
    "activePlaces": 10,
    "utilization": {
      "byPlace": [...],
      "peakHours": [...],
      "averageUtilization": "75%"
    }
  }
}
```

---

### **7. Pass Statistics**
**Endpoint:** `GET /api/dashboard/pass-statistics`

**Access:** Admin, Manager, Reception

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPasses": 50,
      "assigned": 28,
      "available": 22,
      "overdue": 3
    },
    "byType": [...],
    "recentAssignments": [...]
  }
}
```

---

### **8. System Alerts**
**Endpoint:** `GET /api/dashboard/alerts`

**Access:** Admin, Manager

**Query Parameters:**
- `severity` (optional): `'all'` | `'high'` | `'medium'` | `'low'` (default: `'all'`)

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_capacity_123",
        "type": "capacity_exceeded",
        "severity": "high",
        "title": "Room Capacity Exceeded",
        "message": "Conference Room A has 15 people (capacity: 10)",
        "timestamp": "2025-10-09T14:25:00.000Z",
        "resolved": false
      }
    ],
    "summary": {
      "total": 5,
      "high": 2,
      "medium": 2,
      "low": 1,
      "unresolved": 5
    }
  }
}
```

**⚠️ Note:** Fixed collation errors in JOIN conditions using `BINARY` comparisons for UUID columns.

---

### **9. System Performance**
**Endpoint:** `GET /api/dashboard/performance`

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "database": {
      "totalTables": 25,
      "totalRecords": 15420
    },
    "apiUsage": {
      "totalRequests": 1250,
      "averageResponseTime": "45ms",
      "recentRequests": [...]
    },
    "systemHealth": {
      "status": "healthy",
      "uptime": "7 days"
    }
  }
}
```

---

### **10. Top Statistics**
**Endpoint:** `GET /api/dashboard/top-statistics`

**Access:** Admin, Manager

**Query Parameters:**
- `limit` (optional): Number of items to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "topPlaces": [...],
    "topVisitorCompanies": [...],
    "mostActiveHours": [...]
  }
}
```

---

## 🔧 **Recent Bug Fixes (2025-01-15)**

### **SQL Collation Errors - FIXED ✅**

**Issues Fixed:**
1. **Collation Mismatch in JOINs:** Fixed `Illegal mix of collations` errors by using `BINARY` comparisons for UUID/CHAR columns in JOIN conditions
2. **UNION Collation Errors:** Fixed `Illegal mix of collations for operation 'UNION'` by adding `COLLATE utf8mb4_unicode_ci` to all string columns in UNION queries
3. **Invalid Column References:** Fixed queries using non-existent `ep.member_id` column - changed to use `ep.id` from `external_participants` table

**Affected Endpoints:**
- `GET /api/dashboard/recent-activity` - Fixed UNION collation issues
- `GET /api/dashboard/alerts` - Fixed JOIN collation issues
- `GET /api/dashboard/visitors-analytics` - Fixed invalid column references

**Technical Details:**
- All UUID/CHAR(36) JOINs now use: `ON BINARY column1 = BINARY column2`
- All UNION string columns now use: `COLLATE utf8mb4_unicode_ci`
- All `external_participants` queries now correctly use `ep.id` instead of `ep.member_id`

---

## 🔒 **Authentication**

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

Admin-only endpoints require user role to be `admin`.

---

## 📝 **Notes**

- All timestamps are in ISO 8601 format
- All dates are in YYYY-MM-DD format
- All times are in HH:MM:SS format (24-hour)
- Error responses follow format: `{ "error": "Error message" }`
- Success responses follow format: `{ "success": true, "data": {...} }`

---

## 🚀 **Quick Reference**

### **Most Used APIs:**
1. `GET /api/dashboard/statistics` - Dashboard overview statistics
2. `GET /api/dashboard/recent-activity` - Recent system activities
3. `GET /api/dashboard/todays-schedule` - Today's bookings
4. `GET /api/dashboard/alerts` - System alerts
5. `GET /api/user-management/users` - User list
6. `POST /api/admin/users` - Create user
7. `PATCH /api/admin/users/[id]/status` - Update user status
8. `POST /api/admin/send-meeting-invitations` - Send invitations
9. `POST /api/booking-email/send-from-frontend` - Send booking emails
10. `GET /api/dashboard/visitors-analytics` - Visitor statistics

### **Frontend Usage Example:**
```javascript
// Get dashboard statistics
const response = await fetch('http://localhost:3000/api/dashboard/statistics', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

// Get recent activity
const activityResponse = await fetch('http://localhost:3000/api/dashboard/recent-activity?limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const activityData = await activityResponse.json();
```

---

## ⚠️ **Important Notes**

1. **Collation Issues:** All collation-related bugs have been fixed. If you encounter any collation errors, ensure you're using the latest backend code.

2. **Table Relationships:** 
   - `external_participants` table does NOT have a `member_id` column
   - Use `external_participants.id` for counting distinct participants
   - `external_members` is a separate table with its own structure

3. **UUID Comparisons:** All UUID/CHAR(36) column comparisons use `BINARY` to avoid collation issues

4. **UNION Queries:** All string columns in UNION operations use `COLLATE utf8mb4_unicode_ci` for consistency

---

**Last Updated:** 2025-01-15

**Version:** 1.1.0 (Includes collation bug fixes)
