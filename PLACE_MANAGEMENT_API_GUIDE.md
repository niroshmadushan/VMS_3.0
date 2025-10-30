# 🏢 PLACE MANAGEMENT SYSTEM - API GUIDE

## 📋 **Complete Place Management System Documentation**

This guide provides comprehensive API documentation for the place management system with deactivation functionality, visitor tracking, and audit trails.

---

## 🎯 **Core Features**

✅ **Place Management** - Create, update, deactivate places  
✅ **Deactivation Tracking** - Reasons, timelines, contact info  
✅ **Visitor Management** - Registration, blacklisting, history  
✅ **Visit Tracking** - Scheduling, check-in/out, status updates  
✅ **Access Logging** - Security logs, badge scanning  
✅ **Statistics & Reporting** - Daily stats, analytics  
✅ **Notifications** - Place alerts, updates, emergencies  

---

## 🗄️ **Database Schema Overview**

### **Main Tables:**
- `places` - Physical locations and their details
- `place_deactivation_reasons` - Deactivation tracking with reasons
- `visitors` - Visitor information and blacklist status
- `visits` - Individual visit records
- `visit_cancellations` - Cancellation details and reasons
- `place_access_logs` - Security and access logging
- `place_notifications` - System notifications
- `place_statistics` - Daily analytics and metrics

---

## 🔧 **API Endpoints**

### **1. PLACE MANAGEMENT**

#### **Create Place**
```http
POST /api/places
Content-Type: application/json

{
  "name": "Main Office Building",
  "description": "Primary corporate headquarters",
  "address": "123 Business Ave",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "place_type": "office",
  "capacity": 500,
  "area_sqft": 50000.00,
  "phone": "+1-555-0101",
  "email": "main@company.com",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### **Get All Places**
```http
GET /api/places?active=true&type=office&city=New York
```

#### **Get Place by ID**
```http
GET /api/places/{place_id}
```

#### **Update Place**
```http
PUT /api/places/{place_id}
Content-Type: application/json

{
  "name": "Updated Office Building",
  "capacity": 600,
  "description": "Updated description"
}
```

#### **Get Place Status with Deactivation Info**
```http
GET /api/places/{place_id}/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "place_id": "uuid",
    "place_name": "Main Office Building",
    "is_active": false,
    "deactivation_reason": "Maintenance required",
    "deactivated_at": "2024-01-15T10:30:00Z",
    "deactivated_by": "uuid",
    "reason_type": "maintenance",
    "reason_description": "HVAC system maintenance",
    "estimated_reactivation_date": "2024-01-20",
    "contact_person": "John Smith",
    "contact_phone": "+1-555-0123",
    "contact_email": "john@company.com"
  }
}
```

---

### **2. PLACE DEACTIVATION**

#### **Deactivate Place with Reason**
```http
POST /api/places/{place_id}/deactivate
Content-Type: application/json

{
  "reason_type": "maintenance",
  "reason_description": "HVAC system maintenance required",
  "estimated_reactivation_date": "2024-01-20",
  "contact_person": "John Smith",
  "contact_phone": "+1-555-0123",
  "contact_email": "john@company.com"
}
```

**Available Reason Types:**
- `maintenance` - Regular maintenance
- `renovation` - Building renovation
- `safety_concern` - Safety issues
- `legal_issue` - Legal problems
- `financial` - Financial constraints
- `operational` - Operational issues
- `emergency` - Emergency situations
- `scheduled_closure` - Planned closure
- `equipment_failure` - Equipment breakdown
- `staff_shortage` - Insufficient staff
- `other` - Other reasons

#### **Reactivate Place**
```http
POST /api/places/{place_id}/reactivate
Content-Type: application/json

{
  "resolution_notes": "HVAC maintenance completed successfully"
}
```

#### **Get Deactivation History**
```http
GET /api/places/{place_id}/deactivation-history
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reason_type": "maintenance",
      "reason_description": "HVAC system maintenance",
      "deactivated_at": "2024-01-15T10:30:00Z",
      "deactivated_by": "uuid",
      "estimated_reactivation_date": "2024-01-20",
      "contact_person": "John Smith",
      "contact_phone": "+1-555-0123",
      "contact_email": "john@company.com",
      "is_resolved": true,
      "resolved_at": "2024-01-18T14:00:00Z",
      "resolved_by": "uuid",
      "resolution_notes": "Maintenance completed successfully"
    }
  ]
}
```

---

### **3. VISITOR MANAGEMENT**

#### **Register Visitor**
```http
POST /api/visitors
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "company": "ABC Corp",
  "designation": "Manager",
  "id_type": "driver_license",
  "id_number": "DL123456789",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+1-555-0124",
  "emergency_contact_relation": "Spouse"
}
```

#### **Get Visitor by ID**
```http
GET /api/visitors/{visitor_id}
```

#### **Search Visitors**
```http
GET /api/visitors/search?q=john&company=ABC&blacklisted=false
```

#### **Blacklist Visitor**
```http
POST /api/visitors/{visitor_id}/blacklist
Content-Type: application/json

{
  "blacklist_reason": "Security violation"
}
```

#### **Remove from Blacklist**
```http
POST /api/visitors/{visitor_id}/unblacklist
Content-Type: application/json

{
  "resolution_notes": "Issue resolved"
}
```

---

### **4. VISIT MANAGEMENT**

#### **Schedule Visit**
```http
POST /api/visits
Content-Type: application/json

