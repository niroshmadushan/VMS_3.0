-- ============================================
-- MIGRATION: Remove external_participants table
-- Use only external_members table with junction table
-- ============================================

-- ============================================
-- 1. CREATE BOOKING_EXTERNAL_MEMBERS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `booking_external_members` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `booking_id` CHAR(36) NOT NULL,
  `member_id` CHAR(36) NOT NULL,
  `participation_status` ENUM('invited', 'confirmed', 'checked_in', 'checked_out', 'no_show') DEFAULT 'invited',
  `checked_in_at` DATETIME NULL,
  `checked_out_at` DATETIME NULL,
  `visitor_pass_id` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  INDEX `idx_booking_id` (`booking_id`),
  INDEX `idx_member_id` (`member_id`),
  INDEX `idx_participation_status` (`participation_status`),
  UNIQUE KEY `unique_booking_member` (`booking_id`, `member_id`),
  
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `external_members`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. MIGRATE DATA FROM external_participants TO booking_external_members
-- (Only if external_participants has member_id)
-- ============================================
INSERT INTO `booking_external_members` (
  `id`,
  `booking_id`,
  `member_id`,
  `participation_status`,
  `checked_in_at`,
  `checked_out_at`,
  `visitor_pass_id`,
  `created_at`,
  `updated_at`
)
SELECT 
  ep.id,
  ep.booking_id,
  ep.member_id,
  COALESCE(ep.participation_status, 'invited'),
  ep.checked_in_at,
  ep.checked_out_at,
  ep.visitor_pass_id,
  ep.created_at,
  ep.updated_at
FROM `external_participants` ep
WHERE ep.member_id IS NOT NULL
  AND ep.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM `booking_external_members` bem
    WHERE bem.booking_id = ep.booking_id 
      AND bem.member_id = ep.member_id
  );

-- ============================================
-- 3. CREATE MEMBERS FROM external_participants THAT DON'T HAVE member_id
-- (For orphaned records without member_id)
-- ============================================
INSERT INTO `external_members` (
  `id`,
  `full_name`,
  `email`,
  `phone`,
  `company_name`,
  `designation`,
  `reference_type`,
  `reference_value`,
  `visit_count`,
  `last_visit_date`,
  `is_active`,
  `is_deleted`,
  `is_blacklisted`,
  `created_at`
)
SELECT DISTINCT
  UUID() as id,
  ep.full_name,
  COALESCE(ep.email, CONCAT('temp_', ep.id, '@temp.com')) as email,
  COALESCE(ep.phone, '0000000000') as phone,
  ep.company_name,
  ep.company_position as designation,
  ep.reference_type,
  ep.reference_value,
  1 as visit_count,
  ep.created_at as last_visit_date,
  1 as is_active,
  0 as is_deleted,
  0 as is_blacklisted,
  ep.created_at
FROM `external_participants` ep
WHERE ep.member_id IS NULL
  AND ep.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM `external_members` em
    WHERE (em.email = ep.email AND ep.email IS NOT NULL AND ep.email != '')
       OR (em.phone = ep.phone AND ep.phone IS NOT NULL AND ep.phone != '')
  );

-- ============================================
-- 4. LINK ORPHANED RECORDS TO NEWLY CREATED MEMBERS
-- ============================================
INSERT INTO `booking_external_members` (
  `id`,
  `booking_id`,
  `member_id`,
  `participation_status`,
  `checked_in_at`,
  `checked_out_at`,
  `visitor_pass_id`,
  `created_at`,
  `updated_at`
)
SELECT 
  ep.id,
  ep.booking_id,
  em.id as member_id,
  COALESCE(ep.participation_status, 'invited'),
  ep.checked_in_at,
  ep.checked_out_at,
  ep.visitor_pass_id,
  ep.created_at,
  ep.updated_at
FROM `external_participants` ep
INNER JOIN `external_members` em ON (
  (em.email = ep.email AND ep.email IS NOT NULL AND ep.email != '')
  OR (em.phone = ep.phone AND ep.phone IS NOT NULL AND ep.phone != '')
)
WHERE ep.member_id IS NULL
  AND ep.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM `booking_external_members` bem
    WHERE bem.booking_id = ep.booking_id 
      AND bem.member_id = em.id
  );

-- ============================================
-- 5. DROP external_participants TABLE
-- (Uncomment when ready to remove)
-- ============================================
-- DROP TABLE IF EXISTS `external_participants`;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================
-- Check total bookings with external members
-- SELECT COUNT(DISTINCT booking_id) as total_bookings FROM booking_external_members;

-- Check total external members linked to bookings
-- SELECT COUNT(DISTINCT member_id) as total_members FROM booking_external_members;

-- Check bookings with external members
-- SELECT b.id, b.title, COUNT(bem.member_id) as external_member_count
-- FROM bookings b
-- LEFT JOIN booking_external_members bem ON b.id = bem.booking_id
-- WHERE bem.member_id IS NOT NULL
-- GROUP BY b.id, b.title;












