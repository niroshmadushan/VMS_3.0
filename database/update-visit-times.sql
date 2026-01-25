-- ============================================
-- UPDATE VISIT TIMES - SQL QUERIES
-- For updating Pass ID, In-Time, and Out-Time
-- in external_member_visit_times table
-- ============================================

-- ============================================
-- 1. UPDATE BY VISIT TIME ID
-- Update specific record by its ID
-- ============================================

-- Update Pass ID only
UPDATE `external_member_visit_times`
SET 
  `visitor_pass_id` = 'PASS12345',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'  -- Replace with actual user ID
WHERE `id` = 'VISIT_TIME_ID_HERE';  -- Replace with actual visit time ID

-- Update In-Time only
UPDATE `external_member_visit_times`
SET 
  `in_time` = '2025-01-15 09:30:00',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `id` = 'VISIT_TIME_ID_HERE';

-- Update Out-Time only
UPDATE `external_member_visit_times`
SET 
  `out_time` = '2025-01-15 17:45:00',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `id` = 'VISIT_TIME_ID_HERE';

-- Update Pass ID, In-Time, and Out-Time together
UPDATE `external_member_visit_times`
SET 
  `visitor_pass_id` = 'PASS12345',
  `in_time` = '2025-01-15 09:30:00',
  `out_time` = '2025-01-15 17:45:00',
  `pass_type_id` = 'PASS_TYPE_ID_HERE',  -- Optional: Pass type ID
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `id` = 'VISIT_TIME_ID_HERE';

-- ============================================
-- 2. UPDATE BY EXTERNAL PARTICIPANT ID
-- Update visit times for a specific participant
-- ============================================

UPDATE `external_member_visit_times`
SET 
  `visitor_pass_id` = 'PASS12345',
  `in_time` = '2025-01-15 09:30:00',
  `out_time` = '2025-01-15 17:45:00',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `external_participant_id` = 'EXTERNAL_PARTICIPANT_ID_HERE';

-- ============================================
-- 3. UPDATE BY BOOKING ID
-- Update visit times for all participants in a booking
-- ============================================

UPDATE `external_member_visit_times`
SET 
  `visitor_pass_id` = 'PASS12345',
  `in_time` = '2025-01-15 09:30:00',
  `out_time` = '2025-01-15 17:45:00',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `booking_id` = 'BOOKING_ID_HERE';

-- ============================================
-- 4. UPDATE BY MEMBER ID
-- Update visit times for a specific external member
-- ============================================

UPDATE `external_member_visit_times`
SET 
  `visitor_pass_id` = 'PASS12345',
  `in_time` = '2025-01-15 09:30:00',
  `out_time` = '2025-01-15 17:45:00',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `member_id` = 'MEMBER_ID_HERE';

-- ============================================
-- 5. UPDATE WITH CONDITIONS
-- Update only records that meet certain conditions
-- ============================================

-- Update only records with missing Pass ID
UPDATE `external_member_visit_times`
SET 
  `visitor_pass_id` = 'PASS12345',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `visitor_pass_id` IS NULL 
  AND `external_participant_id` = 'EXTERNAL_PARTICIPANT_ID_HERE';

-- Update only records with missing In-Time
UPDATE `external_member_visit_times`
SET 
  `in_time` = '2025-01-15 09:30:00',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `in_time` IS NULL 
  AND `external_participant_id` = 'EXTERNAL_PARTICIPANT_ID_HERE';

-- Update only records with missing Out-Time
UPDATE `external_member_visit_times`
SET 
  `out_time` = '2025-01-15 17:45:00',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `out_time` IS NULL 
  AND `external_participant_id` = 'EXTERNAL_PARTICIPANT_ID_HERE';

-- ============================================
-- 6. BULK UPDATE EXAMPLES
-- Update multiple records at once
-- ============================================

