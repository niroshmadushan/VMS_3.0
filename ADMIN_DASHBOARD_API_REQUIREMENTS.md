# 📊 Admin Dashboard API Requirements & Implementation Guide

## 🎯 Overview

Complete API specification for building a real-time admin dashboard with comprehensive analytics, statistics, and insights for the SMART Visitor Management System.

---

## 📋 Required APIs for Dashboard

### **1. Dashboard Statistics API**
**Endpoint:** `GET /api/dashboard/statistics`

**Purpose:** Get all key metrics and statistics for the dashboard overview

**Authentication:** JWT Token (authToken)

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/statistics

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

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
    },
    "timeframe": {
      "startDate": "2025-10-09",
      "endDate": "2025-10-09",
      "comparisonPeriod": "last_week"
    }
  }
}
```

---

### **2. Recent Activity API**
**Endpoint:** `GET /api/dashboard/recent-activity`

**Purpose:** Get recent system activities (bookings, check-ins, user registrations, alerts)

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/recent-activity?limit=20

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "act_001",
        "type": "booking_created",
        "title": "New booking created",
        "description": "Conference Room A - 2:00 PM",
        "user": "John Doe",
        "timestamp": "2025-10-09T14:25:00.000Z",
        "relativeTime": "5 min ago",
        "urgent": false,
        "metadata": {
          "booking_id": "book_123",
          "place_name": "Conference Room A",
          "start_time": "14:00:00"
        }
      },
      {
        "id": "act_002",
        "type": "visitor_checkin",
        "title": "Visitor checked in",
        "description": "John Smith - Meeting Room B",
        "user": "Reception",
        "timestamp": "2025-10-09T14:18:00.000Z",
        "relativeTime": "12 min ago",
        "urgent": false,
        "metadata": {
          "visitor_name": "John Smith",
          "place_name": "Meeting Room B",
          "booking_id": "book_124"
        }
      },
      {
        "id": "act_003",
        "type": "user_registered",
        "title": "New user registered",
        "description": "Sarah Johnson - Employee",
        "user": "Admin",
        "timestamp": "2025-10-09T13:30:00.000Z",
        "relativeTime": "1 hour ago",
        "urgent": false,
        "metadata": {
          "user_id": "user_456",
          "role": "employee"
        }
      },
      {
        "id": "act_004",
        "type": "capacity_alert",
        "title": "Room capacity exceeded",
        "description": "Conference Room C - 15/12 people",
        "user": "System",
        "timestamp": "2025-10-09T12:30:00.000Z",
        "relativeTime": "2 hours ago",
        "urgent": true,
        "metadata": {
          "place_id": "place_789",
          "capacity": 12,
          "current_count": 15
        }
      }
    ],
    "total": 156,
    "hasMore": true
  }
}
```

---

### **3. Today's Schedule API**
**Endpoint:** `GET /api/dashboard/todays-schedule`

