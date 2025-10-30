# 👥 Today's Visitors System - Complete Guide

## 📋 Overview

The **Today's Visitors** page provides real-time tracking and management of all external visitors scheduled for the current date. This powerful tool helps security, reception, and admin staff efficiently monitor and manage visitor traffic.

---

## 🗄️ Database Setup

### Step 1: Run the SQL Views

Execute the `todays-visitors-view.sql` file in your MySQL database:

```bash
mysql -u your_username -p your_database < todays-visitors-view.sql
```

This creates:
- ✅ `v_todays_visitors` - Main view with all today's visitor details
- ✅ `v_todays_visitors_summary` - Statistics summary
- ✅ `v_todays_visitors_by_place` - Visitors grouped by location
- ✅ `v_todays_visitors_by_hour` - Hourly breakdown
- ✅ `visitor_check_ins` - Check-in/out tracking table (future enhancement)
- ✅ Stored procedures for check-in/check-out operations

---

## ✨ Key Features

### 1. **Real-Time Updates**
- ⏱️ Auto-refreshes every 60 seconds
- 🔴 Live status: Ongoing, Upcoming, Completed, Cancelled
- ⚡ Always shows CURRENT_DATE visitors

### 2. **Comprehensive Visitor Information**
Each visitor record shows:
- 👤 Full name, email, phone
- 🏢 Company and designation
- 🆔 Reference type & value (NIC, Passport, etc.)
- 📍 Location and host details
- ⏰ Time slot and duration
- 📊 Visit count (identifies VIP/frequent visitors)
- ⚠️ Blacklist status

### 3. **Advanced Search & Filtering**
Search by:
- ✅ Visitor name
- ✅ Email
- ✅ Phone number
- ✅ Reference value (ID number)
- ✅ Company name
- ✅ Booking title
- ✅ Booking reference ID

Filter by status:
- 🟢 **Ongoing** - Currently on premises
- 🟠 **Upcoming** - Expected arrivals
- 🔵 **Completed** - Already left
- ⚫ **Cancelled** - Cancelled bookings

### 4. **Analytics Dashboard**
Real-time statistics:
- 📊 Total visits (with unique visitor count)
- 🟢 Currently ongoing visits
- 🟠 Expected arrivals
- 🏢 Number of companies visiting

### 5. **Security Alerts**
- 🚨 Blacklisted visitors highlighted in RED
- ⚠️ Warning banner if blacklisted visitors scheduled
- 📋 VIP badges for frequent visitors (10+ visits)

### 6. **Detailed View Dialog**
Click "View" on any visitor to see:
- **Visitor Profile Tab**: Personal and professional details
- **Booking Details Tab**: Complete booking information with place, time, and host

---

## 🎯 How It Works

### Automatic Date Filtering

The system automatically shows **only today's visitors**:

```sql
WHERE DATE(b.booking_date) = CURRENT_DATE
```

This means:
- ✅ No manual date selection needed
- ✅ Always shows current day
- ✅ Updates at midnight automatically

### Status Calculation

The system intelligently calculates the current status:

| Status | Condition |
|--------|-----------|
| **Ongoing** | Current time is between start_time and end_time |
| **Upcoming** | Current time is before start_time |
| **Completed** | Current time is after end_time OR booking marked complete |
| **Cancelled** | Booking marked as cancelled |

---

## 📊 SQL Views Explained

### 1. `v_todays_visitors` (Main View)

```sql
SELECT 
  -- External member details
  em.full_name, em.email, em.phone, em.reference_value,
  -- Booking details
  b.title, b.start_time, b.end_time,
  -- Place and host
  p.name AS place_name,
  u.full_name AS responsible_person_name,
  -- Dynamic status
  CASE WHEN CURRENT_TIME BETWEEN start_time AND end_time 
       THEN 'ongoing' ELSE 'upcoming' END AS current_status
FROM external_participants ep
JOIN external_members em ON ep.member_id = em.id
JOIN bookings b ON ep.booking_id = b.id
WHERE DATE(b.booking_date) = CURRENT_DATE
```

**Returns:** All visitors with complete details for today only

---

### 2. `v_todays_visitors_summary`