-- Update all visit times for a specific date range
UPDATE `external_member_visit_times` emvt
INNER JOIN `bookings` b ON emvt.booking_id = b.id
SET 
  emvt.`visitor_pass_id` = CONCAT('PASS', LPAD(emvt.id, 6, '0')),
  emvt.`updated_at` = NOW(),
  emvt.`updated_by` = 'USER_ID_HERE'
WHERE b.`booking_date` BETWEEN '2025-01-01' AND '2025-01-31'
  AND emvt.`visitor_pass_id` IS NULL;

-- Update In-Time and Out-Time based on booking times
UPDATE `external_member_visit_times` emvt
INNER JOIN `bookings` b ON emvt.booking_id = b.id
SET 
  emvt.`in_time` = CONCAT(b.`booking_date`, ' ', b.`start_time`),
  emvt.`out_time` = CONCAT(b.`booking_date`, ' ', b.`end_time`),
  emvt.`updated_at` = NOW(),
  emvt.`updated_by` = 'USER_ID_HERE'
WHERE emvt.`in_time` IS NULL 
  AND b.`booking_date` IS NOT NULL 
  AND b.`start_time` IS NOT NULL;

-- ============================================
-- 7. UPDATE WITH PASS TYPE
-- Update including pass type
-- ============================================

UPDATE `external_member_visit_times`
SET 
  `visitor_pass_id` = 'PASS12345',
  `pass_type_id` = 'PASS_TYPE_ID_HERE',  -- Pass type UUID
  `in_time` = '2025-01-15 09:30:00',
  `out_time` = '2025-01-15 17:45:00',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `id` = 'VISIT_TIME_ID_HERE';

-- ============================================
-- 8. UPDATE WITH NOTES
-- Update including notes field
-- ============================================

UPDATE `external_member_visit_times`
SET 
  `visitor_pass_id` = 'PASS12345',
  `in_time` = '2025-01-15 09:30:00',
  `out_time` = '2025-01-15 17:45:00',
  `notes` = 'Updated via admin panel',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `id` = 'VISIT_TIME_ID_HERE';

-- ============================================
-- 9. SAFE UPDATE (Check if record exists first)
-- ============================================

-- Update only if record exists
UPDATE `external_member_visit_times`
SET 
  `visitor_pass_id` = 'PASS12345',
  `in_time` = '2025-01-15 09:30:00',
  `out_time` = '2025-01-15 17:45:00',
  `updated_at` = NOW(),
  `updated_by` = 'USER_ID_HERE'
WHERE `id` = 'VISIT_TIME_ID_HERE'
  AND EXISTS (
    SELECT 1 FROM `external_member_visit_times` 
    WHERE `id` = 'VISIT_TIME_ID_HERE'
  );

-- ============================================
-- 10. QUERY TO FIND RECORDS TO UPDATE
-- Useful queries to find records that need updating
-- ============================================

-- Find all visit times without Pass ID
SELECT 
  emvt.`id`,
  emvt.`booking_id`,
  emvt.`external_participant_id`,
  ep.`full_name`,
  ep.`email`,
  ep.`phone`,
  b.`booking_ref_id`,
  b.`title`,
  b.`booking_date`,
  emvt.`in_time`,
  emvt.`out_time`,
  emvt.`visitor_pass_id`
FROM `external_member_visit_times` emvt
INNER JOIN `external_participants` ep ON emvt.`external_participant_id` = ep.`id`
INNER JOIN `bookings` b ON emvt.`booking_id` = b.`id`
WHERE emvt.`visitor_pass_id` IS NULL
  AND b.`is_deleted` = 0
ORDER BY b.`booking_date` DESC;

-- Find all visit times without In-Time
SELECT 
  emvt.`id`,
  emvt.`booking_id`,
  emvt.`external_participant_id`,
  ep.`full_name`,
  b.`booking_ref_id`,
  b.`booking_date`,
  b.`start_time`,
  emvt.`in_time`,
  emvt.`out_time`
