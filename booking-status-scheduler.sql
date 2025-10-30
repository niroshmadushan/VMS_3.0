-- =====================================================
-- BOOKING STATUS AUTO-UPDATE EVENT SCHEDULER
-- =====================================================
-- This will automatically update booking status based on current time
-- 
-- Status Flow:
-- pending → upcoming → ongoing → completed
-- cancelled → stays cancelled (never changes)
-- =====================================================

-- Step 1: Enable Event Scheduler
-- =====================================================

SET GLOBAL event_scheduler = ON;

-- Verify it's enabled
SHOW VARIABLES LIKE 'event_scheduler';
-- Should show: ON


-- =====================================================
-- Step 2: Create Status Update Event
-- =====================================================

-- Drop existing event if exists
DROP EVENT IF EXISTS update_booking_status;

DELIMITER $$

CREATE EVENT update_booking_status
ON SCHEDULE EVERY 1 MINUTE  -- Runs every minute
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DECLARE current_date DATE;
    DECLARE current_time TIME;
    
    SET current_date = CURDATE();
    SET current_time = CURTIME();
    
    -- =====================================================
    -- Rule 1: PENDING → UPCOMING
    -- =====================================================
    -- If booking date is today or in future, and currently pending
    -- Change to: upcoming
    
    UPDATE bookings
    SET 
        status = 'upcoming',
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        status = 'pending'
        AND booking_date >= current_date
        AND is_deleted = 0;
    
    
    -- =====================================================
    -- Rule 2: UPCOMING → ONGOING
    -- =====================================================
    -- If booking date is TODAY and start time has passed
    -- Change to: ongoing (in-progress)
    
    UPDATE bookings
    SET 
        status = 'in_progress',
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        status IN ('upcoming', 'pending')
        AND booking_date = current_date
        AND start_time <= current_time
        AND end_time > current_time  -- Not yet ended
        AND is_deleted = 0;
    
    
    -- =====================================================
    -- Rule 3: ONGOING → COMPLETED
    -- =====================================================
    -- If booking date is TODAY and end time has passed
    -- Or booking date is in the PAST
    -- Change to: completed
    
    UPDATE bookings
    SET 
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        status IN ('upcoming', 'pending', 'in_progress')
        AND (
            (booking_date = current_date AND end_time <= current_time) OR
            (booking_date < current_date)
        )
        AND is_deleted = 0;
    
    
    -- =====================================================
    -- Rule 4: CANCELLED stays CANCELLED
    -- =====================================================
    -- Cancelled bookings are NEVER changed
    -- No update needed - they stay cancelled forever
    
    -- Log the update (optional)
    -- You can create a log table if needed
    
END$$

DELIMITER ;


-- =====================================================
-- Step 3: Verify Event is Created
-- =====================================================

-- Check if event exists and is enabled
SELECT 
    EVENT_NAME,
    EVENT_DEFINITION,
    INTERVAL_VALUE,
    INTERVAL_FIELD,
    STATUS,
    LAST_EXECUTED,
    NEXT_EXECUTION_TIME
FROM information_schema.EVENTS
WHERE EVENT_NAME = 'update_booking_status';


-- =====================================================
-- Step 4: Manual Status Update (Run Once Initially)
-- =====================================================

-- Run this once to update all existing bookings to correct status
-- Based on current date/time

SET @current_date = CURDATE();
SET @current_time = CURTIME();

-- Update to upcoming
UPDATE bookings
SET status = 'upcoming'
WHERE status = 'pending'
  AND booking_date >= @current_date
  AND is_deleted = 0;

-- Update to ongoing
UPDATE bookings
SET status = 'in_progress'
WHERE status IN ('upcoming', 'pending')
  AND booking_date = @current_date
  AND start_time <= @current_time
  AND end_time > @current_time
  AND is_deleted = 0;

-- Update to completed
UPDATE bookings
SET status = 'completed'
WHERE status IN ('upcoming', 'pending', 'in_progress')
  AND (
      (booking_date = @current_date AND end_time <= @current_time) OR
      (booking_date < @current_date)
  )
  AND is_deleted = 0;


-- =====================================================
-- Step 5: Test the Event Manually
-- =====================================================

-- You can trigger the event manually to test
-- (without waiting for the schedule)

CALL update_booking_status;  -- This will fail, events can't be called
-- Instead, copy the UPDATE statements from Step 4 and run them


-- =====================================================
-- Step 6: Monitor Event Execution
-- =====================================================

-- Check when event last ran
SELECT 
    EVENT_NAME,
    STATUS,
    LAST_EXECUTED,
    NEXT_EXECUTION_TIME,
    EVENT_COMMENT
FROM information_schema.EVENTS
WHERE EVENT_NAME = 'update_booking_status';


-- =====================================================
-- Step 7: Disable Event (if needed)
-- =====================================================

-- To temporarily disable
ALTER EVENT update_booking_status DISABLE;

-- To re-enable
ALTER EVENT update_booking_status ENABLE;

-- To delete permanently
-- DROP EVENT update_booking_status;


-- =====================================================
-- EXAMPLES: How Status Changes
-- =====================================================

/*
SCENARIO 1: Future Booking
----------------------------
Booking: 2025-10-05 10:00-11:00
Current: 2025-10-02 14:00

Status: pending → upcoming ✅
Reason: Booking date is in future


SCENARIO 2: Today, Before Start
----------------------------
Booking: 2025-10-02 15:00-16:00
Current: 2025-10-02 14:00

Status: upcoming ✅
Reason: Same day, but start time not reached


SCENARIO 3: Today, During Meeting
----------------------------
Booking: 2025-10-02 14:00-15:00
Current: 2025-10-02 14:30

Status: upcoming → in_progress ✅
Reason: Start time passed, end time not yet


SCENARIO 4: Today, After Meeting
----------------------------
Booking: 2025-10-02 10:00-11:00
Current: 2025-10-02 14:30

Status: in_progress → completed ✅
Reason: End time passed


SCENARIO 5: Past Date
----------------------------
Booking: 2025-09-30 10:00-11:00
Current: 2025-10-02 14:30

Status: any → completed ✅
Reason: Booking date in past


SCENARIO 6: Cancelled
----------------------------
Booking: 2025-10-05 10:00-11:00
Status: cancelled

Status: cancelled (NEVER CHANGES) ✅
Reason: Cancelled bookings stay cancelled
*/


-- =====================================================
-- INSTALLATION SUMMARY
-- =====================================================

/*
1. Run Step 1: Enable event scheduler
2. Run Step 2: Create the event
3. Run Step 4: Manual update for existing bookings
4. Verify with Step 3: Check event is created
5. Monitor with Step 6: Check execution times

The event will run every 1 minute and automatically update:
- pending → upcoming (for future bookings)
- upcoming → in_progress (when meeting starts)
- in_progress → completed (when meeting ends)
- cancelled → stays cancelled (never changes)

Done! ✅
*/

