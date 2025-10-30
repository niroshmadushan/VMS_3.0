# 🔍 BOOKING DEBUG GUIDE

## 🎯 **Problem**

Database has bookings for a date/place, but the system shows full time available (not detecting existing bookings).

---

## 🛠️ **New Debug Features**

### **1. Debug Information Card**

At the top of the booking page, you'll now see a blue card showing:

```
📊 Debug Information
Total Bookings Loaded: 5

Bookings Summary:
1. Team Meeting - Date: 2024-01-15 | Place: Main Office (7cd9142f...) | Time: 09:00-11:00 | Status: upcoming
2. Client Call - Date: 2024-01-15 | Place: Conference Room (abc12345...) | Time: 14:00-15:00 | Status: upcoming
...

[📋 Log All Bookings to Console]
```

### **2. Enhanced Console Logging**

When you open the page or click the button, you'll see:

```
🔄 Component mounted - Fetching bookings from database...
📚 Fetching bookings from database...
✅ Transformed bookings: 5

📊 All bookings loaded:
  📌 ID: booking-1
     Title: Team Meeting
     Date: 2024-01-15
     Place: Main Office (ID: 7cd9142f-9dad-11f0-9b48-00ff3d223740)
     Time: 09:00 - 11:00
     Status: upcoming
     ---
  📌 ID: booking-2
     Title: Client Call
     Date: 2024-01-15
     Place: Conference Room (ID: abc12345-6789-1234-5678-90abcdef1234)
     Time: 14:00 - 15:00
     Status: upcoming
     ---
  ...
```

---

## 🔍 **Diagnostic Steps**

### **Step 1: Check if Bookings are Loaded**

**Action:** Open the booking page

**Check:**
1. Look at the blue Debug Information card at the top
2. Check "Total Bookings Loaded" number
3. Review the bookings list

**Expected:**
```
Total Bookings Loaded: X (should be > 0 if you have bookings)
```

**If 0:**
- ❌ Bookings not fetched from database
- Check console for errors
- Check database has bookings with `is_deleted = 0`

---

### **Step 2: Verify Your Booking is Listed**

**Action:** Look in the Debug Information card

**Check:**
- Find your booking by title
- Verify the date matches
- Verify the place matches
- Verify the time is correct

**Example:**
```
1. Team Meeting - Date: 2024-01-15 | Place: Main Office | Time: 09:00-11:00
    ↑ Your booking      ↑ Date         ↑ Place            ↑ Time
```

---

### **Step 3: Check Place ID Matching**

**Action:** Click "📋 Log All Bookings to Console"

**In Console, Check:**
```
🔍 MANUAL BOOKING CHECK:
1. Team Meeting
  Date: 2024-01-15
  Place: Main Office
  PlaceId: 7cd9142f-9dad-11f0-9b48-00ff3d223740  ← Note this ID
  Time: 09:00 - 11:00
  Status: upcoming
```

**Then when you select a place in the form:**
```
🕐 Generating available time gaps for place: 7cd9142f-9dad-11f0-9b48-00ff3d223740
                                                  ↑ Should match booking PlaceId
```

**If IDs don't match:**
- ❌ Place ID mismatch
- Booking has different place ID
- Won't be detected as conflict

---

### **Step 4: Check Date Format**

**In Debug Card:**
```
Date: 2024-01-15  ← Check format
```

**Should be:**
- Format: YYYY-MM-DD
- Example: 2024-01-15 (not 15/01/2024 or 01-15-2024)

**If format is different:**
- ❌ Date won't match
- Check database date format
- Check transformation in `fetchBookings()`

---

### **Step 5: Check Filtering Logic**

**Action:** Select the same date/place in form

**In Console:**
```
🔍 Checking bookings - Total in state: 5
🔍 Filtering for date: 2024-01-15 place: Main Office placeId: 7cd9142f-...

  Checking booking: {
    title: "Team Meeting",
    date: "2024-01-15",        ← Should match
    place: "Main Office",       ← Should match
    placeId: "7cd9142f-...",   ← Should match
    status: "upcoming",
    time: "09:00-11:00"
  }
    ✅ Booking matches criteria  ← Should see this

📋 Existing bookings found: 1   ← Should be > 0
  📌 Team Meeting: 09:00 - 11:00
```

**If "Existing bookings found: 0":**
- ❌ Filtering failed
- Check each "Checking booking" entry
- Look for "❌ Date mismatch" or "❌ Place mismatch"

---

## 🐛 **Common Issues**

### **Issue 1: Place ID Mismatch**

**Symptom:**
```
❌ Place mismatch: abc12345-... != 7cd9142f-...
```

**Cause:**
- Booking has different place_id than selected place
- Database has wrong place_id

**Solution:**
```sql
-- Check booking's place_id
SELECT id, title, place_id, place_name 
FROM bookings 
WHERE booking_date = '2024-01-15';

-- Update if wrong
UPDATE bookings 
SET place_id = 'correct-place-id' 
WHERE id = 'booking-id';
```

---

### **Issue 2: Date Format Mismatch**