FROM `external_member_visit_times` emvt
INNER JOIN `external_participants` ep ON emvt.`external_participant_id` = ep.`id`
INNER JOIN `bookings` b ON emvt.`booking_id` = b.`id`
WHERE emvt.`in_time` IS NULL
  AND b.`is_deleted` = 0
ORDER BY b.`booking_date` DESC;

-- Find all visit times without Out-Time
SELECT 
  emvt.`id`,
  emvt.`booking_id`,
  emvt.`external_participant_id`,
  ep.`full_name`,
  b.`booking_ref_id`,
  b.`booking_date`,
  b.`end_time`,
  emvt.`in_time`,
  emvt.`out_time`
FROM `external_member_visit_times` emvt
INNER JOIN `external_participants` ep ON emvt.`external_participant_id` = ep.`id`
INNER JOIN `bookings` b ON emvt.`booking_id` = b.`id`
WHERE emvt.`out_time` IS NULL
  AND b.`is_deleted` = 0
ORDER BY b.`booking_date` DESC;

-- Find incomplete visit time records (missing any field)
SELECT 
  emvt.`id`,
  emvt.`booking_id`,
  emvt.`external_participant_id`,
  ep.`full_name`,
  b.`booking_ref_id`,
  b.`title`,
  b.`booking_date`,
  emvt.`visitor_pass_id`,
  emvt.`in_time`,
  emvt.`out_time`,
  CASE 
    WHEN emvt.`visitor_pass_id` IS NULL THEN 'Missing Pass ID'
    WHEN emvt.`in_time` IS NULL THEN 'Missing In-Time'
    WHEN emvt.`out_time` IS NULL THEN 'Missing Out-Time'
    ELSE 'Complete'
  END AS `status`
FROM `external_member_visit_times` emvt
INNER JOIN `external_participants` ep ON emvt.`external_participant_id` = ep.`id`
INNER JOIN `bookings` b ON emvt.`booking_id` = b.`id`
WHERE (
    emvt.`visitor_pass_id` IS NULL 
    OR emvt.`in_time` IS NULL 
    OR emvt.`out_time` IS NULL
  )
  AND b.`is_deleted` = 0
ORDER BY b.`booking_date` DESC;

-- ============================================
-- 11. VIEW CURRENT DATA
-- View all visit times with related information
-- ============================================

SELECT 
  emvt.`id` AS visit_time_id,
  b.`booking_ref_id`,
  b.`title` AS booking_title,
  b.`booking_date`,
  b.`start_time`,
  b.`end_time`,
  ep.`full_name`,
  ep.`email`,
  ep.`phone`,
  emvt.`visitor_pass_id`,
  pt.`name` AS pass_type_name,
  emvt.`in_time`,
  emvt.`out_time`,
  TIMESTAMPDIFF(MINUTE, emvt.`in_time`, emvt.`out_time`) AS duration_minutes,
  emvt.`notes`,
  emvt.`created_at`,
  emvt.`updated_at`
FROM `external_member_visit_times` emvt
INNER JOIN `external_participants` ep ON emvt.`external_participant_id` = ep.`id`
INNER JOIN `bookings` b ON emvt.`booking_id` = b.`id`
LEFT JOIN `pass_types` pt ON emvt.`pass_type_id` = pt.`id`
WHERE b.`is_deleted` = 0
ORDER BY b.`booking_date` DESC, emvt.`in_time` DESC;

-- ============================================
-- NOTES:
-- 1. Replace 'USER_ID_HERE' with actual user ID
-- 2. Replace 'VISIT_TIME_ID_HERE' with actual visit time ID
-- 3. Replace 'EXTERNAL_PARTICIPANT_ID_HERE' with actual participant ID
-- 4. Replace 'BOOKING_ID_HERE' with actual booking ID
-- 5. Replace 'MEMBER_ID_HERE' with actual member ID
-- 6. Replace 'PASS_TYPE_ID_HERE' with actual pass type ID
-- 7. Adjust date/time values as needed
-- 8. Always test UPDATE queries on a backup first
-- ============================================