**Purpose:** Get all bookings scheduled for today with status

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/todays-schedule

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "id": "book_001",
        "title": "Board Meeting",
        "place_name": "Conference Room A",
        "place_id": "place_001",
        "start_time": "09:00:00",
        "end_time": "11:00:00",
        "status": "completed",
        "responsible_person": "John Doe",
        "participants_count": 8,
        "external_visitors_count": 3,
        "has_refreshments": true,
        "color": "blue"
      },
      {
        "id": "book_002",
        "title": "Team Standup",
        "place_name": "Meeting Room B",
        "place_id": "place_002",
        "start_time": "14:00:00",
        "end_time": "15:00:00",
        "status": "ongoing",
        "responsible_person": "Jane Smith",
        "participants_count": 5,
        "external_visitors_count": 0,
        "has_refreshments": false,
        "color": "green"
      },
      {
        "id": "book_003",
        "title": "Client Presentation",
        "place_name": "Conference Room C",
        "place_id": "place_003",
        "start_time": "16:00:00",
        "end_time": "17:30:00",
        "status": "upcoming",
        "responsible_person": "Mike Johnson",
        "participants_count": 12,
        "external_visitors_count": 5,
        "has_refreshments": true,
        "color": "purple"
      }
    ],
    "summary": {
      "total": 12,
      "completed": 4,
      "ongoing": 2,
      "upcoming": 6,
      "cancelled": 0
    }
  }
}
```

---

### **4. Bookings Analytics API**
**Endpoint:** `GET /api/dashboard/bookings-analytics`

**Purpose:** Get detailed booking analytics and trends

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/bookings-analytics?period=week

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}

Query Parameters:
- period: 'today' | 'week' | 'month' | 'year'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBookings": 156,
      "completedBookings": 98,
      "cancelledBookings": 12,
      "upcomingBookings": 46,
      "averageBookingsPerDay": 22.3,
      "peakBookingDay": "Wednesday",
      "peakBookingHour": "14:00"
    },
    "byStatus": {
      "completed": 98,
      "ongoing": 8,
      "upcoming": 46,
      "cancelled": 12
    },
    "byPlace": [
      {
        "place_id": "place_001",
        "place_name": "Conference Room A",
        "booking_count": 45,
        "utilization_rate": 85.5,
        "most_booked_time": "14:00-16:00"
      },
      {
        "place_id": "place_002",
        "place_name": "Meeting Room B",
        "booking_count": 38,
        "utilization_rate": 72.3,
        "most_booked_time": "10:00-12:00"
      }
    ],
    "byTimeSlot": [
      { "hour": "08:00", "count": 8 },
      { "hour": "09:00", "count": 15 },
      { "hour": "10:00", "count": 22 },
      { "hour": "11:00", "count": 18 },
      { "hour": "12:00", "count": 12 },
      { "hour": "13:00", "count": 10 },
      { "hour": "14:00", "count": 28 },
      { "hour": "15:00", "count": 25 },
      { "hour": "16:00", "count": 18 }
    ],
    "dailyTrend": [
      { "date": "2025-10-03", "count": 18 },
      { "date": "2025-10-04", "count": 22 },
      { "date": "2025-10-05", "count": 15 },
      { "date": "2025-10-06", "count": 20 },
      { "date": "2025-10-07", "count": 25 },
      { "date": "2025-10-08", "count": 28 },
      { "date": "2025-10-09", "count": 24 }
    ]
  }
}
```

---

### **5. Visitors Analytics API**
**Endpoint:** `GET /api/dashboard/visitors-analytics`

**Purpose:** Get visitor statistics and trends

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/visitors-analytics?period=month

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalVisitors": 342,
      "uniqueVisitors": 256,
      "repeatVisitors": 86,
      "averageVisitsPerDay": 11.4,
      "topVisitor": {
        "name": "John Smith",
        "company": "ABC Corp",
        "visit_count": 15
      }
    },
    "byCompany": [
      {
        "company_name": "ABC Corp",
        "visitor_count": 45,
        "visit_count": 78,
        "percentage": 22.8
      },
      {
        "company_name": "XYZ Ltd",
        "visitor_count": 32,
        "visit_count": 56,
        "percentage": 16.4
      }
    ],
    "byReferenceType": [
      { "type": "NIC", "count": 156 },
      { "type": "Passport", "count": 98 },
      { "type": "Driving License", "count": 88 }
    ],
    "frequentVisitors": [
      {
        "member_id": "mem_001",
        "full_name": "John Smith",
        "company": "ABC Corp",
        "visit_count": 15,
        "last_visit": "2025-10-09"
      },
      {
        "member_id": "mem_002",
        "full_name": "Jane Doe",
        "company": "XYZ Ltd",
        "visit_count": 12,
        "last_visit": "2025-10-08"
      }
    ],
    "dailyTrend": [
      { "date": "2025-10-03", "count": 8 },
      { "date": "2025-10-04", "count": 12 },
      { "date": "2025-10-05", "count": 10 },
      { "date": "2025-10-06", "count": 15 },
      { "date": "2025-10-07", "count": 18 },
      { "date": "2025-10-08", "count": 22 },
      { "date": "2025-10-09", "count": 16 }
    ]
  }
}
```

---

### **6. Places Utilization API**
**Endpoint:** `GET /api/dashboard/places-utilization`

**Purpose:** Get place usage statistics and availability

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/places-utilization?date=2025-10-09

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPlaces": 12,
      "activePlaces": 10,
      "currentlyOccupied": 5,
      "averageUtilization": 76.5,
      "mostBookedPlace": "Conference Room A",
      "leastBookedPlace": "Meeting Room F"
    },
    "places": [
      {
        "place_id": "place_001",
        "place_name": "Conference Room A",
        "capacity": 20,
        "todaysBookings": 6,
        "totalHoursBooked": 12,
        "utilizationRate": 85.7,
        "currentStatus": "occupied",
        "nextAvailable": "16:00:00",
        "popularTimeSlots": ["09:00-11:00", "14:00-16:00"]
      },
      {
        "place_id": "place_002",
        "place_name": "Meeting Room B",
        "capacity": 10,
        "todaysBookings": 4,
        "totalHoursBooked": 8,
        "utilizationRate": 66.7,
        "currentStatus": "available",
        "nextBooking": "16:30:00",
        "popularTimeSlots": ["10:00-12:00"]
      }
    ],
    "utilizationByHour": [
      { "hour": "08:00", "occupied_places": 2, "percentage": 20 },
      { "hour": "09:00", "occupied_places": 6, "percentage": 60 },
      { "hour": "10:00", "occupied_places": 8, "percentage": 80 },
      { "hour": "11:00", "occupied_places": 7, "percentage": 70 },
      { "hour": "14:00", "occupied_places": 9, "percentage": 90 },
      { "hour": "15:00", "occupied_places": 8, "percentage": 80 },
      { "hour": "16:00", "occupied_places": 5, "percentage": 50 }
    ]
  }
}
```

