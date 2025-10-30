-- =====================================================
-- FIX PARTICIPANT BOOKING_ID ISSUE
-- =====================================================

-- Step 1: Check current state of participants
-- =====================================================

-- See all participants and their booking_ids
SELECT 
    'Internal' as type,
    bp.id as participant_id,
    bp.booking_id,
    bp.employee_name,
    b.title as booking_title,
    b.booking_date,
    CASE 
        WHEN b.id IS NULL THEN '❌ NO MATCH'
        WHEN bp.booking_id = b.id THEN '✅ CORRECT'
        ELSE '⚠️ MISMATCH'
    END as status
FROM booking_participants bp
LEFT JOIN bookings b ON bp.booking_id = b.id
ORDER BY bp.booking_id;

-- External participants
SELECT 
    'External' as type,
    ep.id as participant_id,
    ep.booking_id,
    ep.full_name,
    b.title as booking_title,
    b.booking_date,
    CASE 
        WHEN b.id IS NULL THEN '❌ NO MATCH'
        WHEN ep.booking_id = b.id THEN '✅ CORRECT'
        ELSE '⚠️ MISMATCH'
    END as status
FROM external_participants ep
LEFT JOIN bookings b ON ep.booking_id = b.id
ORDER BY ep.booking_id;


-- Step 2: Count participants per booking
-- =====================================================

SELECT 
    b.id,
    b.title,
    b.booking_date,
    (SELECT COUNT(*) FROM booking_participants WHERE booking_id = b.id) as internal_count,
    (SELECT COUNT(*) FROM external_participants WHERE booking_id = b.id) as external_count,
    (SELECT COUNT(*) FROM booking_participants WHERE booking_id = b.id) + 
    (SELECT COUNT(*) FROM external_participants WHERE booking_id = b.id) as total_count
FROM bookings b
ORDER BY b.created_at DESC;

-- Expected result: Different counts for each booking
-- If all show same count: booking_id issue!


-- Step 3: Find orphaned participants
-- =====================================================

-- Internal participants with no matching booking
SELECT bp.id, bp.booking_id, bp.employee_name, 'NO BOOKING FOUND' as issue
FROM booking_participants bp
LEFT JOIN bookings b ON bp.booking_id = b.id
WHERE b.id IS NULL;

-- External participants with no matching booking
SELECT ep.id, ep.booking_id, ep.full_name, 'NO BOOKING FOUND' as issue
FROM external_participants ep
LEFT JOIN bookings b ON ep.booking_id = b.id
WHERE b.id IS NULL;


-- Step 4: Check if all participants have same booking_id
-- =====================================================

SELECT 
    booking_id,
    COUNT(*) as participant_count,
    GROUP_CONCAT(employee_name) as employees
FROM booking_participants
GROUP BY booking_id;

SELECT 
    booking_id,
    COUNT(*) as participant_count,
    GROUP_CONCAT(full_name) as externals
FROM external_participants
GROUP BY booking_id;

-- If you see only ONE booking_id with count 6:
-- Problem: All participants assigned to same booking!


-- Step 5: Get booking IDs for reference
-- =====================================================

SELECT 
    id,
    title,
    booking_date,
    DATE_FORMAT(booking_date, '%Y-%m-%d') as formatted_date,
    created_at
FROM bookings
ORDER BY created_at DESC;

-- Copy these IDs to update participants


-- =====================================================
-- EXAMPLE FIX: Update participants with correct booking_id
-- =====================================================

-- IF you created 3 bookings and need to distribute 6 participants:
-- Booking 1 (test): 2 internal, 1 external = 3 total
-- Booking 2 (qwert): 1 internal, 2 external = 3 total  
-- Booking 3 (tesr): 0 internal, 0 external = 0 total

-- First, get booking IDs:
-- Let's say:
-- Booking 1 ID: 'booking-id-1'
-- Booking 2 ID: 'booking-id-2'
-- Booking 3 ID: 'booking-id-3'

-- Update internal participants (example - adjust based on your data)
UPDATE booking_participants 
SET booking_id = 'booking-id-1'  -- Test booking
WHERE id IN ('internal-participant-1-id', 'internal-participant-2-id');

UPDATE booking_participants 
SET booking_id = 'booking-id-2'  -- Qwert booking
WHERE id = 'internal-participant-3-id';

-- Update external participants (example - adjust based on your data)
UPDATE external_participants
SET booking_id = 'booking-id-1'  -- Test booking
WHERE id = 'external-participant-1-id';

UPDATE external_participants
SET booking_id = 'booking-id-2'  -- Qwert booking
WHERE id IN ('external-participant-2-id', 'external-participant-3-id');


-- =====================================================
-- VERIFICATION: After fixing
-- =====================================================

-- Should show different counts now:
SELECT 
    b.title,
    (SELECT COUNT(*) FROM booking_participants WHERE booking_id = b.id) as internal,
    (SELECT COUNT(*) FROM external_participants WHERE booking_id = b.id) as external,
    (SELECT COUNT(*) FROM booking_participants WHERE booking_id = b.id) + 
    (SELECT COUNT(*) FROM external_participants WHERE booking_id = b.id) as total
FROM bookings b
ORDER BY b.created_at DESC;

-- Expected:
-- test:  internal: 2, external: 1, total: 3 ✅
-- qwert: internal: 1, external: 2, total: 3 ✅
-- tesr:  internal: 0, external: 0, total: 0 ✅