{
  "visitor_id": "uuid",
  "place_id": "uuid",
  "visit_purpose": "Business meeting",
  "host_employee_id": "uuid",
  "host_name": "Jane Smith",
  "host_department": "Sales",
  "host_phone": "+1-555-0125",
  "host_email": "jane@company.com",
  "scheduled_start_time": "2024-01-20T10:00:00Z",
  "scheduled_end_time": "2024-01-20T12:00:00Z",
  "access_level": "standard",
  "special_requirements": "Wheelchair accessible",
  "vehicle_plate": "ABC123",
  "vehicle_model": "Toyota Camry"
}
```

#### **Get Visit by ID**
```http
GET /api/visits/{visit_id}
```

#### **Get Visits by Place**
```http
GET /api/places/{place_id}/visits?date=2024-01-20&status=scheduled
```

#### **Check In Visitor**
```http
POST /api/visits/{visit_id}/checkin
Content-Type: application/json

{
  "badge_number": "V001",
  "temperature_check": 36.5,
  "health_screening_passed": true,
  "notes": "Visitor arrived on time"
}
```

#### **Check Out Visitor**
```http
POST /api/visits/{visit_id}/checkout
Content-Type: application/json

{
  "notes": "Visit completed successfully"
}
```

#### **Cancel Visit**
```http
POST /api/visits/{visit_id}/cancel
Content-Type: application/json

{
  "cancellation_reason": "visitor_cancelled",
  "cancellation_description": "Emergency came up",
  "can_be_rescheduled": true
}
```

---

### **5. ACCESS LOGGING**

#### **Log Access Event**
```http
POST /api/access-logs
Content-Type: application/json

{
  "visit_id": "uuid",
  "place_id": "uuid",
  "visitor_id": "uuid",
  "access_type": "entry",
  "access_point": "main_entrance",
  "badge_scanned": true,
  "security_verified": true,
  "security_officer_id": "uuid",
  "temperature_check": 36.5,
  "health_screening_passed": true,
  "notes": "Visitor checked in successfully"
}
```

#### **Get Access Logs**
```http
GET /api/access-logs?place_id=uuid&date=2024-01-20&access_type=entry
```

---

### **6. NOTIFICATIONS**

#### **Create Place Notification**
```http
POST /api/notifications
Content-Type: application/json

{
  "place_id": "uuid",
  "notification_type": "place_closure",
  "title": "Office Closed for Maintenance",
  "message": "The main office will be closed tomorrow for scheduled maintenance.",
  "priority": "high",
  "target_audience": "all",
  "scheduled_at": "2024-01-20T09:00:00Z",
  "expires_at": "2024-01-21T09:00:00Z"
}
```

#### **Get Notifications**
```http
GET /api/notifications?place_id=uuid&type=place_closure&priority=high
```

---

### **7. STATISTICS & REPORTING**

#### **Get Place Statistics**
```http
GET /api/places/{place_id}/statistics?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "place_id": "uuid",
    "place_name": "Main Office Building",
    "total_visitors": 150,
    "unique_visitors": 120,
    "completed_visits": 140,
    "cancelled_visits": 8,
    "no_show_visits": 2,
    "avg_visit_duration_minutes": 45,
    "peak_hour": 14,
    "max_capacity_used": 85,
    "avg_capacity_used": 60
  }
}
```

#### **Get Daily Statistics**
```http
GET /api/statistics/daily?date=2024-01-20
```

#### **Get Monthly Report**
```http
GET /api/reports/monthly?month=2024-01
```

---

## 🔍 **Common Queries & Views**

### **Active Places**
```sql
SELECT * FROM active_places;
```

### **Deactivated Places with Reasons**
```sql
SELECT * FROM deactivated_places;
```

### **Today's Visits**
```sql
SELECT * FROM todays_visits;
```

### **Place Statistics Summary**
```sql
SELECT * FROM place_statistics_summary;
```

---

## 🚨 **Error Handling**

### **Common Error Responses**

#### **Place Not Found**
```json
{
  "success": false,
  "error": "PLACE_NOT_FOUND",
  "message": "Place with ID 'uuid' not found"
}
```

#### **Place Already Deactivated**
```json
{
  "success": false,
  "error": "PLACE_ALREADY_DEACTIVATED",
  "message": "Place is already deactivated"
}
```

#### **Invalid Deactivation Reason**
```json
{
  "success": false,
  "error": "INVALID_REASON_TYPE",
  "message": "Invalid reason type. Must be one of: maintenance, renovation, safety_concern, etc."
}
```

#### **Visitor Blacklisted**
```json
{
  "success": false,
  "error": "VISITOR_BLACKLISTED",
  "message": "Visitor is blacklisted and cannot schedule visits"
}
```

---

## 📊 **Sample Data**

### **Sample Place Deactivation**
```json
{
  "place_id": "uuid",
  "reason_type": "maintenance",
  "reason_description": "HVAC system maintenance required",
  "estimated_reactivation_date": "2024-01-20",
  "contact_person": "John Smith",
  "contact_phone": "+1-555-0123",
  "contact_email": "john@company.com"
}
```

### **Sample Visit Cancellation**
```json
{
  "visit_id": "uuid",
  "cancellation_reason": "place_unavailable",
  "cancellation_description": "Place deactivated for maintenance",
  "can_be_rescheduled": true
}
```

---

## 🔐 **Security Considerations**

1. **Authentication Required** - All endpoints require valid JWT token
2. **Role-Based Access** - Different permissions for admin, security, reception
3. **Audit Logging** - All actions are logged with timestamps and user IDs
4. **Data Validation** - Input validation on all endpoints
5. **Rate Limiting** - API rate limiting to prevent abuse

---

## 🎯 **Summary**

This place management system provides:

✅ **Complete place lifecycle management**  
✅ **Detailed deactivation tracking with reasons**  
✅ **Comprehensive visitor management**  
✅ **Full visit tracking and logging**  
✅ **Security and access control**  
✅ **Statistics and reporting**  
✅ **Notification system**  
✅ **Audit trails and compliance**  

**Your place management system is now fully documented and ready for implementation!** 🚀