---

### **7. Pass Management Statistics API**
**Endpoint:** `GET /api/dashboard/pass-statistics`

**Purpose:** Get visitor pass usage and availability

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/pass-statistics

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPasses": 50,
      "assignedPasses": 18,
      "availablePasses": 32,
      "overduePasses": 3,
      "todaysAssignments": 12,
      "todaysReturns": 8
    },
    "byType": [
      {
        "pass_type_id": "type_001",
        "pass_type_name": "Visitor Passes",
        "total": 20,
        "assigned": 8,
        "available": 12,
        "utilization": 40
      },
      {
        "pass_type_id": "type_002",
        "pass_type_name": "VIP Passes",
        "total": 5,
        "assigned": 3,
        "available": 2,
        "utilization": 60
      }
    ],
    "recentAssignments": [
      {
        "pass_number": "VP-001",
        "holder_name": "John Smith",
        "company": "ABC Corp",
        "assigned_time": "2025-10-09T09:30:00.000Z",
        "status": "assigned"
      }
    ]
  }
}
```

---

### **8. System Alerts API**
**Endpoint:** `GET /api/dashboard/alerts`

**Purpose:** Get system alerts and warnings

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/alerts?severity=all

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}

Query Parameters:
- severity: 'all' | 'high' | 'medium' | 'low'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_001",
        "type": "capacity_exceeded",
        "severity": "high",
        "title": "Room Capacity Exceeded",
        "message": "Conference Room C has 15 people (capacity: 12)",
        "timestamp": "2025-10-09T12:30:00.000Z",
        "resolved": false,
        "metadata": {
          "place_id": "place_003",
          "capacity": 12,
          "current": 15
        }
      },
      {
        "id": "alert_002",
        "type": "overdue_pass",
        "severity": "medium",
        "title": "Overdue Pass",
        "message": "Pass VP-005 not returned (assigned 2 days ago)",
        "timestamp": "2025-10-09T10:00:00.000Z",
        "resolved": false,
        "metadata": {
          "pass_id": "pass_005",
          "holder_name": "Jane Doe",
          "days_overdue": 2
        }
      },
      {
        "id": "alert_003",
        "type": "blacklisted_visitor",
        "severity": "high",
        "title": "Blacklisted Visitor Scheduled",
        "message": "Blacklisted visitor has a booking today at 15:00",
        "timestamp": "2025-10-09T08:00:00.000Z",
        "resolved": false,
        "metadata": {
          "member_id": "mem_456",
          "visitor_name": "Bob Wilson",
          "booking_id": "book_789"
        }
      }
    ],
    "summary": {
      "total": 8,
      "high": 2,
      "medium": 4,
      "low": 2,
      "unresolved": 6
    }
  }
}
```

---

### **9. Performance Metrics API**
**Endpoint:** `GET /api/dashboard/performance`

