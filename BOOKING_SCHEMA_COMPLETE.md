# ✅ BOOKING MANAGEMENT SYSTEM - SQL SCHEMA COMPLETE

## 🎯 **Complete Database Schema Created**

I've created a comprehensive MySQL database schema for your booking management system in `booking-management-schema.sql`.

---

## 📊 **Tables Created**

### **1. `bookings` (Main Table)**
Stores all meeting/session bookings

**Key Fields:**
- Basic: `title`, `description`
- Date/Time: `booking_date`, `start_time`, `end_time`
- Place: `place_id`, `place_name`
- Status: `pending`, `confirmed`, `cancelled`, `completed`, `in_progress`
- Responsible Person: `id`, `name`, `email`
- Participants: `total_participants`, `internal_participants`, `external_participants`
- Refreshments: `refreshments_required`, `refreshments_details` (JSON)
- Soft Delete: `is_deleted`, `deleted_at`, `deleted_by`
- Audit: `created_at`, `created_by`, `updated_at`, `updated_by`

---

### **2. `booking_participants` (Internal Employees)**
Tracks internal employee participants

**Key Fields:**
- `booking_id` (FK to bookings)
- `employee_id`, `employee_name`, `employee_email`
- `employee_department`, `employee_role`, `employee_phone`
- `participation_status`: `invited`, `confirmed`, `declined`, `attended`, `absent`
- `invited_at`, `responded_at`

---

### **3. `external_participants` (Visitors/Guests)**
Tracks external visitor participants

**Key Fields:**
- `booking_id` (FK to bookings)
- `full_name`, `email`, `phone`
- `reference_type`: `NIC`, `Passport`, `Employee ID`, etc.
- `reference_value` (ID number)
- `company_name`, `company_position`
- `participation_status`: `invited`, `confirmed`, `checked_in`, `checked_out`, `no_show`
- `checked_in_at`, `checked_out_at`
- `visitor_pass_id`

---

### **4. `booking_refreshments`**
Detailed refreshment information

**Key Fields:**
- `booking_id` (FK to bookings)
- `refreshment_type`: `beverages`, `snacks`, `meals`, `full_catering`, `custom`
- `items` (JSON array): `["Coffee", "Tea", "Cookies"]`
- `serving_time`, `estimated_count`
- `special_requests`
- `status`: `pending`, `confirmed`, `prepared`, `served`, `cancelled`

---

### **5. `booking_history` (Audit Log)**
Tracks all changes to bookings

**Key Fields:**
- `booking_id` (FK to bookings)
- `action`: `created`, `updated`, `cancelled`, `confirmed`, `completed`, `deleted`
- `changed_field`, `old_value`, `new_value`
- `change_description`
- `changed_by`, `changed_by_role`
- `changed_at`

---

## 📋 **Views Created**

### **1. `bookings_with_details`**
Complete booking information with place and configuration details

**Includes:**
- All booking fields
- Place information (name, city, type, capacity)
- Configuration (operating hours, booking settings)
- Calculated fields (time_range, duration, day_of_week)

---

### **2. `todays_bookings`**
All bookings for today

**Usage:**
```sql
SELECT * FROM todays_bookings;
```

---

### **3. `upcoming_bookings`**
Future bookings (not cancelled or completed)

**Usage:**
```sql
SELECT * FROM upcoming_bookings;
```

---

### **4. `active_bookings`**
Bookings currently in progress (happening right now)

**Usage:**
```sql
SELECT * FROM active_bookings;
```

---

## 🔧 **Stored Procedure**

### **`check_place_availability()`**
Validates if a place can be booked for a specific date/time

**Checks:**
1. ✅ Place is active
2. ✅ Bookings are allowed (from configuration)
3. ✅ Place is available on this day of week
4. ✅ Time is within operating hours
5. ✅ No time conflicts with existing bookings

**Usage:**
```sql
CALL check_place_availability(
    '7cd9142f-9dad-11f0-9b48-00ff3d223740',  -- place_id
    '2024-01-15',                             -- booking_date
    '09:00:00',                               -- start_time
    '10:00:00',                               -- end_time
    @available,                               -- OUT: is available?
    @message                                  -- OUT: message
);

SELECT @available, @message;
```

**Returns:**
- `@available`: `true` or `false`
- `@message`: Reason (e.g., "Place is available" or "Time conflicts with existing booking")

---

## 🔄 **Triggers**

### **1. Participant Count Triggers**
Automatically update participant counts when participants are added/removed

- `update_participant_count_insert` - When internal participant added
- `update_participant_count_delete` - When internal participant removed
- `update_external_participant_count_insert` - When external participant added
- `update_external_participant_count_delete` - When external participant removed

**Result:** `total_participants`, `internal_participants`, `external_participants` always accurate

---

### **2. Booking History Trigger**
Logs status changes automatically

- `booking_history_on_update` - When booking status changes

**Result:** Complete audit trail of all status changes

---

## 📊 **Dummy Data Included**

### **3 Sample Bookings:**

**Booking 1:**
- Title: "Weekly Team Meeting"
- Date: Tomorrow
- Time: 09:00 - 10:00
- Place: Main Office (your specified place ID)
- Status: Confirmed
- Refreshments: Yes

