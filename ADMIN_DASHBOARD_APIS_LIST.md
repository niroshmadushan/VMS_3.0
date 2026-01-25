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
1. `GET /api/user-management/statistics` - Dashboard statistics
2. `GET /api/user-management/users` - User list
3. `POST /api/admin/users` - Create user
4. `PATCH /api/admin/users/[id]/status` - Update user status
5. `POST /api/admin/send-meeting-invitations` - Send invitations
6. `POST /api/booking-email/send-from-frontend` - Send booking emails

---

**Last Updated:** 2025-01-15