**Purpose:** Get system performance and health metrics

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/performance

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "system": {
      "serverLoad": 68,
      "databaseUsage": 45,
      "storageUsage": 32,
      "apiResponseTime": 125,
      "uptime": "99.8%",
      "lastRestart": "2025-10-01T00:00:00.000Z"
    },
    "database": {
      "totalRecords": {
        "users": 156,
        "bookings": 2456,
        "visitors": 1234,
        "places": 12,
        "passes": 50
      },
      "recentGrowth": {
        "users": "+12",
        "bookings": "+156",
        "visitors": "+89"
      }
    },
    "api": {
      "totalRequests": 15678,
      "successRate": 98.5,
      "averageResponseTime": 125,
      "slowestEndpoint": "/api/bookings",
      "mostUsedEndpoint": "/api/my-profile"
    }
  }
}
```

---

### **10. Top Statistics API**
**Endpoint:** `GET /api/dashboard/top-statistics`

**Purpose:** Get top performers and rankings

**Request:**
```javascript
GET http://localhost:3000/api/dashboard/top-statistics?limit=10

Headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topBookers": [
      {
        "user_id": "user_001",
        "full_name": "John Doe",
        "role": "admin",
        "booking_count": 45,
        "total_hours": 120
      }
    ],
    "topPlaces": [
      {
        "place_id": "place_001",
        "place_name": "Conference Room A",
        "booking_count": 156,
        "utilization_rate": 85.5
      }
    ],
    "topVisitorCompanies": [
      {
        "company_name": "ABC Corp",
        "visitor_count": 45,
        "visit_count": 78,
        "percentage": 22.8
      }
    ],
    "mostActiveHours": [
      { "hour": "14:00", "booking_count": 28 },
      { "hour": "15:00", "booking_count": 25 },
      { "hour": "10:00", "booking_count": 22 }
    ]
  }
}
```

---

## 📊 Database Queries Needed

### **1. Total Users Count**
```sql
SELECT COUNT(*) as total_users 
FROM users 
WHERE is_deleted = 0;
```

### **2. Active Users (Last 7 Days)**
```sql
SELECT COUNT(*) as active_users 
FROM users 
WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)
AND is_deleted = 0;
```

### **3. Today's Bookings**
```sql
SELECT COUNT(*) as todays_bookings 
FROM bookings 
WHERE DATE(booking_date) = CURDATE()
AND is_deleted = 0;
```

### **4. Ongoing Bookings**
```sql
SELECT COUNT(*) as ongoing_bookings 
FROM bookings 
WHERE DATE(booking_date) = CURDATE()
AND CURTIME() BETWEEN start_time AND end_time
AND status != 'cancelled'
AND is_deleted = 0;
```

### **5. Today's Visitors Count**
```sql
SELECT COUNT(DISTINCT ep.member_id) as todays_visitors
FROM external_participants ep
INNER JOIN bookings b ON ep.booking_id = b.id
WHERE DATE(b.booking_date) = CURDATE()
AND ep.is_deleted = 0
AND b.is_deleted = 0;
```

### **6. Checked-In Visitors**
```sql
SELECT COUNT(DISTINCT pa.holder_id) as checked_in_visitors
FROM pass_assignments pa
INNER JOIN bookings b ON pa.booking_id = b.id
WHERE DATE(b.booking_date) = CURDATE()
AND pa.action_type = 'assigned'
AND pa.actual_return_date IS NULL
AND pa.is_deleted = 0;
```

### **7. Places Utilization**
```sql
SELECT 
  p.id,
  p.name,
  COUNT(b.id) as booking_count,
  SUM(TIMESTAMPDIFF(HOUR, b.start_time, b.end_time)) as total_hours,
  (COUNT(b.id) * 100.0 / (SELECT COUNT(*) FROM bookings WHERE DATE(booking_date) = CURDATE())) as utilization_rate
FROM places p
LEFT JOIN bookings b ON p.id = b.place_id 
  AND DATE(b.booking_date) = CURDATE()
  AND b.is_deleted = 0
WHERE p.is_deleted = 0
GROUP BY p.id, p.name
ORDER BY booking_count DESC;
```

### **8. Recent Activity (Last 20)**
```sql
-- Bookings created
SELECT 
  'booking_created' as type,
  b.id,
  CONCAT('New booking: ', b.title) as title,
  CONCAT(p.name, ' - ', TIME_FORMAT(b.start_time, '%h:%i %p')) as description,
  u.full_name as user,
  b.created_at as timestamp
