-- =====================================================
-- QUICK VERIFICATION: Check booking_id matching
-- =====================================================

-- Step 1: Show all bookings with their IDs
SELECT 
    '📅 BOOKINGS' as section,
    id as booking_id,
    title,
    booking_date,
    CONCAT(TIME_FORMAT(start_time, '%H:%i'), ' - ', TIME_FORMAT(end_time, '%H:%i')) as time_range
FROM bookings
WHERE is_deleted = 0
ORDER BY created_at DESC;

-- Step 2: Show all internal participants with their booking_id
SELECT 
    '👤 INTERNAL PARTICIPANTS' as section,
    id as participant_id,
    booking_id,
    employee_name,
    employee_email
FROM booking_participants
ORDER BY booking_id;

-- Step 3: Show all external participants with their booking_id
SELECT 
    '👥 EXTERNAL PARTICIPANTS' as section,
    id as participant_id,
    booking_id,
    full_name,
    phone
FROM external_participants
ORDER BY booking_id;

-- Step 4: CHECK IF BOOKING_IDs MATCH
-- This query shows if participant booking_ids exist in bookings table
SELECT 
    '❌ MISMATCHED INTERNAL PARTICIPANTS' as issue,
    bp.id,
    bp.booking_id as participant_booking_id,
    bp.employee_name,
    'NOT FOUND IN BOOKINGS TABLE' as problem
FROM booking_participants bp
WHERE bp.booking_id NOT IN (SELECT id FROM bookings WHERE is_deleted = 0);

SELECT 
    '❌ MISMATCHED EXTERNAL PARTICIPANTS' as issue,
    ep.id,
    ep.booking_id as participant_booking_id,
    ep.full_name,
    'NOT FOUND IN BOOKINGS TABLE' as problem
FROM external_participants ep
WHERE ep.booking_id NOT IN (SELECT id FROM bookings WHERE is_deleted = 0);

-- Step 5: Count participants per booking
SELECT 
    b.id as booking_id,
    b.title,
    b.booking_date,
    (SELECT COUNT(*) FROM booking_participants WHERE booking_id = b.id) as internal_count,
    (SELECT COUNT(*) FROM external_participants WHERE booking_id = b.id) as external_count,
    (SELECT COUNT(*) FROM booking_participants WHERE booking_id = b.id) + 
    (SELECT COUNT(*) FROM external_participants WHERE booking_id = b.id) as total_count,
    b.total_participants as stored_total
FROM bookings b
WHERE is_deleted = 0
ORDER BY b.created_at DESC;

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- If participant filtering works correctly, you should see:
-- - Different total_count for each booking
-- - Each booking has its own unique participants
-- 
-- If ALL bookings show same total_count (like 6):
-- - The booking_id values in participant tables are wrong
-- - Run Step 4 to see which participants have invalid booking_id
-- - You need to update them with correct booking_id values