**Symptom:**
```
❌ Date mismatch: 2024-01-15T00:00:00.000Z != 2024-01-15
```

**Cause:**
- Date includes timestamp
- Format not normalized

**Solution:**
Check the transformation in `fetchBookings()`:
```typescript
date: booking.booking_date  // Should already be YYYY-MM-DD
```

If date has time:
```typescript
date: booking.booking_date.split('T')[0]  // Remove time part
```

---

### **Issue 3: Time Format Issue**

**Symptom:**
Booking shows but gaps calculated wrong

**Cause:**
- Time has seconds: "09:00:00"
- System expects: "09:00"

**Check:**
```
Time: 09:00:00 - 11:00:00  ❌ Has seconds
Time: 09:00 - 11:00        ✅ Correct
```

**Solution:**
Already handled in code:
```typescript
startTime: booking.start_time.substring(0, 5)  // HH:MM:SS → HH:MM
endTime: booking.end_time.substring(0, 5)
```

---

### **Issue 4: Status Problem**

**Symptom:**
```
⏭️ Cancelled booking
```

**Cause:**
- Booking status is 'cancelled'
- System ignores cancelled bookings

**Check:**
```
Status: cancelled  ← Will be ignored
Status: upcoming   ← Will be checked
Status: pending    ← Will be checked
```

**Solution:**
If booking should be active:
```sql
UPDATE bookings 
SET status = 'pending' 
WHERE id = 'booking-id';
```

---

## 📋 **Complete Diagnostic Checklist**

### **Visual Check (Debug Card):**
- [ ] Total Bookings Loaded > 0
- [ ] Your booking is listed
- [ ] Date matches (YYYY-MM-DD)
- [ ] Place name correct
- [ ] Time format correct (HH:MM)
- [ ] Status not "cancelled"

### **Console Check (After selecting date/place):**
- [ ] "Checking bookings - Total in state: X" (X > 0)
- [ ] Your booking appears in "Checking booking:"
- [ ] See "✅ Booking matches criteria"
- [ ] "Existing bookings found: X" (X > 0)
- [ ] Your booking listed with time
- [ ] Gaps calculated correctly

### **Database Check:**
```sql
-- 1. Check booking exists
SELECT * FROM bookings 
WHERE booking_date = '2024-01-15' 
AND place_id = 'your-place-id'
AND is_deleted = 0;

-- 2. Check place_id matches
SELECT id, place_id, place_name 
FROM bookings 
WHERE id = 'your-booking-id';

-- 3. Check date format
SELECT booking_date, 
       DATE_FORMAT(booking_date, '%Y-%m-%d') as formatted_date
FROM bookings 
WHERE id = 'your-booking-id';

-- 4. Check time format
SELECT start_time, end_time,
       TIME_FORMAT(start_time, '%H:%i') as formatted_start,
       TIME_FORMAT(end_time, '%H:%i') as formatted_end
FROM bookings 
WHERE id = 'your-booking-id';
```

---

## 🎯 **Quick Test**

**Create a test booking manually:**

```sql
INSERT INTO bookings (
  id,
  title,
  booking_date,
  start_time,
  end_time,
  place_id,
  place_name,
  status,
  is_deleted,
  created_at
) VALUES (
  'test-booking-123',
  'TEST BOOKING',
  '2024-01-15',           -- Use YYYY-MM-DD
  '10:00:00',             -- Use HH:MM:SS
  '12:00:00',
  'your-place-id-here',   -- Get from places table
  'Main Office',
  'pending',
  0,
  NOW()
);
```

**Then:**
1. Refresh booking page
2. Check Debug Card - should see "TEST BOOKING"
3. Select date: 2024-01-15
4. Select place: Main Office
5. ✅ Should see gap excluded: 10:00-12:00

---

## 📊 **Expected Output**

**When everything works:**

```
Debug Card:
  Total Bookings Loaded: 3
  1. TEST BOOKING - Date: 2024-01-15 | Place: Main Office | Time: 10:00-12:00

Console:
  🔍 Checking bookings - Total in state: 3
  📋 Existing bookings found: 1
    📌 TEST BOOKING: 10:00 - 12:00
  ✅ Gap found: 08:00 - 10:00 (2h)
  ✅ Gap found: 12:00 - 17:00 (5h)

Dropdown:
  Available Time Slots:
  ├─ 08:00 - 10:00 (2h)
  └─ 12:00 - 17:00 (5h)
  
  ❌ 10:00-12:00 NOT available (blocked by TEST BOOKING)
```

---

## 🎉 **Summary**

**Use Debug Card to:**
- ✅ See all loaded bookings
- ✅ Verify your booking is there
- ✅ Check date/place/time format
- ✅ Click button for detailed console log

**Use Console to:**
- ✅ See filtering process
- ✅ Check which bookings match
- ✅ Verify gap calculation
- ✅ Debug mismatches

**If gaps still wrong:**
1. Check place ID matches exactly
2. Check date format (YYYY-MM-DD)
3. Check status not "cancelled"
4. Check time format (HH:MM)

**The debug tools will show you exactly what's happening!** 🔍