FROM bookings b
LEFT JOIN places p ON b.place_id = p.id
LEFT JOIN users u ON b.created_by = u.id
WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
AND b.is_deleted = 0

UNION ALL

-- Visitor check-ins
SELECT 
  'visitor_checkin' as type,
  pa.id,
  'Visitor checked in' as title,
  CONCAT(em.full_name, ' - ', p.name) as description,
  'Reception' as user,
  pa.assigned_date as timestamp
FROM pass_assignments pa
INNER JOIN external_members em ON pa.holder_id = em.id
INNER JOIN bookings b ON pa.booking_id = b.id
INNER JOIN places p ON b.place_id = p.id
WHERE pa.assigned_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
AND pa.action_type = 'assigned'

ORDER BY timestamp DESC
LIMIT 20;
```

### **9. Bookings by Time Slot**
```sql
SELECT 
  DATE_FORMAT(start_time, '%H:00') as hour,
  COUNT(*) as count
FROM bookings
WHERE DATE(booking_date) = CURDATE()
AND is_deleted = 0
GROUP BY hour
ORDER BY hour;
```

### **10. Top Visitor Companies**
```sql
SELECT 
  em.company_name,
  COUNT(DISTINCT em.id) as visitor_count,
  COUNT(ep.id) as visit_count,
  (COUNT(ep.id) * 100.0 / (SELECT COUNT(*) FROM external_participants WHERE is_deleted = 0)) as percentage
FROM external_members em
INNER JOIN external_participants ep ON em.id = ep.member_id
WHERE em.is_deleted = 0
AND ep.is_deleted = 0
AND em.company_name IS NOT NULL
GROUP BY em.company_name
ORDER BY visit_count DESC
LIMIT 10;
```

---

## 🎨 Dashboard Components Needed

### **1. Statistics Cards (Top Row)**
- Total Users (with growth %)
- Active Places (with utilization %)
- Today's Bookings (with trend)
- Visitors Today (with comparison)

### **2. Charts & Graphs**
- **Bookings Trend Chart**: Line chart showing daily bookings over last 7/30 days
- **Time Slot Heatmap**: Bar chart showing booking distribution by hour
- **Place Utilization**: Horizontal bar chart showing utilization % per place
- **Visitor Companies**: Pie chart showing top visitor companies
- **Pass Status**: Donut chart showing assigned/available/overdue passes

### **3. Recent Activity Feed**
- Real-time activity list
- Color-coded by type (booking, check-in, alert)
- Relative timestamps ("5 min ago")
- Urgent items highlighted

### **4. Today's Schedule**
- Timeline view of today's bookings
- Status indicators (completed, ongoing, upcoming)
- Quick view of participants and visitors

### **5. System Alerts**
- High-priority alerts at top
- Capacity warnings
- Overdue passes
- Blacklisted visitors scheduled
- System performance issues

### **6. Quick Actions**
- Create New Booking
- Add User
- Add Place
- View All Visitors
- Manage Passes

### **7. Performance Metrics**
- Server load indicator
- Database usage
- Storage usage
- API response time

---

## 🔄 Real-Time Updates

### **Recommended Refresh Intervals:**

```javascript
// Statistics - Refresh every 60 seconds
setInterval(() => fetchStatistics(), 60000)

// Recent Activity - Refresh every 30 seconds
setInterval(() => fetchRecentActivity(), 30000)

// Today's Schedule - Refresh every 60 seconds
setInterval(() => fetchTodaysSchedule(), 60000)

// Alerts - Refresh every 30 seconds
setInterval(() => fetchAlerts(), 30000)

// Performance - Refresh every 120 seconds
setInterval(() => fetchPerformance(), 120000)
```

---

## 💻 Frontend Implementation Example

```typescript
// Dashboard Component
import { useState, useEffect } from 'react'