```sql
SELECT 
  COUNT(DISTINCT em.id) AS total_unique_visitors,
  COUNT(DISTINCT b.id) AS total_bookings,
  SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) AS ongoing_count,
  -- More aggregations...
FROM external_participants ep
WHERE DATE(b.booking_date) = CURRENT_DATE
```

**Returns:** Aggregated statistics for the dashboard

---

### 3. `v_todays_visitors_by_place`

Groups visitors by location for security checkpoints:

```sql
SELECT 
  p.name AS place_name,
  COUNT(DISTINCT em.id) AS unique_visitors,
  MIN(b.start_time) AS first_visit_time,
  MAX(b.end_time) AS last_visit_time
FROM bookings b
WHERE DATE(b.booking_date) = CURRENT_DATE
GROUP BY p.id
```

**Use Case:** Security can see which locations expect visitors

---

### 4. `v_todays_visitors_by_hour`

Hourly breakdown for capacity planning:

```sql
SELECT 
  HOUR(start_time) AS hour_slot,
  COUNT(DISTINCT em.id) AS unique_visitors
FROM bookings b
WHERE DATE(b.booking_date) = CURRENT_DATE
GROUP BY HOUR(start_time)
```

**Use Case:** Identify peak visitor hours

---

## 🔍 Use Cases

### For **Security Personnel**

✅ **Check visitor identity:**
1. Search by reference value (NIC, Passport)
2. View full visitor details
3. Verify against booking information
4. Check for blacklist status

✅ **Monitor current visitors:**
1. Filter by "Ongoing" status
2. See who is currently on premises
3. Track time spent on site

---

### For **Reception**

✅ **Prepare for arrivals:**
1. Filter by "Upcoming" status
2. See expected visitors and times
3. Prepare visitor passes
4. Notify hosts

✅ **Quick search:**
- Visitor calls: Search by name or phone
- Booking inquiry: Search by booking ref ID
- Company visit: Search by company name

---

### For **Admin**

✅ **Monitor daily operations:**
1. View total visitor count
2. Check utilization by location
3. Identify VIP visitors
4. Review blacklist warnings

✅ **Generate reports:**
- Export visitor list
- Analyze peak hours
- Track company visits

---

## 🎨 UI Features

### Table Columns

| Column | Information |
|--------|-------------|
| **Time** | Time slot (HH:MM - HH:MM) and duration |
| **Visitor Details** | Name, email, phone, company, designation |
| **Reference** | ID type (NIC/Passport) and number |
| **Booking Info** | Booking ref ID, title, description |
| **Place** | Location name and city |
| **Host** | Responsible person name and contact |
| **Status** | Current status badge with icon |
| **Actions** | View button for detailed information |

### Color Coding

```
🟢 Green   - Ongoing (on premises now)
🟠 Orange  - Upcoming (expected arrival)
🔵 Blue    - Completed (already left)
⚫ Gray    - Cancelled
🔴 Red     - Blacklisted (warning)
```

### Badges

- 🏆 **VIP Badge** - Visitors with 10+ visits
- ⚠️ **BLACKLISTED** - Security warning
- 📋 **Booking Ref** - Quick booking identification

---

## 🔐 Access Control

The page is accessible by:
- ✅ **Admin** - Full access
- ✅ **Security** - Monitor and verify visitors
- ✅ **Receptionist** - Check-in/out management

```typescript
requireAuth(["admin", "security", "receptionist"])
```

---

## 📱 Responsive Design

The page is fully responsive:
- 📱 Mobile: Scrollable table, stacked cards
- 💻 Tablet: 2-column statistics grid
- 🖥️ Desktop: Full 4-column layout

---

## ⚡ Performance

### Optimization Features

1. **Auto-refresh**: Updates every 60 seconds
2. **Client-side filtering**: Fast search and filter
3. **Indexed queries**: Database views use indexes
4. **Batch loading**: All data loaded in parallel

### Database Indexes

```sql
CREATE INDEX idx_bookings_date_status 
  ON bookings(booking_date, status, is_deleted);

CREATE INDEX idx_external_participants_booking 
  ON external_participants(booking_id, is_deleted);
```

---

## 🚀 Future Enhancements

### Check-In/Check-Out System

The SQL includes tables and procedures for:

```sql
-- Check in a visitor
CALL sp_check_in_visitor(
  booking_id, 
  member_id, 
  checked_in_by, 
  notes
);

-- Check out a visitor
CALL sp_check_out_visitor(
  booking_id, 
  member_id, 
  checked_out_by, 
  notes
);
```

This enables:
- ⏰ Track actual arrival/departure times
- 📊 Calculate on-time vs late arrivals
- 📈 Measure actual visit duration
- 🔔 Send departure notifications

---

## 📊 Example Scenarios

### Scenario 1: Security Check

**Visitor arrives at gate:**
1. Security opens "Today's Visitors" page
2. Searches by name: "John Doe"
3. Views reference value: "NIC 199012345678"
4. Verifies identity
5. Checks status: "Upcoming" ✅
6. Allows entry

---

### Scenario 2: Reception Management

**Morning preparation:**
1. Reception opens page at 8:00 AM
2. Filters "Upcoming" - sees 15 expected visitors
3. Prints visitor list
4. Prepares 15 visitor passes
5. Notifies hosts via email

---

### Scenario 3: Blacklist Alert

**Admin reviews visitors:**
1. Opens page, sees warning banner
2. "⚠️ 1 blacklisted visitor scheduled!"
3. Clicks on red-highlighted row
4. Views blacklist reason: "Security concern"
5. Contacts responsible person
6. Cancels or reinforces security

---

## 🎯 Best Practices

### 1. **Daily Review**
- Check page at start of day
- Review expected visitors
- Verify high-priority visits

### 2. **Real-Time Monitoring**
- Keep page open on security/reception desk
- Monitor ongoing visits
- Track visitor count

### 3. **Search Efficiency**
- Use reference value for quick verification
- Search by company for bulk visits
- Filter by status to focus on active visitors

### 4. **Blacklist Management**
- Always check blacklist warnings
- Review reasons before allowing entry
- Escalate to management if needed

---

## 🔧 Troubleshooting

### Issue: "No visitors showing"

**Check:**
- ✅ Are there bookings scheduled for today?
- ✅ Do bookings have external participants?
- ✅ Are participants linked to external_members?
- ✅ Is booking_date = today's date?

---

### Issue: "Visitor not appearing"

**Verify:**
1. Booking status is not "deleted"
2. External participant is_deleted = FALSE
3. External member is_active = TRUE
4. Booking date matches today

---

### Issue: "Wrong status showing"

**Reason:** Status is calculated in real-time based on current time.
- Check system time is correct
- Status updates automatically every 60 seconds
- Manual refresh: Close and reopen page

---

## 📈 Analytics & Reporting

### Daily Metrics

Track these KPIs:
- 📊 Total daily visitors
- 📊 Peak visitor hours
- 📊 Average visit duration
- 📊 Top visiting companies
- 📊 Frequent visitors (VIPs)

### Query Examples

```sql
-- Today's visitor count
SELECT COUNT(*) FROM v_todays_visitors;

-- Peak hour
SELECT hour_slot, unique_visitors 
FROM v_todays_visitors_by_hour 
ORDER BY unique_visitors DESC 
LIMIT 1;

-- Top companies
SELECT visitor_company, COUNT(*) as visits
FROM v_todays_visitors
WHERE visitor_company IS NOT NULL
GROUP BY visitor_company
ORDER BY visits DESC;
```

---

## 🎉 Success Indicators

You'll know the system is working when:
- ✅ Page loads instantly with today's visitors
- ✅ Search returns results immediately
- ✅ Filters work correctly
- ✅ Status badges show accurate colors
- ✅ Blacklist warnings appear when needed
- ✅ Detailed view shows complete information

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review SQL view definitions
3. Verify database data
4. Check browser console for errors

---

## 🚀 Quick Start

1. **Run SQL**: `todays-visitors-view.sql`
2. **Navigate**: `/admin/todays-visitors`
3. **Search**: Type visitor name or ID
4. **Filter**: Click status buttons
5. **View**: Click "View" button for details

**That's it!** You're now tracking visitors in real-time! 👥✨

---

**Access URL:** `/admin/todays-visitors`

**Auto-Refresh:** Every 60 seconds

**Timezone:** Uses server's local timezone

**Date Filter:** Automatically set to CURRENT_DATE

