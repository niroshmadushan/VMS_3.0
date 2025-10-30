-- =====================================================
-- Add booking_ref_id column to bookings table
-- =====================================================

-- Add the new column
ALTER TABLE bookings
ADD COLUMN booking_ref_id VARCHAR(6) UNIQUE AFTER id;

-- Add index for faster lookups
ALTER TABLE bookings
ADD INDEX idx_booking_ref_id (booking_ref_id);

-- =====================================================
-- Generate unique reference IDs for existing bookings
-- =====================================================

-- This will generate a random 6-character alphanumeric code
-- You need to run this for each existing booking

-- Example for your existing bookings:
UPDATE bookings 
SET booking_ref_id = 'BK3A7F'
WHERE id = '81ee5bc0-aa6c-47d6-ac80-715302d48061'; -- test

UPDATE bookings 
SET booking_ref_id = 'QW5B2M'
WHERE id = 'd25a7ab8-e47b-4070-821f-7607a8b2df76'; -- qwert

UPDATE bookings 
SET booking_ref_id = 'TS9K4P'
WHERE id = 'fd91df4c-d3e5-46ca-9a5a-514b38434194'; -- tesr

-- =====================================================
-- Verification
-- =====================================================

-- Check all booking reference IDs
SELECT 
    booking_ref_id,
    title,
    booking_date,
    place_name
FROM bookings
WHERE is_deleted = 0
ORDER BY created_at DESC;

-- Verify uniqueness
SELECT 
    booking_ref_id, 
    COUNT(*) as count 
FROM bookings 
WHERE booking_ref_id IS NOT NULL
GROUP BY booking_ref_id 
HAVING count > 1;
-- Should return 0 rows (all unique)

-- =====================================================
-- NOTES:
-- =====================================================
/*
The booking_ref_id will be:
- 6 characters long
- Uppercase letters and numbers (A-Z, 0-9)
- Unique across all bookings
- Easy to reference and share

Examples:
- BK3A7F
- M9K2P1
- A1B2C3
- XY789Z

The frontend will auto-generate this when creating new bookings.
*/