export function AdminDashboard() {
  const [statistics, setStatistics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [schedule, setSchedule] = useState([])
  const [alerts, setAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh
    const statsInterval = setInterval(() => loadStatistics(), 60000)
    const activityInterval = setInterval(() => loadRecentActivity(), 30000)
    
    return () => {
      clearInterval(statsInterval)
      clearInterval(activityInterval)
    }
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    await Promise.all([
      loadStatistics(),
      loadRecentActivity(),
      loadTodaysSchedule(),
      loadAlerts()
    ])
    setIsLoading(false)
  }

  const loadStatistics = async () => {
    const token = localStorage.getItem('authToken')
    const response = await fetch('http://localhost:3000/api/dashboard/statistics', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await response.json()
    if (result.success) {
      setStatistics(result.data)
    }
  }

  const loadRecentActivity = async () => {
    const token = localStorage.getItem('authToken')
    const response = await fetch('http://localhost:3000/api/dashboard/recent-activity?limit=20', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await response.json()
    if (result.success) {
      setRecentActivity(result.data.activities)
    }
  }

  const loadTodaysSchedule = async () => {
    const token = localStorage.getItem('authToken')
    const response = await fetch('http://localhost:3000/api/dashboard/todays-schedule', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await response.json()
    if (result.success) {
      setSchedule(result.data.schedule)
    }
  }

  const loadAlerts = async () => {
    const token = localStorage.getItem('authToken')
    const response = await fetch('http://localhost:3000/api/dashboard/alerts?severity=all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await response.json()
    if (result.success) {
      setAlerts(result.data.alerts)
    }
  }

  // Render dashboard...
}
```

---

## 📦 Complete API List for Dashboard

| # | Endpoint | Method | Purpose | Auth |
|---|----------|--------|---------|------|
| 1 | `/api/dashboard/statistics` | GET | Overview statistics | JWT |
| 2 | `/api/dashboard/recent-activity` | GET | Recent system activities | JWT |
| 3 | `/api/dashboard/todays-schedule` | GET | Today's bookings | JWT |
| 4 | `/api/dashboard/bookings-analytics` | GET | Booking trends & analytics | JWT |
| 5 | `/api/dashboard/visitors-analytics` | GET | Visitor statistics | JWT |
| 6 | `/api/dashboard/places-utilization` | GET | Place usage & availability | JWT |
| 7 | `/api/dashboard/pass-statistics` | GET | Pass management stats | JWT |
| 8 | `/api/dashboard/alerts` | GET | System alerts & warnings | JWT |
| 9 | `/api/dashboard/performance` | GET | System performance metrics | JWT |
| 10 | `/api/dashboard/top-statistics` | GET | Top performers & rankings | JWT |

---

## 🎯 Priority Implementation Order

### **Phase 1: Essential (Must Have)**
1. ✅ Dashboard Statistics API
2. ✅ Today's Schedule API
3. ✅ Recent Activity API

### **Phase 2: Important (Should Have)**
4. ✅ Bookings Analytics API
5. ✅ Visitors Analytics API
6. ✅ System Alerts API

### **Phase 3: Enhanced (Nice to Have)**
7. ✅ Places Utilization API
8. ✅ Pass Statistics API
9. ✅ Performance Metrics API
10. ✅ Top Statistics API

---

## 🚀 Quick Start for Backend Developer

### **Step 1: Create Dashboard Controller**
```javascript
// controllers/dashboardController.js

exports.getStatistics = async (req, res) => {
  // Query database for statistics
  // Return formatted response
}

exports.getRecentActivity = async (req, res) => {
  // Query recent activities
  // Return formatted response
}

// ... other controller methods
```

### **Step 2: Create Dashboard Routes**
```javascript
// routes/dashboard.js

router.get('/statistics', authenticateJWT, dashboardController.getStatistics)
router.get('/recent-activity', authenticateJWT, dashboardController.getRecentActivity)
router.get('/todays-schedule', authenticateJWT, dashboardController.getTodaysSchedule)
// ... other routes
```

### **Step 3: Register Routes**
```javascript
// app.js or server.js

app.use('/api/dashboard', dashboardRoutes)
```

---

## 📝 Testing Checklist

- [ ] All 10 APIs return correct data format
- [ ] Authentication works with JWT token
- [ ] Statistics calculations are accurate
- [ ] Trends and percentages are correct
- [ ] Real-time data updates work
- [ ] Performance metrics are realistic
- [ ] Alerts are properly prioritized
- [ ] All timestamps are in correct format
- [ ] Error handling returns proper status codes

---

## 🎉 Result

With these 10 APIs, you'll have a **complete, real-time admin dashboard** with:

✅ Live statistics and metrics  
✅ Real-time activity feed  
✅ Today's schedule overview  
✅ Comprehensive analytics  
✅ System alerts and warnings  
✅ Performance monitoring  
✅ Top performers and rankings  

**Ready for backend implementation!** 🚀📊
