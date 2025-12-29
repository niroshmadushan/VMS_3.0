-- ============================================
-- MISSING BOOKING DETAILS - DATABASE SCHEMA
-- For tracking external member visit times and pass numbers
-- ============================================

-- ============================================
-- 1. EXTERNAL MEMBER VISIT TIMES TABLE
-- Create table WITHOUT foreign keys first
-- ============================================
CREATE TABLE IF NOT EXISTS `external_member_visit_times` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `booking_id` CHAR(36) NOT NULL,
  `external_participant_id` CHAR(36) NOT NULL,
  `member_id` CHAR(36) NULL COMMENT 'Reference to external_members table if member exists',
  `in_time` DATETIME NULL COMMENT 'When the external member entered',
  `out_time` DATETIME NULL COMMENT 'When the external member exited',
  `visitor_pass_id` VARCHAR(100) NULL COMMENT 'Pass number assigned to visitor',
  `pass_type_id` CHAR(36) NULL COMMENT 'Reference to pass_types table',
  `notes` TEXT NULL COMMENT 'Additional notes about the visit',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` CHAR(36) NULL COMMENT 'User who created this record',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` CHAR(36) NULL COMMENT 'User who last updated this record',
  
  -- Indexes for faster queries
  INDEX `idx_booking_id` (`booking_id`),
  INDEX `idx_external_participant_id` (`external_participant_id`),
  INDEX `idx_member_id` (`member_id`),
  INDEX `idx_visitor_pass_id` (`visitor_pass_id`),
  INDEX `idx_in_time` (`in_time`),
  INDEX `idx_out_time` (`out_time`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_booking_participant` (`booking_id`, `external_participant_id`),
  INDEX `idx_visit_date_range` (`in_time`, `out_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. ADD FOREIGN KEY CONSTRAINTS (only if tables exist)
-- ============================================

-- Check and add foreign key to bookings table
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
);

SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'id'
    AND DATA_TYPE = 'char'
    AND CHARACTER_MAXIMUM_LENGTH = 36
);

SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_member_visit_times'
    AND CONSTRAINT_NAME = 'fk_emvt_booking_id'
);

SET @sql = IF(@table_exists > 0 AND @column_exists > 0 AND @fk_exists = 0,
  'ALTER TABLE `external_member_visit_times` ADD CONSTRAINT `fk_emvt_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add foreign key to external_participants table
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_participants'
);

SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_participants'
    AND COLUMN_NAME = 'id'
    AND DATA_TYPE = 'char'
    AND CHARACTER_MAXIMUM_LENGTH = 36
);

SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_member_visit_times'
    AND CONSTRAINT_NAME = 'fk_emvt_external_participant_id'
);

SET @sql = IF(@table_exists > 0 AND @column_exists > 0 AND @fk_exists = 0,
  'ALTER TABLE `external_member_visit_times` ADD CONSTRAINT `fk_emvt_external_participant_id` FOREIGN KEY (`external_participant_id`) REFERENCES `external_participants`(`id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add foreign key to external_members table
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_members'
);

SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_members'
    AND COLUMN_NAME = 'id'
    AND DATA_TYPE = 'char'
    AND CHARACTER_MAXIMUM_LENGTH = 36
);

SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_member_visit_times'
    AND CONSTRAINT_NAME = 'fk_emvt_member_id'
);

SET @sql = IF(@table_exists > 0 AND @column_exists > 0 AND @fk_exists = 0,
  'ALTER TABLE `external_member_visit_times` ADD CONSTRAINT `fk_emvt_member_id` FOREIGN KEY (`member_id`) REFERENCES `external_members`(`id`) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add foreign key to pass_types table (optional)
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pass_types'
);

SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pass_types'
    AND COLUMN_NAME = 'id'
    AND DATA_TYPE = 'char'
    AND CHARACTER_MAXIMUM_LENGTH = 36
);

SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_member_visit_times'
    AND CONSTRAINT_NAME = 'fk_emvt_pass_type_id'
);

SET @sql = IF(@table_exists > 0 AND @column_exists > 0 AND @fk_exists = 0,
  'ALTER TABLE `external_member_visit_times` ADD CONSTRAINT `fk_emvt_pass_type_id` FOREIGN KEY (`pass_type_id`) REFERENCES `pass_types`(`id`) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. UPDATE BOOKINGS TABLE
-- Add is_missing_booking column to mark missing booking records
-- ============================================
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
);

SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'is_missing_booking'
);

SET @sql = IF(@table_exists > 0 AND @column_exists = 0,
  'ALTER TABLE `bookings` ADD COLUMN `is_missing_booking` TINYINT(1) NOT NULL DEFAULT 0 COMMENT \'1 = Missing booking record, 0 = Regular booking\'',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. UPDATE EXTERNAL_PARTICIPANTS TABLE
-- Add visitor_pass_id column if it doesn't exist
-- ============================================
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_participants'
);

SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_participants'
    AND COLUMN_NAME = 'visitor_pass_id'
);

SET @sql = IF(@table_exists > 0 AND @column_exists = 0,
  'ALTER TABLE `external_participants` ADD COLUMN `visitor_pass_id` VARCHAR(100) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 5. VIEW FOR MISSING BOOKING DETAILS
-- Shows bookings with external members and their visit times
-- ============================================
DROP VIEW IF EXISTS `v_missing_booking_details`;

CREATE VIEW `v_missing_booking_details` AS
SELECT 
  b.id AS booking_id,
  b.booking_ref_id,
  b.title AS booking_title,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.place_name,
  ep.id AS external_participant_id,
  ep.full_name,
  ep.email,
  ep.phone,
  ep.company_name,
  ep.visitor_pass_id,
  emvt.in_time,
  emvt.out_time,
  emvt.visitor_pass_id AS visit_pass_id,
  pt.name AS pass_type_name,
  CASE 
    WHEN emvt.in_time IS NULL AND emvt.out_time IS NULL THEN 'No times recorded'
    WHEN emvt.in_time IS NOT NULL AND emvt.out_time IS NULL THEN 'Checked in only'
    WHEN emvt.in_time IS NOT NULL AND emvt.out_time IS NOT NULL THEN 'Complete'
    ELSE 'Unknown'
  END AS visit_status
FROM bookings b
INNER JOIN external_participants ep ON b.id = ep.booking_id
LEFT JOIN external_member_visit_times emvt ON ep.id = emvt.external_participant_id
LEFT JOIN pass_types pt ON emvt.pass_type_id = pt.id
WHERE b.is_deleted = 0
ORDER BY b.booking_date DESC, b.start_time DESC;
