-- Update bookings table to use Sri Lanka timezone (UTC+5:30) for timestamps
-- This ensures created_at, updated_at, and cancelled_at use correct local time

-- Method 1: Update the table defaults to use timezone conversion
-- Note: This requires MySQL 5.7+ and timezone tables to be loaded

-- First, let's modify the created_at column to use Sri Lanka time
ALTER TABLE bookings 
MODIFY COLUMN created_at TIMESTAMP DEFAULT (CONVERT_TZ(NOW(), @@session.time_zone, '+05:30'));

-- Update updated_at to also use Sri Lanka time on update
ALTER TABLE bookings 
MODIFY COLUMN updated_at TIMESTAMP DEFAULT (CONVERT_TZ(NOW(), @@session.time_zone, '+05:30')) 
ON UPDATE CURRENT_TIMESTAMP;

-- Note: cancelled_at is set manually, but we can ensure it uses timezone conversion when set
-- The application should set cancelled_at with timezone-aware value

-- Method 2: Set MySQL session timezone (Recommended - Run this before any queries)
-- Add this to your backend database connection code:
-- SET time_zone = '+05:30';

-- Method 3: Update MySQL server timezone (System-wide)
-- This requires server access:
-- SET GLOBAL time_zone = '+05:30';

-- For existing records, you may want to update them (optional):
-- UPDATE bookings 
-- SET created_at = CONVERT_TZ(created_at, @@session.time_zone, '+05:30')
-- WHERE created_at IS NOT NULL;