**Booking 2:**
- Title: "Client Presentation"
- Date: Day after tomorrow
- Time: 14:00 - 16:00
- Place: Main Office
- Status: Pending
- Refreshments: Yes

**Booking 3:**
- Title: "Project Review"
- Date: Next week
- Time: 10:00 - 12:00
- Place: Main Office
- Status: Confirmed
- Refreshments: No

---

## 🔐 **Security Features**

### **Soft Delete** ✅
- Records marked as `is_deleted = true`
- Not physically removed
- Can be restored
- Filtered out from normal queries

### **Audit Trail** ✅
- `created_by`, `created_at` tracked
- `updated_by`, `updated_at` tracked
- `deleted_by`, `deleted_at` tracked
- All changes logged in `booking_history`

### **Status Workflow** ✅
```
pending → confirmed → in_progress → completed
                    ↘ cancelled
```

---

## 🧪 **How to Use**

### **Step 1: Run the SQL Script**
```bash
mysql -u your_user -p your_database < booking-management-schema.sql
```

### **Step 2: Verify Tables**
```sql
SHOW TABLES LIKE 'booking%';

-- Should show:
-- bookings
-- booking_participants
-- booking_refreshments
-- booking_history
```

### **Step 3: Verify Views**
```sql
SHOW FULL TABLES WHERE table_type = 'VIEW';

-- Should show:
-- bookings_with_details
-- todays_bookings
-- upcoming_bookings
-- active_bookings
```

### **Step 4: Test Sample Data**
```sql
-- View sample bookings
SELECT * FROM bookings WHERE is_deleted = false;

-- View with full details
SELECT * FROM bookings_with_details;

-- Check today's bookings
SELECT * FROM todays_bookings;
```

### **Step 5: Test Availability Check**
```sql
CALL check_place_availability(
    '7cd9142f-9dad-11f0-9b48-00ff3d223740',
    CURDATE() + INTERVAL 1 DAY,
    '09:00:00',
    '10:00:00',
    @available,
    @message
);

SELECT @available as is_available, @message as message;
```

---

## 📋 **Integration with Existing Tables**

### **Foreign Keys:**
- `bookings.place_id` → `places.id`
- `booking_participants.booking_id` → `bookings.id`
- `external_participants.booking_id` → `bookings.id`
- `booking_refreshments.booking_id` → `bookings.id`

### **Dependencies:**
- Requires `places` table (✅ Already exists)
- Requires `place_configuration` table (✅ Already created)
- Works with existing place management system

---

## 🎯 **Key Features**

### **1. Time Conflict Prevention** ✅
- Stored procedure checks for overlapping bookings
- Prevents double-booking of places
- Validates against operating hours

### **2. Day-of-Week Validation** ✅
- Checks if place is available on selected day
- Matches `available_monday`, `available_tuesday`, etc.
- Integrated with place configuration

### **3. Participant Management** ✅
- Separate tables for internal and external participants
- Automatic count updates via triggers
- Track participation status

### **4. Refreshment Tracking** ✅
- Optional refreshments per booking
- Detailed items and timing
- Status tracking (pending → served)

### **5. Complete Audit Trail** ✅
- History of all changes
- Who created/updated
- When changes occurred
- Status change log

---

## 📈 **Sample Queries**

### **Get Available Time Slots for a Place**
```sql
SELECT DISTINCT start_time, end_time
FROM bookings
WHERE place_id = '7cd9142f-9dad-11f0-9b48-00ff3d223740'
  AND booking_date = '2024-01-15'
  AND is_deleted = false
  AND status NOT IN ('cancelled')
ORDER BY start_time;
```

### **Get Bookings by Status**
```sql
SELECT * FROM bookings_with_details
WHERE status = 'confirmed'
  AND booking_date >= CURDATE()
ORDER BY booking_date, start_time;
```

### **Get Participant List for a Booking**
```sql
-- Internal participants
SELECT employee_name, employee_email, participation_status
FROM booking_participants
WHERE booking_id = 'booking-id-here';

-- External participants
SELECT full_name, email, phone, participation_status
FROM external_participants
WHERE booking_id = 'booking-id-here';
```

### **Get Booking Statistics**
```sql
SELECT 
    DATE(booking_date) as date,
    COUNT(*) as total_bookings,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
    SUM(total_participants) as total_people
FROM bookings
WHERE is_deleted = false
  AND booking_date >= CURDATE() - INTERVAL 30 DAY
GROUP BY DATE(booking_date)
ORDER BY date DESC;
```

---

## 🎉 **Summary**

**SQL Script Includes:**
- ✅ 5 tables (bookings, participants, refreshments, history)
- ✅ 4 views (with_details, today's, upcoming, active)
- ✅ 1 stored procedure (availability check)
- ✅ 5 triggers (auto-update counts & log changes)
- ✅ 3 sample bookings (dummy data)
- ✅ Complete indexes for performance
- ✅ Foreign key relationships
- ✅ Soft delete support
- ✅ Audit trail system

**Integrated With:**
- ✅ `places` table
- ✅ `place_configuration` table
- ✅ Your secure-select API

**Ready for:**
- ✅ Full booking management
- ✅ Participant tracking
- ✅ Refreshment management
- ✅ Availability validation
- ✅ Conflict detection

**Run the SQL script and your booking system will be ready!** 🚀
